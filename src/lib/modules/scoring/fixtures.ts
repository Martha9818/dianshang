import type { ManualRiskValues } from "@/lib/modules/scoring/types";

export type AcceptanceFixtureInputProduct = {
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
  updatedAt: string;
};

export type AcceptanceFixtureInputCompetitor = {
  id?: number;
  platform: string;
  title: string;
  price: number;
  heatMetricType: string;
  heatMetricValue: number;
  dataDate: string;
  updatedAt?: string | null;
};

export type AcceptanceFixture = {
  id: string;
  title: string;
  now: string;
  product: AcceptanceFixtureInputProduct;
  competitors: AcceptanceFixtureInputCompetitor[];
  manualRisk: ManualRiskValues;
  expectedRecommendation: string;
};

const defaultManualRisk: ManualRiskValues = {
  manualRegulatedRisk: false,
  manualInfringementRisk: false,
  manualRiskNotes: null,
};

export const THREAD03_ACCEPTANCE_FIXTURES: AcceptanceFixture[] = [
  {
    id: "A",
    title: "宠物梳毛器",
    now: "2026-05-28T10:30:00+08:00",
    manualRisk: defaultManualRisk,
    product: {
      id: 1001,
      name: "宠物梳毛器",
      categoryLevel1: "宠物用品",
      categoryLevel2: "宠物清洁",
      estimatedPrice: 29.9,
      estimatedCost: 8,
      estimatedShipping: 3,
      packagingCost: 1,
      sellingPoints: "一键退毛，梳理不飞毛，适合猫狗日常掉毛季使用。",
      painPoints: "家里宠物掉毛严重，传统梳子清理麻烦，宠物还容易抗拒。",
      usageScenes: "居家日常梳毛、换毛季集中清理、出门前快速整理。",
      categoryRisk: "低风险",
      returnRisk: "低",
      explanationCost: "容易解释",
      contentVisualLevel: "高",
      sceneClarityLevel: "高",
      videoFitLevel: "适合",
      comparisonDemoLevel: "明显",
      updatedAt: "2026-05-28T09:00:00+08:00",
    },
    competitors: [
      { id: 1, platform: "闲鱼", title: "宠物退毛梳 A", price: 26.9, heatMetricType: "想要", heatMetricValue: 38, dataDate: "2026-05-25T00:00:00+08:00" },
      { id: 2, platform: "淘宝", title: "宠物退毛梳 B", price: 29.9, heatMetricType: "销量", heatMetricValue: 1350, dataDate: "2026-05-24T00:00:00+08:00" },
      { id: 3, platform: "小红书", title: "宠物退毛梳 C", price: 32.0, heatMetricType: "点赞", heatMetricValue: 1280, dataDate: "2026-05-23T00:00:00+08:00" },
      { id: 4, platform: "抖音", title: "宠物退毛梳 D", price: 31.8, heatMetricType: "点赞", heatMetricValue: 6200, dataDate: "2026-05-22T00:00:00+08:00" },
      { id: 5, platform: "淘宝", title: "宠物退毛梳 E", price: 28.5, heatMetricType: "销量", heatMetricValue: 820, dataDate: "2026-05-26T00:00:00+08:00" },
    ],
    expectedRecommendation: "建议测试",
  },
  {
    id: "B",
    title: "冷门宠物装饰摆件",
    now: "2026-05-28T10:30:00+08:00",
    manualRisk: {
      manualRegulatedRisk: false,
      manualInfringementRisk: false,
      manualRiskNotes: "当前先按普通装饰类处理",
    },
    product: {
      id: 1002,
      name: "冷门宠物装饰摆件",
      categoryLevel1: "宠物用品",
      categoryLevel2: "宠物周边",
      estimatedPrice: 39.9,
      estimatedCost: 18,
      estimatedShipping: 5,
      packagingCost: 0,
      sellingPoints: "造型小众，可做桌面装饰。",
      painPoints: "普通宠物周边太常见，部分用户想找更有个性的摆件。",
      usageScenes: "桌面装饰、礼物赠送。",
      categoryRisk: "中风险",
      returnRisk: "中",
      explanationCost: "一般",
      contentVisualLevel: "中",
      sceneClarityLevel: "中",
      videoFitLevel: "一般",
      comparisonDemoLevel: "一般",
      updatedAt: "2026-05-28T09:05:00+08:00",
    },
    competitors: [
      { id: 6, platform: "淘宝", title: "宠物摆件 A", price: 36, heatMetricType: "销量", heatMetricValue: 22, dataDate: "2026-05-18T00:00:00+08:00" },
    ],
    expectedRecommendation: "临时评估",
  },
  {
    id: "C",
    title: "宠物营养粉",
    now: "2026-05-28T10:30:00+08:00",
    manualRisk: {
      manualRegulatedRisk: true,
      manualInfringementRisk: false,
      manualRiskNotes: "涉及宠物营养补充，按受监管高风险类目处理",
    },
    product: {
      id: 1003,
      name: "宠物营养粉",
      categoryLevel1: "宠物用品",
      categoryLevel2: "宠物保健",
      estimatedPrice: 59,
      estimatedCost: 20,
      estimatedShipping: 4,
      packagingCost: 1,
      sellingPoints: "独立包装，冲泡方便。",
      painPoints: "宠物挑食、营养摄入不足时，主人想寻找更方便的补充方式。",
      usageScenes: "宠物日常喂养、恢复期补充。",
      categoryRisk: "高风险",
      returnRisk: "中",
      explanationCost: "一般",
      contentVisualLevel: "中",
      sceneClarityLevel: "中",
      videoFitLevel: "一般",
      comparisonDemoLevel: "一般",
      updatedAt: "2026-05-28T09:10:00+08:00",
    },
    competitors: [
      { id: 7, platform: "淘宝", title: "宠物营养粉 A", price: 55, heatMetricType: "销量", heatMetricValue: 680, dataDate: "2026-05-26T00:00:00+08:00" },
      { id: 8, platform: "闲鱼", title: "宠物营养粉 B", price: 49, heatMetricType: "想要", heatMetricValue: 12, dataDate: "2026-05-24T00:00:00+08:00" },
      { id: 9, platform: "小红书", title: "宠物营养粉 C", price: 61, heatMetricType: "点赞", heatMetricValue: 420, dataDate: "2026-05-23T00:00:00+08:00" },
      { id: 10, platform: "抖音", title: "宠物营养粉 D", price: 57, heatMetricType: "点赞", heatMetricValue: 1600, dataDate: "2026-05-27T00:00:00+08:00" },
      { id: 11, platform: "淘宝", title: "宠物营养粉 E", price: 63, heatMetricType: "销量", heatMetricValue: 1250, dataDate: "2026-05-22T00:00:00+08:00" },
      { id: 12, platform: "其他", title: "宠物营养粉 F", price: 58, heatMetricType: "评论", heatMetricValue: 320, dataDate: "2026-05-21T00:00:00+08:00" },
    ],
    expectedRecommendation: "淘汰",
  },
  {
    id: "missing-cost",
    title: "缺少成本数据",
    now: "2026-05-28T10:30:00+08:00",
    manualRisk: defaultManualRisk,
    product: {
      id: 1004,
      name: "旅行宠物水杯",
      categoryLevel1: "宠物用品",
      categoryLevel2: "外出用品",
      estimatedPrice: 39.9,
      estimatedCost: null,
      estimatedShipping: 4,
      packagingCost: 1,
      sellingPoints: "一键出水，外出喂水更方便。",
      painPoints: "外出遛宠时携带水碗不方便，容易洒水。",
      usageScenes: "遛狗、出行、短途旅行。",
      categoryRisk: "低风险",
      returnRisk: "低",
      explanationCost: "容易解释",
      contentVisualLevel: "高",
      sceneClarityLevel: "高",
      videoFitLevel: "适合",
      comparisonDemoLevel: "明显",
      updatedAt: "2026-05-28T09:15:00+08:00",
    },
    competitors: [
      { platform: "淘宝", title: "宠物水杯 A", price: 35, heatMetricType: "销量", heatMetricValue: 600, dataDate: "2026-05-27T00:00:00+08:00" },
      { platform: "抖音", title: "宠物水杯 B", price: 42, heatMetricType: "点赞", heatMetricValue: 2100, dataDate: "2026-05-26T00:00:00+08:00" },
      { platform: "小红书", title: "宠物水杯 C", price: 38, heatMetricType: "收藏", heatMetricValue: 540, dataDate: "2026-05-25T00:00:00+08:00" },
    ],
    expectedRecommendation: "待补充成本数据",
  },
  {
    id: "infringement",
    title: "侵权风险样例",
    now: "2026-05-28T10:30:00+08:00",
    manualRisk: {
      manualRegulatedRisk: false,
      manualInfringementRisk: true,
      manualRiskNotes: "明显仿牌风险",
    },
    product: {
      id: 1005,
      name: "品牌同款宠物背包",
      categoryLevel1: "宠物用品",
      categoryLevel2: "外出用品",
      estimatedPrice: 99,
      estimatedCost: 40,
      estimatedShipping: 8,
      packagingCost: 2,
      sellingPoints: "热门造型，外出拍照效果好。",
      painPoints: "宠物外出背负不便，用户希望更轻松携带。",
      usageScenes: "商场、地铁、短途出行、拍照打卡。",
      categoryRisk: "中风险",
      returnRisk: "中",
      explanationCost: "一般",
      contentVisualLevel: "高",
      sceneClarityLevel: "高",
      videoFitLevel: "适合",
      comparisonDemoLevel: "明显",
      updatedAt: "2026-05-28T09:20:00+08:00",
    },
    competitors: [
      { platform: "淘宝", title: "宠物背包 A", price: 88, heatMetricType: "销量", heatMetricValue: 1200, dataDate: "2026-05-27T00:00:00+08:00" },
      { platform: "闲鱼", title: "宠物背包 B", price: 79, heatMetricType: "想要", heatMetricValue: 31, dataDate: "2026-05-26T00:00:00+08:00" },
      { platform: "抖音", title: "宠物背包 C", price: 92, heatMetricType: "点赞", heatMetricValue: 5300, dataDate: "2026-05-25T00:00:00+08:00" },
    ],
    expectedRecommendation: "淘汰",
  },
  {
    id: "cost-priority-over-temporary",
    title: "缺成本优先于临时评估",
    now: "2026-05-28T10:30:00+08:00",
    manualRisk: defaultManualRisk,
    product: {
      id: 1006,
      name: "宠物牵引配件",
      categoryLevel1: "宠物用品",
      categoryLevel2: "外出用品",
      estimatedPrice: 19.9,
      estimatedCost: null,
      estimatedShipping: 2,
      packagingCost: 0,
      sellingPoints: "安装简单，出门更稳固。",
      painPoints: "原装配件损坏后替换麻烦。",
      usageScenes: "日常遛狗、备用替换。",
      categoryRisk: "低风险",
      returnRisk: "低",
      explanationCost: "容易解释",
      contentVisualLevel: "中",
      sceneClarityLevel: "中",
      videoFitLevel: "一般",
      comparisonDemoLevel: "一般",
      updatedAt: "2026-05-28T09:25:00+08:00",
    },
    competitors: [
      { platform: "淘宝", title: "牵引配件 A", price: 18, heatMetricType: "销量", heatMetricValue: 45, dataDate: "2026-05-20T00:00:00+08:00" },
    ],
    expectedRecommendation: "待补充成本数据",
  },
];
