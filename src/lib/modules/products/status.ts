import type { ProductStatus } from "@/lib/modules/products/constants";

type StatusDerivationInput = {
  currentStatus?: string | null;
  estimatedCost?: number | null;
  estimatedShipping?: number | null;
  packagingCost?: number | null;
  targetPlatforms?: string[];
  sellingPoints?: string | null;
};

export function deriveProductStatus(input: StatusDerivationInput): ProductStatus {
  const currentStatus = input.currentStatus?.trim();
  if (currentStatus === "建议测试" || currentStatus === "暂缓" || currentStatus === "淘汰") {
    return currentStatus;
  }

  const hasCostInfo =
    typeof input.estimatedCost === "number" ||
    typeof input.estimatedShipping === "number" ||
    typeof input.packagingCost === "number";
  const hasPlatforms = (input.targetPlatforms?.length ?? 0) > 0;
  const hasSellingPoints = Boolean(input.sellingPoints?.trim());

  if (hasCostInfo || hasPlatforms || hasSellingPoints) {
    return "分析中";
  }

  return "待分析";
}

export function upgradeProductStatusToAnalyzing(currentStatus?: string | null) {
  return currentStatus?.trim() === "待分析" ? "分析中" : currentStatus ?? null;
}
