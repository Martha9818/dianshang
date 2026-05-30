export const PROMPT_TASK_PLATFORMS = [
  { code: "xianyu", label: "闲鱼" },
  { code: "taobao", label: "淘宝" },
  { code: "xiaohongshu", label: "小红书" },
  { code: "douyin", label: "抖音" },
] as const;

export const PROMPT_IMAGE_TYPES = [
  { code: "main", label: "主图" },
  { code: "detail", label: "详情图" },
  { code: "cover", label: "封面图" },
  { code: "scene", label: "场景图" },
  { code: "selling_point", label: "卖点图" },
] as const;

export type PromptTaskPlatformCode = (typeof PROMPT_TASK_PLATFORMS)[number]["code"];
export type PromptImageTypeCode = (typeof PROMPT_IMAGE_TYPES)[number]["code"];

const presetMap: Partial<Record<PromptTaskPlatformCode, Partial<Record<PromptImageTypeCode, string>>>> = {
  taobao: {
    main: "800x800",
    detail: "750xauto",
    selling_point: "750x1000",
  },
  xiaohongshu: {
    cover: "1080x1440",
    main: "1080x1080",
    scene: "1080x1440",
  },
  douyin: {
    cover: "1080x1440",
    main: "1080x1080",
    detail: "750x1200",
  },
  xianyu: {
    main: "1080x1080",
    scene: "1080x1440",
  },
};

export function isPromptTaskPlatform(value: string): value is PromptTaskPlatformCode {
  return PROMPT_TASK_PLATFORMS.some((platform) => platform.code === value);
}

export function isPromptImageType(value: string): value is PromptImageTypeCode {
  return PROMPT_IMAGE_TYPES.some((imageType) => imageType.code === value);
}

export function getPlatformLabel(platform: string | null | undefined) {
  return PROMPT_TASK_PLATFORMS.find((item) => item.code === platform)?.label ?? platform ?? "--";
}

export function getImageTypeLabel(imageType: string | null | undefined) {
  return PROMPT_IMAGE_TYPES.find((item) => item.code === imageType)?.label ?? imageType ?? "--";
}

export function getRecommendedSize(platform: string, imageType: string) {
  if (!isPromptTaskPlatform(platform) || !isPromptImageType(imageType)) {
    return "original";
  }

  return presetMap[platform]?.[imageType] ?? "original";
}
