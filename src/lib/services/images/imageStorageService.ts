import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readImageDimensionsFromBuffer } from "@/lib/services/image-metadata-service";
import { getLocalDirectoryPath } from "@/lib/services/local-paths";
import { assertPathLength, createShortFileName, toSafeRelativePath } from "@/lib/services/local-paths/pathSafetyService";
import { logWarn } from "@/lib/services/logging";
import { assertLocalWritable } from "@/lib/services/runtime";
import { calculateImageHash } from "./imageHashService";
import { assertSupportedImageFile } from "./imageValidationService";
import type { StoredImageResult } from "./imageTypes";
import { generateImageThumbnail } from "./thumbnailService";

function sanitizeSegment(value: string, fallback: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || fallback;
}

export function getUploadsAbsolutePath(relativePath: string) {
  const normalized = relativePath.replaceAll("\\", "/").replace(/^uploads\//, "");
  const uploadsRoot = getLocalDirectoryPath("uploads");
  const resolvedPath = path.resolve(uploadsRoot, normalized);

  if (resolvedPath !== uploadsRoot && !resolvedPath.startsWith(`${uploadsRoot}${path.sep}`)) {
    throw new Error("文件路径无效，请重新选择文件。");
  }

  return resolvedPath;
}

export function buildProductImageRelativePath(productId: number, fileName: string) {
  return toSafeRelativePath("uploads", "products", String(productId), "original", fileName);
}

export function buildCompetitorScreenshotRelativePath(productId: number, extension: string) {
  const fileName = createShortFileName({ prefix: "competitor", extension });
  return toSafeRelativePath("uploads", "products", String(productId), "competitors", fileName);
}

export function buildMaterialImageRelativePath(input: {
  productId: number;
  platform: string;
  imageType: string;
  version: string;
  extension: string;
}) {
  const fileName = createShortFileName({
    prefix: sanitizeSegment(input.version, "material"),
    extension: input.extension,
  });

  return toSafeRelativePath(
    "uploads",
    "products",
    String(input.productId),
    "materials",
    sanitizeSegment(input.platform, "general"),
    sanitizeSegment(input.imageType, "original"),
    fileName,
  );
}

async function saveImageBuffer(relativePath: string, buffer: Buffer) {
  const absolutePath = getUploadsAbsolutePath(relativePath);
  assertPathLength(absolutePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
}

export async function storeImageFile(input: {
  file: File;
  label?: string;
  relativePath: string;
  generateThumbnail?: boolean;
}): Promise<StoredImageResult> {
  assertLocalWritable();
  const validation = assertSupportedImageFile(input.file, { label: input.label });
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const dimensions = readImageDimensionsFromBuffer(buffer);
  const fileHash = calculateImageHash(buffer);
  const warnings: string[] = [];

  await saveImageBuffer(input.relativePath, buffer);

  let thumbnailPath: string | null = null;
  let thumbnailSizeBytes: number | null = null;

  if (input.generateThumbnail ?? true) {
    try {
      const thumbnail = await generateImageThumbnail({
        sourceBuffer: buffer,
        originalRelativePath: input.relativePath,
        mimeType: validation.mimeType,
      });
      thumbnailPath = thumbnail.thumbnailPath;
      thumbnailSizeBytes = thumbnail.thumbnailSizeBytes;
    } catch (error) {
      warnings.push("缩略图生成失败，已保留原图并降级展示原图。");
      await logWarn(`thumbnail generation failed for ${input.relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    filePath: input.relativePath,
    thumbnailPath,
    thumbnailSizeBytes,
    fileHash,
    originalSizeBytes: validation.originalSizeBytes,
    mimeType: validation.mimeType,
    width: dimensions.width,
    height: dimensions.height,
    warnings,
  };
}

export async function saveProductMainImage(productId: number, file: File) {
  const extension = assertSupportedImageFile(file, { label: "商品主图" }).extension;
  const fileName = createShortFileName({ prefix: "main", extension });
  const relativePath = buildProductImageRelativePath(productId, fileName);
  const result = await storeImageFile({ file, label: "商品主图", relativePath });
  return result.filePath;
}

export async function saveCompetitorScreenshot(productId: number, file: File) {
  const extension = assertSupportedImageFile(file, { label: "竞品截图" }).extension;
  const relativePath = buildCompetitorScreenshotRelativePath(productId, extension);
  const result = await storeImageFile({ file, label: "竞品截图", relativePath });
  return result.filePath;
}

export async function saveMaterialImage(input: {
  productId: number;
  platform: string;
  imageType: string;
  version: string;
  file: File;
}) {
  const extension = assertSupportedImageFile(input.file, { label: "素材图片" }).extension;
  const relativePath = buildMaterialImageRelativePath({
    productId: input.productId,
    platform: input.platform,
    imageType: input.imageType,
    version: input.version,
    extension,
  });

  return storeImageFile({
    file: input.file,
    label: "素材图片",
    relativePath,
  });
}

