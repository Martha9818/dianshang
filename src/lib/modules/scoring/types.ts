export type ManualRiskValues = {
  manualRegulatedRisk: boolean;
  manualInfringementRisk: boolean;
  manualRiskNotes: string | null;
};

export type ScoringSourceProduct = {
  id: number;
  name: string;
  categoryLevel1: string | null;
  categoryLevel2: string | null;
  estimatedPrice: number | null;
  estimatedCost: number | null;
  estimatedShipping: number | null;
  packagingCost: number | null;
  sellingPoints: string | null;
  painPoints: string | null;
  usageScenes: string | null;
  categoryRisk: string | null;
  returnRisk: string | null;
  explanationCost: string | null;
  contentVisualLevel: string | null;
  sceneClarityLevel: string | null;
  videoFitLevel: string | null;
  comparisonDemoLevel: string | null;
  manualRegulatedRisk: boolean;
  manualInfringementRisk: boolean;
  manualRiskNotes: string | null;
  updatedAt?: Date | null;
};

export type ScoringSourceCompetitor = {
  id?: number;
  platform: string;
  title: string;
  price: number;
  heatMetricType: string;
  heatMetricValue: number;
  dataDate: Date;
  updatedAt?: Date | null;
};

export type ScoreComponentScores = {
  effectiveCompetitorCountScore: number;
  competitorEngagementScore: number;
  priceBandScore: number;
  platformCoverageScore: number;
  painPointClarityScore: number;
  dataFreshnessScore: number;
  netProfitScore: number | null;
  profitRateScore: number | null;
  categoryRiskScore: number;
  returnRiskScore: number;
  explanationCostScore: number;
  competitorCountPressureScore: number;
  pricePressureScore: number;
  differentiationScore: number;
  supplierStabilityScore: number;
  contentVisualScore: number;
  sceneClarityScore: number;
  videoFitScore: number;
  comparisonDemoScore: number;
};

export type ScoreDimensionScores = {
  demandScore: number;
  profitScore: number | null;
  afterSalesScore: number;
  competitionScore: number;
  supplierScore: number;
  contentScore: number;
  totalScore: number | null;
};

export type ScoreFlags = {
  validCompetitorCount: number;
  platformCount: number;
  hasEnoughCompetitors: boolean;
  hasCompleteCostData: boolean;
  latestCompetitorDataDate: Date | null;
  competitorMedianPrice: number | null;
  estimatedNetProfit: number | null;
  profitRate: number | null;
  supplierDataMissing: boolean;
  vetoReasons: string[];
};

export type ScoreRecommendation =
  | "建议测试"
  | "暂缓"
  | "淘汰"
  | "临时评估"
  | "待补充成本数据";

export type ScoreEvaluation = {
  manualRisk: ManualRiskValues;
  components: ScoreComponentScores;
  dimensions: ScoreDimensionScores;
  flags: ScoreFlags;
  recommendation: ScoreRecommendation;
  recommendationNote: string;
  productStatus: "建议测试" | "暂缓" | "淘汰";
  deductionReasons: string[];
  nextSuggestions: string[];
};

export type ScoreSnapshotLists = {
  deductionReasons: string[];
  nextSuggestions: string[];
};
