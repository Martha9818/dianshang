import type { CopywritingPlatform } from "@/lib/modules/copywriting/prompts";

type StructuredCopywritingPayload = {
  platform?: string;
  versions?: Array<{
    version?: string;
    style?: string;
    title?: string;
    main_copy?: string;
    selling_points?: unknown;
    faq?: unknown;
    risk_notes?: unknown;
  }>;
};

type CopywritingRecordLike = {
  platform: string | null;
  version: string | null;
  style: string | null;
  title: string | null;
  mainCopy: string | null;
  sellingPointsJson: string | null;
  faqJson: string | null;
  riskNotesJson: string | null;
  structuredPayloadJson: string | null;
  rawResponseText: string | null;
};

export type CopywritingDisplaySection = {
  label: string;
  value: string;
};

export type CopywritingDisplayView = {
  title: string;
  styleLabel: string;
  sections: CopywritingDisplaySection[];
  sellingPoints: string[];
  faqItems: string[];
  riskNotes: string[];
  copyText: string;
};

function parseJsonArray(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

function parseStructuredPayload(value: string | null | undefined): StructuredCopywritingPayload | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed as StructuredCopywritingPayload;
  } catch {
    return null;
  }
}

function extractPlatformSections(platform: CopywritingPlatform | string, record: CopywritingRecordLike) {
  switch (platform) {
    case "闲鱼":
      return [
        { label: "商品描述", value: record.mainCopy ?? "--" },
        { label: "议价回复", value: parseJsonArray(record.faqJson).join("\n") || "--" },
        { label: "发货说明 / 风险提示", value: parseJsonArray(record.riskNotesJson).join("\n") || "--" },
      ];
    case "淘宝":
      return [
        { label: "商品标题", value: record.title ?? "--" },
        { label: "详情页分段文案", value: record.mainCopy ?? "--" },
        { label: "参数 / FAQ / 售后", value: parseJsonArray(record.faqJson).join("\n") || "--" },
      ];
    case "小红书":
      return [
        { label: "笔记标题", value: record.title ?? "--" },
        { label: "种草正文", value: record.mainCopy ?? "--" },
        { label: "互动话术 / 标签 / 角度", value: parseJsonArray(record.faqJson).join("\n") || "--" },
      ];
    case "抖音":
      return [
        { label: "视频标题", value: record.title ?? "--" },
        { label: "脚本 / 口播稿", value: record.mainCopy ?? "--" },
        { label: "封面文案 / 商品卡卖点", value: parseJsonArray(record.faqJson).join("\n") || "--" },
      ];
    default:
      return [
        { label: "标题", value: record.title ?? "--" },
        { label: "正文", value: record.mainCopy ?? "--" },
      ];
  }
}

export function buildCopywritingDisplayView(record: CopywritingRecordLike): CopywritingDisplayView {
  const sellingPoints = parseJsonArray(record.sellingPointsJson);
  const faqItems = parseJsonArray(record.faqJson);
  const riskNotes = parseJsonArray(record.riskNotesJson);
  const payload = parseStructuredPayload(record.structuredPayloadJson);
  const platform = record.platform ?? payload?.platform ?? "文案";
  const sections = extractPlatformSections(platform, record);

  const copyText = [
    `${platform} ${record.version ?? ""}版 ${record.style ?? ""}`.trim(),
    record.title ? `标题：${record.title}` : null,
    record.mainCopy ? `正文：\n${record.mainCopy}` : null,
    sellingPoints.length > 0 ? `卖点：\n- ${sellingPoints.join("\n- ")}` : null,
    faqItems.length > 0 ? `FAQ：\n- ${faqItems.join("\n- ")}` : null,
    riskNotes.length > 0 ? `风险提示：\n- ${riskNotes.join("\n- ")}` : null,
    !record.title && !record.mainCopy && record.rawResponseText ? "AI 返回未通过结构化展示，请重新生成或手动编辑。" : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    title: record.title ?? "未命名文案",
    styleLabel: record.style ?? "--",
    sections,
    sellingPoints,
    faqItems,
    riskNotes,
    copyText: copyText || "--",
  };
}
