import type { InspirationAISuggestion } from "@/lib/services/inspirations/inspirationTypes";

export type InboxTone = "amber" | "green" | "slate" | "red" | "violet" | "blue";

export type InspirationInboxField = {
  label: string;
  value: string;
  isPlaceholder?: boolean;
};

export type InspirationInboxAiStatus = {
  label: string;
  description: string;
  tone: InboxTone;
};

export type InspirationInboxCardSummary = {
  title: string;
  subtitle: string;
  productType: string;
  targetAudience: string;
  nextStep: string;
};

export type InspirationInboxSource = {
  title: string | null;
  fileName: string;
  note: string | null;
  status: string;
  rejectedReason: string | null;
  convertedProduct: { id: number; name: string } | null;
  aiSuggestion: InspirationAISuggestion | null;
  aiDraftJobs: Array<{ status: string }>;
};

const PLACEHOLDER_INSUFFICIENT = "信息不足";
const PLACEHOLDER_PENDING = "待补充";
const PLACEHOLDER_NOT_GENERATED = "尚未生成";

function cleanText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function joinValues(values: Array<string | null | undefined>, placeholder: string) {
  const items = Array.from(
    new Set(
      values
        .map((value) => cleanText(value))
        .filter(Boolean),
    ),
  );

  return items.length > 0 ? items.join("、") : placeholder;
}

function getCandidateName(source: InspirationInboxSource) {
  return cleanText(source.title) || cleanText(source.aiSuggestion?.titleSuggestion) || PLACEHOLDER_PENDING;
}

function getNextStepSuggestion(source: InspirationInboxSource) {
  if (source.convertedProduct || source.status === "converted") {
    return "已转商品，可继续补充正式商品资料。";
  }

  if (source.status === "rejected") {
    return source.rejectedReason ? `已放弃：${source.rejectedReason}` : "已放弃，除非有新线索再继续。";
  }

  if (source.status === "archived") {
    return "已归档；需要时再回看，不占用日常处理位。";
  }

  if (source.aiSuggestion) {
    return "先核对图片和 AI 草稿，再决定保留、放弃或转商品。";
  }

  if (source.aiDraftJobs.some((job) => job.status === "failed")) {
    return "AI 草稿生成失败，可先补充人工备注或重试。";
  }

  return "先生成 AI 草稿，再决定保留、放弃或转商品。";
}

export function getInspirationInboxAiStatus(source: InspirationInboxSource): InspirationInboxAiStatus {
  if (source.convertedProduct || source.status === "converted") {
    return {
      label: "已转商品",
      description: "这条灵感已经进入正式商品流程，当前页面以回看和补充说明为主。",
      tone: "green",
    };
  }

  if (source.status === "rejected") {
    return {
      label: "已放弃",
      description: source.rejectedReason ? `已记录放弃原因：${source.rejectedReason}` : "这条灵感已放弃，不再进入主处理流程。",
      tone: "red",
    };
  }

  if (source.status === "archived") {
    return {
      label: "已归档",
      description: "这条灵感已从日常处理位移出，保留记录供后续查询。",
      tone: "slate",
    };
  }

  if (source.aiSuggestion) {
    return {
      label: cleanText(source.aiSuggestion.draftLabel) || "AI 草稿待确认",
      description: "先核对图片和 AI 草稿，再决定保留、放弃或转商品。",
      tone: "violet",
    };
  }

  if (source.aiDraftJobs.some((job) => job.status === "processing")) {
    return {
      label: "AI 草稿生成中",
      description: "AI 正在整理草稿，先看图片和人工备注，稍后再回来确认。",
      tone: "blue",
    };
  }

  if (source.aiDraftJobs.some((job) => job.status === "failed")) {
    return {
      label: "AI 草稿待重试",
      description: "上一次草稿生成失败，可先补充人工备注或重试。",
      tone: "amber",
    };
  }

  return {
    label: "尚未生成 AI 草稿",
    description: "先生成 AI 草稿；如果只有链接，建议补充截图或页面文字再判断。",
    tone: "amber",
  };
}

export function buildInspirationInboxPrimaryFields(source: InspirationInboxSource): InspirationInboxField[] {
  const suggestion = source.aiSuggestion;
  const aiStatus = getInspirationInboxAiStatus(source);
  const tags = joinValues(
    [...(suggestion?.styleKeywords ?? []), ...(suggestion?.colors ?? []), ...(suggestion?.materials ?? [])],
    PLACEHOLDER_PENDING,
  );

  return [
    { label: "AI 草稿状态", value: aiStatus.label },
    { label: "候选商品名", value: getCandidateName(source), isPlaceholder: getCandidateName(source) === PLACEHOLDER_PENDING },
    { label: "候选价格", value: PLACEHOLDER_PENDING, isPlaceholder: true },
    {
      label: "商品类型",
      value: cleanText(suggestion?.possibleProductType) || cleanText(suggestion?.possibleCategory) || PLACEHOLDER_INSUFFICIENT,
      isPlaceholder: !(cleanText(suggestion?.possibleProductType) || cleanText(suggestion?.possibleCategory)),
    },
    {
      label: "目标人群",
      value: joinValues(suggestion?.targetAudience ?? [], PLACEHOLDER_INSUFFICIENT),
      isPlaceholder: (suggestion?.targetAudience?.length ?? 0) === 0,
    },
    { label: "用户痛点", value: PLACEHOLDER_INSUFFICIENT, isPlaceholder: true },
    {
      label: "使用场景",
      value: joinValues(suggestion?.useScenarios ?? [], PLACEHOLDER_INSUFFICIENT),
      isPlaceholder: (suggestion?.useScenarios?.length ?? 0) === 0,
    },
    {
      label: "核心卖点",
      value: joinValues(suggestion?.sellingPoints ?? [], PLACEHOLDER_INSUFFICIENT),
      isPlaceholder: (suggestion?.sellingPoints?.length ?? 0) === 0,
    },
    {
      label: "建议平台",
      value: joinValues(suggestion?.suitablePlatforms ?? [], PLACEHOLDER_INSUFFICIENT),
      isPlaceholder: (suggestion?.suitablePlatforms?.length ?? 0) === 0,
    },
    { label: "标签", value: tags, isPlaceholder: tags === PLACEHOLDER_PENDING },
    {
      label: "类目建议",
      value: cleanText(suggestion?.possibleCategory) || PLACEHOLDER_PENDING,
      isPlaceholder: !cleanText(suggestion?.possibleCategory),
    },
    { label: "可见文字摘要", value: PLACEHOLDER_NOT_GENERATED, isPlaceholder: true },
    { label: "规格线索", value: PLACEHOLDER_INSUFFICIENT, isPlaceholder: true },
    {
      label: "风险提示",
      value: joinValues(suggestion?.riskNotes ?? [], PLACEHOLDER_INSUFFICIENT),
      isPlaceholder: (suggestion?.riskNotes?.length ?? 0) === 0,
    },
    { label: "内容表现力", value: PLACEHOLDER_PENDING, isPlaceholder: true },
    { label: "短视频适配", value: PLACEHOLDER_PENDING, isPlaceholder: true },
    { label: "对比展示能力", value: PLACEHOLDER_PENDING, isPlaceholder: true },
    { label: "下一步建议", value: getNextStepSuggestion(source) },
    { label: "识别质量", value: PLACEHOLDER_NOT_GENERATED, isPlaceholder: true },
    { label: "草稿初筛分", value: PLACEHOLDER_NOT_GENERATED, isPlaceholder: true },
    { label: "初筛结论", value: PLACEHOLDER_NOT_GENERATED, isPlaceholder: true },
  ];
}

export function buildInspirationInboxCardSummary(source: InspirationInboxSource): InspirationInboxCardSummary {
  const suggestion = source.aiSuggestion;

  return {
    title: getCandidateName(source),
    subtitle:
      cleanText(suggestion?.shortDescription) ||
      cleanText(source.note) ||
      getInspirationInboxAiStatus(source).description,
    productType: cleanText(suggestion?.possibleProductType) || cleanText(suggestion?.possibleCategory) || PLACEHOLDER_INSUFFICIENT,
    targetAudience: joinValues(suggestion?.targetAudience ?? [], PLACEHOLDER_INSUFFICIENT),
    nextStep: getNextStepSuggestion(source),
  };
}
