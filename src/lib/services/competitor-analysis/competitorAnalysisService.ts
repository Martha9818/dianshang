import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  BUSINESS_ERROR_CODES,
  ProductBusinessError,
  formatDateOnly,
  formatDateTime,
  parseJsonStringArray,
} from "@/lib/modules/products";
import { generateTextJson } from "@/lib/services/ai-client";
import {
  createAIJob,
  markAIJobFailed,
  markAIJobRunning,
  markAIJobSuccess,
  sanitizeAIErrorSummary,
  summarizePrompt,
  validateJsonAIOutput,
} from "@/lib/services/ai";
import { getDefaultEnabledAIProvider } from "@/lib/services/ai-provider-service";
import { detectBannedWords, getBannedWords } from "@/lib/services/banned-word-service";
import { getRuntimeModeSummary, normalizeProductReadError, normalizeProductWriteError } from "@/lib/services/product-runtime-service";
import { buildCompetitorAnalysisPrompt, type CompetitorAnalysisPromptContext } from "./prompts";
import {
  COMPETITOR_ANALYSIS_AI_JOB_TYPES,
  COMPETITOR_ANALYSIS_MIN_COMPETITORS,
  COMPETITOR_ANALYSIS_READONLY_MESSAGE,
  COMPETITOR_ANALYSIS_STATUSES,
  buildCompetitorAnalysisJsonSchema,
  competitorAnalysisStructuredOutputSchema,
  type CompetitorAnalysisStructuredOutput,
} from "./competitorAnalysisTypes";

const MAX_TEXT_LENGTH = 700;
const MAX_DRAFTS_PER_COMPETITOR = 3;

const analysisSnapshotSelect = {
  id: true,
  productId: true,
  aiJobId: true,
  competitorIds: true,
  summary: true,
  differentiationAdvice: true,
  priceBandSummary: true,
  sellingPointSummary: true,
  imageStyleSummary: true,
  copywritingStyleSummary: true,
  riskTips: true,
  nextStepAdvice: true,
  dataGapAdvice: true,
  uncertaintyNotes: true,
  riskScanResultJson: true,
  model: true,
  provider: true,
  status: true,
  errorSummary: true,
  isReference: true,
  archivedAt: true,
  createdAt: true,
  aiJob: { select: { id: true, status: true, errorSummary: true } },
} satisfies Prisma.CompetitorAnalysisSnapshotSelect;

const productForAnalysisSelect = {
  id: true,
  name: true,
  categoryLevel1: true,
  categoryLevel2: true,
  tags: true,
  targetUser: true,
  targetPlatforms: true,
  estimatedPrice: true,
  sellingPoints: true,
  painPoints: true,
  usageScenes: true,
  categoryRisk: true,
  returnRisk: true,
  manualRiskNotes: true,
  notes: true,
  deletedAt: true,
} satisfies Prisma.ProductSelect;

const competitorForAnalysisSelect = {
  id: true,
  productId: true,
  platform: true,
  title: true,
  price: true,
  heatMetricType: true,
  heatMetricValue: true,
  sellerName: true,
  sellingPoint: true,
  painPoint: true,
  imageStyle: true,
  dataDate: true,
  notes: true,
  updatedAt: true,
} satisfies Prisma.CompetitorSelect;

type AnalysisSnapshotRecord = Prisma.CompetitorAnalysisSnapshotGetPayload<{ select: typeof analysisSnapshotSelect }>;
type ProductForAnalysisRecord = Prisma.ProductGetPayload<{ select: typeof productForAnalysisSelect }>;
type CompetitorForAnalysisRecord = Prisma.CompetitorGetPayload<{ select: typeof competitorForAnalysisSelect }>;

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function createReadonlyError() {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.PREVIEW_READONLY, COMPETITOR_ANALYSIS_READONLY_MESSAGE);
}

function ensureCompetitorAnalysisWritesAllowed() {
  const runtime = getRuntimeModeSummary();
  if (!runtime.isWritable) {
    throw createReadonlyError();
  }
}

function normalizeOptionalText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  const text = Array.isArray(value) ? value.map((item) => String(item ?? "").trim()).filter(Boolean).join("\n") : String(value ?? "");
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function normalizeMultilineText(value: unknown, maxLength = 1600) {
  const text = Array.isArray(value) ? value.map((item) => String(item ?? "").trim()).filter(Boolean).join("\n") : String(value ?? "");
  const trimmed = text.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function parseCompetitorIds(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => Number(item)).filter((id) => Number.isInteger(id) && id > 0);
  } catch {
    return [];
  }
}

function parseRiskScan(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value) as {
      hits?: Array<{ word: string; category: string; riskLevel: string; field: string }>;
      auditStatus?: string;
      hasHighRisk?: boolean;
    };
  } catch {
    return null;
  }
}

function getStatusTone(status: string) {
  if (status === COMPETITOR_ANALYSIS_STATUSES.SUCCESS) return "green" as const;
  if (status === COMPETITOR_ANALYSIS_STATUSES.FAILED) return "red" as const;
  if (status === COMPETITOR_ANALYSIS_STATUSES.ARCHIVED) return "slate" as const;
  return "amber" as const;
}

function mapAnalysisSnapshot(record: AnalysisSnapshotRecord) {
  const riskScan = parseRiskScan(record.riskScanResultJson);
  return {
    ...record,
    competitorIdList: parseCompetitorIds(record.competitorIds),
    riskScan,
    riskHitCount: riskScan?.hits?.length ?? 0,
    statusTone: getStatusTone(record.status),
    formattedCreatedAt: formatDateTime(record.createdAt),
    formattedArchivedAt: record.archivedAt ? formatDateTime(record.archivedAt) : null,
  };
}

function normalizeSelectedCompetitorIds(ids: Array<string | number>) {
  return Array.from(
    new Set(
      ids
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  );
}

function assertEnoughCompetitors(competitors: CompetitorForAnalysisRecord[]) {
  if (competitors.length < COMPETITOR_ANALYSIS_MIN_COMPETITORS) {
    throw createValidationError("建议先补充竞品数据：至少选择 3 个已录入竞品后再生成智能分析。");
  }
}

async function resolveProductForAnalysis(productId: number) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: productForAnalysisSelect,
  });

  if (!product) {
    throw createValidationError("商品不存在或已删除。");
  }

  return product;
}

async function resolveSelectedCompetitors(productId: number, competitorIds: number[]) {
  if (competitorIds.length === 0) {
    throw createValidationError("请至少选择 3 个竞品参与分析。");
  }

  const competitors = await prisma.competitor.findMany({
    where: {
      productId,
      id: { in: competitorIds },
    },
    orderBy: [{ dataDate: "desc" }, { updatedAt: "desc" }],
    select: competitorForAnalysisSelect,
  });

  if (competitors.length !== competitorIds.length) {
    throw createValidationError("部分竞品不存在或不属于当前商品，请重新选择。");
  }

  assertEnoughCompetitors(competitors);
  return competitors;
}

function buildPriceStats(competitors: CompetitorForAnalysisRecord[]) {
  const prices = competitors.map((competitor) => competitor.price).filter((price) => Number.isFinite(price));
  const sorted = [...prices].sort((left, right) => left - right);
  const median =
    sorted.length === 0
      ? null
      : sorted.length % 2 === 1
        ? sorted[Math.floor(sorted.length / 2)]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

  return {
    minPrice: sorted.length > 0 ? sorted[0] : null,
    maxPrice: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    averagePrice: sorted.length > 0 ? sorted.reduce((sum, value) => sum + value, 0) / sorted.length : null,
    medianPrice: median,
  };
}

function summarizeDraft(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const parts = [
      parsed.draftLabel,
      parsed.possibleTitle,
      parsed.possiblePrice,
      parsed.possibleSalesOrHeat,
      Array.isArray(parsed.sellingPoints) ? parsed.sellingPoints.join(" / ") : null,
      parsed.imageDescription,
      parsed.copywritingMaterialSummary,
      Array.isArray(parsed.uncertaintyNotes) ? parsed.uncertaintyNotes.join(" / ") : null,
    ];
    return normalizeOptionalText(parts.filter(Boolean).join(" | "), 500);
  } catch {
    return normalizeOptionalText(value, 500);
  }
}

async function getLocalDraftSummaries(productId: number, competitorIds: number[]) {
  const [screenshotJobs, linkImportDrafts] = await Promise.all([
    prisma.screenshotRecognitionJob.findMany({
      where: {
        productId,
        competitorId: { in: competitorIds },
        OR: [{ confirmedDraft: { not: null } }, { structuredDraft: { not: null } }],
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: competitorIds.length * MAX_DRAFTS_PER_COMPETITOR,
      select: {
        competitorId: true,
        confirmedDraft: true,
        structuredDraft: true,
        resultSummary: true,
        qualityLevel: true,
      },
    }),
    prisma.linkImportDraft.findMany({
      where: {
        productId,
        competitorId: { in: competitorIds },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: competitorIds.length * MAX_DRAFTS_PER_COMPETITOR,
      select: {
        competitorId: true,
        sourcePlatform: true,
        qualityLevel: true,
        manualText: true,
        note: true,
        metaTitle: true,
        metaDescription: true,
      },
    }),
  ]);

  const screenshotMap = new Map<number, string[]>();
  const linkMap = new Map<number, string[]>();

  for (const job of screenshotJobs) {
    if (!job.competitorId) continue;
    const summary =
      summarizeDraft(job.confirmedDraft ?? job.structuredDraft) ??
      normalizeOptionalText(`${job.resultSummary ?? ""} ${job.qualityLevel ?? ""}`, 500);
    if (!summary) continue;
    const list = screenshotMap.get(job.competitorId) ?? [];
    if (list.length < MAX_DRAFTS_PER_COMPETITOR) list.push(summary);
    screenshotMap.set(job.competitorId, list);
  }

  for (const draft of linkImportDrafts) {
    if (!draft.competitorId) continue;
    const summary = normalizeOptionalText(
      [
        draft.sourcePlatform,
        draft.qualityLevel,
        draft.metaTitle,
        draft.metaDescription,
        draft.manualText,
        draft.note,
      ]
        .filter(Boolean)
        .join(" | "),
      500,
    );
    if (!summary) continue;
    const list = linkMap.get(draft.competitorId) ?? [];
    if (list.length < MAX_DRAFTS_PER_COMPETITOR) list.push(summary);
    linkMap.set(draft.competitorId, list);
  }

  return { screenshotMap, linkMap };
}

async function buildPromptContext(
  product: ProductForAnalysisRecord,
  competitors: CompetitorForAnalysisRecord[],
): Promise<CompetitorAnalysisPromptContext> {
  const competitorIds = competitors.map((competitor) => competitor.id);
  const { screenshotMap, linkMap } = await getLocalDraftSummaries(product.id, competitorIds);

  return {
    product: {
      name: product.name,
      categoryLevel1: product.categoryLevel1,
      categoryLevel2: product.categoryLevel2,
      tags: parseJsonStringArray(product.tags),
      targetUser: normalizeOptionalText(product.targetUser, 240),
      targetPlatforms: parseJsonStringArray(product.targetPlatforms),
      estimatedPrice: product.estimatedPrice,
      sellingPoints: normalizeOptionalText(product.sellingPoints),
      painPoints: normalizeOptionalText(product.painPoints),
      usageScenes: normalizeOptionalText(product.usageScenes),
      categoryRisk: normalizeOptionalText(product.categoryRisk),
      returnRisk: normalizeOptionalText(product.returnRisk),
      manualRiskNotes: normalizeOptionalText(product.manualRiskNotes),
      notes: normalizeOptionalText(product.notes),
    },
    competitors: competitors.map((competitor) => ({
      id: competitor.id,
      platform: competitor.platform,
      title: competitor.title,
      price: competitor.price,
      heatMetricType: competitor.heatMetricType,
      heatMetricValue: competitor.heatMetricValue,
      sellerName: normalizeOptionalText(competitor.sellerName, 120),
      sellingPoint: normalizeOptionalText(competitor.sellingPoint),
      painPoint: normalizeOptionalText(competitor.painPoint),
      imageStyle: normalizeOptionalText(competitor.imageStyle, 240),
      dataDate: formatDateOnly(competitor.dataDate),
      notes: normalizeOptionalText(competitor.notes),
      screenshotDrafts: screenshotMap.get(competitor.id) ?? [],
      linkImportDrafts: linkMap.get(competitor.id) ?? [],
    })),
    priceStats: buildPriceStats(competitors),
  };
}

function normalizeStructuredOutput(input: Partial<CompetitorAnalysisStructuredOutput>): CompetitorAnalysisStructuredOutput {
  return {
    summary: normalizeMultilineText(input.summary, 1600) ?? "AI 未能生成竞品共性总结。",
    priceBandSummary: normalizeMultilineText(input.priceBandSummary, 1200) ?? "价格带信息不足，需要补充竞品价格。",
    sellingPointSummary: normalizeMultilineText(input.sellingPointSummary, 1200) ?? "卖点信息不足，需要补充竞品卖点。",
    imageStyleSummary: normalizeMultilineText(input.imageStyleSummary, 1200) ?? "图片风格信息不足，需要补充截图或图片风格记录。",
    copywritingStyleSummary: normalizeMultilineText(input.copywritingStyleSummary, 1200) ?? "文案风格信息不足，需要补充标题、描述或草稿文本。",
    differentiationAdvice: normalizeMultilineText(input.differentiationAdvice, 1600) ?? "暂未发现稳定差异化机会。",
    riskTips: normalizeMultilineText(input.riskTips, 1200) ?? "请人工复核平台规则、价格、售后和侵权风险。",
    nextStepAdvice: normalizeMultilineText(input.nextStepAdvice, 1200) ?? "建议先补充竞品数据，再进行小批量测试。",
    dataGapAdvice: normalizeMultilineText(input.dataGapAdvice, 1200) ?? "建议补充竞品截图、卖点、差评痛点、价格和热度数据。",
    uncertaintyNotes: normalizeMultilineText(input.uncertaintyNotes, 1200) ?? "AI 辅助建议存在不确定性，仅供参考。",
  };
}

async function buildRiskScan(output: CompetitorAnalysisStructuredOutput) {
  const bannedWords = await getBannedWords();
  const scan = detectBannedWords({
    title: "competitor analysis",
    mainCopy: [output.summary, output.priceBandSummary, output.differentiationAdvice, output.nextStepAdvice].join("\n"),
    sellingPoints: [output.sellingPointSummary, output.imageStyleSummary, output.copywritingStyleSummary],
    riskNotes: [output.riskTips, output.dataGapAdvice, output.uncertaintyNotes],
    bannedWords,
  });

  return {
    auditStatus: scan.auditStatus,
    hasHighRisk: scan.hasHighRisk,
    hits: scan.hits.map((hit) => ({
      word: hit.word,
      category: hit.category,
      riskLevel: hit.riskLevel,
      field: hit.field,
    })),
  };
}

async function recordAnalysisOperation(input: { productId: number; action: string; detail: string }) {
  await prisma.operationLog.create({
    data: {
      productId: input.productId,
      action: input.action,
      detail: input.detail,
    },
  });
}

async function createFailedSnapshot(input: {
  productId: number;
  competitorIds: number[];
  aiJobId?: number | null;
  provider?: string | null;
  model?: string | null;
  error: unknown;
}) {
  const errorSummary = sanitizeAIErrorSummary(input.error);
  const snapshot = await prisma.competitorAnalysisSnapshot.create({
    data: {
      productId: input.productId,
      aiJobId: input.aiJobId ?? null,
      competitorIds: JSON.stringify(input.competitorIds),
      provider: input.provider ?? null,
      model: input.model ?? null,
      status: COMPETITOR_ANALYSIS_STATUSES.FAILED,
      errorSummary,
      uncertaintyNotes: "AI 分析失败；商品、竞品、评分、状态、导出、备份和文件清理均未被修改。",
    },
    select: analysisSnapshotSelect,
  });

  await recordAnalysisOperation({
    productId: input.productId,
    action: "COMPETITOR_ANALYSIS_FAILED",
    detail: `竞品智能分析失败并保存失败快照：snapshotId=${snapshot.id} / competitors=${input.competitorIds.length}`,
  });

  return snapshot;
}

export async function generateCompetitorAnalysisSnapshot(input: {
  productId: number;
  competitorIds: Array<string | number>;
}) {
  ensureCompetitorAnalysisWritesAllowed();

  const competitorIds = normalizeSelectedCompetitorIds(input.competitorIds);
  let aiJobId: number | null = null;
  let providerName: string | null = null;
  let modelName: string | null = null;
  let failureCanBeRecorded = false;

  try {
    const product = await resolveProductForAnalysis(input.productId);
    const competitors = await resolveSelectedCompetitors(product.id, competitorIds);
    failureCanBeRecorded = true;

    const provider = await getDefaultEnabledAIProvider();
    if (!provider) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.DEFAULT_PROVIDER_REQUIRED, "请先配置可用的默认 AI Provider。");
    }

    providerName = provider.name;
    modelName = provider.modelName ?? null;

    const aiJob = await createAIJob({
      jobType: COMPETITOR_ANALYSIS_AI_JOB_TYPES.ANALYSIS,
      idempotencyKey: `competitor-analysis:${product.id}:${competitorIds.join(",")}:${Date.now()}`,
      relatedProductId: product.id,
      inputSummary: `competitor analysis product=${product.id} competitors=${competitorIds.length}`,
    });
    aiJobId = aiJob.id;
    await markAIJobRunning(aiJobId);

    const context = await buildPromptContext(product, competitors);
    const prompt = buildCompetitorAnalysisPrompt(context);
    const result = await generateTextJson({
      baseUrl: provider.baseUrl ?? "",
      apiKey: provider.apiKey ?? "",
      modelName: provider.modelName ?? "",
      providerType: provider.providerType,
      prompt,
      requestType: "competitor_analysis",
      inputSummary: summarizePrompt(`competitor analysis product=${product.id} competitors=${competitorIds.length}`),
      relatedProductId: product.id,
      relatedTaskId: aiJobId,
      preferStructuredOutput: true,
      responseSchema: buildCompetitorAnalysisJsonSchema(),
    });

    const structured = validateJsonAIOutput(result.content, competitorAnalysisStructuredOutputSchema);
    if (!structured.success) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, structured.errorSummary);
    }

    const output = normalizeStructuredOutput(structured.data);
    const riskScan = await buildRiskScan(output);
    const snapshot = await prisma.competitorAnalysisSnapshot.create({
      data: {
        productId: product.id,
        aiJobId,
        competitorIds: JSON.stringify(competitorIds),
        summary: output.summary,
        priceBandSummary: output.priceBandSummary,
        sellingPointSummary: output.sellingPointSummary,
        imageStyleSummary: output.imageStyleSummary,
        copywritingStyleSummary: output.copywritingStyleSummary,
        differentiationAdvice: output.differentiationAdvice,
        riskTips: output.riskTips,
        nextStepAdvice: output.nextStepAdvice,
        dataGapAdvice: output.dataGapAdvice,
        uncertaintyNotes: output.uncertaintyNotes,
        riskScanResultJson: JSON.stringify(riskScan),
        provider: providerName,
        model: modelName,
        status: COMPETITOR_ANALYSIS_STATUSES.SUCCESS,
        errorSummary: null,
      },
      select: analysisSnapshotSelect,
    });

    await markAIJobSuccess(aiJobId, `competitor analysis snapshot saved id=${snapshot.id}`);
    await recordAnalysisOperation({
      productId: product.id,
      action: "CREATE_COMPETITOR_ANALYSIS",
      detail: `生成竞品智能分析快照：snapshotId=${snapshot.id} / competitors=${competitorIds.length}。未修改评分、推荐结论、商品状态或竞品字段。`,
    });

    return mapAnalysisSnapshot(snapshot);
  } catch (error) {
    if (aiJobId !== null) {
      try {
        await markAIJobFailed(aiJobId, error);
      } catch {
        // Keep original error for the caller.
      }
    }

    if (failureCanBeRecorded) {
      try {
        await createFailedSnapshot({
          productId: input.productId,
          competitorIds,
          aiJobId,
          provider: providerName,
          model: modelName,
          error,
        });
      } catch {
        // Do not hide the original AI or validation failure.
      }
    }

    throw normalizeProductWriteError(error);
  }
}

export async function markCompetitorAnalysisReference(input: { productId: number; snapshotId: number }) {
  ensureCompetitorAnalysisWritesAllowed();

  try {
    const snapshot = await prisma.competitorAnalysisSnapshot.findFirst({
      where: {
        id: input.snapshotId,
        productId: input.productId,
        archivedAt: null,
        status: { not: COMPETITOR_ANALYSIS_STATUSES.ARCHIVED },
      },
      select: { id: true },
    });
    if (!snapshot) throw createValidationError("分析快照不存在或已归档。");

    await prisma.$transaction(async (tx) => {
      await tx.competitorAnalysisSnapshot.updateMany({
        where: { productId: input.productId, isReference: true },
        data: { isReference: false },
      });
      await tx.competitorAnalysisSnapshot.update({
        where: { id: input.snapshotId },
        data: { isReference: true },
      });
      await tx.operationLog.create({
        data: {
          productId: input.productId,
          action: "MARK_COMPETITOR_ANALYSIS_REFERENCE",
          detail: `标记竞品智能分析参考版本：snapshotId=${input.snapshotId}`,
        },
      });
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function archiveCompetitorAnalysisSnapshot(input: { productId: number; snapshotId: number }) {
  ensureCompetitorAnalysisWritesAllowed();

  try {
    const snapshot = await prisma.competitorAnalysisSnapshot.findFirst({
      where: { id: input.snapshotId, productId: input.productId },
      select: { id: true },
    });
    if (!snapshot) throw createValidationError("分析快照不存在。");

    await prisma.$transaction(async (tx) => {
      await tx.competitorAnalysisSnapshot.update({
        where: { id: input.snapshotId },
        data: {
          status: COMPETITOR_ANALYSIS_STATUSES.ARCHIVED,
          archivedAt: new Date(),
          isReference: false,
        },
      });
      await tx.operationLog.create({
        data: {
          productId: input.productId,
          action: "ARCHIVE_COMPETITOR_ANALYSIS",
          detail: `归档竞品智能分析快照：snapshotId=${input.snapshotId}`,
        },
      });
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function getCompetitorAnalysisSnapshots(productId: number) {
  try {
    const runtime = getRuntimeModeSummary();
    const snapshots = await prisma.competitorAnalysisSnapshot.findMany({
      where: { productId },
      orderBy: [{ isReference: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: 40,
      select: analysisSnapshotSelect,
    });

    return {
      runtime,
      snapshots: snapshots.map(mapAnalysisSnapshot),
      minCompetitorCount: COMPETITOR_ANALYSIS_MIN_COMPETITORS,
      readonlyNotice: runtime.isWritable ? null : COMPETITOR_ANALYSIS_READONLY_MESSAGE,
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}
