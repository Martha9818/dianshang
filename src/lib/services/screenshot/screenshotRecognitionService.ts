import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUSINESS_ERROR_CODES, ProductBusinessError, formatDateTime } from "@/lib/modules/products";
import { generateTextJson } from "@/lib/services/ai-client";
import {
  createAIJob,
  markAIJobFailed,
  markAIJobRunning,
  markAIJobSuccess,
  validateJsonAIOutput,
} from "@/lib/services/ai";
import { sanitizeAIErrorSummary, summarizePrompt } from "@/lib/services/ai/aiPromptSanitizer";
import { getDefaultEnabledAIProvider } from "@/lib/services/ai-provider-service";
import { assertSupportedImageFile, getUploadsAbsolutePath, storeImageFile } from "@/lib/services/images";
import { createShortFileName, toSafeRelativePath } from "@/lib/services/local-paths/pathSafetyService";
import { getRuntimeModeSummary, normalizeProductReadError, normalizeProductWriteError } from "@/lib/services/product-runtime-service";
import {
  SCREENSHOT_AI_JOB_TYPES,
  SCREENSHOT_JOB_STATUSES,
  SCREENSHOT_QUALITY_LEVELS,
  SCREENSHOT_READONLY_MESSAGE,
  SCREENSHOT_SOURCE_TYPES,
  buildScreenshotDraftJsonSchema,
  isScreenshotQualityLevel,
  isScreenshotSourceType,
  screenshotStructuredDraftSchema,
  type ScreenshotQualityLevel,
  type ScreenshotSourceType,
  type ScreenshotStructuredDraft,
} from "@/lib/services/screenshot/screenshotTypes";

const screenshotJobSelect = {
  id: true,
  sourceType: true,
  sourceId: true,
  productId: true,
  inspirationId: true,
  materialId: true,
  competitorId: true,
  aiJobId: true,
  imagePath: true,
  thumbnailPath: true,
  status: true,
  resultSummary: true,
  structuredDraft: true,
  confirmedDraft: true,
  qualityLevel: true,
  errorSummary: true,
  needsUserConfirmation: true,
  confirmedAt: true,
  ignoredAt: true,
  createdAt: true,
  updatedAt: true,
  product: { select: { id: true, name: true, spu: true, deletedAt: true } },
  inspiration: { select: { id: true, title: true } },
  material: { select: { id: true, filePath: true, productId: true } },
  competitor: { select: { id: true, title: true, productId: true } },
  aiJob: { select: { id: true, jobType: true, status: true, errorSummary: true, resultSummary: true } },
} satisfies Prisma.ScreenshotRecognitionJobSelect;

type ScreenshotJobRecord = Prisma.ScreenshotRecognitionJobGetPayload<{ select: typeof screenshotJobSelect }>;

type SourceImage = {
  imagePath: string;
  thumbnailPath: string | null;
  productId: number | null;
  inspirationId: number | null;
  materialId: number | null;
  competitorId: number | null;
};

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function createReadonlyError() {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.PREVIEW_READONLY, SCREENSHOT_READONLY_MESSAGE);
}

function ensureScreenshotWritesAllowed() {
  const runtime = getRuntimeModeSummary();
  if (!runtime.isWritable) {
    throw createReadonlyError();
  }
}

function normalizeSourceType(value: string): ScreenshotSourceType {
  const sourceType = value.trim();
  if (!isScreenshotSourceType(sourceType)) {
    throw createValidationError("请选择有效的截图来源。");
  }

  return sourceType;
}

function parsePositiveId(value: string | number | null | undefined) {
  const id = Number(value ?? "");
  return Number.isInteger(id) && id > 0 ? id : null;
}

function sanitizeSegment(value: string, fallback: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || fallback;
}

function normalizeOptionalText(value: string | null | undefined, maxLength = 240) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function normalizeArray(values: unknown, maxItems = 8) {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.map((item) => String(item ?? "").trim()).filter(Boolean))).slice(0, maxItems);
}

function parseTextareaLines(value: string | null | undefined) {
  return Array.from(
    new Set(
      String(value ?? "")
        .split(/\r?\n+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 8);
}

function normalizeQualityLevel(value: string | null | undefined): ScreenshotQualityLevel {
  const level = String(value ?? "").trim();
  return isScreenshotQualityLevel(level) ? level : SCREENSHOT_QUALITY_LEVELS.MEDIUM;
}

function normalizeDraft(input: Partial<ScreenshotStructuredDraft>): ScreenshotStructuredDraft {
  return {
    draftLabel: normalizeOptionalText(input.draftLabel, 80) ?? "AI 识别草稿 / 待用户确认",
    possibleTitle: normalizeOptionalText(input.possibleTitle, 160),
    possiblePrice: normalizeOptionalText(input.possiblePrice, 80),
    possibleSalesOrHeat: normalizeOptionalText(input.possibleSalesOrHeat, 120),
    possiblePlatformSource: normalizeOptionalText(input.possiblePlatformSource, 80),
    sellingPoints: normalizeArray(input.sellingPoints),
    specInfo: normalizeArray(input.specInfo),
    riskWords: normalizeArray(input.riskWords),
    imageDescription: normalizeOptionalText(input.imageDescription, 500) ?? "",
    copywritingMaterialSummary: normalizeOptionalText(input.copywritingMaterialSummary, 500) ?? "",
    platformCopywritingDirections: normalizeArray(input.platformCopywritingDirections),
    privacyNotes: normalizeArray(input.privacyNotes),
    uncertaintyNotes: normalizeArray(input.uncertaintyNotes),
    qualityLevel: normalizeQualityLevel(input.qualityLevel),
  };
}

export function buildScreenshotDraftFromForm(input: {
  possibleTitle?: string | null;
  possiblePrice?: string | null;
  possibleSalesOrHeat?: string | null;
  possiblePlatformSource?: string | null;
  sellingPointsText?: string | null;
  specInfoText?: string | null;
  riskWordsText?: string | null;
  imageDescription?: string | null;
  copywritingMaterialSummary?: string | null;
  platformCopywritingDirectionsText?: string | null;
  privacyNotesText?: string | null;
  uncertaintyNotesText?: string | null;
  qualityLevel?: string | null;
}): ScreenshotStructuredDraft {
  return normalizeDraft({
    draftLabel: "用户编辑草稿 / 待最终使用",
    possibleTitle: input.possibleTitle ?? null,
    possiblePrice: input.possiblePrice ?? null,
    possibleSalesOrHeat: input.possibleSalesOrHeat ?? null,
    possiblePlatformSource: input.possiblePlatformSource ?? null,
    sellingPoints: parseTextareaLines(input.sellingPointsText),
    specInfo: parseTextareaLines(input.specInfoText),
    riskWords: parseTextareaLines(input.riskWordsText),
    imageDescription: input.imageDescription ?? "",
    copywritingMaterialSummary: input.copywritingMaterialSummary ?? "",
    platformCopywritingDirections: parseTextareaLines(input.platformCopywritingDirectionsText),
    privacyNotes: parseTextareaLines(input.privacyNotesText),
    uncertaintyNotes: parseTextareaLines(input.uncertaintyNotesText),
    qualityLevel: normalizeQualityLevel(input.qualityLevel),
  });
}

function parseDraft(value: string | null | undefined) {
  if (!value) return null;
  try {
    return normalizeDraft(JSON.parse(value) as Partial<ScreenshotStructuredDraft>);
  } catch {
    return null;
  }
}

function buildResultSummary(draft: ScreenshotStructuredDraft) {
  return summarizePrompt(
    [
      draft.possibleTitle,
      draft.possiblePrice,
      draft.possiblePlatformSource,
      draft.imageDescription,
      draft.sellingPoints.join("/"),
      draft.uncertaintyNotes.join("/"),
    ]
      .filter(Boolean)
      .join(" | "),
    320,
  );
}

function buildSourceLabel(record: ScreenshotJobRecord) {
  if (record.sourceType === SCREENSHOT_SOURCE_TYPES.PRODUCT && record.product && !record.product.deletedAt) {
    return `商品：${record.product.name}`;
  }
  if (record.sourceType === SCREENSHOT_SOURCE_TYPES.INSPIRATION && record.inspiration) {
    return `灵感：${record.inspiration.title ?? `#${record.inspiration.id}`}`;
  }
  if (record.sourceType === SCREENSHOT_SOURCE_TYPES.MATERIAL && record.material) {
    return `素材：#${record.material.id}`;
  }
  if (record.sourceType === SCREENSHOT_SOURCE_TYPES.COMPETITOR && record.competitor) {
    return `竞品：${record.competitor.title}`;
  }
  return "手动上传";
}

function getQualityTone(qualityLevel: string | null) {
  if (qualityLevel === SCREENSHOT_QUALITY_LEVELS.HIGH) return "green" as const;
  if (qualityLevel === SCREENSHOT_QUALITY_LEVELS.MEDIUM) return "blue" as const;
  if (qualityLevel === SCREENSHOT_QUALITY_LEVELS.LOW) return "amber" as const;
  if (qualityLevel === SCREENSHOT_QUALITY_LEVELS.FAILED) return "red" as const;
  return "slate" as const;
}

function getStatusTone(status: string) {
  if (status === SCREENSHOT_JOB_STATUSES.SUCCESS) return "green" as const;
  if (status === SCREENSHOT_JOB_STATUSES.FAILED) return "red" as const;
  if (status === SCREENSHOT_JOB_STATUSES.PROCESSING) return "blue" as const;
  if (status === SCREENSHOT_JOB_STATUSES.SKIPPED) return "slate" as const;
  return "amber" as const;
}

function mapScreenshotJob(record: ScreenshotJobRecord) {
  const structuredDraft = parseDraft(record.structuredDraft);
  const confirmedDraft = parseDraft(record.confirmedDraft);
  return {
    ...record,
    displayPath: record.thumbnailPath ?? record.imagePath,
    structuredDraft,
    confirmedDraft,
    effectiveDraft: confirmedDraft ?? structuredDraft,
    sourceLabel: buildSourceLabel(record),
    statusTone: getStatusTone(record.status),
    qualityTone: getQualityTone(record.qualityLevel),
    formattedCreatedAt: formatDateTime(record.createdAt),
    formattedUpdatedAt: formatDateTime(record.updatedAt),
    formattedConfirmedAt: record.confirmedAt ? formatDateTime(record.confirmedAt) : null,
    formattedIgnoredAt: record.ignoredAt ? formatDateTime(record.ignoredAt) : null,
  };
}

async function resolveProduct(productId: number | null) {
  if (!productId) return null;
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true },
  });
  if (!product) {
    throw createValidationError("关联商品不存在或已删除。");
  }
  return product.id;
}

async function resolveExistingSourceImage(sourceType: ScreenshotSourceType, sourceId: string | null): Promise<SourceImage | null> {
  const id = parsePositiveId(sourceId);
  if (!id) return null;

  if (sourceType === SCREENSHOT_SOURCE_TYPES.INSPIRATION) {
    const inspiration = await prisma.inspiration.findUnique({
      where: { id },
      select: { id: true, imagePath: true, thumbnailPath: true, convertedProductId: true },
    });
    if (!inspiration) throw createValidationError("灵感记录不存在。");
    return {
      imagePath: inspiration.imagePath,
      thumbnailPath: inspiration.thumbnailPath,
      productId: inspiration.convertedProductId,
      inspirationId: inspiration.id,
      materialId: null,
      competitorId: null,
    };
  }

  if (sourceType === SCREENSHOT_SOURCE_TYPES.MATERIAL) {
    const material = await prisma.material.findUnique({
      where: { id },
      select: { id: true, productId: true, filePath: true, thumbnailPath: true },
    });
    if (!material) throw createValidationError("素材记录不存在。");
    return {
      imagePath: material.filePath,
      thumbnailPath: material.thumbnailPath,
      productId: material.productId,
      inspirationId: null,
      materialId: material.id,
      competitorId: null,
    };
  }

  if (sourceType === SCREENSHOT_SOURCE_TYPES.COMPETITOR) {
    const competitor = await prisma.competitor.findUnique({
      where: { id },
      select: { id: true, productId: true, screenshotPath: true },
    });
    if (!competitor) throw createValidationError("竞品记录不存在。");
    if (!competitor.screenshotPath) return null;
    return {
      imagePath: competitor.screenshotPath,
      thumbnailPath: null,
      productId: competitor.productId,
      inspirationId: null,
      materialId: null,
      competitorId: competitor.id,
    };
  }

  if (sourceType === SCREENSHOT_SOURCE_TYPES.PRODUCT) {
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, mainImagePath: true },
    });
    if (!product) throw createValidationError("商品不存在或已删除。");
    if (!product.mainImagePath) return null;
    return {
      imagePath: product.mainImagePath,
      thumbnailPath: null,
      productId: product.id,
      inspirationId: null,
      materialId: null,
      competitorId: null,
    };
  }

  return null;
}

async function storeScreenshotUpload(input: { file: File; sourceType: ScreenshotSourceType }) {
  const extension = assertSupportedImageFile(input.file, { label: "截图识别图片" }).extension;
  const fileName = createShortFileName({ prefix: "screenshot", extension });
  const relativePath = toSafeRelativePath(
    "uploads",
    "screenshots",
    sanitizeSegment(input.sourceType, "manual"),
    fileName,
  );

  return storeImageFile({
    file: input.file,
    label: "截图识别图片",
    relativePath,
  });
}

async function recordScreenshotOperation(input: {
  productId?: number | null;
  inspirationId?: number | null;
  action: string;
  detail: string;
}) {
  return prisma.operationLog.create({
    data: {
      productId: input.productId ?? null,
      relatedInspirationId: input.inspirationId ?? null,
      action: input.action,
      detail: input.detail,
    },
  });
}

function getMimeTypeFromRelativePath(relativePath: string) {
  const extension = path.extname(relativePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  return "image/webp";
}

function buildVisionPrompt() {
  return [
    "你是 EcomPilot 的本地电商截图识别助手。",
    "只处理用户主动上传或明确选择的截图/本地图片；不要假设你访问了网页，也不要生成链接、爬虫、自动采集或发布建议。",
    "请只根据图片中可直接观察到的信息，生成结构化草稿。所有结果都必须视为“AI 识别草稿 / 待用户确认”，不是事实。",
    "可以尝试提取可能商品标题、可能价格、可能销量或热度线索、可能平台来源、卖点、规格、风险词、图片描述、文案素材摘要和平台文案方向。",
    "不得把不确定内容写成确定结论；不得保存个人隐私数据。若截图含手机号、地址、头像、昵称、订单号等个人信息，只在 privacyNotes 中提醒用户人工处理。",
    "qualityLevel 只能表示图片识别质量：high 清晰且字段较完整，medium 可用但字段缺失，low 模糊或不确定，failed 无法识别。",
    "输出必须是 JSON，且符合给定 schema。",
  ].join("\n");
}

export async function createScreenshotRecognitionJob(input: {
  sourceType: string;
  sourceId?: string | null;
  productId?: string | number | null;
  file?: File | null;
}) {
  ensureScreenshotWritesAllowed();

  try {
    const sourceType = normalizeSourceType(input.sourceType || SCREENSHOT_SOURCE_TYPES.MANUAL);
    const sourceId = normalizeOptionalText(input.sourceId, 40);
    const sourceImage = await resolveExistingSourceImage(sourceType, sourceId);
    const inputProductId = parsePositiveId(input.productId);
    const hasUpload = input.file instanceof File && input.file.size > 0;

    let imagePath: string;
    let thumbnailPath: string | null;
    let productId = sourceImage?.productId ?? inputProductId;
    const inspirationId = sourceImage?.inspirationId ?? null;
    const materialId = sourceImage?.materialId ?? null;
    const competitorId = sourceImage?.competitorId ?? null;

    if (hasUpload) {
      const storedImage = await storeScreenshotUpload({ file: input.file!, sourceType });
      imagePath = storedImage.filePath;
      thumbnailPath = storedImage.thumbnailPath;
    } else if (sourceImage) {
      imagePath = sourceImage.imagePath;
      thumbnailPath = sourceImage.thumbnailPath;
    } else {
      throw createValidationError("请上传截图，或选择一条已有图片的来源记录。");
    }

    productId = await resolveProduct(productId);

    const job = await prisma.screenshotRecognitionJob.create({
      data: {
        sourceType,
        sourceId,
        productId,
        inspirationId,
        materialId,
        competitorId,
        imagePath,
        thumbnailPath,
        status: SCREENSHOT_JOB_STATUSES.PENDING,
        needsUserConfirmation: true,
      },
      select: screenshotJobSelect,
    });

    await recordScreenshotOperation({
      productId,
      inspirationId,
      action: "CREATE_SCREENSHOT_RECOGNITION_JOB",
      detail: `创建截图识别草稿任务：jobId=${job.id} / sourceType=${sourceType} / image=${imagePath}`,
    });

    return mapScreenshotJob(job);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function recognizeScreenshotJob(jobId: number) {
  ensureScreenshotWritesAllowed();

  let aiJobId: number | null = null;

  try {
    const job = await prisma.screenshotRecognitionJob.findUnique({
      where: { id: jobId },
      select: screenshotJobSelect,
    });

    if (!job) throw createValidationError("截图识别任务不存在。");
    if (job.status === SCREENSHOT_JOB_STATUSES.PROCESSING) {
      throw createValidationError("截图识别任务正在处理中，请稍后查看结果。");
    }

    await prisma.screenshotRecognitionJob.update({
      where: { id: job.id },
      data: {
        status: SCREENSHOT_JOB_STATUSES.PROCESSING,
        errorSummary: null,
      },
    });

    const provider = await getDefaultEnabledAIProvider();
    if (!provider) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.DEFAULT_PROVIDER_REQUIRED, "请先配置可用的默认 AI Provider。");
    }

    const aiJob = await createAIJob({
      jobType: SCREENSHOT_AI_JOB_TYPES.RECOGNITION,
      idempotencyKey: `screenshot-recognition:${job.id}:${Date.now()}`,
      relatedProductId: job.productId,
      relatedInspirationId: job.inspirationId,
      inputSummary: `screenshot recognition job=${job.id} sourceType=${job.sourceType}`,
    });
    aiJobId = aiJob.id;

    await prisma.screenshotRecognitionJob.update({
      where: { id: job.id },
      data: { aiJobId },
    });
    await markAIJobRunning(aiJobId);

    const sourceRelativePath = job.thumbnailPath ?? job.imagePath;
    const imageBuffer = await readFile(getUploadsAbsolutePath(sourceRelativePath));
    const imageDataUrl = `data:${getMimeTypeFromRelativePath(sourceRelativePath)};base64,${imageBuffer.toString("base64")}`;
    const inputSummary = `screenshot recognition job=${job.id} sourceType=${job.sourceType}`;

    const result = await generateTextJson({
      baseUrl: provider.baseUrl ?? "",
      apiKey: provider.apiKey ?? "",
      modelName: provider.modelName ?? "",
      providerType: provider.providerType,
      prompt: buildVisionPrompt(),
      requestType: "screenshot_recognition",
      inputSummary,
      relatedProductId: job.productId,
      relatedInspirationId: job.inspirationId,
      relatedTaskId: aiJobId,
      preferStructuredOutput: true,
      responseSchema: buildScreenshotDraftJsonSchema(),
      imageDataUrl,
    });

    const structured = validateJsonAIOutput(result.content, screenshotStructuredDraftSchema);
    if (!structured.success) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, structured.errorSummary);
    }

    const draft = normalizeDraft(structured.data);
    const resultSummary = buildResultSummary(draft);
    const updated = await prisma.screenshotRecognitionJob.update({
      where: { id: job.id },
      data: {
        status: SCREENSHOT_JOB_STATUSES.SUCCESS,
        resultSummary,
        structuredDraft: JSON.stringify(draft),
        qualityLevel: draft.qualityLevel,
        needsUserConfirmation: true,
        errorSummary: null,
      },
      select: screenshotJobSelect,
    });

    await markAIJobSuccess(aiJobId, `screenshot recognition draft saved job=${job.id}`);
    return mapScreenshotJob(updated);
  } catch (error) {
    const failureSummary = sanitizeAIErrorSummary(error);

    try {
      await prisma.screenshotRecognitionJob.update({
        where: { id: jobId },
        data: {
          status: SCREENSHOT_JOB_STATUSES.FAILED,
          qualityLevel: SCREENSHOT_QUALITY_LEVELS.FAILED,
          errorSummary: failureSummary,
        },
      });
    } catch {
      // Keep the original error.
    }

    if (aiJobId !== null) {
      try {
        await markAIJobFailed(aiJobId, error);
      } catch {
        // Keep the original error.
      }
    }

    throw normalizeProductWriteError(error);
  }
}

export async function saveScreenshotDraft(input: {
  jobId: number;
  draft: ScreenshotStructuredDraft;
}) {
  ensureScreenshotWritesAllowed();

  try {
    const normalized = normalizeDraft(input.draft);
    const updated = await prisma.screenshotRecognitionJob.update({
      where: { id: input.jobId },
      data: {
        structuredDraft: JSON.stringify(normalized),
        qualityLevel: normalized.qualityLevel,
        resultSummary: buildResultSummary(normalized),
        needsUserConfirmation: true,
      },
      select: screenshotJobSelect,
    });

    await recordScreenshotOperation({
      productId: updated.productId,
      inspirationId: updated.inspirationId,
      action: "EDIT_SCREENSHOT_RECOGNITION_DRAFT",
      detail: `编辑截图识别草稿：jobId=${updated.id}。未写入正式商品、竞品或素材字段。`,
    });

    return mapScreenshotJob(updated);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function confirmScreenshotDraft(input: {
  jobId: number;
  draft: ScreenshotStructuredDraft;
}) {
  ensureScreenshotWritesAllowed();

  try {
    const normalized = normalizeDraft(input.draft);
    const updated = await prisma.screenshotRecognitionJob.update({
      where: { id: input.jobId },
      data: {
        confirmedDraft: JSON.stringify(normalized),
        qualityLevel: normalized.qualityLevel,
        needsUserConfirmation: false,
        confirmedAt: new Date(),
      },
      select: screenshotJobSelect,
    });

    await recordScreenshotOperation({
      productId: updated.productId,
      inspirationId: updated.inspirationId,
      action: "CONFIRM_SCREENSHOT_RECOGNITION_DRAFT",
      detail: `确认截图识别草稿：jobId=${updated.id}。确认结果仅保存在截图识别任务中，未自动覆盖正式字段。`,
    });

    return mapScreenshotJob(updated);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function ignoreScreenshotDraft(jobId: number) {
  ensureScreenshotWritesAllowed();

  try {
    const updated = await prisma.screenshotRecognitionJob.update({
      where: { id: jobId },
      data: {
        status: SCREENSHOT_JOB_STATUSES.SKIPPED,
        needsUserConfirmation: false,
        ignoredAt: new Date(),
      },
      select: screenshotJobSelect,
    });

    await recordScreenshotOperation({
      productId: updated.productId,
      inspirationId: updated.inspirationId,
      action: "IGNORE_SCREENSHOT_RECOGNITION_DRAFT",
      detail: `忽略截图识别草稿：jobId=${updated.id}。未写入正式商品、竞品或素材字段。`,
    });

    return mapScreenshotJob(updated);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function getScreenshotRecognitionPageData(input?: {
  jobId?: number | null;
  sourceType?: string | null;
  sourceId?: string | null;
  productId?: string | number | null;
}) {
  try {
    const runtime = getRuntimeModeSummary();
    const querySourceType = input?.sourceType && isScreenshotSourceType(input.sourceType) ? input.sourceType : SCREENSHOT_SOURCE_TYPES.MANUAL;
    const queryProductId = parsePositiveId(input?.productId);

    if (!runtime.isWritable && runtime.mode === "cloud") {
      return {
        runtime,
        jobs: [],
        selectedJob: null,
        defaults: {
          sourceType: querySourceType,
          sourceId: input?.sourceId ?? "",
          productId: queryProductId ? String(queryProductId) : "",
        },
      };
    }

    const where: Prisma.ScreenshotRecognitionJobWhereInput = {};
    if (queryProductId) {
      where.productId = queryProductId;
    }

    const jobs = await prisma.screenshotRecognitionJob.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 80,
      select: screenshotJobSelect,
    });
    const selectedRecord =
      input?.jobId && Number.isInteger(input.jobId)
        ? jobs.find((job) => job.id === input.jobId) ??
          (await prisma.screenshotRecognitionJob.findUnique({ where: { id: input.jobId }, select: screenshotJobSelect }))
        : jobs[0] ?? null;

    return {
      runtime,
      jobs: jobs.map(mapScreenshotJob),
      selectedJob: selectedRecord ? mapScreenshotJob(selectedRecord) : null,
      defaults: {
        sourceType: querySourceType,
        sourceId: input?.sourceId ?? "",
        productId: queryProductId ? String(queryProductId) : "",
      },
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export const screenshotSourceTypeOptions = [
  { value: SCREENSHOT_SOURCE_TYPES.MANUAL, label: "手动上传" },
  { value: SCREENSHOT_SOURCE_TYPES.INSPIRATION, label: "灵感箱" },
  { value: SCREENSHOT_SOURCE_TYPES.PRODUCT, label: "商品详情" },
  { value: SCREENSHOT_SOURCE_TYPES.COMPETITOR, label: "竞品模块" },
  { value: SCREENSHOT_SOURCE_TYPES.MATERIAL, label: "素材库" },
];

export const screenshotQualityOptions = [
  { value: SCREENSHOT_QUALITY_LEVELS.HIGH, label: "high：清晰且字段较完整" },
  { value: SCREENSHOT_QUALITY_LEVELS.MEDIUM, label: "medium：可用但字段缺失" },
  { value: SCREENSHOT_QUALITY_LEVELS.LOW, label: "low：模糊或不确定" },
  { value: SCREENSHOT_QUALITY_LEVELS.FAILED, label: "failed：无法识别" },
];
