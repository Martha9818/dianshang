export const PRODUCT_STATUS_VALUES = ["待分析", "分析中", "建议测试", "暂缓", "淘汰"] as const;

export const TARGET_PLATFORM_VALUES = ["闲鱼", "淘宝", "小红书", "抖音"] as const;

export const COMPETITOR_PLATFORM_VALUES = ["闲鱼", "淘宝", "小红书", "抖音", "其他"] as const;

export const COMPETITOR_HEAT_METRIC_VALUES = ["想要", "销量", "点赞", "收藏", "评论"] as const;

export const CATEGORY_RISK_VALUES = ["高风险", "中风险", "低风险", "未知"] as const;

export const RETURN_RISK_VALUES = ["低", "中", "高", "未知"] as const;

export const EXPLANATION_COST_VALUES = ["容易解释", "一般", "难解释", "未知"] as const;

export const LEVEL_THREE_VALUES = ["低", "中", "高"] as const;

export const VIDEO_FIT_VALUES = ["不适合", "一般", "适合"] as const;

export const COMPARISON_DEMO_VALUES = ["弱", "一般", "明显"] as const;

export const PRODUCT_STATUS_TONE: Record<string, "amber" | "blue" | "green" | "violet" | "red" | "slate"> = {
  待分析: "amber",
  分析中: "blue",
  建议测试: "green",
  暂缓: "violet",
  淘汰: "red",
};

export const OPERATION_LOG_ACTIONS = {
  CREATE_PRODUCT: "CREATE_PRODUCT",
  UPDATE_PRODUCT: "UPDATE_PRODUCT",
  DELETE_PRODUCT: "DELETE_PRODUCT",
  UPLOAD_MAIN_IMAGE: "UPLOAD_MAIN_IMAGE",
  CHANGE_STATUS: "CHANGE_STATUS",
  CREATE_COMPETITOR: "CREATE_COMPETITOR",
  UPDATE_COMPETITOR: "UPDATE_COMPETITOR",
  DELETE_COMPETITOR: "DELETE_COMPETITOR",
  UPDATE_PROFIT: "UPDATE_PROFIT",
  CALCULATE_SCORE: "CALCULATE_SCORE",
  GENERATE_COPYWRITING: "GENERATE_COPYWRITING",
  UPDATE_COPYWRITING: "UPDATE_COPYWRITING",
  TEST_AI_PROVIDER: "TEST_AI_PROVIDER",
  CREATE_AI_PROVIDER: "CREATE_AI_PROVIDER",
  UPDATE_AI_PROVIDER: "UPDATE_AI_PROVIDER",
  DELETE_AI_PROVIDER: "DELETE_AI_PROVIDER",
  CREATE_BANNED_WORD: "CREATE_BANNED_WORD",
  UPDATE_BANNED_WORD: "UPDATE_BANNED_WORD",
  DELETE_BANNED_WORD: "DELETE_BANNED_WORD",
  CREATE_PROMPT_TASK: "CREATE_PROMPT_TASK",
  COPY_PROMPT_TASK: "COPY_PROMPT_TASK",
  CANCEL_PROMPT_TASK: "CANCEL_PROMPT_TASK",
  UPLOAD_PROMPT_RESULT: "UPLOAD_PROMPT_RESULT",
  MANUAL_UPLOAD_MATERIAL: "MANUAL_UPLOAD_MATERIAL",
  UPDATE_MATERIAL_STATUS: "UPDATE_MATERIAL_STATUS",
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS_VALUES)[number];
export type TargetPlatform = (typeof TARGET_PLATFORM_VALUES)[number];
export type CompetitorPlatform = (typeof COMPETITOR_PLATFORM_VALUES)[number];
export type CompetitorHeatMetricType = (typeof COMPETITOR_HEAT_METRIC_VALUES)[number];
