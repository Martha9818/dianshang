import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  BUSINESS_ERROR_CODES,
  computeEstimatedNetProfit,
  formatDateTime,
  OPERATION_LOG_ACTIONS,
  parseJsonStringArray,
  PRODUCT_STATUS_TONE,
  type BusinessErrorCode,
  type RuntimeMode,
} from "@/lib/modules/products";
import { getRecommendationDisplayText, getRecommendationFilterValue, shouldNeedsRescore } from "@/lib/modules/scoring";
import { getBackupDisplayPath } from "@/lib/services/backup-log-service";
import {
  computeCompetitorStats,
  getCompetitorRecordsByProductIdForStats,
  getCompetitorsByProductId,
} from "@/lib/services/competitor-service";
import { getProductCopywritingTabData } from "@/lib/services/copywriting-service";
import { getProductOperationLogs } from "@/lib/services/operation-log-service";
import { buildProfitView, getMissingCostDataCount } from "@/lib/services/profit-service";
import { getHomeMaterialStats, getProductMaterials } from "@/lib/services/material-service";
import { getHomePromptTaskStats, getProductPromptTasks } from "@/lib/services/prompt-task-service";
import {
  buildProductReadUnavailableMessage,
  getRuntimeModeSummary,
  normalizeProductReadError,
} from "@/lib/services/product-runtime-service";
import {
  getSortDirection,
  normalizeProductPoolQuery,
  type ProductPoolQuery,
} from "@/lib/services/query-service";
import {
  getLatestScoreMap,
  getLatestScoreSnapshot,
  getProductsNeedingRescoreCount,
  getScoreHistory,
  getScorePreview,
} from "@/lib/services/scoring-service";

export type ProductListFilters = ProductPoolQuery;

const productBaseSelect = {
  id: true,
  spu: true,
  name: true,
  categoryLevel1: true,
  categoryLevel2: true,
  tags: true,
  targetUser: true,
  targetPlatforms: true,
  estimatedPrice: true,
  estimatedCost: true,
  estimatedShipping: true,
  packagingCost: true,
  sellingPoints: true,
  painPoints: true,
  usageScenes: true,
  categoryRisk: true,
  returnRisk: true,
  explanationCost: true,
  contentVisualLevel: true,
  sceneClarityLevel: true,
  videoFitLevel: true,
  comparisonDemoLevel: true,
  manualRegulatedRisk: true,
  manualInfringementRisk: true,
  manualRiskNotes: true,
  notes: true,
  status: true,
  mainImagePath: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ProductRecord = Prisma.ProductGetPayload<{ select: typeof productBaseSelect }>;
type ProductListRecord = ProductRecord & {
  competitors: Array<{ updatedAt: Date }>;
};

export type ProductPageState<T> =
  | {
      kind: "ready";
      runtimeMode: RuntimeMode;
      data: T;
    }
  | {
      kind: "unavailable";
      runtimeMode: RuntimeMode;
      code: BusinessErrorCode;
      message: string;
    };

function buildProductWhere(filters?: ProductListFilters) {
  const query = filters?.keyword?.trim();
  const status = filters?.status?.trim();
  const targetPlatform = filters?.platform?.trim();
  const andConditions = [{ deletedAt: null }] as Array<Record<string, unknown>>;

  if (query) {
    andConditions.push({
      OR: [
        { name: { contains: query } },
        { spu: { contains: query } },
      ],
    });
  }

  if (status) {
    andConditions.push({ status });
  }

  if (targetPlatform) {
    andConditions.push({ targetPlatforms: { contains: `"${targetPlatform}"` } });
  }

  if (filters?.missingCompetitor === "true") {
    andConditions.push({ competitors: { none: {} } });
  } else if (filters?.missingCompetitor === "false") {
    andConditions.push({ competitors: { some: {} } });
  }

  if (filters?.missingCost === "true") {
    andConditions.push({
      OR: [{ estimatedPrice: null }, { estimatedCost: null }, { estimatedShipping: null }],
    });
  } else if (filters?.missingCost === "false") {
    andConditions.push({
      estimatedPrice: { not: null },
      estimatedCost: { not: null },
      estimatedShipping: { not: null },
    });
  }

  if (filters?.hasMaterial === "true") {
    andConditions.push({ materials: { some: {} } });
  } else if (filters?.hasMaterial === "false") {
    andConditions.push({ materials: { none: {} } });
  }

  if (filters?.hasCopywriting === "true") {
    andConditions.push({ copywritings: { some: {} } });
  } else if (filters?.hasCopywriting === "false") {
    andConditions.push({ copywritings: { none: {} } });
  }

  return { AND: andConditions };
}

function mapProductCard(
  product: ProductRecord,
  latestScore?: Awaited<ReturnType<typeof getLatestScoreSnapshot>> | null,
  needsRescore = false,
) {
  const profitView = buildProfitView(product);
  const recommendationFilterValue = getRecommendationFilterValue(latestScore?.recommendation);

  return {
    ...product,
    tags: parseJsonStringArray(product.tags),
    targetPlatforms: parseJsonStringArray(product.targetPlatforms),
    estimatedNetProfit: profitView.hasCompleteCostData ? computeEstimatedNetProfit(product) : null,
    formattedUpdatedAt: formatDateTime(product.updatedAt),
    statusTone: PRODUCT_STATUS_TONE[product.status] ?? "slate",
    latestScore: latestScore?.totalScore ?? null,
    formattedLatestScore: latestScore?.formattedTotalScore ?? "--",
    latestRecommendation: latestScore?.recommendation ?? null,
    latestRecommendationDisplay: getRecommendationDisplayText(latestScore?.recommendation),
    recommendationFilterValue,
    needsRescore,
  };
}

async function mapProductsWithLatestScores(products: ProductRecord[]) {
  const latestScoreMap = await getLatestScoreMap(products.map((product) => product.id));

  return products.map((product) =>
    mapProductCard(
      product,
      latestScoreMap.get(product.id) ?? null,
      shouldNeedsRescore({
        productUpdatedAt: product.updatedAt,
        latestCompetitorUpdatedAt: null,
        latestScoreCreatedAt: latestScoreMap.get(product.id)?.createdAt,
      }),
    ),
  );
}

function buildReadUnavailableState(runtimeMode: RuntimeMode): ProductPageState<never> {
  return {
    kind: "unavailable",
    runtimeMode,
    code: BUSINESS_ERROR_CODES.LOCAL_DB_UNAVAILABLE,
    message: buildProductReadUnavailableMessage(runtimeMode),
  };
}

export async function getProductList(filters?: ProductListFilters) {
  try {
    const query = normalizeProductPoolQuery(filters);
    const orderField = query.sort.startsWith("createdAt") ? "createdAt" : "updatedAt";
    const products = await prisma.product.findMany({
      where: buildProductWhere(query),
      orderBy: { [orderField]: getSortDirection(query.sort) },
      select: {
        ...productBaseSelect,
        competitors: {
          select: { updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });

    const typedProducts = products as ProductListRecord[];
    const latestScoreMap = await getLatestScoreMap(typedProducts.map((product) => product.id));
    const mappedProducts = typedProducts.map((product) => {
      const latestScore = latestScoreMap.get(product.id) ?? null;
      return mapProductCard(
        product,
        latestScore,
        shouldNeedsRescore({
          productUpdatedAt: product.updatedAt,
          latestCompetitorUpdatedAt: product.competitors[0]?.updatedAt ?? null,
          latestScoreCreatedAt: latestScore?.createdAt,
        }),
      );
    });

    return mappedProducts.filter((product) => {
      if (query.recommendation?.trim() && product.recommendationFilterValue !== query.recommendation.trim()) {
        return false;
      }

      if (query.needsRescore === "true" && !product.needsRescore) {
        return false;
      }

      if (query.needsRescore === "false" && product.needsRescore) {
        return false;
      }

      if (query.minScore !== null && (product.latestScore === null || product.latestScore < query.minScore)) {
        return false;
      }

      if (query.maxScore !== null && (product.latestScore === null || product.latestScore > query.maxScore)) {
        return false;
      }

      return true;
    });
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getProductPoolStats() {
  try {
    const grouped = await prisma.product.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    });

    const totalCount = grouped.reduce((sum, item) => sum + item._count._all, 0);

    return {
      totalCount,
      pendingCount: grouped.find((item) => item.status === "待分析")?._count._all ?? 0,
      analyzingCount: grouped.find((item) => item.status === "分析中")?._count._all ?? 0,
      suggestedCount: grouped.find((item) => item.status === "建议测试")?._count._all ?? 0,
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getProductFilterOptions() {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: {
        categoryLevel1: true,
        categoryLevel2: true,
        targetPlatforms: true,
      },
    });

    const categorySet = new Set<string>();
    const platformSet = new Set<string>();

    for (const product of products) {
      if (product.categoryLevel1) {
        categorySet.add(product.categoryLevel1);
      }

      if (product.categoryLevel2) {
        categorySet.add(product.categoryLevel2);
      }

      for (const platform of parseJsonStringArray(product.targetPlatforms)) {
        platformSet.add(platform);
      }
    }

    return {
      categories: Array.from(categorySet).sort((left, right) => left.localeCompare(right, "zh-CN")),
      platforms: Array.from(platformSet).sort((left, right) => left.localeCompare(right, "zh-CN")),
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getProductById(productId: number) {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
      select: productBaseSelect,
    });

    if (!product) {
      return null;
    }

    const latestScore = await getLatestScoreSnapshot(product.id);
    return mapProductCard(product, latestScore);
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getProductForEdit(productId: number) {
  try {
    return await prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
      select: productBaseSelect,
    });
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getProductOperationLogView(productId: number) {
  const logs = await getProductOperationLogs(productId);

  return logs.map((log) => ({
    ...log,
    formattedCreatedAt: formatDateTime(log.createdAt),
  }));
}

async function getMissingCompetitorDataCount() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  const competitorCounts = await Promise.all(
    products.map(async (product) => {
      const competitors = await getCompetitorRecordsByProductIdForStats(product.id);
      return computeCompetitorStats(competitors).validCount;
    }),
  );

  return competitorCounts.filter((count) => count < 3).length;
}

export async function getHomeProductStats() {
  try {
    const [
      totalCount,
      pendingCount,
      suggestedCount,
      recentProducts,
      missingCompetitorCount,
      missingCostCount,
      needsRescoreCount,
      generatedCopywritingCount,
      promptTaskStats,
      materialStats,
      recentActivities,
      recentExportLogs,
      recentBackupLogs,
    ] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null, status: "待分析" } }),
      prisma.product.count({ where: { deletedAt: null, status: "建议测试" } }),
      prisma.product.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: productBaseSelect,
      }),
      getMissingCompetitorDataCount(),
      getMissingCostDataCount(),
      getProductsNeedingRescoreCount(),
      prisma.copywriting.count(),
      getHomePromptTaskStats(),
      getHomeMaterialStats(),
      prisma.operationLog.findMany({
        where: {
          action: {
            in: [
              OPERATION_LOG_ACTIONS.GENERATE_COPYWRITING,
              OPERATION_LOG_ACTIONS.UPDATE_COPYWRITING,
              OPERATION_LOG_ACTIONS.TEST_AI_PROVIDER,
              OPERATION_LOG_ACTIONS.CREATE_AI_PROVIDER,
              OPERATION_LOG_ACTIONS.UPDATE_AI_PROVIDER,
              OPERATION_LOG_ACTIONS.DELETE_AI_PROVIDER,
              OPERATION_LOG_ACTIONS.CREATE_BANNED_WORD,
              OPERATION_LOG_ACTIONS.UPDATE_BANNED_WORD,
              OPERATION_LOG_ACTIONS.DELETE_BANNED_WORD,
              OPERATION_LOG_ACTIONS.CREATE_PROMPT_TASK,
              OPERATION_LOG_ACTIONS.COPY_PROMPT_TASK,
              OPERATION_LOG_ACTIONS.CANCEL_PROMPT_TASK,
              OPERATION_LOG_ACTIONS.UPLOAD_PROMPT_RESULT,
              OPERATION_LOG_ACTIONS.MANUAL_UPLOAD_MATERIAL,
              OPERATION_LOG_ACTIONS.UPDATE_MATERIAL_STATUS,
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          productId: true,
          action: true,
          detail: true,
          createdAt: true,
          product: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.exportLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.backupLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

    const operationActivities = recentActivities.map((item) => ({
      id: `operation-${item.id}`,
      productId: item.productId,
      action: item.action,
      detail: item.detail,
      productName: item.product.name,
      createdAt: item.createdAt,
    }));

    const exportActivities = recentExportLogs.map((item) => ({
      id: `export-${item.id}`,
      productId: null,
      action: item.status === "成功" ? "EXPORT_SUCCESS" : "EXPORT_FAILED",
      detail: `${item.status === "成功" ? "导出成功" : "导出失败"}：${item.fileName}`,
      productName: item.errorMessage ?? "Excel 导出",
      createdAt: item.createdAt,
    }));

    const backupActivities = recentBackupLogs.map((item) => ({
      id: `backup-${item.id}`,
      productId: null,
      action: item.status === "成功" ? "BACKUP_SUCCESS" : "BACKUP_FAILED",
      detail: `${item.status === "成功" ? "备份成功" : "备份失败"}：${getBackupDisplayPath(item.backupPath)}`,
      productName: item.errorMessage ?? "手动备份",
      createdAt: item.createdAt,
    }));

    return {
      totalCount,
      pendingCount,
      suggestedCount,
      missingCompetitorCount,
      missingCostCount,
      needsRescoreCount,
      generatedCopywritingCount,
      promptTaskCount: promptTaskStats.totalCount,
      pendingPromptReturnCount: promptTaskStats.pendingReturnCount,
      materialCount: materialStats.activeCount,
      pendingMaterialReviewCount: materialStats.pendingReviewCount,
      recentPromptTasks: promptTaskStats.recentTasks,
      recentProducts: await mapProductsWithLatestScores(recentProducts),
      recentActivities: [...operationActivities, ...exportActivities, ...backupActivities]
        .toSorted((left, right) => {
          return right.createdAt.getTime() - left.createdAt.getTime();
        })
        .slice(0, 6)
        .map((item) => ({
          id: item.id,
          productId: item.productId,
          action: item.action,
          detail: item.detail,
          productName: item.productName,
          formattedCreatedAt: formatDateTime(item.createdAt),
        })),
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getProductPoolPageData(filters?: ProductListFilters): Promise<
  ProductPageState<{
    stats: Awaited<ReturnType<typeof getProductPoolStats>>;
    filters: Awaited<ReturnType<typeof getProductFilterOptions>>;
    products: Awaited<ReturnType<typeof getProductList>>;
  }>
> {
  const { mode } = getRuntimeModeSummary();
  const query = normalizeProductPoolQuery(filters);

  if (mode === "cloud") {
    return buildReadUnavailableState(mode);
  }

  try {
    const [stats, filterOptions, products] = await Promise.all([
      getProductPoolStats(),
      getProductFilterOptions(),
      getProductList(query),
    ]);

    return {
      kind: "ready",
      runtimeMode: mode,
      data: {
        stats,
        filters: filterOptions,
        products,
      },
    };
  } catch (error) {
    const businessError = normalizeProductReadError(error);
    return {
      kind: "unavailable",
      runtimeMode: mode,
      code: businessError.code,
      message: businessError.message,
    };
  }
}

export async function getProductDetailPageData(
  productId: number,
  options?: {
    includeLogs?: boolean;
    copyPlatform?: string | null;
    copyVersion?: string | null;
    materialPlatform?: string | null;
    materialType?: string | null;
    materialStatus?: string | null;
  },
): Promise<
  ProductPageState<{
    product: Awaited<ReturnType<typeof getProductById>>;
    logs: Awaited<ReturnType<typeof getProductOperationLogView>>;
    competitors: Awaited<ReturnType<typeof getCompetitorsByProductId>>;
    competitorStats: ReturnType<typeof computeCompetitorStats>;
    profitView: ReturnType<typeof buildProfitView> | null;
    currentScoreEvaluation: Awaited<ReturnType<typeof getScorePreview>> | null;
    latestScoreSnapshot: Awaited<ReturnType<typeof getLatestScoreSnapshot>> | null;
    scoreHistory: Awaited<ReturnType<typeof getScoreHistory>>;
    needsRescore: boolean;
    copywritings: Awaited<ReturnType<typeof getProductCopywritingTabData>>;
    promptTasks: Awaited<ReturnType<typeof getProductPromptTasks>>;
    materials: Awaited<ReturnType<typeof getProductMaterials>>;
  }>
> {
  const { mode } = getRuntimeModeSummary();

  if (mode === "cloud") {
    return buildReadUnavailableState(mode);
  }

  try {
    const product = await getProductById(productId);

    if (!product) {
      return {
        kind: "ready",
        runtimeMode: mode,
        data: {
          product: null,
          logs: [],
          competitors: [],
          competitorStats: computeCompetitorStats([]),
          profitView: null,
          currentScoreEvaluation: null,
          latestScoreSnapshot: null,
          scoreHistory: [],
          needsRescore: false,
          copywritings: [],
          promptTasks: [],
          materials: [],
        },
      };
    }

    const [
      logs,
      competitorRecords,
      competitors,
      currentScoreEvaluation,
      latestScoreSnapshot,
      scoreHistory,
      copywritings,
      promptTasks,
      materials,
    ] =
      await Promise.all([
        options?.includeLogs ? getProductOperationLogView(product.id) : Promise.resolve([]),
        getCompetitorRecordsByProductIdForStats(product.id),
        getCompetitorsByProductId(product.id),
        getScorePreview(product.id),
        getLatestScoreSnapshot(product.id),
        getScoreHistory(product.id),
        getProductCopywritingTabData(product.id, {
          platform: options?.copyPlatform ?? undefined,
          version: options?.copyVersion ?? undefined,
        }),
        getProductPromptTasks(product.id),
        getProductMaterials(product.id, {
          platform: options?.materialPlatform ?? undefined,
          materialType: options?.materialType ?? undefined,
          status: options?.materialStatus ?? undefined,
        }),
      ]);

    const latestCompetitorUpdatedAt = competitorRecords.reduce<Date | null>((latest, competitor) => {
      if (!latest || competitor.updatedAt > latest) {
        return competitor.updatedAt;
      }

      return latest;
    }, null);

    return {
      kind: "ready",
      runtimeMode: mode,
      data: {
        product,
        logs,
        competitors,
        competitorStats: computeCompetitorStats(competitorRecords),
        profitView: buildProfitView(product),
        currentScoreEvaluation,
        latestScoreSnapshot,
        scoreHistory,
        needsRescore: shouldNeedsRescore({
          productUpdatedAt: product.updatedAt,
          latestCompetitorUpdatedAt,
          latestScoreCreatedAt: latestScoreSnapshot?.createdAt,
        }),
        copywritings,
        promptTasks,
        materials,
      },
    };
  } catch (error) {
    const businessError = normalizeProductReadError(error);
    return {
      kind: "unavailable",
      runtimeMode: mode,
      code: businessError.code,
      message: businessError.message,
    };
  }
}

export async function getProductEditPageData(productId: number): Promise<ProductPageState<Awaited<ReturnType<typeof getProductForEdit>>>> {
  const { mode } = getRuntimeModeSummary();

  if (mode === "cloud") {
    return buildReadUnavailableState(mode);
  }

  try {
    return {
      kind: "ready",
      runtimeMode: mode,
      data: await getProductForEdit(productId),
    };
  } catch (error) {
    const businessError = normalizeProductReadError(error);
    return {
      kind: "unavailable",
      runtimeMode: mode,
      code: businessError.code,
      message: businessError.message,
    };
  }
}

export async function getHomeProductStatsPageData(): Promise<ProductPageState<Awaited<ReturnType<typeof getHomeProductStats>>>> {
  const { mode } = getRuntimeModeSummary();

  if (mode === "cloud") {
    return buildReadUnavailableState(mode);
  }

  try {
    return {
      kind: "ready",
      runtimeMode: mode,
      data: await getHomeProductStats(),
    };
  } catch (error) {
    const businessError = normalizeProductReadError(error);
    return {
      kind: "unavailable",
      runtimeMode: mode,
      code: businessError.code,
      message: businessError.message,
    };
  }
}
