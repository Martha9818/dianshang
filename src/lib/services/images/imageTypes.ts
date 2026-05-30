export const SUPPORTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;
export const DEFAULT_MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const THUMBNAIL_MAX_SIZE = 480;

export const IMAGE_SOURCE_TYPES = [
  "own_photo",
  "ai_generated",
  "competitor_reference",
  "platform_screenshot",
  "unknown",
] as const;

export const IMAGE_USAGE_PERMISSIONS = ["usable", "reference_only", "needs_review"] as const;

export type SupportedImageMimeType = (typeof SUPPORTED_IMAGE_MIME_TYPES)[number];
export type ImageSourceType = (typeof IMAGE_SOURCE_TYPES)[number];
export type ImageUsagePermission = (typeof IMAGE_USAGE_PERMISSIONS)[number];

export type ImageValidationResult = {
  extension: string;
  mimeType: SupportedImageMimeType;
  originalSizeBytes: number;
};

export type StoredImageResult = {
  filePath: string;
  thumbnailPath: string | null;
  thumbnailSizeBytes: number | null;
  fileHash: string;
  originalSizeBytes: number;
  mimeType: SupportedImageMimeType;
  width: number | null;
  height: number | null;
  warnings: string[];
};

