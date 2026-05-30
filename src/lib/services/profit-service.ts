import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  BUSINESS_ERROR_CODES,
  computeEstimatedNetProfit,
  formatCurrency,
  formatPercentFromRatio,
  OPERATION_LOG_ACTIONS,
  ProductBusinessError,
  upgradeProductStatusToAnalyzing,
} from "@/lib/modules/products";
import { ensureProductWritesAllowed, normalizeProductReadError, normalizeProductWriteError } from "@/lib/services/product-runtime-service";

export type ProfitFormValues = {
  estimatedPrice: string;
  estimatedCost: string;
  estimatedShipping: string;
  packagingCost: string;
};

export type ProfitMutationInput = {
  estimatedPrice: number | null;
  estimatedCost: number | null;
  estimatedShipping: number | null;
  packagingCost: number | null;
};

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

async function createOperationLogInTransaction(input: {
  tx: Prisma.TransactionClient;
  productId: number;
  action: string;
  detail?: string | null;
}) {
  await input.tx.operationLog.create({
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

  await createOperationLogInTransaction({
    tx,
    productId,
    action: OPERATION_LOG_ACTIONS.CHANGE_STATUS,
    detail: `状态由 ${product.status} 变更为 ${nextStatus}`,
  });
}

function normalizeOptionalNumber(value: string | null | undefined, fieldLabel: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw createValidationError(`${fieldLabel}必须是数字。`);
  }

  return parsed;
}

export function buildProfitFormValues(product: {
  estimatedPrice: number | null;
  estimatedCost: number | null;
  estimatedShipping: number | null;
  packagingCost: number | null;
}): ProfitFormValues {
  return {
    estimatedPrice: product.estimatedPrice?.toString() ?? "",
    estimatedCost: product.estimatedCost?.toString() ?? "",
    estimatedShipping: product.estimatedShipping?.toString() ?? "",
    packagingCost: product.packagingCost?.toString() ?? "",
  };
}

export function extractProfitFormValues(formData: FormData): ProfitFormValues {
  const value = (key: string) => String(formData.get(key) ?? "");

  return {
    estimatedPrice: value("estimatedPrice"),
    estimatedCost: value("estimatedCost"),
    estimatedShipping: value("estimatedShipping"),
    packagingCost: value("packagingCost"),
  };
}

export function normalizeProfitMutationInput(values: ProfitFormValues): ProfitMutationInput {
  return {
    estimatedPrice: normalizeOptionalNumber(values.estimatedPrice, "预估售价"),
    estimatedCost: normalizeOptionalNumber(values.estimatedCost, "预估进货价"),
    estimatedShipping: normalizeOptionalNumber(values.estimatedShipping, "预估运费"),
    packagingCost: normalizeOptionalNumber(values.packagingCost, "包装成本"),
  };
}

export function hasRequiredProfitInputs(input: {
  estimatedPrice?: number | null;
  estimatedCost?: number | null;
  estimatedShipping?: number | null;
}) {
  return (
    typeof input.estimatedPrice === "number" &&
    typeof input.estimatedCost === "number" &&
    typeof input.estimatedShipping === "number"
  );
}

export function buildProfitView(input: {
  estimatedPrice?: number | null;
  estimatedCost?: number | null;
  estimatedShipping?: number | null;
  packagingCost?: number | null;
}) {
  const hasCompleteCostData = hasRequiredProfitInputs(input);
  const packagingCost = input.packagingCost ?? 0;
  const estimatedNetProfit = hasCompleteCostData
    ? computeEstimatedNetProfit({
        estimatedPrice: input.estimatedPrice,
        estimatedCost: input.estimatedCost,
        estimatedShipping: input.estimatedShipping,
        packagingCost,
      })
    : null;
  const invalidPrice =
    hasCompleteCostData && typeof input.estimatedPrice === "number" && input.estimatedPrice <= 0;
  const profitRate =
    hasCompleteCostData &&
    !invalidPrice &&
    typeof estimatedNetProfit === "number" &&
    typeof input.estimatedPrice === "number"
      ? estimatedNetProfit / input.estimatedPrice
      : null;

  return {
    estimatedPrice: input.estimatedPrice ?? null,
    estimatedCost: input.estimatedCost ?? null,
    estimatedShipping: input.estimatedShipping ?? null,
    packagingCost,
    hasCompleteCostData,
    invalidPrice,
    estimatedNetProfit,
    profitRate,
    formattedEstimatedPrice: formatCurrency(input.estimatedPrice ?? null),
    formattedEstimatedCost: formatCurrency(input.estimatedCost ?? null),
    formattedEstimatedShipping: formatCurrency(input.estimatedShipping ?? null),
    formattedPackagingCost: formatCurrency(packagingCost),
    formattedEstimatedNetProfit: formatCurrency(estimatedNetProfit),
    formattedProfitRate: profitRate === null ? "--" : formatPercentFromRatio(profitRate),
    statusMessage: !hasCompleteCostData
      ? "待补充成本数据"
      : invalidPrice
        ? "售价无效"
        : "成本数据已完整，可用于正式利润评估。",
  };
}

export async function getProfitSnapshot(productId: number) {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
      select: {
        id: true,
        estimatedPrice: true,
        estimatedCost: true,
        estimatedShipping: true,
        packagingCost: true,
      },
    });

    if (!product) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "商品不存在或已删除。");
    }

    return buildProfitView(product);
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function updateProductProfit(productId: number, values: ProfitMutationInput) {
  ensureProductWritesAllowed();

  try {
    return await prisma.$transaction(async (tx) => {
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

      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          estimatedPrice: values.estimatedPrice,
          estimatedCost: values.estimatedCost,
          estimatedShipping: values.estimatedShipping,
          packagingCost: values.packagingCost,
        },
        select: {
          id: true,
          estimatedPrice: true,
          estimatedCost: true,
          estimatedShipping: true,
          packagingCost: true,
        },
      });

      await createOperationLogInTransaction({
        tx,
        productId,
        action: OPERATION_LOG_ACTIONS.UPDATE_PROFIT,
        detail: "更新了利润测算字段",
      });

      const hasAnyCostField =
        values.estimatedPrice !== null ||
        values.estimatedCost !== null ||
        values.estimatedShipping !== null ||
        values.packagingCost !== null;

      if (hasAnyCostField) {
        await markProductAnalyzingIfNeeded(tx, productId);
      }

      return updated;
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function getMissingCostDataCount() {
  try {
    return await prisma.product.count({
      where: {
        deletedAt: null,
        OR: [{ estimatedPrice: null }, { estimatedCost: null }, { estimatedShipping: null }],
      },
    });
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}
