import type { ScoreDimensionScores, ScoreFlags, ScoreRecommendation, ScoringSourceProduct } from "@/lib/modules/scoring/types";

type RecommendationResult = {
  recommendation: ScoreRecommendation;
  recommendationNote: string;
  productStatus: "建议测试" | "暂缓" | "淘汰";
};

function buildResult(
  recommendation: ScoreRecommendation,
  recommendationNote: string,
  productStatus: "建议测试" | "暂缓" | "淘汰",
): RecommendationResult {
  return {
    recommendation,
    recommendationNote,
    productStatus,
  };
}

export function deriveRecommendation(input: {
  product: ScoringSourceProduct;
  flags: ScoreFlags;
  dimensions: ScoreDimensionScores;
  vetoReasons: string[];
}): RecommendationResult {
  if (input.vetoReasons.length > 0) {
    if (input.product.manualInfringementRisk) {
      return buildResult("淘汰", "商品存在明显仿牌或侵权风险，不建议继续推进。", "淘汰");
    }

    if (input.product.categoryRisk === "高风险" && input.product.manualRegulatedRisk) {
      return buildResult("淘汰", "该商品属于受监管高风险类目，当前不建议新手继续推进。", "淘汰");
    }

    if (input.flags.estimatedNetProfit !== null && input.flags.estimatedNetProfit < 3) {
      return buildResult("淘汰", "单件净利润过低，不适合投入库存。", "淘汰");
    }

    return buildResult("淘汰", "该商品售后风险过高，不建议继续推进。", "淘汰");
  }

  if (!input.flags.hasCompleteCostData || input.dimensions.totalScore === null) {
    return buildResult("待补充成本数据", "缺少售价、进货价或运费，无法计算利润空间。", "暂缓");
  }

  if (!input.flags.hasEnoughCompetitors) {
    return buildResult(
      "临时评估",
      "当前有效竞品不足 3 个，系统仅生成参考评分，不生成正式推荐结论。",
      "暂缓",
    );
  }

  if (input.dimensions.totalScore >= 80) {
    return buildResult(
      "建议测试",
      "该商品综合表现较好，具备小批量测试价值。建议先少量采购，重点验证真实转化和售后情况。",
      "建议测试",
    );
  }

  if (input.dimensions.totalScore >= 65) {
    return buildResult(
      "建议测试",
      "该商品具备一定机会，但仍有不确定因素。建议少量测试，不建议一次性大量囤货。",
      "建议测试",
    );
  }

  if (input.dimensions.totalScore >= 50) {
    return buildResult(
      "暂缓",
      "当前数据不足或优势不明显，建议继续补充竞品、成本和素材数据后再判断。",
      "暂缓",
    );
  }

  return buildResult(
    "淘汰",
    "当前商品综合评分偏低，存在需求、利润、竞争或售后方面的问题，不建议投入库存。",
    "淘汰",
  );
}
