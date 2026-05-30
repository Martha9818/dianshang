import { parseJsonStringArray } from "@/lib/modules/products";

export const COPYWRITING_PLATFORMS = ["闲鱼", "淘宝", "小红书", "抖音"] as const;
export const COPYWRITING_VERSIONS = ["A", "B", "C"] as const;
export const COPYWRITING_JOB_TYPES = {
  SINGLE_PLATFORM: "copywriting",
  MULTI_PLATFORM: "copywriting_multi_platform",
} as const;
export const COPYWRITING_VERSION_STYLES = {
  A: "稳妥真实版",
  B: "强卖点转化版",
  C: "种草内容版",
} as const;
export const COPYWRITING_AUDIT_STATUS = {
  SAFE: "无风险",
  RISKY: "有风险",
  NEEDS_EDIT: "待修改",
  PENDING: "待生成",
} as const;
export const COPYWRITING_GENERATION_STATUS = {
  SUCCESS: "success",
  PARTIAL: "partial",
  EMPTY: "empty",
} as const;
export const COPYWRITING_USAGE_STATUS = {
  USED: "used",
  UNUSED: "unused",
} as const;
export const BANNED_WORD_RISK_LEVELS = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
} as const;

type ProductPromptRecord = {
  id: number;
  name: string;
  categoryLevel1: string | null;
  categoryLevel2: string | null;
  tags: string | null;
  targetUser: string | null;
  targetPlatforms: string | null;
  estimatedPrice: number | null;
  estimatedCost: number | null;
  estimatedShipping: number | null;
  sellingPoints: string | null;
  painPoints: string | null;
  usageScenes: string | null;
  notes: string | null;
};

export type CopywritingPlatform = (typeof COPYWRITING_PLATFORMS)[number];
export type CopywritingVersionCode = (typeof COPYWRITING_VERSIONS)[number];

export type CopywritingPromptInput = {
  product: ProductPromptRecord;
  platform: CopywritingPlatform;
  bannedWordsText: string;
  competitorSummary: {
    sellingPoints: string[];
    painPoints: string[];
    priceRangeText: string;
    imageStyles: string[];
    hasCompetitors: boolean;
  };
};

const PROMPT_TEMPLATE = `你是一名资深中文电商运营文案专家，擅长根据不同平台风格生成合规、真实、可转化的商品文案。

请基于以下商品信息，为【{platform}】生成 3 个版本的文案。

【商品基础信息】
商品名称：{product_name}
一级类目：{category_level1}
二级类目：{category_level2}
商品标签：{product_tags}
目标人群：{target_user}
预估售价：{estimated_price}
核心卖点：{selling_points}
用户痛点：{pain_points}
使用场景：{usage_scenes}
竞品常见卖点：{competitor_selling_points}
竞品差评/顾虑：{competitor_pain_points}
竞品价格区间：{competitor_price_range}
竞品图片风格：{competitor_image_style}
目标平台：{target_platforms}
备注：{notes}

【禁用词参考】
{banned_words}

【生成要求】
1. 生成 3 个版本：
   - A版：稳妥真实版
   - B版：强卖点转化版
   - C版：种草内容版
2. 不得虚构商品不存在的功能。
3. 不得使用绝对化、夸大化表达，例如：最好、第一、100%、永久、根治、无敌、全网最低。
4. 不得出现医疗、药效、治疗、保证效果等高风险表达。
5. 文案要符合【{platform}】的平台风格。
6. 输出必须为 JSON 格式，方便系统解析和保存。

【输出格式】
{
  "platform": "{platform}",
  "versions": [
    {
      "version": "A",
      "style": "稳妥真实版",
      "title": "",
      "main_copy": "",
      "selling_points": [],
      "faq": [],
      "risk_notes": []
    },
    {
      "version": "B",
      "style": "强卖点转化版",
      "title": "",
      "main_copy": "",
      "selling_points": [],
      "faq": [],
      "risk_notes": []
    },
    {
      "version": "C",
      "style": "种草内容版",
      "title": "",
      "main_copy": "",
      "selling_points": [],
      "faq": [],
      "risk_notes": []
    }
  ]
}`;

const PLATFORM_APPENDIX: Record<CopywritingPlatform, string> = {
  闲鱼: `【平台追加要求：闲鱼】
1. 像真实个人卖家，不要太像官方广告。
2. 语气自然、可信、口语化。
3. 可强调实拍、现货、个人使用感受、适合自用。
4. 生成标题、商品描述、议价回复、发货说明、常见问题回复。`,
  淘宝: `【平台追加要求：淘宝】
1. 清楚、标准、信息完整。
2. 标题包含核心关键词，不堆砌无关词。
3. 主图文案短、直接，突出核心卖点。
4. 生成商品标题、主图卖点文案、详情页分段文案、参数说明、FAQ、售后说明。`,
  小红书: `【平台追加要求：小红书】
1. 有种草感、生活化、真实体验感。
2. 不要像硬广。
3. 重点表达使用场景、用户痛点、体验变化。
4. 生成笔记标题、种草正文、标签、评论区互动话术、内容角度建议。`,
  抖音: `【平台追加要求：抖音】
1. 短句化、节奏快、第一眼抓人。
2. 强调痛点、反差、使用前后变化。
3. 生成视频标题、封面文案、15-30 秒短视频脚本、口播稿、商品卡卖点。`,
};

function formatTextValue(value: string | null | undefined, fallback = "--") {
  const trimmed = value?.trim() ?? "";
  return trimmed || fallback;
}

function formatOptionalNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "--";
}

function formatList(values: string[], fallback: string) {
  const normalized = values.map((item) => item.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized.join("；") : fallback;
}

export function buildCopywritingJsonSchema() {
  return {
    name: "copywriting_response",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["platform", "versions"],
      properties: {
        platform: {
          type: "string",
          enum: [...COPYWRITING_PLATFORMS],
        },
        versions: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["version", "style", "title", "main_copy", "selling_points", "faq", "risk_notes"],
            properties: {
              version: {
                type: "string",
                enum: [...COPYWRITING_VERSIONS],
              },
              style: {
                type: "string",
              },
              title: {
                type: "string",
              },
              main_copy: {
                type: "string",
              },
              selling_points: {
                type: "array",
                items: { type: "string" },
              },
              faq: {
                type: "array",
                items: { type: "string" },
              },
              risk_notes: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
      },
    },
  };
}

export function buildCopywritingPrompt(input: CopywritingPromptInput) {
  const productTags = parseJsonStringArray(input.product.tags);
  const targetPlatforms = parseJsonStringArray(input.product.targetPlatforms);
  const sellingPoints = formatTextValue(
    input.product.sellingPoints,
    "【提示】核心卖点为空，请优先基于商品基础信息保守生成。",
  );
  const painPoints = formatTextValue(
    input.product.painPoints,
    "请基于商品类目推测常见用户痛点，但不要虚构具体效果。",
  );
  const usageScenes = formatTextValue(input.product.usageScenes, "日常使用场景");
  const noCompetitorFallback = "暂无竞品信息，请基于商品基础信息生成";
  const competitorSellingPoints = formatList(
    input.competitorSummary.sellingPoints,
    input.competitorSummary.hasCompetitors ? "--" : noCompetitorFallback,
  );
  const competitorPainPoints = formatList(
    input.competitorSummary.painPoints,
    input.competitorSummary.hasCompetitors ? "--" : noCompetitorFallback,
  );

  const values: Record<string, string> = {
    product_name: formatTextValue(input.product.name),
    category_level1: formatTextValue(input.product.categoryLevel1),
    category_level2: formatTextValue(input.product.categoryLevel2),
    product_tags: formatList(productTags, "--"),
    target_user: formatTextValue(input.product.targetUser),
    estimated_price: formatOptionalNumber(input.product.estimatedPrice),
    estimated_cost: formatOptionalNumber(input.product.estimatedCost),
    estimated_shipping: formatOptionalNumber(input.product.estimatedShipping),
    selling_points: sellingPoints,
    pain_points: painPoints,
    usage_scenes: usageScenes,
    target_platforms: formatList(targetPlatforms, "--"),
    notes: formatTextValue(input.product.notes),
    platform: input.platform,
    banned_words: input.bannedWordsText || "暂无禁用词，但仍需避免绝对化、夸大化和医疗功效表达。",
    competitor_selling_points: competitorSellingPoints,
    competitor_pain_points: competitorPainPoints,
    competitor_price_range: input.competitorSummary.priceRangeText || "--",
    competitor_image_style: formatList(
      input.competitorSummary.imageStyles,
      input.competitorSummary.hasCompetitors ? "--" : noCompetitorFallback,
    ),
  };

  let prompt = PROMPT_TEMPLATE;

  for (const [key, value] of Object.entries(values)) {
    prompt = prompt.replaceAll(`{${key}}`, value);
  }

  return `${prompt}\n\n${PLATFORM_APPENDIX[input.platform]}`;
}
