export const LINK_IMPORT_READONLY_MESSAGE = "预览环境只读，请在 Windows 本地验收链接导入。";

export const LINK_IMPORT_PURPOSES = {
  INSPIRATION: "inspiration",
  PRODUCT_CANDIDATE: "product_candidate",
  COMPETITOR_REFERENCE: "competitor_reference",
} as const;

export const LINK_IMPORT_STATUSES = {
  DRAFT: "draft",
  NEEDS_REVIEW: "needs_review",
  CONVERTED: "converted",
  REJECTED: "rejected",
  FAILED: "failed",
} as const;

export const LINK_IMPORT_QUALITY_LEVELS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  FAILED: "failed",
} as const;

export const LINK_IMPORT_PLATFORMS = {
  TAOBAO: "taobao",
  XIAN_YU: "xianyu",
  XIAO_HONG_SHU: "xiaohongshu",
  DOU_YIN: "douyin",
  ALIBABA_1688: "1688",
  OTHER: "other",
} as const;

export type LinkImportPurpose = (typeof LINK_IMPORT_PURPOSES)[keyof typeof LINK_IMPORT_PURPOSES];
export type LinkImportStatus = (typeof LINK_IMPORT_STATUSES)[keyof typeof LINK_IMPORT_STATUSES];
export type LinkImportQualityLevel = (typeof LINK_IMPORT_QUALITY_LEVELS)[keyof typeof LINK_IMPORT_QUALITY_LEVELS];
export type LinkImportPlatform = (typeof LINK_IMPORT_PLATFORMS)[keyof typeof LINK_IMPORT_PLATFORMS];

const purposeSet = new Set<string>(Object.values(LINK_IMPORT_PURPOSES));

export function isLinkImportPurpose(value: string): value is LinkImportPurpose {
  return purposeSet.has(value);
}
