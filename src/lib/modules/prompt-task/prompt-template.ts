import { getImageTypeLabel, getPlatformLabel } from "@/lib/modules/prompt-task/image-size-presets";

export const PLATFORM_STYLE_TEXT: Record<string, string> = {
  xianyu: "真实感、可信感、像个人实拍，广告感弱。",
  taobao: "清楚、标准、商品突出，适合详情页和主图。",
  xiaohongshu: "种草感、生活化、干净、低广告感。",
  douyin: "强冲击、短句卖点、封面吸引力强。",
};

type PromptProductInput = {
  name: string;
  categoryLevel1: string | null;
  categoryLevel2: string | null;
  sellingPoints: string | null;
  painPoints: string | null;
  usageScenes: string | null;
  targetUser: string | null;
};

type BuildPromptInput = {
  product: PromptProductInput;
  platform: string;
  imageType: string;
  recommendedSize: string;
};

function fallback(value: string | null | undefined, fallbackText = "未填写") {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallbackText;
}

export function getPlatformStyle(platform: string) {
  return PLATFORM_STYLE_TEXT[platform] ?? "按目标平台常见电商宣传图风格处理，保持真实可信。";
}

export function buildPromptText(input: BuildPromptInput) {
  const platformLabel = getPlatformLabel(input.platform);
  const imageTypeLabel = getImageTypeLabel(input.imageType);
  const platformStyle = getPlatformStyle(input.platform);
  const sellingPoints = fallback(input.product.sellingPoints, "未填写，请基于真实商品图片与商品名称保守表达，不要虚构功能。");
  const painPoints = fallback(input.product.painPoints, "未填写，请避免夸大痛点或制造不真实使用场景。");
  const usageScenes = fallback(input.product.usageScenes, "未填写，请按商品类目选择真实可信的日常使用场景。");
  const targetUser = fallback(input.product.targetUser, "未填写，请面向该类商品的常见购买人群。");

  return `请基于我上传的真实商品图片，为【${platformLabel}】生成一张适合电商使用的【${imageTypeLabel}】。

商品信息：
商品名称：${fallback(input.product.name)}
一级类目：${fallback(input.product.categoryLevel1)}
二级类目：${fallback(input.product.categoryLevel2)}
核心卖点：${sellingPoints}
用户痛点：${painPoints}
使用场景：${usageScenes}
目标人群：${targetUser}

图片要求：
1. 保持商品本体结构、颜色、比例、核心外观不变。
2. 不要虚构商品不存在的功能。
3. 可以优化背景、光线、清晰度、构图和文字排版。
4. 风格要符合【${platformLabel}】平台。
5. 推荐尺寸：${fallback(input.recommendedSize, "original")}。
6. 不要直接模仿竞品图片的具体构图、文字和版式。
7. 图片要真实可信，能够作为商品宣传图使用。

平台风格：
${platformStyle}

请输出一张适合该平台使用的商品宣传图。`;
}
