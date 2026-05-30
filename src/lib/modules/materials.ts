export const MATERIAL_TYPES = [
  { code: "original", label: "原始图" },
  { code: "main_image", label: "主图" },
  { code: "detail_image", label: "详情图" },
  { code: "cover_image", label: "封面图" },
  { code: "prompt_result", label: "Prompt 结果" },
  { code: "competitor_screenshot", label: "竞品截图" },
] as const;

export const MANUAL_MATERIAL_TYPES = MATERIAL_TYPES.filter((item) => item.code !== "competitor_screenshot");

export const MATERIAL_STATUS = {
  PENDING_REVIEW: "待审核",
  USABLE: "可使用",
  NEEDS_EDIT: "待修改",
  ADOPTED: "已采用",
  DISCARDED: "已弃用",
} as const;

export const MATERIAL_STATUSES = Object.values(MATERIAL_STATUS);

export const MATERIAL_SOURCE = {
  PROMPT_RESULT: "prompt_result",
  MANUAL_UPLOAD: "manual_upload",
} as const;

export const MATERIAL_IMAGE_SOURCE_TYPES = [
  { code: "own_photo", label: "自有拍摄" },
  { code: "ai_generated", label: "AI 生成" },
  { code: "competitor_reference", label: "竞品参考" },
  { code: "platform_screenshot", label: "平台截图" },
  { code: "unknown", label: "未知来源" },
] as const;

export const MATERIAL_USAGE_PERMISSIONS = [
  { code: "usable", label: "可用于发布" },
  { code: "reference_only", label: "仅作参考" },
  { code: "needs_review", label: "需要复核" },
] as const;

export type MaterialTypeCode = (typeof MATERIAL_TYPES)[number]["code"];
export type ManualMaterialTypeCode = (typeof MANUAL_MATERIAL_TYPES)[number]["code"];
export type MaterialStatus = (typeof MATERIAL_STATUS)[keyof typeof MATERIAL_STATUS];
export type MaterialImageSourceType = (typeof MATERIAL_IMAGE_SOURCE_TYPES)[number]["code"];
export type MaterialUsagePermission = (typeof MATERIAL_USAGE_PERMISSIONS)[number]["code"];

const materialTypeLabels = new Map<string, string>(MATERIAL_TYPES.map((item) => [item.code, item.label]));
const materialImageSourceTypeLabels = new Map<string, string>(MATERIAL_IMAGE_SOURCE_TYPES.map((item) => [item.code, item.label]));
const materialUsagePermissionLabels = new Map<string, string>(MATERIAL_USAGE_PERMISSIONS.map((item) => [item.code, item.label]));

export const MATERIAL_STATUS_TONE: Record<string, "amber" | "blue" | "green" | "violet" | "red" | "slate"> = {
  [MATERIAL_STATUS.PENDING_REVIEW]: "amber",
  [MATERIAL_STATUS.USABLE]: "blue",
  [MATERIAL_STATUS.NEEDS_EDIT]: "red",
  [MATERIAL_STATUS.ADOPTED]: "green",
  [MATERIAL_STATUS.DISCARDED]: "slate",
};

export function isMaterialType(value: string): value is MaterialTypeCode {
  return MATERIAL_TYPES.some((item) => item.code === value);
}

export function isManualMaterialType(value: string): value is ManualMaterialTypeCode {
  return MANUAL_MATERIAL_TYPES.some((item) => item.code === value);
}

export function isMaterialStatus(value: string): value is MaterialStatus {
  return MATERIAL_STATUSES.includes(value as MaterialStatus);
}

export function getMaterialTypeLabel(value: string | null | undefined) {
  return materialTypeLabels.get(value ?? "") ?? value ?? "--";
}

export function getMaterialStatusTone(value: string | null | undefined) {
  return MATERIAL_STATUS_TONE[value ?? ""] ?? "slate";
}

export function getMaterialSourceLabel(value: string | null | undefined) {
  if (value === MATERIAL_SOURCE.PROMPT_RESULT) return "Prompt 回传";
  if (value === MATERIAL_SOURCE.MANUAL_UPLOAD) return "手动上传";
  return value ?? "--";
}

export function getMaterialImageSourceTypeLabel(value: string | null | undefined) {
  return materialImageSourceTypeLabels.get(value ?? "") ?? "未知来源";
}

export function getMaterialUsagePermissionLabel(value: string | null | undefined) {
  return materialUsagePermissionLabels.get(value ?? "") ?? "需要复核";
}

export function mapManualMaterialTypeToStorageImageType(value: ManualMaterialTypeCode) {
  const storageMap: Record<ManualMaterialTypeCode, string> = {
    original: "original",
    main_image: "main",
    detail_image: "detail",
    cover_image: "cover",
    prompt_result: "manual",
  };

  return storageMap[value];
}
