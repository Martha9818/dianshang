import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  BUSINESS_ERROR_CODES,
  COMPETITOR_HEAT_METRIC_VALUES,
  COMPETITOR_PLATFORM_VALUES,
  formatDateOnly,
  formatDecimal,
  formatInteger,
  OPERATION_LOG_ACTIONS,
  ProductBusinessError,
  upgradeProductStatusToAnalyzing,
} from "@/lib/modules/products";
import { ensureProductWritesAllowed, normalizeProductReadError, normalizeProductWriteError } from "@/lib/services/product-runtime-service";

const competitorSelect = {
  id: true,
  productId: true,
  platform: true,
  title: true,
  price: true,
  heatMetricType: true,
  heatMetricValue: true,
  sellerName: true,
  link: true,
  screenshotPath: true,
  sellingPoint: true,
  painPoint: true,
  imageStyle: true,
  dataDate: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type CompetitorRecord = Prisma.CompetitorGetPayload<{ select: typeof competitorSelect }>;

export type CompetitorFormValues = {
  id?: string;
  platform: string;
  title: string;
  price: string;
  heatMetricType: string;
  heatMetricValue: string;
  sellerName: string;
  link: string;
  sellingPoint: string;
  painPoint: string;
  imageStyle: string;
  dataDate: string;
  notes: string;
};

export type CompetitorMutationInput = {
  platform: string;
  title: string;
  price: number;
  heatMetricType: string;
  heatMetricValue: number;
  sellerName: string | null;
  link: string | null;
  sellingPoint: string | null;
  painPoint: string | null;
  imageStyle: string | null;
  dataDate: Date;
  notes: string | null;
};

export type CompetitorStats = {
  validCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  averagePrice: number | null;
  medianPrice: number | null;
  maxHeatMetricValue: number | null;
  averageHeatMetricValue: number | null;
  platformCount: number;
  latestDataDate: Date | null;
  sufficiencyMessage: string;
  hasEnoughCompetitors: boolean;
};

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

async function createOperationLogInTransaction(
  tx: Prisma.TransactionClient,
  input: {
    productId: number;
    action: string;
    detail?: string | null;
  },
) {
  await tx.operationLog.create({
    data: {
      productId: input.productId,
      action: input.action,
      detail: input.detail ?? null,
    },
  });
}

async function markProductAnalyzingIfNeeded(tx: Prisma.TransactionClient, productId: number) {
  const product = await tx.product.findFirst({
    where: {
      id: productId,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!product) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "商品不存在或已删除。");
  }

  const nextStatus = upgradeProductStatusToAnalyzing(product.status);
  if (nextStatus !== "分析中" || product.status === nextStatus) {
    return;
  }

  await tx.product.update({
    where: { id: productId },
    data: { status: nextStatus },
  });

  await createOperationLogInTransaction(tx, {
    productId,
    action: OPERATION_LOG_ACTIONS.CHANGE_STATUS,
    detail: `状态由 ${product.status} 变更为 ${nextStatus}`,
  });
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function parseRequiredNumber(value: string | null | undefined, fieldLabel: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw createValidationError(`${fieldLabel}不能为空。`);
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw createValidationError(`${fieldLabel}必须是数字。`);
  }

  return parsed;
}

function parseRequiredDate(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw createValidationError("数据日期不能为空。");
  }

  const date = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw createValidationError("数据日期格式无效。");
  }

  return date;
}

function assertPlatform(platform: string) {
  if (!COMPETITOR_PLATFORM_VALUES.includes(platform as never)) {
    throw createValidationError("竞品平台无效。");
  }
}

function assertHeatMetricType(heatMetricType: string) {
  if (!COMPETITOR_HEAT_METRIC_VALUES.includes(heatMetricType as never)) {
    throw createValidationError("热度指标类型无效。");
  }
}

function mapCompetitorView(record: CompetitorRecord) {
  return {
    ...record,
    formattedPrice: formatDecimal(record.price),
    formattedHeatMetricValue: Number.isInteger(record.heatMetricValue)
      ? formatInteger(record.heatMetricValue)
      : formatDecimal(record.heatMetricValue),
    formattedDataDate: formatDateOnly(record.dataDate),
  };
}

function computeMedian(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middleIndex = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middleIndex];
  }

  return (sorted[middleIndex - 1] + sorted[middleIndex]) / 2;
}

export function getEmptyCompetitorFormValues(): CompetitorFormValues {
  return {
    platform: "",
    title: "",
    price: "",
    heatMetricType: "",
    heatMetricValue: "",
    sellerName: "",
    link: "",
    sellingPoint: "",
    painPoint: "",
    imageStyle: "",
    dataDate: "",
    notes: "",
  };
}

export function buildCompetitorFormValues(competitor: CompetitorRecord): CompetitorFormValues {
  const formattedDate = formatDateOnly(competitor.dataDate);

  return {
    id: String(competitor.id),
    platform: competitor.platform,
    title: competitor.title,
    price: String(competitor.price),
    heatMetricType: competitor.heatMetricType,
    heatMetricValue: String(competitor.heatMetricValue),
    sellerName: competitor.sellerName ?? "",
    link: competitor.link ?? "",
    sellingPoint: competitor.sellingPoint ?? "",
    painPoint: competitor.painPoint ?? "",
    imageStyle: competitor.imageStyle ?? "",
    dataDate: formattedDate === "--" ? "" : formattedDate,
    notes: competitor.notes ?? "",
  };
}

export function extractCompetitorFormValues(formData: FormData): CompetitorFormValues {
  const value = (key: string) => String(formData.get(key) ?? "");

  return {
    id: value("competitorId"),
    platform: value("platform"),
    title: value("title"),
    price: value("price"),
    heatMetricType: value("heatMetricType"),
    heatMetricValue: value("heatMetricValue"),
    sellerName: value("sellerName"),
    link: value("link"),
    sellingPoint: value("sellingPoint"),
    painPoint: value("painPoint"),
    imageStyle: value("imageStyle"),
    dataDate: value("dataDate"),
    notes: value("notes"),
  };
}

export function normalizeCompetitorMutationInput(input: CompetitorFormValues): CompetitorMutationInput {
  const platform = input.platform.trim();
  const title = input.title.trim();
  const heatMetricType = input.heatMetricType.trim();
  const price = parseRequiredNumber(input.price, "价格");
  const heatMetricValue = parseRequiredNumber(input.heatMetricValue, "热度指标数值");

  if (!platform) {
    throw createValidationError("平台不能为空。");
  }

  if (!title) {
    throw createValidationError("竞品标题不能为空。");
  }

  if (!heatMetricType) {
    throw createValidationError("热度指标类型不能为空。");
  }

  assertPlatform(platform);
  assertHeatMetricType(heatMetricType);

  return {
    platform,
    title,
    price,
    heatMetricType,
    heatMetricValue,
    sellerName: normalizeOptionalText(input.sellerName),
    link: normalizeOptionalText(input.link),
    sellingPoint: normalizeOptionalText(input.sellingPoint),
    painPoint: normalizeOptionalText(input.painPoint),
    imageStyle: normalizeOptionalText(input.imageStyle),
    dataDate: parseRequiredDate(input.dataDate),
    notes: normalizeOptionalText(input.notes),
  };
}

export function isValidCompetitor(input: {
  platform?: string | null;
  title?: string | null;
  price?: number | null;
  heatMetricType?: string | null;
  heatMetricValue?: number | null;
  dataDate?: Date | string | null;
}) {
  const hasDate =
    input.dataDate instanceof Date
      ? !Number.isNaN(input.dataDate.getTime())
      : typeof input.dataDate === "string"
        ? !Number.isNaN(new Date(input.dataDate).getTime())
        : false;

  return Boolean(
    input.platform?.trim() &&
      input.title?.trim() &&
      input.heatMetricType?.trim() &&
      typeof input.price === "number" &&
      input.price > 0 &&
      typeof input.heatMetricValue === "number" &&
      input.heatMetricValue >= 0 &&
      hasDate,
  );
}

export function computeCompetitorStats(competitors: CompetitorRecord[]): CompetitorStats {
  const validCompetitors = competitors.filter((competitor) => isValidCompetitor(competitor));
  const prices = validCompetitors.map((competitor) => competitor.price);
  const heatValues = validCompetitors.map((competitor) => competitor.heatMetricValue);
  const latestDataDate = validCompetitors.reduce<Date | null>((latest, competitor) => {
    if (!latest || competitor.dataDate > latest) {
      return competitor.dataDate;
    }

    return latest;
  }, null);
  const validCount = validCompetitors.length;
  const hasEnoughCompetitors = validCount >= 3;

  return {
    validCount,
    minPrice: prices.length > 0 ? Math.min(...prices) : null,
    maxPrice: prices.length > 0 ? Math.max(...prices) : null,
    averagePrice: prices.length > 0 ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null,
    medianPrice: computeMedian(prices),
    maxHeatMetricValue: heatValues.length > 0 ? Math.max(...heatValues) : null,
    averageHeatMetricValue:
      heatValues.length > 0 ? heatValues.reduce((sum, value) => sum + value, 0) / heatValues.length : null,
    platformCount: new Set(validCompetitors.map((competitor) => competitor.platform)).size,
    latestDataDate,
    sufficiencyMessage: hasEnoughCompetitors
      ? "已满足正式评分的最低竞品数量。"
      : "有效竞品不足 3 个，后续评分仅生成临时评估。",
    hasEnoughCompetitors,
  };
}

export async function getCompetitorRecordsByProductIdForStats(productId: number) {
  try {
    return await prisma.competitor.findMany({
      where: { productId },
      orderBy: [{ dataDate: "desc" }, { updatedAt: "desc" }],
      select: competitorSelect,
    });
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getCompetitorsByProductId(productId: number) {
  const competitors = await getCompetitorRecordsByProductIdForStats(productId);
  return competitors.map(mapCompetitorView);
}

export async function getCompetitorStats(productId: number) {
  const competitors = await getCompetitorRecordsByProductIdForStats(productId);

  return computeCompetitorStats(competitors);
}

export async function createCompetitor(input: {
  productId: number;
  values: CompetitorMutationInput;
  screenshot?: File | null;
}) {
  ensureProductWritesAllowed();

  try {
    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          id: input.productId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!product) {
        throw new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "商品不存在或已删除。");
      }

      const competitor = await tx.competitor.create({
        data: {
          productId: input.productId,
          ...input.values,
        },
        select: competitorSelect,
      });

      await createOperationLogInTransaction(tx, {
        productId: input.productId,
        action: OPERATION_LOG_ACTIONS.CREATE_COMPETITOR,
        detail: `新增竞品 ${competitor.title}`,
      });

      if (isValidCompetitor(input.values)) {
        await markProductAnalyzingIfNeeded(tx, input.productId);
      }

      return competitor;
    });

    let screenshotPath = created.screenshotPath;

    if (input.screenshot) {
      const { saveCompetitorScreenshot } = await import("@/lib/services/file-storage-service");
      screenshotPath = await saveCompetitorScreenshot(input.productId, input.screenshot);
      await prisma.competitor.update({
        where: { id: created.id },
        data: { screenshotPath },
      });
    }

    return {
      ...created,
      screenshotPath,
    };
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function updateCompetitor(input: {
  productId: number;
  competitorId: number;
  values: CompetitorMutationInput;
  screenshot?: File | null;
}) {
  ensureProductWritesAllowed();

  try {
    const existing = await prisma.competitor.findFirst({
      where: {
        id: input.competitorId,
        productId: input.productId,
      },
      select: competitorSelect,
    });

    if (!existing) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "竞品不存在或已删除。");
    }

    let screenshotPath = existing.screenshotPath;

    if (input.screenshot) {
      const { saveCompetitorScreenshot } = await import("@/lib/services/file-storage-service");
      screenshotPath = await saveCompetitorScreenshot(input.productId, input.screenshot);
    }

    return await prisma.$transaction(async (tx) => {
      const competitor = await tx.competitor.update({
        where: { id: input.competitorId },
        data: {
          ...input.values,
          screenshotPath,
        },
        select: competitorSelect,
      });

      await createOperationLogInTransaction(tx, {
        productId: input.productId,
        action: OPERATION_LOG_ACTIONS.UPDATE_COMPETITOR,
        detail: `编辑竞品 ${competitor.title}`,
      });

      if (isValidCompetitor(input.values)) {
        await markProductAnalyzingIfNeeded(tx, input.productId);
      }

      return competitor;
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function deleteCompetitor(productId: number, competitorId: number) {
  ensureProductWritesAllowed();

  try {
    const existing = await prisma.competitor.findFirst({
      where: {
        id: competitorId,
        productId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!existing) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "竞品不存在或已删除。");
    }

    await prisma.$transaction(async (tx) => {
      await tx.competitor.delete({
        where: { id: competitorId },
      });

      await createOperationLogInTransaction(tx, {
        productId,
        action: OPERATION_LOG_ACTIONS.DELETE_COMPETITOR,
        detail: `删除竞品 ${existing.title}`,
      });
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}
