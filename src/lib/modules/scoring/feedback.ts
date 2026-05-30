import type { ScoreDimensionScores, ScoreFlags, ScoringSourceProduct } from "@/lib/modules/scoring/types";

function getTextLength(value: string | null | undefined) {
  return value?.trim().length ?? 0;
}

function pushUnique(items: string[], value: string) {
  if (!items.includes(value)) {
    items.push(value);
  }
}

export function buildDeductionReasons(input: {
  product: ScoringSourceProduct;
  flags: ScoreFlags;
  dimensions: ScoreDimensionScores;
  vetoReasons: string[];
}) {
  const reasons: string[] = [];

  if (input.product.categoryRisk === "高风险" && input.product.manualRegulatedRisk) {
    reasons.push("商品命中受监管高风险类目，存在一票否决风险。");
  }

  if (input.product.manualInfringementRisk) {
    reasons.push("商品存在明显仿牌或侵权风险，不建议继续推进。");
  }

  if (input.flags.validCompetitorCount < 3) {
    reasons.push("竞品数据不足，当前仅能生成临时评估。");
  }

  if (!input.flags.hasCompleteCostData) {
    reasons.push("缺少售价、进货价或运费，暂时无法计算利润空间。");
  }

  if (input.flags.estimatedNetProfit !== null && input.flags.estimatedNetProfit < 3) {
    reasons.push("单件净利润过低，不适合投入库存。");
  }

  if (!input.product.painPoints?.trim()) {
    reasons.push("用户痛点不明确，可能影响文案和转化。");
  } else if (getTextLength(input.product.painPoints) < 20) {
    reasons.push("用户痛点描述偏少，建议补充更具体的痛点场景。");
  }

  if (!input.product.sellingPoints?.trim()) {
    reasons.push("商品差异化卖点不足。");
  } else if (getTextLength(input.product.sellingPoints) < 20) {
    reasons.push("核心卖点描述偏少，差异化表达仍然不够强。");
  }

  if (!input.flags.latestCompetitorDataDate) {
    reasons.push("竞品数据日期缺失，参考价值有限。");
  } else {
    const now = new Date();
    const latest = new Date(
      input.flags.latestCompetitorDataDate.getFullYear(),
      input.flags.latestCompetitorDataDate.getMonth(),
      input.flags.latestCompetitorDataDate.getDate(),
    );
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayDiff = Math.floor((today.getTime() - latest.getTime()) / (24 * 60 * 60 * 1000));

    if (dayDiff > 14) {
      reasons.push("竞品数据偏旧，建议补充近 14 天的新数据。");
    }
  }

  if (input.flags.platformCount <= 1) {
    reasons.push("竞品平台覆盖偏少，跨平台验证仍然不足。");
  }

  if (input.dimensions.afterSalesScore < 60) {
    reasons.push("售后风险偏高，后续可能带来退货或解释成本。");
  }

  if (input.dimensions.competitionScore < 60) {
    reasons.push("竞争压力较大，价格或差异化空间不足。");
  }

  if (input.dimensions.contentScore < 60) {
    reasons.push("内容表现力偏弱，可能影响素材出片和转化表达。");
  }

  if (input.flags.supplierDataMissing) {
    reasons.push("供应商数据不足，建议后续补充供应商信息。");
  }

  return reasons.slice(0, 5);
}

export function buildNextSuggestions(input: {
  product: ScoringSourceProduct;
  flags: ScoreFlags;
  dimensions: ScoreDimensionScores;
  recommendation: string;
}) {
  const suggestions: string[] = [];

  if (input.flags.validCompetitorCount < 3) {
    pushUnique(suggestions, "补充至少 3 个有效竞品。");
  }

  if (!input.flags.hasCompleteCostData) {
    pushUnique(suggestions, "补充售价、进货价、运费。");
  }

  if (
    getTextLength(input.product.sellingPoints) < 20 ||
    getTextLength(input.product.painPoints) < 20 ||
    getTextLength(input.product.usageScenes) < 5
  ) {
    pushUnique(suggestions, "补充核心卖点、痛点、使用场景。");
  }

  if (!input.flags.latestCompetitorDataDate) {
    pushUnique(suggestions, "补充近 14 天的竞品数据日期。");
  } else {
    const now = new Date();
    const latest = new Date(
      input.flags.latestCompetitorDataDate.getFullYear(),
      input.flags.latestCompetitorDataDate.getMonth(),
      input.flags.latestCompetitorDataDate.getDate(),
    );
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayDiff = Math.floor((today.getTime() - latest.getTime()) / (24 * 60 * 60 * 1000));

    if (dayDiff > 14) {
      pushUnique(suggestions, "更新最近 14 天的竞品数据。");
    }
  }

  if (input.flags.supplierDataMissing) {
    pushUnique(suggestions, "补充供应商信息，完善稳定性判断。");
  }

  if (input.recommendation === "建议测试") {
    pushUnique(suggestions, "建议生成平台文案和 Prompt 任务，并安排小批量测试。");
  }

  if (input.recommendation === "暂缓" || input.recommendation === "临时评估" || input.recommendation === "待补充成本数据") {
    pushUnique(suggestions, "建议先暂缓，补齐关键信息后再重新评分。");
  }

  if (input.recommendation === "淘汰") {
    pushUnique(suggestions, "建议直接淘汰，避免继续投入库存与精力。");
  }

  return suggestions;
}
