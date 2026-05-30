import { computeEstimatedNetProfit } from "@/lib/modules/products";
import type {
  ScoreComponentScores,
  ScoreDimensionScores,
  ScoreFlags,
  ScoringSourceCompetitor,
  ScoringSourceProduct,
} from "@/lib/modules/scoring/types";

function getTextLength(value: string | null | undefined) {
  return value?.trim().length ?? 0;
}

function roundScore(value: number | null) {
  if (value === null) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function isValidCompetitor(competitor: ScoringSourceCompetitor) {
  return Boolean(
    competitor.platform.trim() &&
      competitor.title.trim() &&
      competitor.heatMetricType.trim() &&
      Number.isFinite(competitor.price) &&
      competitor.price > 0 &&
      Number.isFinite(competitor.heatMetricValue) &&
      competitor.heatMetricValue >= 0 &&
      competitor.dataDate instanceof Date &&
      !Number.isNaN(competitor.dataDate.getTime()),
  );
}

function computeMedian(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middleIndex];
  }

  return (sorted[middleIndex - 1] + sorted[middleIndex]) / 2;
}

function getDayDiff(from: Date, to: Date) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function scoreEffectiveCompetitorCount(validCount: number) {
  if (validCount <= 0) {
    return 0;
  }

  if (validCount === 1) {
    return 40;
  }

  if (validCount === 2) {
    return 55;
  }

  if (validCount <= 4) {
    return 70;
  }

  if (validCount <= 9) {
    return 85;
  }

  return 100;
}

function scoreSingleCompetitorEngagement(competitor: ScoringSourceCompetitor) {
  const value = competitor.heatMetricValue;
  const platform = competitor.platform.trim();
  const metric = competitor.heatMetricType.trim();

  if (platform === "闲鱼" && metric === "想要") {
    if (value <= 5) {
      return 30;
    }

    if (value <= 30) {
      return 60;
    }

    return 85;
  }

  if (platform === "淘宝" && metric === "销量") {
    if (value <= 99) {
      return 40;
    }

    if (value <= 999) {
      return 70;
    }

    return 95;
  }

  if (platform === "小红书" && ["点赞", "收藏", "评论"].includes(metric)) {
    if (value <= 99) {
      return 35;
    }

    if (value <= 999) {
      return 70;
    }

    return 95;
  }

  if (platform === "抖音" && ["点赞", "评论"].includes(metric)) {
    if (value <= 499) {
      return 35;
    }

    if (value <= 4999) {
      return 70;
    }

    return 95;
  }

  if (value <= 99) {
    return 35;
  }

  if (value <= 999) {
    return 70;
  }

  return 90;
}

function scoreCompetitorEngagement(competitors: ScoringSourceCompetitor[]) {
  if (competitors.length === 0) {
    return 0;
  }

  const topThreeScores = competitors
    .map(scoreSingleCompetitorEngagement)
    .sort((left, right) => right - left)
    .slice(0, 3);

  return topThreeScores.reduce((sum, value) => sum + value, 0) / topThreeScores.length;
}

function scorePriceBandReasonableness(estimatedPrice: number | null, medianPrice: number | null) {
  if (estimatedPrice === null || medianPrice === null || medianPrice <= 0) {
    return 50;
  }

  const priceGapRatio = Math.abs(estimatedPrice - medianPrice) / medianPrice;

  if (priceGapRatio <= 0.2) {
    return 100;
  }

  if (priceGapRatio <= 0.35) {
    return 70;
  }

  return 40;
}

function scorePlatformCoverage(platformCount: number) {
  if (platformCount <= 0) {
    return 0;
  }

  if (platformCount === 1) {
    return 40;
  }

  if (platformCount === 2) {
    return 65;
  }

  if (platformCount === 3) {
    return 85;
  }

  return 100;
}

function scorePainPointClarity(painPoints: string | null) {
  const length = getTextLength(painPoints);

  if (length >= 20) {
    return 100;
  }

  if (length >= 5) {
    return 60;
  }

  return 30;
}

function scoreDataFreshness(latestDataDate: Date | null, now: Date) {
  if (!latestDataDate) {
    return 40;
  }

  const dayDiff = getDayDiff(latestDataDate, now);

  if (dayDiff <= 7) {
    return 100;
  }

  if (dayDiff <= 14) {
    return 85;
  }

  if (dayDiff <= 30) {
    return 60;
  }

  return 30;
}

function scoreNetProfit(estimatedNetProfit: number | null) {
  if (estimatedNetProfit === null || estimatedNetProfit < 3) {
    return 0;
  }

  if (estimatedNetProfit < 5) {
    return 40;
  }

  if (estimatedNetProfit < 10) {
    return 70;
  }

  if (estimatedNetProfit < 20) {
    return 90;
  }

  return 100;
}

function scoreProfitRate(profitRate: number | null) {
  if (profitRate === null) {
    return null;
  }

  if (profitRate < 0.2) {
    return 30;
  }

  if (profitRate < 0.3) {
    return 60;
  }

  if (profitRate < 0.5) {
    return 85;
  }

  return 100;
}

function scoreCategoryRisk(value: string | null) {
  switch (value) {
    case "高风险":
      return 0;
    case "中风险":
      return 60;
    case "低风险":
      return 90;
    default:
      return 60;
  }
}

function scoreReturnRisk(value: string | null) {
  switch (value) {
    case "低":
      return 90;
    case "中":
      return 60;
    case "高":
      return 30;
    default:
      return 60;
  }
}

function scoreExplanationCost(value: string | null) {
  switch (value) {
    case "容易解释":
      return 90;
    case "一般":
      return 60;
    case "难解释":
      return 30;
    default:
      return 60;
  }
}

function scoreCompetitorCountPressure(validCount: number) {
  if (validCount <= 0) {
    return 40;
  }

  if (validCount <= 2) {
    return 60;
  }

  if (validCount <= 5) {
    return 80;
  }

  if (validCount <= 10) {
    return 60;
  }

  return 40;
}

function scorePricePressure(estimatedPrice: number | null, medianPrice: number | null) {
  if (estimatedPrice === null || medianPrice === null || medianPrice <= 0) {
    return 50;
  }

  if (estimatedPrice <= medianPrice) {
    return 85;
  }

  const premiumRatio = (estimatedPrice - medianPrice) / medianPrice;

  if (premiumRatio <= 0.1) {
    return 90;
  }

  if (premiumRatio <= 0.25) {
    return 70;
  }

  if (premiumRatio <= 0.5) {
    return 50;
  }

  return 30;
}

function scoreDifferentiation(sellingPoints: string | null) {
  const length = getTextLength(sellingPoints);

  if (length >= 20) {
    return 90;
  }

  if (length >= 5) {
    return 60;
  }

  return 30;
}

function scoreLevelThree(value: string | null) {
  switch (value) {
    case "低":
    case "无":
    case "不适合":
      return 30;
    case "中":
    case "一般":
      return 60;
    case "高":
    case "明显":
    case "适合":
      return 90;
    default:
      return 60;
  }
}

function roundComponents(components: ScoreComponentScores): ScoreComponentScores {
  return {
    ...components,
    competitorEngagementScore: roundScore(components.competitorEngagementScore) ?? 0,
  };
}

export function buildScoreComponents(
  product: ScoringSourceProduct,
  competitors: ScoringSourceCompetitor[],
  now = new Date(),
) {
  const validCompetitors = competitors.filter(isValidCompetitor);
  const validCount = validCompetitors.length;
  const prices = validCompetitors.map((competitor) => competitor.price);
  const platformCount = new Set(validCompetitors.map((competitor) => competitor.platform)).size;
  const latestCompetitorDataDate = validCompetitors.reduce<Date | null>((latest, competitor) => {
    if (!latest || competitor.dataDate > latest) {
      return competitor.dataDate;
    }

    return latest;
  }, null);
  const competitorMedianPrice = computeMedian(prices);
  const estimatedNetProfit =
    typeof product.estimatedPrice === "number"
      ? computeEstimatedNetProfit({
          estimatedPrice: product.estimatedPrice,
          estimatedCost: product.estimatedCost,
          estimatedShipping: product.estimatedShipping,
          packagingCost: product.packagingCost ?? 0,
        })
      : null;
  const hasCompleteCostData =
    typeof product.estimatedPrice === "number" &&
    typeof product.estimatedCost === "number" &&
    typeof product.estimatedShipping === "number";
  const profitRate =
    estimatedNetProfit === null || product.estimatedPrice === null || product.estimatedPrice <= 0
      ? null
      : estimatedNetProfit / product.estimatedPrice;

  const components = roundComponents({
    effectiveCompetitorCountScore: scoreEffectiveCompetitorCount(validCount),
    competitorEngagementScore: scoreCompetitorEngagement(validCompetitors),
    priceBandScore: scorePriceBandReasonableness(product.estimatedPrice, competitorMedianPrice),
    platformCoverageScore: scorePlatformCoverage(platformCount),
    painPointClarityScore: scorePainPointClarity(product.painPoints),
    dataFreshnessScore: scoreDataFreshness(latestCompetitorDataDate, now),
    netProfitScore: scoreNetProfit(estimatedNetProfit),
    profitRateScore: scoreProfitRate(profitRate),
    categoryRiskScore: scoreCategoryRisk(product.categoryRisk),
    returnRiskScore: scoreReturnRisk(product.returnRisk),
    explanationCostScore: scoreExplanationCost(product.explanationCost),
    competitorCountPressureScore: scoreCompetitorCountPressure(validCount),
    pricePressureScore: scorePricePressure(product.estimatedPrice, competitorMedianPrice),
    differentiationScore: scoreDifferentiation(product.sellingPoints),
    supplierStabilityScore: 60,
    contentVisualScore: scoreLevelThree(product.contentVisualLevel),
    sceneClarityScore: scoreLevelThree(product.sceneClarityLevel),
    videoFitScore: scoreLevelThree(product.videoFitLevel),
    comparisonDemoScore: scoreLevelThree(product.comparisonDemoLevel),
  });

  const flags: ScoreFlags = {
    validCompetitorCount: validCount,
    platformCount,
    hasEnoughCompetitors: validCount >= 3,
    hasCompleteCostData,
    latestCompetitorDataDate,
    competitorMedianPrice,
    estimatedNetProfit,
    profitRate,
    supplierDataMissing: true,
    vetoReasons: [],
  };

  return { components, flags };
}

export function buildScoreDimensions(components: ScoreComponentScores): ScoreDimensionScores {
  const demandScore =
    components.effectiveCompetitorCountScore * 0.2 +
    components.competitorEngagementScore * 0.25 +
    components.priceBandScore * 0.15 +
    components.platformCoverageScore * 0.15 +
    components.painPointClarityScore * 0.15 +
    components.dataFreshnessScore * 0.1;

  const profitScore =
    components.netProfitScore === null || components.profitRateScore === null
      ? null
      : components.netProfitScore * 0.6 + components.profitRateScore * 0.4;

  const afterSalesScore =
    components.categoryRiskScore * 0.5 +
    components.returnRiskScore * 0.3 +
    components.explanationCostScore * 0.2;

  const competitionScore =
    components.competitorCountPressureScore * 0.4 +
    components.pricePressureScore * 0.3 +
    components.differentiationScore * 0.3;

  const supplierScore = components.supplierStabilityScore;

  const contentScore =
    components.contentVisualScore * 0.35 +
    components.sceneClarityScore * 0.25 +
    components.videoFitScore * 0.2 +
    components.comparisonDemoScore * 0.2;

  const totalScore =
    profitScore === null
      ? null
      : demandScore * 0.3 +
        profitScore * 0.25 +
        afterSalesScore * 0.15 +
        competitionScore * 0.1 +
        supplierScore * 0.1 +
        contentScore * 0.1;

  return {
    demandScore: roundScore(demandScore) ?? 0,
    profitScore: roundScore(profitScore),
    afterSalesScore: roundScore(afterSalesScore) ?? 0,
    competitionScore: roundScore(competitionScore) ?? 0,
    supplierScore: roundScore(supplierScore) ?? 0,
    contentScore: roundScore(contentScore) ?? 0,
    totalScore: roundScore(totalScore),
  };
}

export function getVetoReasons(
  product: ScoringSourceProduct,
  flags: ScoreFlags,
  dimensions: ScoreDimensionScores,
) {
  const reasons: string[] = [];

  if (product.categoryRisk === "高风险" && product.manualRegulatedRisk) {
    reasons.push("商品命中受监管高风险类目");
  }

  if (product.manualInfringementRisk) {
    reasons.push("商品存在明显仿牌或侵权风险");
  }

  if (flags.estimatedNetProfit !== null && flags.estimatedNetProfit < 3) {
    reasons.push("单件净利润低于 3 元");
  }

  if (dimensions.afterSalesScore < 30) {
    reasons.push("售后风险分低于 30");
  }

  return reasons;
}
