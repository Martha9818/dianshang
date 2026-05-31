import { COMPETITOR_ANALYSIS_MIN_COMPETITORS } from "./competitorAnalysisTypes";

export type CompetitorAnalysisPromptContext = {
  product: {
    name: string;
    categoryLevel1: string | null;
    categoryLevel2: string | null;
    tags: string[];
    targetUser: string | null;
    targetPlatforms: string[];
    estimatedPrice: number | null;
    sellingPoints: string | null;
    painPoints: string | null;
    usageScenes: string | null;
    categoryRisk: string | null;
    returnRisk: string | null;
    manualRiskNotes: string | null;
    notes: string | null;
  };
  competitors: Array<{
    id: number;
    platform: string;
    title: string;
    price: number;
    heatMetricType: string;
    heatMetricValue: number;
    sellerName: string | null;
    sellingPoint: string | null;
    painPoint: string | null;
    imageStyle: string | null;
    dataDate: string;
    notes: string | null;
    screenshotDrafts: string[];
    linkImportDrafts: string[];
  }>;
  priceStats: {
    minPrice: number | null;
    maxPrice: number | null;
    averagePrice: number | null;
    medianPrice: number | null;
  };
};

export function buildCompetitorAnalysisPrompt(context: CompetitorAnalysisPromptContext) {
  return [
    "你是 EcomPilot 的本地电商竞品分析助手。",
    "只分析用户已经手动录入、已经确认或已保存在本地草稿中的业务数据。",
    "不要访问外部平台，不要爬取链接，不要假设你打开过网页，不要提出自动采集、自动发布、自动私信、自动评论、采购下单、库存或供应商系统建议。",
    "AI 输出只能作为辅助建议，不能成为事实字段；不得建议自动修改商品评分、推荐结论、商品状态或竞品字段。",
    `如果可用竞品少于 ${COMPETITOR_ANALYSIS_MIN_COMPETITORS} 个，只能建议补充数据。本次输入已经由系统做过数量校验。`,
    "请基于输入总结竞品共性、价格带、卖点共性、图片风格共性、文案风格共性、差异化机会、新手风险、小批量测试建议、建议补充的数据和不确定性说明。",
    "可以提示“建议重新评分”，但必须说明需要用户手动触发评分更新，评分模型仍以规则为主。",
    "不要输出 API key、完整本地路径、数据库路径、堆栈、原始 prompt 或无关隐私数据。",
    "输出必须是严格 JSON，字段为 summary、priceBandSummary、sellingPointSummary、imageStyleSummary、copywritingStyleSummary、differentiationAdvice、riskTips、nextStepAdvice、dataGapAdvice、uncertaintyNotes。",
    "每个字段使用简洁中文。对不确定内容必须明确写“不确定”或“需要用户补充/复核”。",
    "",
    "本地业务数据：",
    JSON.stringify(context, null, 2),
  ].join("\n");
}
