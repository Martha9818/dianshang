import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildCopywritingDisplayView } from "@/lib/modules/copywriting/copywriting-display-adapter";
import {
  buildMultiPlatformCopywritingJsonSchema,
  buildMultiPlatformCopywritingPrompt,
  multiPlatformCopywritingSchema,
  normalizeMultiPlatformDraft,
} from "@/lib/modules/copywriting/multi-platform-package";
import {
  buildCopywritingJsonSchema,
  buildCopywritingPrompt,
  COPYWRITING_GENERATION_STATUS,
  COPYWRITING_JOB_TYPES,
  COPYWRITING_PLATFORMS,
  COPYWRITING_VERSION_STYLES,
  type CopywritingPlatform,
  type CopywritingVersionCode,
} from "@/lib/modules/copywriting/prompts";
import {
  BUSINESS_ERROR_CODES,
  formatCurrency,
  OPERATION_LOG_ACTIONS,
  parseJsonStringArray,
  ProductBusinessError,
} from "@/lib/modules/products";
import { buildBannedWordsText, detectBannedWords, getBannedWords } from "@/lib/services/banned-word-service";
import { generateTextJson } from "@/lib/services/ai-client";
import {
  createAIJob,
  createAIRequestLog,
  markAIJobFailed,
  markAIJobRunning,
  markAIJobSuccess,
  validateJsonAIOutput,
  type AISchema,
} from "@/lib/services/ai";
import { getAIProviderById, getSceneDefaultAIProvider } from "@/lib/services/ai-provider-service";
import {
  ensureProductWritesAllowed,
  getRuntimeModeSummary,
  normalizeProductReadError,
  normalizeProductWriteError,
} from "@/lib/services/product-runtime-service";
import {
  getSortDirection,
  normalizeCopywritingListQuery,
  type CopywritingListQuery,
} from "@/lib/services/query-service";

const PRODUCT_COPYWRITING_SELECT = {
  id: true,
  name: true,
  categoryLevel1: true,
  categoryLevel2: true,
  tags: true,
  targetUser: true,
  targetPlatforms: true,
  estimatedPrice: true,
  estimatedCost: true,
  estimatedShipping: true,
  sellingPoints: true,
  painPoints: true,
  usageScenes: true,
  notes: true,
  deletedAt: true,
} as const;

const COMPETITOR_COPYWRITING_SELECT = {
  id: true,
  productId: true,
  price: true,
  sellingPoint: true,
  painPoint: true,
  imageStyle: true,
  updatedAt: true,
} as const;

const COPYWRITING_SELECT = {
  id: true,
  productId: true,
  providerId: true,
  aiJobId: true,
  platform: true,
  copyType: true,
  version: true,
  versionLabel: true,
  style: true,
  title: true,
  content: true,
  body: true,
  mainCopy: true,
  sellingPointsJson: true,
  tagsJson: true,
  faqJson: true,
  riskNotesJson: true,
  auditStatus: true,
  generationStatus: true,
  riskWords: true,
  violationScanResultJson: true,
  isUsedInListing: true,
  usedAt: true,
  usedPlatform: true,
  usageNote: true,
  structuredPayloadJson: true,
  rawResponseText: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      name: true,
      spu: true,
      deletedAt: true,
    },
  },
  aiJob: {
    select: {
      id: true,
      jobType: true,
      status: true,
      errorSummary: true,
      resultSummary: true,
      createdAt: true,
      finishedAt: true,
    },
  },
} as const;

const inFlightGenerations = new Set<string>();

type CopywritingRecord = Prisma.CopywritingGetPayload<{ select: typeof COPYWRITING_SELECT }>;
type CompetitorPromptRecord = Prisma.CompetitorGetPayload<{ select: typeof COMPETITOR_COPYWRITING_SELECT }>;

export type CopywritingFormValues = {
  copywritingId?: number | null;
  productId: number;
  providerId: number | null;
  platform: CopywritingPlatform;
  version: CopywritingVersionCode;
  style: string;
  title: string;
  mainCopy: string;
  sellingPointsText: string;
  faqText?: string;
  riskNotesText?: string;
  tagsText?: string;
  usageNote?: string;
};

export type MultiPlatformGenerateInput = {
  productId: number;
  providerId?: number | null;
  retryFromAiJobId?: number | null;
};

type StructuredVersionResult = {
  version: CopywritingVersionCode;
  style: string;
  title: string;
  main_copy: string;
  selling_points: string[];
  faq: string[];
  risk_notes: string[];
};

type StructuredResponse = {
  platform: string;
  versions: StructuredVersionResult[];
};

type CopywritingDraftPayload = {
  platform: CopywritingPlatform;
  versionLabel: CopywritingVersionCode;
  providerId: number | null;
  aiJobId: number | null;
  title: string;
  body: string;
  sellingPoints: string[];
  tags: string[];
  versionStyle: string;
  generationStatus: string;
  auditStatus: string;
  riskWordsJson: string | null;
  violationScanResultJson: string | null;
  structuredPayloadJson: string | null;
  rawResponseText: string | null;
  faq?: string[];
  riskNotes?: string[];
};

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function createNotFoundError() {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.COPYWRITING_NOT_FOUND, "文案记录不存在。");
}

function createGeneratingError() {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.COPYWRITING_GENERATING, "正在生成中，请稍候。");
}

function stringifyStringArray(values: string[]) {
  const normalized = values.map((item) => item.trim()).filter(Boolean);
  return normalized.length > 0 ? JSON.stringify(normalized) : null;
}

function parseJsonArray(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

type RiskWordHitRecord = {
  word: string;
  category: string;
  riskLevel: string;
  field: string;
  matchedText: string;
};

function parseRiskWordHits(value: string | null | undefined) {
  if (!value) {
    return [] as RiskWordHitRecord[];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is RiskWordHitRecord => {
          return Boolean(
            item &&
              typeof item === "object" &&
              typeof (item as RiskWordHitRecord).word === "string" &&
              typeof (item as RiskWordHitRecord).category === "string" &&
              typeof (item as RiskWordHitRecord).riskLevel === "string" &&
              typeof (item as RiskWordHitRecord).field === "string",
          );
        })
      : [];
  } catch {
    return [] as RiskWordHitRecord[];
  }
}

function parseJsonObject<T>(value: string | null | undefined): T | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as T) : null;
  } catch {
    return null;
  }
}

function parseMultilineText(value: string | null | undefined) {
  return Array.from(
    new Set(
      String(value ?? "")
        .split(/\r?\n+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function assertPlatform(platform: string): asserts platform is CopywritingPlatform {
  if (!COPYWRITING_PLATFORMS.includes(platform as CopywritingPlatform)) {
    throw createValidationError("平台无效。");
  }
}

const copywritingResponseSchema: AISchema<StructuredResponse> = {
  name: "copywriting_response",
  validate(value: unknown): value is StructuredResponse {
    if (!value || typeof value !== "object" || !("platform" in value) || !("versions" in value)) {
      return false;
    }

    const candidate = value as { platform?: unknown; versions?: unknown };
    if (typeof candidate.platform !== "string" || !Array.isArray(candidate.versions)) {
      return false;
    }

    const versionCodes = new Set(
      candidate.versions
        .map((version) => (version && typeof version === "object" && "version" in version ? String(version.version) : ""))
        .filter(Boolean),
    );

    return (
      ["A", "B", "C"].every((versionCode) => versionCodes.has(versionCode)) &&
      candidate.versions.every((version) => {
        if (!version || typeof version !== "object") {
          return false;
        }

        const item = version as Record<string, unknown>;
        return (
          typeof item.version === "string" &&
          typeof item.style === "string" &&
          typeof item.title === "string" &&
          typeof item.main_copy === "string" &&
          Array.isArray(item.selling_points) &&
          Array.isArray(item.faq) &&
          Array.isArray(item.risk_notes)
        );
      })
    );
  },
};

function parseStructuredResponse(content: string) {
  return validateJsonAIOutput(content, copywritingResponseSchema);
}

function parseMultiPlatformStructuredResponse(content: string) {
  return validateJsonAIOutput(content, multiPlatformCopywritingSchema);
}

function normalizeVersionResult(input: Partial<StructuredVersionResult>, expectedVersion: CopywritingVersionCode) {
  return {
    version: expectedVersion,
    style: normalizeOptionalText(input.style) ?? COPYWRITING_VERSION_STYLES[expectedVersion],
    title: normalizeOptionalText(input.title) ?? "",
    main_copy: normalizeOptionalText(input.main_copy) ?? "",
    selling_points: Array.isArray(input.selling_points)
      ? input.selling_points.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [],
    faq: Array.isArray(input.faq)
      ? input.faq.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [],
    risk_notes: Array.isArray(input.risk_notes)
      ? input.risk_notes.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [],
  };
}

function buildContentSummary(input: {
  title: string;
  body: string;
  sellingPoints: string[];
  tags: string[];
  faq?: string[];
  riskNotes?: string[];
}) {
  return [
    input.title ? `标题：${input.title}` : null,
    input.body ? `正文：${input.body}` : null,
    input.sellingPoints.length > 0 ? `卖点：${input.sellingPoints.join("；")}` : null,
    input.tags.length > 0 ? `标签：${input.tags.join("；")}` : null,
    input.faq && input.faq.length > 0 ? `FAQ：${input.faq.join("；")}` : null,
    input.riskNotes && input.riskNotes.length > 0 ? `风险提示：${input.riskNotes.join("；")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function summarizeCompetitors(competitors: CompetitorPromptRecord[]) {
  const sellingPoints = Array.from(
    new Set(competitors.map((item) => item.sellingPoint?.trim()).filter((item): item is string => Boolean(item))),
  );
  const painPoints = Array.from(
    new Set(competitors.map((item) => item.painPoint?.trim()).filter((item): item is string => Boolean(item))),
  );
  const imageStyles = Array.from(
    new Set(competitors.map((item) => item.imageStyle?.trim()).filter((item): item is string => Boolean(item))),
  );
  const prices = competitors.map((item) => item.price).filter((item) => typeof item === "number" && Number.isFinite(item));
  const priceRangeText =
    prices.length > 0 ? `${formatCurrency(Math.min(...prices))} - ${formatCurrency(Math.max(...prices))}` : "暂无竞品信息，请基于商品基础信息生成";

  return {
    sellingPoints,
    painPoints,
    imageStyles,
    priceRangeText,
    hasCompetitors: competitors.length > 0,
  };
}

async function getPromptData(productId: number) {
  const [product, competitors, bannedWords] = await Promise.all([
    prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
      select: PRODUCT_COPYWRITING_SELECT,
    }),
    prisma.competitor.findMany({
      where: { productId },
      select: COMPETITOR_COPYWRITING_SELECT,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    }),
    getBannedWords(),
  ]);

  if (!product) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "商品不存在或已删除。");
  }

  return {
    product,
    competitors,
    bannedWords,
  };
}

async function scanDraftWithFallback(input: {
  title: string;
  body: string;
  sellingPoints: string[];
  tags: string[];
  faq?: string[];
  riskNotes?: string[];
  bannedWords: Awaited<ReturnType<typeof getBannedWords>>;
}) {
  try {
    const scan = detectBannedWords({
      title: input.title,
      mainCopy: input.body,
      sellingPoints: [...input.sellingPoints, ...input.tags],
      faq: input.faq ?? [],
      riskNotes: input.riskNotes ?? [],
      bannedWords: input.bannedWords,
    });

    return {
      ok: true as const,
      scan,
      warning: null,
    };
  } catch (error) {
    const warning = error instanceof Error ? error.message.slice(0, 160) : "违规词扫描失败";
    return {
      ok: false as const,
      scan: {
        hits: [],
        auditStatus: "unknown",
        hasHighRisk: false,
      },
      warning,
    };
  }
}

function mapCopywritingRecord(record: CopywritingRecord) {
  const display = buildCopywritingDisplayView(record);
  const riskWords = parseRiskWordHits(record.riskWords);
  const violationScanResult = parseJsonObject<{
    status: string;
    warning?: string | null;
    hits: Array<{ word: string; category: string; riskLevel: string; field: string; matchedText: string }>;
  }>(record.violationScanResultJson);

  return {
    ...record,
    versionLabel: record.versionLabel ?? record.version,
    body: record.body ?? record.mainCopy,
    sellingPoints: parseJsonArray(record.sellingPointsJson),
    tags: parseJsonArray(record.tagsJson),
    faqItems: parseJsonArray(record.faqJson),
    riskNotes: parseJsonArray(record.riskNotesJson),
    riskWordHits: riskWords,
    violationScanResult,
    usedAt: record.usedAt ? record.usedAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    product:
      record.product && !record.product.deletedAt
        ? {
            id: record.product.id,
            name: record.product.name,
            spu: record.product.spu,
          }
        : null,
    display,
    aiJobSummary: record.aiJob
      ? {
          id: record.aiJob.id,
          jobType: record.aiJob.jobType,
          status: record.aiJob.status,
          errorSummary: record.aiJob.errorSummary,
          resultSummary: record.aiJob.resultSummary,
          createdAt: record.aiJob.createdAt.toISOString(),
        }
      : null,
  };
}

async function createCopywritingDraft(
  tx: Prisma.TransactionClient,
  input: {
    productId: number;
    providerId: number | null;
    draft: CopywritingDraftPayload;
  },
) {
  return tx.copywriting.create({
    data: {
      productId: input.productId,
      providerId: input.providerId,
      aiJobId: input.draft.aiJobId,
      platform: input.draft.platform,
      copyType: "platform",
      version: input.draft.versionLabel,
      versionLabel: input.draft.versionLabel,
      style: input.draft.versionStyle,
      title: normalizeOptionalText(input.draft.title),
      content: buildContentSummary({
        title: input.draft.title,
        body: input.draft.body,
        sellingPoints: input.draft.sellingPoints,
        tags: input.draft.tags,
        faq: input.draft.faq,
        riskNotes: input.draft.riskNotes,
      }),
      body: normalizeOptionalText(input.draft.body),
      mainCopy: normalizeOptionalText(input.draft.body),
      sellingPointsJson: stringifyStringArray(input.draft.sellingPoints),
      tagsJson: stringifyStringArray(input.draft.tags),
      faqJson: stringifyStringArray(input.draft.faq ?? []),
      riskNotesJson: stringifyStringArray(input.draft.riskNotes ?? []),
      generationStatus: input.draft.generationStatus,
      auditStatus: input.draft.auditStatus,
      riskWords: input.draft.riskWordsJson,
      violationScanResultJson: input.draft.violationScanResultJson,
      structuredPayloadJson: input.draft.structuredPayloadJson,
      rawResponseText: input.draft.rawResponseText,
      usedPlatform: input.draft.platform,
    },
    select: COPYWRITING_SELECT,
  });
}

async function updateCopywritingDraftForRetry(
  tx: Prisma.TransactionClient,
  input: {
    existingId: number;
    providerId: number | null;
    draft: CopywritingDraftPayload;
  },
) {
  return tx.copywriting.update({
    where: { id: input.existingId },
    data: {
      providerId: input.providerId,
      aiJobId: input.draft.aiJobId,
      style: input.draft.versionStyle,
      title: normalizeOptionalText(input.draft.title),
      content: buildContentSummary({
        title: input.draft.title,
        body: input.draft.body,
        sellingPoints: input.draft.sellingPoints,
        tags: input.draft.tags,
        faq: input.draft.faq,
        riskNotes: input.draft.riskNotes,
      }),
      body: normalizeOptionalText(input.draft.body),
      mainCopy: normalizeOptionalText(input.draft.body),
      sellingPointsJson: stringifyStringArray(input.draft.sellingPoints),
      tagsJson: stringifyStringArray(input.draft.tags),
      faqJson: stringifyStringArray(input.draft.faq ?? []),
      riskNotesJson: stringifyStringArray(input.draft.riskNotes ?? []),
      generationStatus: input.draft.generationStatus,
      auditStatus: input.draft.auditStatus,
      riskWords: input.draft.riskWordsJson,
      violationScanResultJson: input.draft.violationScanResultJson,
      structuredPayloadJson: input.draft.structuredPayloadJson,
      rawResponseText: input.draft.rawResponseText,
      usedPlatform: input.draft.platform,
    },
    select: COPYWRITING_SELECT,
  });
}

async function saveGeneratedDrafts(
  tx: Prisma.TransactionClient,
  input: {
    productId: number;
    providerId: number | null;
    aiJobId: number;
    drafts: CopywritingDraftPayload[];
    retryFromAiJobId?: number | null;
  },
) {
  const retryLookup =
    input.retryFromAiJobId && input.retryFromAiJobId > 0
      ? await tx.copywriting.findMany({
          where: {
            productId: input.productId,
            aiJobId: input.retryFromAiJobId,
          },
          select: {
            id: true,
            platform: true,
            versionLabel: true,
          },
        })
      : [];

  const retryMap = new Map<string, number>(
    retryLookup.map((item) => [`${item.platform ?? ""}:${item.versionLabel ?? ""}`, item.id]),
  );

  const saved: CopywritingRecord[] = [];
  for (const draft of input.drafts) {
    const retryKey = `${draft.platform}:${draft.versionLabel}`;
    const existingId = retryMap.get(retryKey) ?? null;
    const record = existingId
      ? await updateCopywritingDraftForRetry(tx, {
          existingId,
          providerId: input.providerId,
          draft: { ...draft, aiJobId: input.aiJobId },
        })
      : await createCopywritingDraft(tx, {
          productId: input.productId,
          providerId: input.providerId,
          draft: { ...draft, aiJobId: input.aiJobId },
        });
    saved.push(record);
  }

  return saved;
}

function groupCopywritingsByPlatform(records: ReturnType<typeof mapCopywritingRecord>[]) {
  return COPYWRITING_PLATFORMS.map((platform) => ({
    platform,
    records: records
      .filter((record) => record.platform === platform)
      .toSorted((left, right) => {
        if (left.isUsedInListing !== right.isUsedInListing) {
          return left.isUsedInListing ? -1 : 1;
        }
        if ((left.versionLabel ?? "") !== (right.versionLabel ?? "")) {
          return String(left.versionLabel ?? "").localeCompare(String(right.versionLabel ?? ""), "en");
        }
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }),
  })).filter((group) => group.records.length > 0);
}

export async function getCopywritingPageData(filters?: {
  productId?: number | null;
  keyword?: string | null;
  platform?: string | null;
  version?: string | null;
  hasViolation?: "true" | "false" | null;
  sort?: "createdAt_desc" | "createdAt_asc";
  providerId?: number | null;
}) {
  const runtime = getRuntimeModeSummary();
  const query = normalizeCopywritingListQuery(filters as CopywritingListQuery | undefined);

  async function loadProducts() {
    return prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        targetPlatforms: true,
        estimatedPrice: true,
        sellingPoints: true,
        painPoints: true,
        usageScenes: true,
      },
    });
  }

  async function loadProviders() {
    return prisma.aIProvider.findMany({
      where: { enabled: true, purpose: "text" },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        modelName: true,
        isDefault: true,
        enabled: true,
      },
    });
  }

  async function loadCopywritings() {
    const andConditions: Prisma.CopywritingWhereInput[] = [{ product: { deletedAt: null } }];

    if (query.productId) {
      andConditions.push({ productId: query.productId });
    }

    if (query.platform) {
      andConditions.push({ platform: query.platform });
    }

    if (query.version) {
      andConditions.push({
        OR: [{ versionLabel: query.version }, { version: query.version }],
      });
    }

    if (query.keyword) {
      andConditions.push({
        OR: [
          { title: { contains: query.keyword } },
          { body: { contains: query.keyword } },
          { mainCopy: { contains: query.keyword } },
          { content: { contains: query.keyword } },
          { product: { name: { contains: query.keyword } } },
          { product: { spu: { contains: query.keyword } } },
        ],
      });
    }

    if (query.hasViolation === "true") {
      andConditions.push({ riskWords: { not: null } });
    } else if (query.hasViolation === "false") {
      andConditions.push({ riskWords: null });
    }

    if (query.providerId) {
      andConditions.push({ providerId: query.providerId });
    }

    return prisma.copywriting.findMany({
      where: { AND: andConditions },
      orderBy: [{ createdAt: getSortDirection(query.sort) }],
      select: COPYWRITING_SELECT,
      take: 200,
    });
  }

  try {
    const [products, providers, existingCopywritings, sceneDefaultProvider] = await Promise.all([
      loadProducts(),
      loadProviders(),
      loadCopywritings(),
      getSceneDefaultAIProvider("copywriting"),
    ]);

    const defaultProvider = providers.find((provider) => provider.id === sceneDefaultProvider?.id) ?? providers.find((provider) => provider.isDefault) ?? null;
    const selectedProductId = query.productId;
    const selectedPlatform = query.platform;
    const mappedCopywritings = existingCopywritings.map(mapCopywritingRecord);

    return {
      products: products.map((product) => ({
        ...product,
        targetPlatformList: parseJsonStringArray(product.targetPlatforms),
      })),
      providers,
      defaultProviderId: defaultProvider?.id ?? null,
      selectedProductId,
      selectedPlatform,
      copywritings: mappedCopywritings,
      groupedCopywritings: groupCopywritingsByPlatform(mappedCopywritings),
      readNotice: null as string | null,
    };
  } catch (error) {
    if (!runtime.isWritable) {
      const settled = await Promise.allSettled([loadProducts(), loadProviders(), loadCopywritings()]);
      const [productsResult, providersResult, copywritingsResult] = settled;
      const products = productsResult.status === "fulfilled" ? productsResult.value : [];
      const providers = providersResult.status === "fulfilled" ? providersResult.value : [];
      const existingCopywritings = copywritingsResult.status === "fulfilled" ? copywritingsResult.value : [];
      const defaultProvider = providers.find((provider) => provider.isDefault) ?? null;
      const selectedProductId =
        query.productId && products.some((product) => product.id === query.productId) ? query.productId : null;
      const selectedPlatform = query.platform;
      const mappedCopywritings = existingCopywritings.map(mapCopywritingRecord);

      return {
        products: products.map((product) => ({
          ...product,
          targetPlatformList: parseJsonStringArray(product.targetPlatforms),
        })),
        providers,
        defaultProviderId: defaultProvider?.id ?? null,
        selectedProductId,
        selectedPlatform,
        copywritings: mappedCopywritings,
        groupedCopywritings: groupCopywritingsByPlatform(mappedCopywritings),
        readNotice: "预览环境只读，当前仅展示可读取的文案数据；如未看到本地记录，请在 Windows 本地验收。",
      };
    }

    throw normalizeProductReadError(error);
  }
}

export async function getProductCopywritingTabData(productId: number, filters?: { platform?: string; version?: string }) {
  try {
    const records = await prisma.copywriting.findMany({
      where: {
        productId,
        ...(filters?.platform ? { platform: filters.platform } : {}),
        ...(filters?.version ? { versionLabel: filters.version } : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      select: COPYWRITING_SELECT,
    });

    return records.map(mapCopywritingRecord);
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function generatePlatformCopywriting(input: {
  productId: number;
  platform: CopywritingPlatform;
  providerId?: number | null;
}) {
  ensureProductWritesAllowed();
  assertPlatform(input.platform);

  const lockKey = `${input.productId}:${input.platform}`;
  if (inFlightGenerations.has(lockKey)) {
    throw createGeneratingError();
  }

  inFlightGenerations.add(lockKey);
  let aiJobId: number | null = null;

  try {
    const { product, competitors, bannedWords } = await getPromptData(input.productId);
    const provider =
      input.providerId !== null && input.providerId !== undefined
        ? await getAIProviderById(input.providerId)
        : await getSceneDefaultAIProvider("copywriting");

    if (!provider) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.DEFAULT_PROVIDER_REQUIRED, "当前没有可用的默认 Provider，请先配置 AI 设置。");
    }

    if (!provider.enabled) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.PROVIDER_DISABLED, "当前 Provider 已被禁用，请切换可用 Provider。");
    }

    const competitorSummary = summarizeCompetitors(competitors);
    const prompt = buildCopywritingPrompt({
      product,
      platform: input.platform,
      bannedWordsText: buildBannedWordsText(bannedWords),
      competitorSummary,
    });
    const inputSummary = `copywriting product=${input.productId} platform=${input.platform}`;
    const aiJob = await createAIJob({
      jobType: COPYWRITING_JOB_TYPES.SINGLE_PLATFORM,
      idempotencyKey: `copywriting:${input.productId}:${input.platform}`,
      relatedProductId: input.productId,
      inputSummary,
    });
    aiJobId = aiJob.id;
    await markAIJobRunning(aiJobId);

    const aiResult = await generateTextJson({
      baseUrl: provider.baseUrl ?? "",
      apiKey: provider.apiKey ?? "",
      modelName: provider.modelName ?? "",
      providerType: provider.providerType,
      prompt,
      requestType: "copywriting",
      inputSummary,
      relatedProductId: input.productId,
      relatedTaskId: aiJobId,
      preferStructuredOutput: true,
      responseSchema: buildCopywritingJsonSchema(),
    });

    const structuredResult = parseStructuredResponse(aiResult.content);
    if (!structuredResult.success) {
      const validationError = new ProductBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, structuredResult.errorSummary);
      await createAIRequestLog({
        provider: provider.providerType,
        model: provider.modelName ?? "unknown",
        requestType: "copywriting",
        inputTokens: aiResult.inputTokens,
        outputTokens: aiResult.outputTokens,
        durationMs: aiResult.durationMs,
        success: false,
        errorSummary: validationError.message,
        inputSummary,
        relatedProductId: input.productId,
        relatedTaskId: aiJobId,
      });
      await markAIJobFailed(aiJobId, validationError);
      throw validationError;
    }

    const expectedVersions: CopywritingVersionCode[] = ["A", "B", "C"];
    const drafts: CopywritingDraftPayload[] = [];
    const activeAiJobId = aiJobId;
    if (activeAiJobId === null) {
      throw createValidationError("AIJob 创建失败，无法保存文案。");
    }
    for (const versionCode of expectedVersions) {
      const version = structuredResult.data.versions.find((item) => item.version === versionCode);
      if (!version) {
        const validationError = new ProductBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, "AI 输出缺少必要文案版本。");
        await markAIJobFailed(aiJobId, validationError);
        throw validationError;
      }

      const normalized = normalizeVersionResult(version, versionCode);
      const scanResult = await scanDraftWithFallback({
        title: normalized.title,
        body: normalized.main_copy,
        sellingPoints: normalized.selling_points,
        tags: [],
        faq: normalized.faq,
        riskNotes: normalized.risk_notes,
        bannedWords,
      });

      drafts.push({
        platform: input.platform,
        versionLabel: versionCode,
        providerId: provider.id,
        aiJobId: activeAiJobId,
        title: normalized.title,
        body: normalized.main_copy,
        sellingPoints: normalized.selling_points,
        tags: [],
        versionStyle: normalized.style,
        generationStatus: COPYWRITING_GENERATION_STATUS.SUCCESS,
        auditStatus: scanResult.scan.auditStatus,
        riskWordsJson: scanResult.scan.hits.length > 0 ? JSON.stringify(scanResult.scan.hits) : null,
        violationScanResultJson: JSON.stringify({
          status: scanResult.ok ? "scanned" : "scan_failed",
          warning: scanResult.warning,
          hits: scanResult.scan.hits,
        }),
        structuredPayloadJson: JSON.stringify(structuredResult.data),
        rawResponseText: null,
        faq: normalized.faq,
        riskNotes: normalized.risk_notes,
      });
    }

    const saved = await prisma.$transaction(async (tx) => {
      const result = await saveGeneratedDrafts(tx, {
        productId: input.productId,
        providerId: provider.id,
        aiJobId: activeAiJobId,
        drafts,
      });

      await tx.operationLog.create({
        data: {
          productId: input.productId,
          action: OPERATION_LOG_ACTIONS.GENERATE_COPYWRITING,
          detail: `生成 ${product.name} ${input.platform} 平台文案`,
        },
      });

      return result;
    });

    await markAIJobSuccess(aiJobId, `copywriting saved drafts=${saved.length}`);
    return saved.map(mapCopywritingRecord);
  } catch (error) {
    if (aiJobId !== null) {
      try {
        await markAIJobFailed(aiJobId, error);
      } catch {
        // Keep the original copywriting failure as the user-facing error.
      }
    }
    throw normalizeProductWriteError(error);
  } finally {
    inFlightGenerations.delete(lockKey);
  }
}

export async function generateMultiPlatformCopywritingPackage(input: MultiPlatformGenerateInput) {
  ensureProductWritesAllowed();

  const lockKey = `multi:${input.productId}`;
  if (inFlightGenerations.has(lockKey)) {
    throw createGeneratingError();
  }

  inFlightGenerations.add(lockKey);
  let aiJobId: number | null = null;

  try {
    const { product, competitors, bannedWords } = await getPromptData(input.productId);
    const provider =
      input.providerId !== null && input.providerId !== undefined
        ? await getAIProviderById(input.providerId)
        : await getSceneDefaultAIProvider("copywriting");

    if (!provider) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.DEFAULT_PROVIDER_REQUIRED, "当前没有可用的默认 Provider，请先配置 AI 设置。");
    }

    if (!provider.enabled) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.PROVIDER_DISABLED, "当前 Provider 已被禁用，请切换可用 Provider。");
    }

    const competitorSummary = summarizeCompetitors(competitors);
    const prompt = buildMultiPlatformCopywritingPrompt({
      product,
      competitorSummary,
      bannedWordsText: buildBannedWordsText(bannedWords),
    });
    const inputSummary = `copywriting package product=${input.productId} platforms=${COPYWRITING_PLATFORMS.join(",")}`;
    const aiJob = await createAIJob({
      jobType: COPYWRITING_JOB_TYPES.MULTI_PLATFORM,
      idempotencyKey: input.retryFromAiJobId ? null : `copywriting-package:${input.productId}`,
      relatedProductId: input.productId,
      inputSummary,
    });
    aiJobId = aiJob.id;
    await markAIJobRunning(aiJobId);

    const aiResult = await generateTextJson({
      baseUrl: provider.baseUrl ?? "",
      apiKey: provider.apiKey ?? "",
      modelName: provider.modelName ?? "",
      providerType: provider.providerType,
      prompt,
      requestType: "copywriting",
      inputSummary,
      relatedProductId: input.productId,
      relatedTaskId: aiJobId,
      preferStructuredOutput: true,
      responseSchema: buildMultiPlatformCopywritingJsonSchema(),
      timeoutMs: 60_000,
    });

    const structuredResult = parseMultiPlatformStructuredResponse(aiResult.content);
    if (!structuredResult.success) {
      const validationError = new ProductBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, structuredResult.errorSummary);
      await createAIRequestLog({
        provider: provider.providerType,
        model: provider.modelName ?? "unknown",
        requestType: "copywriting",
        inputTokens: aiResult.inputTokens,
        outputTokens: aiResult.outputTokens,
        durationMs: aiResult.durationMs,
        success: false,
        errorSummary: validationError.message,
        inputSummary,
        relatedProductId: input.productId,
        relatedTaskId: aiJobId,
      });
      await markAIJobFailed(aiJobId, validationError);
      throw validationError;
    }

    const drafts: CopywritingDraftPayload[] = [];
    const structuredPayloadJson = JSON.stringify(structuredResult.data);
    const activeAiJobId = aiJobId;
    if (activeAiJobId === null) {
      throw createValidationError("AIJob 创建失败，无法保存文案包。");
    }
    for (const platformEntry of structuredResult.data.platforms) {
      assertPlatform(platformEntry.platform);
      for (const versionLabel of ["A", "B", "C"] as CopywritingVersionCode[]) {
        const version = platformEntry.versions.find((item) => item.versionLabel === versionLabel);
        if (!version) {
          const validationError = new ProductBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, "AI 输出缺少必要平台版本。");
          await markAIJobFailed(aiJobId, validationError);
          throw validationError;
        }

        const normalized = normalizeMultiPlatformDraft(platformEntry.platform, versionLabel, version);
        const scanResult = await scanDraftWithFallback({
          title: normalized.title,
          body: normalized.body,
          sellingPoints: normalized.sellingPoints,
          tags: normalized.tags,
          bannedWords,
        });

        drafts.push({
          platform: normalized.platform,
          versionLabel: normalized.versionLabel,
          providerId: provider.id,
          aiJobId: activeAiJobId,
          title: normalized.title,
          body: normalized.body,
          sellingPoints: normalized.sellingPoints,
          tags: normalized.tags,
          versionStyle: normalized.style,
          generationStatus: COPYWRITING_GENERATION_STATUS.SUCCESS,
          auditStatus: scanResult.scan.auditStatus,
          riskWordsJson: scanResult.scan.hits.length > 0 ? JSON.stringify(scanResult.scan.hits) : null,
          violationScanResultJson: JSON.stringify({
            status: scanResult.ok ? "scanned" : "scan_failed",
            warning: scanResult.warning,
            hits: scanResult.scan.hits,
          }),
          structuredPayloadJson,
          rawResponseText: null,
        });
      }
    }

    const saved = await prisma.$transaction(async (tx) => {
      const result = await saveGeneratedDrafts(tx, {
        productId: input.productId,
        providerId: provider.id,
        aiJobId: activeAiJobId,
        drafts,
        retryFromAiJobId: input.retryFromAiJobId ?? null,
      });

      await tx.operationLog.create({
        data: {
          productId: input.productId,
          action: OPERATION_LOG_ACTIONS.GENERATE_COPYWRITING,
          detail: `生成 ${product.name} 多平台文案包（闲鱼 / 淘宝 / 小红书 / 抖音）`,
        },
      });

      return result;
    });

    await markAIJobSuccess(aiJobId, `copywriting package saved drafts=${saved.length}`);
    const mapped = saved.map(mapCopywritingRecord);

    return {
      aiJobId,
      records: mapped,
      groupedRecords: groupCopywritingsByPlatform(mapped),
    };
  } catch (error) {
    if (aiJobId !== null) {
      try {
        await markAIJobFailed(aiJobId, error);
      } catch {
        // Keep the original copywriting failure as the user-facing error.
      }
    }
    throw normalizeProductWriteError(error);
  } finally {
    inFlightGenerations.delete(lockKey);
  }
}

export async function saveManualCopywriting(values: CopywritingFormValues) {
  ensureProductWritesAllowed();
  assertPlatform(values.platform);

  try {
    const product = await prisma.product.findFirst({
      where: {
        id: values.productId,
        deletedAt: null,
      },
      select: { name: true },
    });

    if (!product) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "商品不存在或已删除。");
    }

    const bannedWords = await getBannedWords();
    const sellingPoints = parseMultilineText(values.sellingPointsText);
    const faq = parseMultilineText(values.faqText);
    const riskNotes = parseMultilineText(values.riskNotesText);
    const tags = parseMultilineText(values.tagsText);
    const scanResult = await scanDraftWithFallback({
      title: values.title,
      body: values.mainCopy,
      sellingPoints,
      tags,
      faq,
      riskNotes,
      bannedWords,
    });

    const structuredPayload = {
      platform: values.platform,
      versions: [
        {
          versionLabel: values.version,
          title: values.title,
          body: values.mainCopy,
          sellingPoints,
          tags,
        },
      ],
    };

    const saved = await prisma.$transaction(async (tx) => {
      let record: CopywritingRecord;
      if (values.copywritingId) {
        const existing = await tx.copywriting.findUnique({
          where: { id: values.copywritingId },
          select: { id: true, productId: true, platform: true, versionLabel: true },
        });

        if (!existing || existing.productId !== values.productId) {
          throw createNotFoundError();
        }

        record = await tx.copywriting.update({
          where: { id: values.copywritingId },
          data: {
            providerId: values.providerId,
            style: normalizeOptionalText(values.style) ?? COPYWRITING_VERSION_STYLES[values.version],
            title: normalizeOptionalText(values.title),
            content: buildContentSummary({
              title: values.title,
              body: values.mainCopy,
              sellingPoints,
              tags,
              faq,
              riskNotes,
            }),
            body: normalizeOptionalText(values.mainCopy),
            mainCopy: normalizeOptionalText(values.mainCopy),
            sellingPointsJson: stringifyStringArray(sellingPoints),
            tagsJson: stringifyStringArray(tags),
            faqJson: stringifyStringArray(faq),
            riskNotesJson: stringifyStringArray(riskNotes),
            structuredPayloadJson: JSON.stringify(structuredPayload),
            rawResponseText: null,
            generationStatus: COPYWRITING_GENERATION_STATUS.SUCCESS,
            auditStatus: scanResult.scan.auditStatus,
            riskWords: scanResult.scan.hits.length > 0 ? JSON.stringify(scanResult.scan.hits) : null,
            violationScanResultJson: JSON.stringify({
              status: scanResult.ok ? "scanned" : "scan_failed",
              warning: scanResult.warning,
              hits: scanResult.scan.hits,
            }),
            usageNote: normalizeOptionalText(values.usageNote),
          },
          select: COPYWRITING_SELECT,
        });
      } else {
        record = await tx.copywriting.create({
          data: {
            productId: values.productId,
            providerId: values.providerId,
            platform: values.platform,
            copyType: "platform",
            version: values.version,
            versionLabel: values.version,
            style: normalizeOptionalText(values.style) ?? COPYWRITING_VERSION_STYLES[values.version],
            title: normalizeOptionalText(values.title),
            content: buildContentSummary({
              title: values.title,
              body: values.mainCopy,
              sellingPoints,
              tags,
              faq,
              riskNotes,
            }),
            body: normalizeOptionalText(values.mainCopy),
            mainCopy: normalizeOptionalText(values.mainCopy),
            sellingPointsJson: stringifyStringArray(sellingPoints),
            tagsJson: stringifyStringArray(tags),
            faqJson: stringifyStringArray(faq),
            riskNotesJson: stringifyStringArray(riskNotes),
            structuredPayloadJson: JSON.stringify(structuredPayload),
            rawResponseText: null,
            generationStatus: COPYWRITING_GENERATION_STATUS.SUCCESS,
            auditStatus: scanResult.scan.auditStatus,
            riskWords: scanResult.scan.hits.length > 0 ? JSON.stringify(scanResult.scan.hits) : null,
            violationScanResultJson: JSON.stringify({
              status: scanResult.ok ? "scanned" : "scan_failed",
              warning: scanResult.warning,
              hits: scanResult.scan.hits,
            }),
            usedPlatform: values.platform,
            usageNote: normalizeOptionalText(values.usageNote),
          },
          select: COPYWRITING_SELECT,
        });
      }

      await tx.operationLog.create({
        data: {
          productId: values.productId,
          action: OPERATION_LOG_ACTIONS.UPDATE_COPYWRITING,
          detail: `手动保存 ${product.name} ${values.platform} ${values.version} 版文案`,
        },
      });

      return record;
    });

    return mapCopywritingRecord(saved);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function markCopywritingAsUsed(input: {
  copywritingId: number;
  productId: number;
  platform: CopywritingPlatform;
  usageNote?: string | null;
}) {
  ensureProductWritesAllowed();
  assertPlatform(input.platform);

  try {
    const saved = await prisma.$transaction(async (tx) => {
      const record = await tx.copywriting.findUnique({
        where: { id: input.copywritingId },
        select: {
          id: true,
          productId: true,
          platform: true,
        },
      });

      if (!record || record.productId !== input.productId || record.platform !== input.platform) {
        throw createNotFoundError();
      }

      await tx.copywriting.updateMany({
        where: {
          productId: input.productId,
          platform: input.platform,
          isUsedInListing: true,
        },
        data: {
          isUsedInListing: false,
          usedAt: null,
          usageNote: null,
        },
      });

      return tx.copywriting.update({
        where: { id: input.copywritingId },
        data: {
          isUsedInListing: true,
          usedAt: new Date(),
          usedPlatform: input.platform,
          usageNote: normalizeOptionalText(input.usageNote),
        },
        select: COPYWRITING_SELECT,
      });
    });

    return mapCopywritingRecord(saved);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function clearCopywritingUsedMark(copywritingId: number) {
  ensureProductWritesAllowed();

  try {
    const record = await prisma.copywriting.update({
      where: { id: copywritingId },
      data: {
        isUsedInListing: false,
        usedAt: null,
        usageNote: null,
      },
      select: COPYWRITING_SELECT,
    });

    return mapCopywritingRecord(record);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function deleteCopywriting(copywritingId: number, productId: number) {
  ensureProductWritesAllowed();

  try {
    const existing = await prisma.copywriting.findUnique({
      where: { id: copywritingId },
      select: {
        id: true,
        productId: true,
        platform: true,
        versionLabel: true,
        version: true,
        title: true,
      },
    });

    if (!existing || existing.productId !== productId) {
      throw createNotFoundError();
    }

    await prisma.$transaction(async (tx) => {
      await tx.copywriting.delete({
        where: { id: copywritingId },
      });

      await tx.operationLog.create({
        data: {
          productId,
          action: OPERATION_LOG_ACTIONS.UPDATE_COPYWRITING,
          detail: `删除文案记录 ${existing.platform ?? ""} ${existing.versionLabel ?? existing.version ?? ""} ${existing.title ?? ""}`.trim(),
        },
      });
    });

    return { id: copywritingId, productId };
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function deleteCopywritings(copywritingIds: number[]) {
  ensureProductWritesAllowed();

  try {
    const uniqueIds = Array.from(new Set(copywritingIds.filter((id) => Number.isInteger(id) && id > 0)));
    if (uniqueIds.length === 0) {
      throw createValidationError("请选择要删除的文案记录。");
    }

    const existingRecords = await prisma.copywriting.findMany({
      where: {
        id: { in: uniqueIds },
        product: { deletedAt: null },
      },
      select: {
        id: true,
        productId: true,
        platform: true,
        versionLabel: true,
        version: true,
        title: true,
      },
    });

    if (existingRecords.length === 0) {
      throw createNotFoundError();
    }

    await prisma.$transaction(async (tx) => {
      await tx.copywriting.deleteMany({
        where: { id: { in: existingRecords.map((record) => record.id) } },
      });

      await tx.operationLog.createMany({
        data: existingRecords.map((record) => ({
          productId: record.productId,
          action: OPERATION_LOG_ACTIONS.UPDATE_COPYWRITING,
          detail: `批量删除文案记录 ${record.platform ?? ""} ${record.versionLabel ?? record.version ?? ""} ${record.title ?? ""}`.trim(),
        })),
      });
    });

    return {
      ids: existingRecords.map((record) => record.id),
      productIds: Array.from(new Set(existingRecords.map((record) => record.productId))),
      deletedCount: existingRecords.length,
    };
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function getCopywritingById(copywritingId: number) {
  try {
    const record = await prisma.copywriting.findUnique({
      where: { id: copywritingId },
      select: COPYWRITING_SELECT,
    });

    if (!record) {
      throw createNotFoundError();
    }

    return mapCopywritingRecord(record);
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}
