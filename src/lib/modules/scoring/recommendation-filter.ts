export const SCORE_RECOMMENDATION_FILTER_VALUES = [
  "recommend_test",
  "temporary",
  "need_cost",
  "eliminated",
  "unscored",
] as const;

export type ScoreRecommendationFilterValue = (typeof SCORE_RECOMMENDATION_FILTER_VALUES)[number];

export function getRecommendationFilterValue(
  recommendation: string | null | undefined,
): ScoreRecommendationFilterValue {
  switch (recommendation) {
    case "建议测试":
      return "recommend_test";
    case "临时评估":
      return "temporary";
    case "待补充成本数据":
      return "need_cost";
    case "淘汰":
      return "eliminated";
    default:
      return "unscored";
  }
}

export function getRecommendationDisplayText(recommendation: string | null | undefined) {
  return recommendation?.trim() ? recommendation : "未评分";
}
