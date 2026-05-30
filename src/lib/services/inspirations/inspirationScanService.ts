import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products";
import { readImageDimensionsFromBuffer } from "@/lib/services/image-metadata-service";
import { sanitizeDiagnosticText } from "@/lib/services/diagnostics/diagnosticsSanitizer";
import {
  calculateImageHash,
  generateImageThumbnail,
  getUploadsAbsolutePath,
  SUPPORTED_IMAGE_EXTENSIONS,
  type SupportedImageMimeType,
} from "@/lib/services/images";
import { logWarn } from "@/lib/services/logging";
import { assertPathLength, createShortFileName, toSafeRelativePath } from "@/lib/services/local-paths/pathSafetyService";
import { getInspirationFolderPath, maskInspirationFolderPath, validateInspirationFolderPath } from "@/lib/services/inspirations/inspirationSettingsService";
import {
  INSPIRATION_SCAN_STATUSES,
  INSPIRATION_SCAN_TYPES,
  INSPIRATION_SOURCE_TYPES,
  INSPIRATION_STATUSES,
  INSPIRATION_USAGE_PERMISSIONS,
} from "@/lib/services/inspirations/inspirationTypes";
import { recordScanLog } from "@/lib/services/inspirations/scanLogService";
import { ensureProductWritesAllowed, normalizeProductWriteError } from "@/lib/services/product-runtime-service";

const extensionToMimeType: Record<string, SupportedImageMimeType> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const supportedExtensionSet = new Set<string>(SUPPORTED_IMAGE_EXTENSIONS);
const MAX_INSPIRATION_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function makeInspirationTitle(fileName: string) {
  const raw = path.basename(fileName, path.extname(fileName));
  const normalized = raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized ? normalized.slice(0, 120) : null;
}

function summarizeFileFailure(fileName: string, error: unknown) {
  const safeName = path.basename(fileName);
  const detail =
    error instanceof Error && error.message.trim()
      ? error.message.split(/\r?\n/)[0] ?? "导入失败"
      : "导入失败";
  return sanitizeDiagnosticText(`${safeName}: ${detail}`).slice(0, 180);
}

function buildInspirationRelativePath(extension: string) {
  const fileName = createShortFileName({
    prefix: "inspiration",
    extension,
  });
  return toSafeRelativePath("uploads", "inspirations", "original", fileName);
}

async function saveInspirationBuffer(relativePath: string, buffer: Buffer) {
  const absolutePath = getUploadsAbsolutePath(relativePath);
  assertPathLength(absolutePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
}

async function storeInspirationImage(buffer: Buffer, extension: string, mimeType: SupportedImageMimeType) {
  const relativePath = buildInspirationRelativePath(extension);
  await saveInspirationBuffer(relativePath, buffer);

  let thumbnailPath: string | null = null;
  try {
    const thumbnail = await generateImageThumbnail({
      sourceBuffer: buffer,
      originalRelativePath: relativePath,
      mimeType,
    });
    thumbnailPath = thumbnail.thumbnailPath;
  } catch (error) {
    await logWarn(
      `inspiration thumbnail generation failed for ${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return {
    imagePath: relativePath,
    thumbnailPath,
  };
}

export async function runManualInspirationScan() {
  ensureProductWritesAllowed();

  const startedAt = new Date();
  const folderPath = await getInspirationFolderPath();

  if (!folderPath) {
    throw createValidationError("请先设置灵感文件夹路径。");
  }

  const safeFolderSummary = maskInspirationFolderPath(folderPath) ?? "未设置";

  try {
    const normalizedFolderPath = await validateInspirationFolderPath(folderPath);
    const entries = await readdir(normalizedFolderPath, { withFileTypes: true });
    const imageFiles = entries
      .filter((entry) => entry.isFile())
      .filter((entry) => supportedExtensionSet.has(path.extname(entry.name).toLowerCase()));

    let newFiles = 0;
    let skippedDuplicates = 0;
    let failedFiles = 0;
    const failureSummaries: string[] = [];

    for (const entry of imageFiles) {
      const filePath = path.join(normalizedFolderPath, entry.name);
      const extension = path.extname(entry.name).toLowerCase();
      const mimeType = extensionToMimeType[extension];

      try {
        if (!mimeType) {
          continue;
        }

        const metadata = await stat(filePath);
        if (metadata.size > MAX_INSPIRATION_IMAGE_SIZE_BYTES) {
          throw createValidationError("图片大小不能超过 10MB。");
        }

        const buffer = await readFile(filePath);
        const fileHash = calculateImageHash(buffer);
        const existing = await prisma.inspiration.findUnique({
          where: { fileHash },
          select: { id: true },
        });

        if (existing) {
          skippedDuplicates += 1;
          continue;
        }

        const storedImage = await storeInspirationImage(buffer, extension, mimeType);
        const dimensions = readImageDimensionsFromBuffer(buffer);

        await prisma.inspiration.create({
          data: {
            title: makeInspirationTitle(entry.name),
            note: null,
            imagePath: storedImage.imagePath,
            thumbnailPath: storedImage.thumbnailPath,
            fileHash,
            sourceType: INSPIRATION_SOURCE_TYPES.FOLDER_MANUAL_SCAN,
            usagePermission: INSPIRATION_USAGE_PERMISSIONS.REFERENCE_ONLY,
            status: INSPIRATION_STATUSES.PENDING_REVIEW,
            importedAt: new Date(),
          },
        });

        if (dimensions.width === null || dimensions.height === null) {
          await logWarn(`inspiration dimensions missing for ${storedImage.imagePath}`);
        }

        newFiles += 1;
      } catch (error) {
        failedFiles += 1;
        failureSummaries.push(summarizeFileFailure(entry.name, error));
      }
    }

    const finishedAt = new Date();
    const status =
      failedFiles === 0
        ? INSPIRATION_SCAN_STATUSES.SUCCESS
        : newFiles > 0 || skippedDuplicates > 0
          ? INSPIRATION_SCAN_STATUSES.PARTIAL_FAILED
          : INSPIRATION_SCAN_STATUSES.FAILED;

    const scanLog = await recordScanLog({
      scanType: INSPIRATION_SCAN_TYPES.MANUAL,
      folderSummary: safeFolderSummary,
      totalFiles: imageFiles.length,
      newFiles,
      skippedDuplicates,
      failedFiles,
      status,
      errorSummary: failureSummaries.length > 0 ? failureSummaries.slice(0, 5).join(" | ") : null,
      startedAt,
      finishedAt,
    });

    return {
      scanLog,
      totalFiles: imageFiles.length,
      newFiles,
      skippedDuplicates,
      failedFiles,
      failedSummaries: failureSummaries,
    };
  } catch (error) {
    const finishedAt = new Date();
    await recordScanLog({
      scanType: INSPIRATION_SCAN_TYPES.MANUAL,
      folderSummary: safeFolderSummary,
      totalFiles: 0,
      newFiles: 0,
      skippedDuplicates: 0,
      failedFiles: 1,
      status: INSPIRATION_SCAN_STATUSES.FAILED,
      errorSummary: summarizeFileFailure("scan", error),
      startedAt,
      finishedAt,
    });

    throw normalizeProductWriteError(error);
  }
}
