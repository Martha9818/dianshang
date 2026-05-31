export const LOCAL_ASSISTANT_ALLOWED_ACTIONS = ["view", "search", "filter", "navigate"] as const;

export const LOCAL_ASSISTANT_SCOPE_VALUES = [
  "product",
  "competitor",
  "material",
  "copywriting",
  "prompt_task",
  "inspiration",
  "notification",
  "cleanup",
  "backup",
  "export",
  "ai_log",
  "assistant",
] as const;

export const LOCAL_ASSISTANT_TOP_NOTICE =
  "辅助建议，仅基于本地已有数据生成；不会自动修改、删除、归档、清理或批量执行。";
export const LOCAL_ASSISTANT_PREVIEW_MESSAGE = "预览环境只读，请在 Windows 本地验收站内助手。";
export const LOCAL_ASSISTANT_AI_FALLBACK_MESSAGE =
  "未能完成智能解析，已提供基于本地规则的筛选建议。请手动确认后查看。";

export type LocalAssistantActionType = (typeof LOCAL_ASSISTANT_ALLOWED_ACTIONS)[number];
export type LocalAssistantScope = (typeof LOCAL_ASSISTANT_SCOPE_VALUES)[number];

export type LocalAssistantSuggestionSource = "rule" | "ai_plus_rule" | "safe_redirect";
export type LocalAssistantTone = "amber" | "blue" | "green" | "red" | "violet" | "slate";

export type LocalAssistantSuggestion = {
  id: string;
  title: string;
  description: string;
  href: string;
  actionType: LocalAssistantActionType;
  scope: LocalAssistantScope;
  source: LocalAssistantSuggestionSource;
  reason: string;
  badgeLabel: "辅助建议";
  tone: LocalAssistantTone;
};

export type LocalAssistantAiStatus =
  | "not_attempted"
  | "success"
  | "failed"
  | "skipped_preview"
  | "skipped_no_provider";

export type LocalAssistantSearchResult = {
  question: string;
  suggestions: LocalAssistantSuggestion[];
  strategyLabel: string;
  helperText: string;
  fallbackMessage: string | null;
  blockedMessage: string | null;
  aiStatus: LocalAssistantAiStatus;
};

export type LocalAssistantSummaryItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  actionType: Extract<LocalAssistantActionType, "view" | "navigate">;
  tone: LocalAssistantTone;
  sourceLabel: string;
};

export type LocalAssistantSummarySection = {
  key: "focus" | "attention" | "ignorable";
  title: string;
  emptyText: string;
  items: LocalAssistantSummaryItem[];
};

export type LocalAssistantSummaryResult = {
  generatedAt: string;
  sections: LocalAssistantSummarySection[];
};

export type LocalAssistantPageData = {
  runtime: {
    mode: string;
    label: string;
    isWritable: boolean;
    readonlyMessage: string | null;
  };
  topNotice: string;
  readonlyNotice: string | null;
  searchResult: LocalAssistantSearchResult | null;
  summary: LocalAssistantSummaryResult;
  examples: string[];
  searchError: string | null;
  summaryError: string | null;
};
