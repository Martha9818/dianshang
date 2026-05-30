import {
  COPYWRITING_PLATFORMS,
  COPYWRITING_VERSION_STYLES,
  COPYWRITING_VERSIONS,
  type CopywritingPlatform,
  type CopywritingVersionCode,
} from "@/lib/modules/copywriting/prompts";
import type { AISchema } from "@/lib/services/ai";

type ProductPromptRecord = {
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

type CompetitorSummary = {
  sellingPoints: string[];
  painPoints: string[];
  priceRangeText: string;
  imageStyles: string[];
  hasCompetitors: boolean;
};

export type MultiPlatformPromptInput = {
  product: ProductPromptRecord;
  competitorSummary: CompetitorSummary;
  bannedWordsText: string;
};

export type MultiPlatformVersionDraft = {
  versionLabel: CopywritingVersionCode;
  title: string;
  body: string;
  sellingPoints: string[];
  tags: string[];
};

export type MultiPlatformPackageResponse = {
  platforms: Array<{
    platform: CopywritingPlatform;
    versions: MultiPlatformVersionDraft[];
  }>;
};

function formatTextValue(value: string | null | undefined, fallback = "--") {
  const trimmed = value?.trim() ?? "";
  return trimmed || fallback;
}

function formatOptionalNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "--";
}

function splitJsonArrayString(value: string | null | undefined) {
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

function getPriceBucket(input: Pick<ProductPromptRecord, "estimatedPrice" | "estimatedCost" | "estimatedShipping">) {
  const price = input.estimatedPrice ?? null;
  if (price === null) {
    return "价格区间未确认";
  }
  if (price < 50) return "低价区间";
  if (price < 150) return "中价区间";
  return "高价区间";
}

function getProfitBand(input: Pick<ProductPromptRecord, "estimatedPrice" | "estimatedCost" | "estimatedShipping">) {
  const price = input.estimatedPrice ?? null;
  const cost = input.estimatedCost ?? null;
  const shipping = input.estimatedShipping ?? 0;

  if (price === null || cost === null) {
    return "利润空间未确认";
  }

  const margin = price - cost - shipping;
  if (margin >= price * 0.45) return "利润空间高";
  if (margin >= price * 0.2) return "利润空间中";
  return "利润空间低";
}

function formatList(values: string[], fallback: string) {
  const normalized = values.map((item) => item.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized.join("；") : fallback;
}

export function buildMultiPlatformCopywritingPrompt(input: MultiPlatformPromptInput) {
  const productTags = splitJsonArrayString(input.product.tags);
  const targetPlatforms = splitJsonArrayString(input.product.targetPlatforms);
  const sellingPoints = formatTextValue(
    input.product.sellingPoints,
    "核心卖点暂未确认，请基于商品基础信息保守生成。",
  );
  const painPoints = formatTextValue(
    input.product.painPoints,
    "用户痛点暂未确认，请避免虚构医疗、功效、绝对化承诺。",
  );
  const usageScenes = formatTextValue(input.product.usageScenes, "日常使用场景");

  return `
你是一名中文电商多平台文案助手，请为同一个商品输出四个平台的文案草稿包：闲鱼、淘宝、小红书、抖音。

输出要求：
1. 每个平台输出 A / B / C 三个版本。
2. 每个版本必须包含：versionLabel、title、body、sellingPoints、tags。
3. 只返回 JSON，不要返回额外解释。
4. 不得虚构商品不存在的功能、认证、销量、权威背书。
5. 不得出现 API Key、本地路径、完整成本公式、供应商隐私。
6. 不得使用绝对化、医疗功效、保健承诺等高风险表达。
7. 标签与话题要贴近平台风格，但不要堆砌。
8. A 版偏稳妥真实，B 版偏卖点转化，C 版偏内容种草。

商品信息：
- 商品名称：${formatTextValue(input.product.name)}
- 一级类目：${formatTextValue(input.product.categoryLevel1)}
- 二级类目：${formatTextValue(input.product.categoryLevel2)}
- 商品标签：${formatList(productTags, "--")}
- 目标用户：${formatTextValue(input.product.targetUser)}
- 目标平台：${formatList(targetPlatforms, "--")}
- 价格区间：${getPriceBucket(input.product)}
- 利润空间：${getProfitBand(input.product)}
- 预估售价：${formatOptionalNumber(input.product.estimatedPrice)}
- 人工确认卖点：${sellingPoints}
- 用户痛点：${painPoints}
- 使用场景：${usageScenes}
- 竞品常见卖点：${formatList(input.competitorSummary.sellingPoints, input.competitorSummary.hasCompetitors ? "--" : "暂无竞品信息")}
- 竞品常见顾虑：${formatList(input.competitorSummary.painPoints, input.competitorSummary.hasCompetitors ? "--" : "暂无竞品信息")}
- 竞品价格带：${input.competitorSummary.priceRangeText || "--"}
- 竞品内容风格：${formatList(input.competitorSummary.imageStyles, input.competitorSummary.hasCompetitors ? "--" : "暂无竞品信息")}
- 备注：${formatTextValue(input.product.notes, "--")}

违规词参考：
${input.bannedWordsText || "暂无违规词，但仍需避免绝对化、夸大化、医疗功效表达。"}

平台风格要求：
- 闲鱼：像真实个人卖家，强调实拍、现货、自然沟通感。
- 淘宝：清晰、信息密度高、适合商品标题和详情页卖点表达。
- 小红书：偏生活化、种草感、真实体验感，不要像硬广。
- 抖音：短句、节奏快、抓眼球，适合短视频口播和封面文案。

JSON 结构：
{
  "platforms": [
    {
      "platform": "闲鱼",
      "versions": [
        {
          "versionLabel": "A",
          "title": "",
          "body": "",
          "sellingPoints": [],
          "tags": []
        }
      ]
    }
  ]
}
`.trim();
}

export function buildMultiPlatformCopywritingJsonSchema() {
  return {
    name: "copywriting_multi_platform_package",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["platforms"],
      properties: {
        platforms: {
          type: "array",
          minItems: 4,
          maxItems: 4,
          items: {
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
                  required: ["versionLabel", "title", "body", "sellingPoints", "tags"],
                  properties: {
                    versionLabel: {
                      type: "string",
                      enum: [...COPYWRITING_VERSIONS],
                    },
                    title: { type: "string" },
                    body: { type: "string" },
                    sellingPoints: {
                      type: "array",
                      items: { type: "string" },
                    },
                    tags: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

export const multiPlatformCopywritingSchema: AISchema<MultiPlatformPackageResponse> = {
  name: "copywriting_multi_platform_package",
  validate(value: unknown): value is MultiPlatformPackageResponse {
    if (!value || typeof value !== "object" || !("platforms" in value)) {
      return false;
    }

    const candidate = value as { platforms?: unknown };
    if (!Array.isArray(candidate.platforms)) {
      return false;
    }

    const platformSet = new Set(
      candidate.platforms
        .map((item) => (item && typeof item === "object" && "platform" in item ? String(item.platform) : ""))
        .filter(Boolean),
    );

    if (![...COPYWRITING_PLATFORMS].every((platform) => platformSet.has(platform))) {
      return false;
    }

    return candidate.platforms.every((platformEntry) => {
      if (!platformEntry || typeof platformEntry !== "object") {
        return false;
      }

      const item = platformEntry as { platform?: unknown; versions?: unknown };
      if (typeof item.platform !== "string" || !Array.isArray(item.versions)) {
        return false;
      }

      const versionSet = new Set(
        item.versions
          .map((version) =>
            version && typeof version === "object" && "versionLabel" in version ? String(version.versionLabel) : "",
          )
          .filter(Boolean),
      );

      return (
        [...COPYWRITING_VERSIONS].every((versionLabel) => versionSet.has(versionLabel)) &&
        item.versions.every((version) => {
          if (!version || typeof version !== "object") {
            return false;
          }

          const draft = version as Record<string, unknown>;
          return (
            typeof draft.versionLabel === "string" &&
            typeof draft.title === "string" &&
            typeof draft.body === "string" &&
            Array.isArray(draft.sellingPoints) &&
            Array.isArray(draft.tags)
          );
        })
      );
    });
  },
};

export function normalizeMultiPlatformDraft(
  platform: CopywritingPlatform,
  versionLabel: CopywritingVersionCode,
  input: Partial<MultiPlatformVersionDraft>,
) {
  const sellingPoints = Array.isArray(input.sellingPoints)
    ? input.sellingPoints.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const tags = Array.isArray(input.tags)
    ? input.tags.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  return {
    platform,
    versionLabel,
    style: COPYWRITING_VERSION_STYLES[versionLabel],
    title: typeof input.title === "string" ? input.title.trim() : "",
    body: typeof input.body === "string" ? input.body.trim() : "",
    sellingPoints,
    tags,
  };
}
