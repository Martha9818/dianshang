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
import {
  getInspirationFolderPath,
  getInspirationScanConfig,
  maskInspirationFolderPath,
  validateInspirationFolderPath,
} from "@/lib/services/inspirations/inspirationSettingsService";
import {
  INSPIRATION_SCAN_STATUSES,
  INSPIRATION_SCAN_TYPES,
  INSPIRATION_SOURCE_TYPES,
  INSPIRATION_STATUSES,
  INSPIRATION_TASK_STATUSES,
  INSPIRATION_USAGE_PERMISSIONS,
} from "@/lib/services/inspirations/inspirationTypes";
import { generateAutomaticInspirationAiDraft } from "@/lib/services/inspirations/inspirationAiService";
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

let scheduledScanInFlight = false;

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

function getSourceType(scanType: string) {
  return scanType === INSPIRATION_SCAN_TYPES.SCHEDULED
    ? INSPIRATION_SOURCE_TYPES.FOLDER_SCHEDULED_SCAN
    : INSPIRATION_SOURCE_TYPES.FOLDER_MANUAL_SCAN;
}

async function createScanJob(sourceRelativePath: string, retryCount = 0) {
  return prisma.inspirationScanJob.create({
    data: {
      sourceRelativePath,
      status: INSPIRATION_TASK_STATUSES.PROCESSING,
      startedAt: new Date(),
      retryCount,
      needsUserConfirmation: true,
    },
  });
}

async function updateScanJobFailed(scanJobId: number, sourceFileHash: string | null, failureReasonSummary: string) {
  await prisma.inspirationScanJob.update({
    where: { id: scanJobId },
    data: {
      sourceFileHash,
      status: INSPIRATION_TASK_STATUSES.FAILED,
      failureReasonSummary,
      finishedAt: new Date(),
    },
  });
}

async function tryGenerateAiDraft(inspirationId: number) {
  try {
    await generateAutomaticInspirationAiDraft(inspirationId);
    return { generated: true, failed: false };
  } catch (error) {
    await logWarn(`inspiration auto AI draft failed inspiration=${inspirationId}: ${error instanceof Error ? error.message : String(error)}`);
    return { generated: false, failed: true };
  }
}

async function processImageFile(input: {
  folderPath: string;
  fileName: string;
  scanType: string;
  retryCount?: number;
  existingScanJobId?: number;
}) {
  const safeSourceRelativePath = sanitizeDiagnosticText(path.basename(input.fileName)).slice(0, 180) || "inspiration-file";
  const extension = path.extname(input.fileName).toLowerCase();
  const mimeType = extensionToMimeType[extension];
  const scanJob =
    input.existingScanJobId !== undefined
      ? await prisma.inspirationScanJob.update({
          where: { id: input.existingScanJobId },
          data: {
            status: INSPIRATION_TASK_STATUSES.PROCESSING,
            startedAt: new Date(),
            finishedAt: null,
            failureReasonSummary: null,
            retryCount: { increment: 1 },
          },
        })
      : await createScanJob(safeSourceRelativePath, input.retryCount ?? 0);

  let fileHash: string | null = null;

  try {
    if (!mimeType || !supportedExtensionSet.has(extension)) {
      throw createValidationError("仅支持 jpg / jpeg / png / webp 图片格式。");
    }

    const filePath = path.join(input.folderPath, path.basename(input.fileName));
    const metadata = await stat(filePath);
    if (!metadata.isFile()) {
      throw createValidationError("当前路径不是文件。");
    }

    if (metadata.size > MAX_INSPIRATION_IMAGE_SIZE_BYTES) {
      throw createValidationError("图片大小不能超过 10MB。");
    }

    const buffer = await readFile(filePath);
    fileHash = calculateImageHash(buffer);
    const existing = await prisma.inspiration.findUnique({
      where: { fileHash },
      select: { id: true, aiSuggestionJson: true },
    });

    if (existing) {
      await prisma.inspirationScanJob.update({
        where: { id: scanJob.id },
        data: {
          inspirationId: existing.id,
          sourceFileHash: fileHash,
          status: INSPIRATION_TASK_STATUSES.SKIPPED,
          aiDraftGenerated: Boolean(existing.aiSuggestionJson),
          finishedAt: new Date(),
        },
      });

      return {
        scanJobId: scanJob.id,
        status: INSPIRATION_TASK_STATUSES.SKIPPED,
        inspirationId: existing.id,
        aiDraftGenerated: Boolean(existing.aiSuggestionJson),
        aiDraftFailed: false,
      };
    }

    const storedImage = await storeInspirationImage(buffer, extension, mimeType);
    const dimensions = readImageDimensionsFromBuffer(buffer);
    const inspiration = await prisma.inspiration.create({
      data: {
        title: makeInspirationTitle(input.fileName),
        note: null,
        imagePath: storedImage.imagePath,
        thumbnailPath: storedImage.thumbnailPath,
        fileHash,
        sourceType: getSourceType(input.scanType),
        usagePermission: INSPIRATION_USAGE_PERMISSIONS.REFERENCE_ONLY,
        status: INSPIRATION_STATUSES.PENDING,
        importedAt: new Date(),
      },
      select: { id: true },
    });

    if (dimensions.width === null || dimensions.height === null) {
      await logWarn(`inspiration dimensions missing for ${storedImage.imagePath}`);
    }

    const aiDraft = await tryGenerateAiDraft(inspiration.id);
    await prisma.inspirationScanJob.update({
      where: { id: scanJob.id },
      data: {
        inspirationId: inspiration.id,
        sourceFileHash: fileHash,
        status: INSPIRATION_TASK_STATUSES.SUCCESS,
        aiDraftGenerated: aiDraft.generated,
        finishedAt: new Date(),
      },
    });

    return {
      scanJobId: scanJob.id,
      status: INSPIRATION_TASK_STATUSES.SUCCESS,
      inspirationId: inspiration.id,
      aiDraftGenerated: aiDraft.generated,
      aiDraftFailed: aiDraft.failed,
    };
  } catch (error) {
    const failureSummary = summarizeFileFailure(input.fileName, error);
    await updateScanJobFailed(scanJob.id, fileHash, failureSummary);
    throw error;
  }
}

async function runInspirationScan(scanType: string) {
  ensureProductWritesAllowed();

  const startedAt = new Date();
  const folderPath = await getInspirationFolderPath();

  if (!folderPath) {
    throw createValidationError("请先设置灵感文件夹路径。");
  }

  const safeFolderSummary = maskInspirationFolderPath(folderPath) ?? "未设置";
  const scanJobIds: number[] = [];

  try {
    const normalizedFolderPath = await validateInspirationFolderPath(folderPath);
    const entries = await readdir(normalizedFolderPath, { withFileTypes: true });
    const imageFiles = entries
      .filter((entry) => entry.isFile())
      .filter((entry) => supportedExtensionSet.has(path.extname(entry.name).toLowerCase()));

    let newFiles = 0;
    let skippedDuplicates = 0;
    let failedFiles = 0;
    let aiDraftGenerated = 0;
    let aiDraftFailed = 0;
    const failureSummaries: string[] = [];

    for (const entry of imageFiles) {
      try {
        const result = await processImageFile({
          folderPath: normalizedFolderPath,
          fileName: entry.name,
          scanType,
        });
        scanJobIds.push(result.scanJobId);

        if (result.status === INSPIRATION_TASK_STATUSES.SKIPPED) {
          skippedDuplicates += 1;
        } else if (result.status === INSPIRATION_TASK_STATUSES.SUCCESS) {
          newFiles += 1;
        }

        if (result.aiDraftGenerated) {
          aiDraftGenerated += 1;
        }

        if (result.aiDraftFailed) {
          aiDraftFailed += 1;
        }
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
    const aiSummary = `AI 草稿成功 ${aiDraftGenerated}，失败 ${aiDraftFailed}`;
    const errorSummary = [
      failureSummaries.length > 0 ? failureSummaries.slice(0, 5).join(" | ") : null,
      aiDraftFailed > 0 ? aiSummary : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const scanLog = await recordScanLog({
      scanType,
      folderSummary: `${safeFolderSummary} / ${aiSummary}`,
      totalFiles: imageFiles.length,
      newFiles,
      skippedDuplicates,
      failedFiles,
      status,
      errorSummary: errorSummary || null,
      startedAt,
      finishedAt,
    });

    if (scanJobIds.length > 0) {
      await prisma.inspirationScanJob.updateMany({
        where: { id: { in: scanJobIds } },
        data: { scanLogId: scanLog.id },
      });
    }

    return {
      scanLog,
      totalFiles: imageFiles.length,
      newFiles,
      skippedDuplicates,
      failedFiles,
      aiDraftGenerated,
      aiDraftFailed,
      failedSummaries: failureSummaries,
    };
  } catch (error) {
    const finishedAt = new Date();
    await recordScanLog({
      scanType,
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

export async function runManualInspirationScan() {
  return runInspirationScan(INSPIRATION_SCAN_TYPES.MANUAL);
}

export async function runScheduledInspirationScanIfDue() {
  ensureProductWritesAllowed();

  if (scheduledScanInFlight) {
    return { skipped: true as const, reason: "scheduled_scan_in_flight" };
  }

  const config = await getInspirationScanConfig();
  if (!config.enabled) {
    return { skipped: true as const, reason: "scheduled_scan_disabled" };
  }

  const latestScheduledScan = await prisma.scanLog.findFirst({
    where: { scanType: INSPIRATION_SCAN_TYPES.SCHEDULED },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true },
  });
  const intervalMs = config.intervalMinutes * 60 * 1000;
  if (latestScheduledScan && Date.now() - latestScheduledScan.startedAt.getTime() < intervalMs) {
    return { skipped: true as const, reason: "scheduled_scan_not_due" };
  }

  scheduledScanInFlight = true;
  try {
    return {
      skipped: false as const,
      result: await runInspirationScan(INSPIRATION_SCAN_TYPES.SCHEDULED),
    };
  } finally {
    scheduledScanInFlight = false;
  }
}

export async function retryFailedInspirationScanJob(scanJobId: number) {
  ensureProductWritesAllowed();

  try {
    const sourceJob = await prisma.inspirationScanJob.findUnique({
      where: { id: scanJobId },
      select: {
        id: true,
        sourceRelativePath: true,
        status: true,
        retryCount: true,
      },
    });

    if (!sourceJob) {
      throw createValidationError("扫描任务不存在。");
    }

    if (sourceJob.status !== INSPIRATION_TASK_STATUSES.FAILED) {
      throw createValidationError("只有失败的扫描任务可以手动重试。");
    }

    const folderPath = await getInspirationFolderPath();
    if (!folderPath) {
      throw createValidationError("请先设置灵感文件夹路径。");
    }

    const normalizedFolderPath = await validateInspirationFolderPath(folderPath);
    const result = await processImageFile({
      folderPath: normalizedFolderPath,
      fileName: path.basename(sourceJob.sourceRelativePath),
      scanType: INSPIRATION_SCAN_TYPES.MANUAL,
      existingScanJobId: sourceJob.id,
      retryCount: sourceJob.retryCount + 1,
    });

    return result;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}
