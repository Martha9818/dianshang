import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatDecimal, OPERATION_LOG_ACTIONS, ProductBusinessError, BUSINESS_ERROR_CODES } from "@/lib/modules/products";
import {
  evaluateScore,
  parseScoreSnapshotLists,
  shouldNeedsRescore,
  stringifyScoreSnapshotLists,
  type ManualRiskValues,
  type ScoreEvaluation,
} from "@/lib/modules/scoring";
import { normalizeProductReadError, normalizeProductWriteError, ensureProductWritesAllowed } from "@/lib/services/product-runtime-service";

const SCORE_RULE_VERSION = "thread03-mvp-v1";

const scoreableProductSelect = {
  id: true,
  name: true,
  categoryLevel1: true,
  categoryLevel2: true,
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
  status: true,
  deletedAt: true,
  updatedAt: true,
} as const;

const scoreCompetitorSelect = {
  id: true,
  platform: true,
  title: true,
  price: true,
  heatMetricType: true,
  heatMetricValue: true,
  dataDate: true,
  updatedAt: true,
} as const;

const scoreSnapshotSelect = {
  id: true,
  productId: true,
  totalScore: true,
  demandScore: true,
  profitScore: true,
  afterSalesScore: true,
  competitionScore: true,
  supplierScore: true,
  contentScore: true,
  recommendation: true,
  recommendationNote: true,
  deductionReasons: true,
  nextSuggestions: true,
  manualRegulatedRisk: true,
  manualInfringementRisk: true,
  manualRiskNotes: true,
  ruleVersion: true,
  createdAt: true,
} as const;

type ScoreableProductRecord = Prisma.ProductGetPayload<{ select: typeof scoreableProductSelect }>;
type ScoreCompetitorRecord = Prisma.CompetitorGetPayload<{ select: typeof scoreCompetitorSelect }>;
type ScoreSnapshotRecord = Prisma.ScoreSnapshotGetPayload<{ select: typeof scoreSnapshotSelect }>;

export type ScoreFormValues = {
  manualRegulatedRisk: boolean;
  manualInfringementRisk: boolean;
  manualRiskNotes: string;
};

export type ScoreSnapshotView = {
  id: number;
  productId: number;
  totalScore: number | null;
  demandScore: number | null;
  profitScore: number | null;
  afterSalesScore: number | null;
  competitionScore: number | null;
  supplierScore: number | null;
  contentScore: number | null;
  recommendation: string | null;
  recommendationNote: string | null;
  deductionReasons: string[];
  nextSuggestions: string[];
  manualRegulatedRisk: boolean;
  manualInfringementRisk: boolean;
  manualRiskNotes: string | null;
  ruleVersion: string | null;
  createdAt: Date;
  formattedCreatedAt: string;
  formattedTotalScore: string;
};

function createNotFoundError() {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "商品不存在或已删除。");
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function formatScore(value: number | null | undefined) {
  return typeof value === "number" ? formatDecimal(value, 1) : "--";
}

function mapScoreSnapshotView(record: ScoreSnapshotRecord): ScoreSnapshotView {
  const lists = parseScoreSnapshotLists({
    deductionReasons: record.deductionReasons,
    nextSuggestions: record.nextSuggestions,
  });

  return {
    id: record.id,
    productId: record.productId,
    totalScore: record.totalScore,
    demandScore: record.demandScore,
    profitScore: record.profitScore,
    afterSalesScore: record.afterSalesScore,
    competitionScore: record.competitionScore,
    supplierScore: record.supplierScore,
    contentScore: record.contentScore,
    recommendation: record.recommendation,
    recommendationNote: record.recommendationNote,
    deductionReasons: lists.deductionReasons,
    nextSuggestions: lists.nextSuggestions,
    manualRegulatedRisk: record.manualRegulatedRisk,
    manualInfringementRisk: record.manualInfringementRisk,
    manualRiskNotes: record.manualRiskNotes,
    ruleVersion: record.ruleVersion,
    createdAt: record.createdAt,
    formattedCreatedAt: formatDateTime(record.createdAt),
    formattedTotalScore: formatScore(record.totalScore),
  };
}

function buildScoreEvaluation(product: ScoreableProductRecord, competitors: ScoreCompetitorRecord[], now = new Date()): ScoreEvaluation {
  return evaluateScore(product, competitors, now);
}

async function getScoreableProductById(productId: number, client: Prisma.TransactionClient | typeof prisma = prisma) {
  const product = await client.product.findFirst({
    where: {
      id: productId,
      deletedAt: null,
    },
    select: scoreableProductSelect,
  });

  if (!product) {
    throw createNotFoundError();
  }

  return product;
}

async function getScoreCompetitorsByProductId(productId: number, client: Prisma.TransactionClient | typeof prisma = prisma) {
  return client.competitor.findMany({
    where: { productId },
    orderBy: [{ dataDate: "desc" }, { updatedAt: "desc" }],
    select: scoreCompetitorSelect,
  });
}

export function buildScoreFormValues(input: {
  manualRegulatedRisk: boolean;
  manualInfringementRisk: boolean;
  manualRiskNotes: string | null;
}): ScoreFormValues {
  return {
    manualRegulatedRisk: input.manualRegulatedRisk,
    manualInfringementRisk: input.manualInfringementRisk,
    manualRiskNotes: input.manualRiskNotes ?? "",
  };
}

export function extractScoreFormValues(formData: FormData): ScoreFormValues {
  return {
    manualRegulatedRisk: String(formData.get("manualRegulatedRisk") ?? "") === "on",
    manualInfringementRisk: String(formData.get("manualInfringementRisk") ?? "") === "on",
    manualRiskNotes: String(formData.get("manualRiskNotes") ?? ""),
  };
}

export function normalizeScoreFormValues(values: ScoreFormValues): ManualRiskValues {
  return {
    manualRegulatedRisk: values.manualRegulatedRisk,
    manualInfringementRisk: values.manualInfringementRisk,
    manualRiskNotes: normalizeOptionalText(values.manualRiskNotes),
  };
}

export async function getScorePreview(productId: number) {
  try {
    const [product, competitors] = await Promise.all([
      getScoreableProductById(productId),
      getScoreCompetitorsByProductId(productId),
    ]);

    return buildScoreEvaluation(product, competitors);
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getLatestScoreSnapshot(productId: number) {
  try {
    const snapshot = await prisma.scoreSnapshot.findFirst({
      where: { productId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: scoreSnapshotSelect,
    });

    return snapshot ? mapScoreSnapshotView(snapshot) : null;
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getLatestScoreMap(productIds: number[]) {
  try {
    const normalizedIds = Array.from(new Set(productIds.filter((id) => Number.isInteger(id) && id > 0)));
    const latestMap = new Map<number, ScoreSnapshotView>();

    if (normalizedIds.length === 0) {
      return latestMap;
    }

    const snapshots = await prisma.scoreSnapshot.findMany({
      where: {
        productId: { in: normalizedIds },
      },
      orderBy: [{ productId: "asc" }, { createdAt: "desc" }, { id: "desc" }],
      select: scoreSnapshotSelect,
    });

    for (const snapshot of snapshots) {
      if (!latestMap.has(snapshot.productId)) {
        latestMap.set(snapshot.productId, mapScoreSnapshotView(snapshot));
      }
    }

    return latestMap;
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getScoreHistory(productId: number, take = 10) {
  try {
    const snapshots = await prisma.scoreSnapshot.findMany({
      where: { productId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      select: scoreSnapshotSelect,
    });

    return snapshots.map(mapScoreSnapshotView);
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getProductsNeedingRescoreCount() {
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        updatedAt: true,
        competitors: {
          select: { updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });

    const latestScoreMap = await getLatestScoreMap(products.map((product) => product.id));
    let count = 0;

    for (const product of products) {
      const latestScore = latestScoreMap.get(product.id);
      const latestCompetitorUpdatedAt = product.competitors[0]?.updatedAt ?? null;
      if (
        shouldNeedsRescore({
          productUpdatedAt: product.updatedAt,
          latestCompetitorUpdatedAt,
          latestScoreCreatedAt: latestScore?.createdAt,
        })
      ) {
        count += 1;
      }
    }

    return count;
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getNeedsRescoreMap(
  input: Array<{
    productId: number;
    productUpdatedAt: Date;
    latestCompetitorUpdatedAt?: Date | null;
  }>,
) {
  try {
    const latestScoreMap = await getLatestScoreMap(input.map((item) => item.productId));
    const result = new Map<number, boolean>();

    for (const item of input) {
      result.set(
        item.productId,
        shouldNeedsRescore({
          productUpdatedAt: item.productUpdatedAt,
          latestCompetitorUpdatedAt: item.latestCompetitorUpdatedAt ?? null,
          latestScoreCreatedAt: latestScoreMap.get(item.productId)?.createdAt,
        }),
      );
    }

    return result;
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function saveScoreSnapshot(productId: number, manualRiskValues: ManualRiskValues) {
  ensureProductWritesAllowed();

  try {
    return await prisma.$transaction(async (tx) => {
      const existingProduct = await getScoreableProductById(productId, tx);
      const competitors = await getScoreCompetitorsByProductId(productId, tx);
      const evaluation = buildScoreEvaluation(
        {
          ...existingProduct,
          ...manualRiskValues,
        },
        competitors,
      );
      const productStatusChanged = existingProduct.status !== evaluation.productStatus;

      await tx.product.update({
        where: { id: productId },
        data: {
          manualRegulatedRisk: manualRiskValues.manualRegulatedRisk,
          manualInfringementRisk: manualRiskValues.manualInfringementRisk,
          manualRiskNotes: manualRiskValues.manualRiskNotes,
          status: evaluation.productStatus,
        },
      });

      if (productStatusChanged) {
        await tx.operationLog.create({
          data: {
            productId,
            action: OPERATION_LOG_ACTIONS.CHANGE_STATUS,
            detail: `状态由 ${existingProduct.status} 变更为 ${evaluation.productStatus}`,
          },
        });
      }

      const lists = stringifyScoreSnapshotLists({
        deductionReasons: evaluation.deductionReasons,
        nextSuggestions: evaluation.nextSuggestions,
      });

      const snapshot = await tx.scoreSnapshot.create({
        data: {
          productId,
          totalScore: evaluation.dimensions.totalScore,
          demandScore: evaluation.dimensions.demandScore,
          profitScore: evaluation.dimensions.profitScore,
          afterSalesScore: evaluation.dimensions.afterSalesScore,
          competitionScore: evaluation.dimensions.competitionScore,
          supplierScore: evaluation.dimensions.supplierScore,
          contentScore: evaluation.dimensions.contentScore,
          recommendation: evaluation.recommendation,
          recommendationNote: evaluation.recommendationNote,
          deductionReasons: lists.deductionReasons,
          nextSuggestions: lists.nextSuggestions,
          manualRegulatedRisk: evaluation.manualRisk.manualRegulatedRisk,
          manualInfringementRisk: evaluation.manualRisk.manualInfringementRisk,
          manualRiskNotes: evaluation.manualRisk.manualRiskNotes,
          ruleVersion: SCORE_RULE_VERSION,
        },
        select: scoreSnapshotSelect,
      });

      await tx.operationLog.create({
        data: {
          productId,
          action: OPERATION_LOG_ACTIONS.CALCULATE_SCORE,
          detail: `保存评分结果：${evaluation.recommendation}（总分 ${formatScore(evaluation.dimensions.totalScore)}）`,
        },
      });

      return {
        evaluation,
        snapshot: mapScoreSnapshotView(snapshot),
        productStatusChanged,
      };
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}
