import path from "node:path";
import { BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products/errors";
import {
  DEFAULT_MAX_IMAGE_SIZE_BYTES,
  SUPPORTED_IMAGE_EXTENSIONS,
  SUPPORTED_IMAGE_MIME_TYPES,
  type ImageValidationResult,
  type SupportedImageMimeType,
} from "./imageTypes";

const extensionSet = new Set<string>(SUPPORTED_IMAGE_EXTENSIONS);
const mimeTypeSet = new Set<string>(SUPPORTED_IMAGE_MIME_TYPES);

function formatMaxSize(bytes: number) {
  return `${Math.floor(bytes / 1024 / 1024)}MB`;
}

export function getImageExtension(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

export function assertSupportedImageFile(
  file: File,
  options: { label?: string; maxSizeBytes?: number } = {},
): ImageValidationResult {
  const label = options.label ?? "图片";
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_IMAGE_SIZE_BYTES;
  const extension = getImageExtension(file.name);

  if (!extensionSet.has(extension) || !mimeTypeSet.has(file.type)) {
    throw new ProductBusinessError(
      BUSINESS_ERROR_CODES.VALIDATION_ERROR,
      `${label}仅支持 jpg / jpeg / png / webp 格式。`,
    );
  }

  if (file.size > maxSizeBytes) {
    throw new ProductBusinessError(
      BUSINESS_ERROR_CODES.VALIDATION_ERROR,
      `${label}大小不能超过 ${formatMaxSize(maxSizeBytes)}。`,
    );
  }

  return {
    extension,
    mimeType: file.type as SupportedImageMimeType,
    originalSizeBytes: file.size,
  };
}

