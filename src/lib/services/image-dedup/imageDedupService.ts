import { readFile, stat } from "node:fs/promises";
import sharp from "sharp";
import type { ImageFingerprint, ImageReviewLog } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUSINESS_ERROR_CODES, ProductBusinessError, formatDateTime } from "@/lib/modules/products";
import { MATERIAL_STATUS } from "@/lib/modules/materials";
import { INSPIRATION_STATUSES } from "@/lib/services/inspirations/inspirationTypes";
import { getUploadsAbsolutePath } from "@/lib/services/file-storage-service";
import { calculateImageHash } from "@/lib/services/images";
import { logWarn, sanitizeLogMessage } from "@/lib/services/logging";
import { createInspirationOperationLog, createOperationLog, tryCreateSettingsOperationLog } from "@/lib/services/operation-log-service";
import {
  getRuntimeModeSummary,
  normalizeProductReadError,
  normalizeProductWriteError,
} from "@/lib/services/product-runtime-service";

export const IMAGE_DEDUP_READONLY_MESSAGE = "预览环境只读，请在 Windows 本地验收图片去重。";

export const IMAGE_DEDUP_TARGET_TYPES = {
  MATERIAL: "material",
  INSPIRATION: "inspiration",
} as const;

export type ImageDedupTargetType = (typeof IMAGE_DEDUP_TARGET_TYPES)[keyof typeof IMAGE_DEDUP_TARGET_TYPES];

const SIMILARITY_THRESHOLD = 0.9;
const HASH_BITS = 64;

type FingerprintRecord = ImageFingerprint;

type ImageTargetRecord = {
  type: ImageDedupTargetType;
  id: number;
  productId: number | null;
  relativePath: string;
  fileHash: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  mimeType: string | null;
  sourceType: string | null;
  usagePermission: string | null;
  status: string | null;
  title: string;
};

export type ImageSimilarityMatchView = {
  reviewLogId: number;
  targetType: ImageDedupTargetType | "risk";
  targetId: number | null;
  title: string;
  href: string | null;
  similarityLabel: string;
  matchTypeLabel: string;
  relationScopeLabel: string;
  riskLevel: "info" | "warning";
  message: string;
  ignored: boolean;
  archiveSuggested: boolean;
  userStatus: string;
  createdAtLabel: string;
};

export type ImageDedupSummaryView = {
  status: "missing" | "ready" | "failed";
  fingerprintId: number | null;
  exactDuplicateCount: number;
  similarCount: number;
  riskCount: number;
  warningLabel: string | null;
  latestCheckedAtLabel: string | null;
  matches: ImageSimilarityMatchView[];
};

type DetectionResult = {
  fingerprint: FingerprintRecord;
  exactCount: number;
  similarCount: number;
  riskCount: number;
};

function assertImageDedupWritable() {
  if (!getRuntimeModeSummary().isWritable) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.PREVIEW_READONLY, IMAGE_DEDUP_READONLY_MESSAGE);
  }
}

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function isImageDedupTargetType(value: string): value is ImageDedupTargetType {
  return value === IMAGE_DEDUP_TARGET_TYPES.MATERIAL || value === IMAGE_DEDUP_TARGET_TYPES.INSPIRATION;
}

function normalizeTargetType(value: string): ImageDedupTargetType {
  if (!isImageDedupTargetType(value)) {
    throw createValidationError("图片类型无效。");
  }

  return value;
}

async function getImageTarget(type: ImageDedupTargetType, id: number): Promise<ImageTargetRecord> {
  if (type === IMAGE_DEDUP_TARGET_TYPES.MATERIAL) {
    const material = await prisma.material.findFirst({
      where: { id, product: { deletedAt: null } },
      select: {
        id: true,
        productId: true,
        filePath: true,
        fileHash: true,
        width: true,
        height: true,
        originalSizeBytes: true,
        mimeType: true,
        sourceType: true,
        usagePermission: true,
        status: true,
        product: { select: { name: true, spu: true } },
      },
    });

    if (!material) {
      throw createValidationError("素材图片不存在。");
    }

    return {
      type,
      id: material.id,
      productId: material.productId,
      relativePath: material.filePath,
      fileHash: material.fileHash,
      width: material.width,
      height: material.height,
      fileSize: material.originalSizeBytes,
      mimeType: material.mimeType,
      sourceType: material.sourceType,
      usagePermission: material.usagePermission,
      status: material.status,
      title: `${material.product.name} / ${material.product.spu}`,
    };
  }

  const inspiration = await prisma.inspiration.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      imagePath: true,
      fileHash: true,
      sourceType: true,
      usagePermission: true,
      status: true,
    },
  });

  if (!inspiration) {
    throw createValidationError("灵感图片不存在。");
  }

  return {
    type,
    id: inspiration.id,
    productId: null,
    relativePath: inspiration.imagePath,
    fileHash: inspiration.fileHash,
    width: null,
    height: null,
    fileSize: null,
    mimeType: null,
    sourceType: inspiration.sourceType,
    usagePermission: inspiration.usagePermission,
    status: inspiration.status,
    title: inspiration.title || `灵感 #${inspiration.id}`,
  };
}

async function readImageFingerprintPayload(relativePath: string) {
  const absolutePath = getUploadsAbsolutePath(relativePath);
  const [buffer, fileStats] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);
  const metadata = await sharp(buffer, { failOn: "none" }).metadata();

  return {
    fileHash: calculateImageHash(buffer),
    perceptualHash: await calculatePerceptualHash(buffer),
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    fileSize: fileStats.size,
    mimeType: metadata.format ? `image/${metadata.format}` : null,
  };
}

async function calculatePerceptualHash(buffer: Buffer) {
  const pixels = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize(8, 8, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer();

  const values = Array.from(pixels);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  let bits = "";

  for (const value of values) {
    bits += value >= average ? "1" : "0";
  }

  let hex = "";
  for (let index = 0; index < bits.length; index += 4) {
    hex += Number.parseInt(bits.slice(index, index + 4), 2).toString(16);
  }

  return hex.padStart(16, "0");
}

function countBits(value: number) {
  let bits = value;
  let count = 0;

  while (bits > 0) {
    count += bits & 1;
    bits >>= 1;
  }

  return count;
}

function calculateSimilarity(left: string | null, right: string | null) {
  if (!left || !right || left.length !== right.length) {
    return null;
  }

  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    const xor = Number.parseInt(left[index] ?? "0", 16) ^ Number.parseInt(right[index] ?? "0", 16);
    distance += countBits(xor);
  }

  return Number((1 - distance / HASH_BITS).toFixed(4));
}

function getCanonicalPair(left: FingerprintRecord, right: FingerprintRecord) {
  const leftKey = `${left.imageType}:${left.imageId}`;
  const rightKey = `${right.imageType}:${right.imageId}`;
  return leftKey <= rightKey ? [left, right] : [right, left];
}

function getRelationScope(left: FingerprintRecord, right: FingerprintRecord) {
  if (left.imageType === IMAGE_DEDUP_TARGET_TYPES.MATERIAL && right.imageType === IMAGE_DEDUP_TARGET_TYPES.MATERIAL) {
    return left.productId && left.productId === right.productId ? "same_product" : "material_library";
  }

  if (left.imageType === IMAGE_DEDUP_TARGET_TYPES.INSPIRATION && right.imageType === IMAGE_DEDUP_TARGET_TYPES.INSPIRATION) {
    return "inspiration_box";
  }

  return "cross_library";
}

function getPairMessage(matchType: "exact_duplicate" | "high_similarity", relationScope: string) {
  if (matchType === "exact_duplicate") {
    return relationScope === "same_product"
      ? "疑似重复：同商品内存在完全相同图片，建议检查是否重复使用。"
      : "疑似重复：库内存在完全相同图片，建议检查是否重复使用。";
  }

  return relationScope === "same_product"
    ? "高度相似：同商品内存在视觉上高度接近的图片，建议重新生成、修改或确认用途差异。"
    : "高度相似：库内存在视觉上高度接近的图片，建议重新生成、修改或确认用途差异。";
}

function hasSourceRisk(target: ImageTargetRecord) {
  return (
    target.usagePermission === "reference_only" ||
    target.usagePermission === "needs_review" ||
    target.sourceType === "unknown" ||
    target.sourceType === "platform_screenshot" ||
    target.sourceType === "competitor_reference"
  );
}

async function upsertSourceRiskLog(target: ImageTargetRecord, fingerprint: FingerprintRecord) {
  if (!hasSourceRisk(target)) {
    return null;
  }

  return prisma.imageReviewLog.upsert({
    where: { dedupeKey: `risk:${fingerprint.id}:source` },
    create: {
      dedupeKey: `risk:${fingerprint.id}:source`,
      sourceFingerprintId: fingerprint.id,
      sourceType: target.type,
      sourceId: target.id,
      relationScope: "source_review",
      matchType: "source_unknown",
      riskLevel: "warning",
      hash: fingerprint.fileHash,
      message: "来源不明或权限待确认，建议谨慎使用并检查是否重复使用。此提示不构成版权结论。",
    },
    update: {
      hash: fingerprint.fileHash,
      message: "来源不明或权限待确认，建议谨慎使用并检查是否重复使用。此提示不构成版权结论。",
      riskLevel: "warning",
    },
  });
}

async function upsertPairLog(input: {
  source: FingerprintRecord;
  matched: FingerprintRecord;
  matchType: "exact_duplicate" | "high_similarity";
  similarity: number;
}) {
  const [left, right] = getCanonicalPair(input.source, input.matched);
  const relationScope = getRelationScope(left, right);
  const dedupeKey = `match:${input.matchType}:${left.id}:${right.id}`;

  return prisma.imageReviewLog.upsert({
    where: { dedupeKey },
    create: {
      dedupeKey,
      sourceFingerprintId: left.id,
      matchedFingerprintId: right.id,
      sourceType: left.imageType,
      sourceId: left.imageId,
      matchedType: right.imageType,
      matchedId: right.imageId,
      relationScope,
      matchType: input.matchType,
      riskLevel: input.matchType === "exact_duplicate" ? "warning" : "info",
      hash: left.fileHash,
      matchedHash: right.fileHash,
      similarity: input.similarity,
      message: getPairMessage(input.matchType, relationScope),
    },
    update: {
      hash: left.fileHash,
      matchedHash: right.fileHash,
      similarity: input.similarity,
      message: getPairMessage(input.matchType, relationScope),
      riskLevel: input.matchType === "exact_duplicate" ? "warning" : "info",
    },
  });
}

async function upsertFailureFingerprint(target: ImageTargetRecord, error: unknown) {
  const summary = sanitizeLogMessage(error).slice(0, 180);

  const fingerprint = await prisma.imageFingerprint.upsert({
    where: { imageType_imageId: { imageType: target.type, imageId: target.id } },
    create: {
      imageType: target.type,
      imageId: target.id,
      productId: target.productId,
      relativePath: target.relativePath,
      fileHash: target.fileHash,
      width: target.width,
      height: target.height,
      fileSize: target.fileSize,
      mimeType: target.mimeType,
      status: "failed",
      errorSummary: summary,
      lastCheckedAt: new Date(),
    },
    update: {
      productId: target.productId,
      relativePath: target.relativePath,
      fileHash: target.fileHash,
      width: target.width,
      height: target.height,
      fileSize: target.fileSize,
      mimeType: target.mimeType,
      status: "failed",
      errorSummary: summary,
      lastCheckedAt: new Date(),
    },
  });

  await prisma.imageReviewLog.create({
    data: {
      sourceFingerprintId: fingerprint.id,
      sourceType: target.type,
      sourceId: target.id,
      relationScope: "fingerprint",
      matchType: "fingerprint_failed",
      riskLevel: "warning",
      hash: target.fileHash,
      message: "图片指纹生成失败，不影响素材库或灵感箱正常使用。",
      userStatus: "open",
    },
  });

  await logWarn(`image dedup fingerprint failed for ${target.type}:${target.id}: ${summary}`);
  return fingerprint;
}

async function upsertReadyFingerprint(target: ImageTargetRecord) {
  const payload = await readImageFingerprintPayload(target.relativePath);

  return prisma.imageFingerprint.upsert({
    where: { imageType_imageId: { imageType: target.type, imageId: target.id } },
    create: {
      imageType: target.type,
      imageId: target.id,
      productId: target.productId,
      relativePath: target.relativePath,
      fileHash: payload.fileHash,
      perceptualHash: payload.perceptualHash,
      width: payload.width ?? target.width,
      height: payload.height ?? target.height,
      fileSize: payload.fileSize ?? target.fileSize,
      mimeType: payload.mimeType ?? target.mimeType,
      status: "ready",
      errorSummary: null,
      lastCheckedAt: new Date(),
    },
    update: {
      productId: target.productId,
      relativePath: target.relativePath,
      fileHash: payload.fileHash,
      perceptualHash: payload.perceptualHash,
      width: payload.width ?? target.width,
      height: payload.height ?? target.height,
      fileSize: payload.fileSize ?? target.fileSize,
      mimeType: payload.mimeType ?? target.mimeType,
      status: "ready",
      errorSummary: null,
      lastCheckedAt: new Date(),
    },
  });
}

async function getComparisonPool(type: ImageDedupTargetType, current: FingerprintRecord) {
  return prisma.imageFingerprint.findMany({
    where: {
      imageType: type,
      id: { not: current.id },
      status: "ready",
    },
  });
}

async function detectMatchesForFingerprint(target: ImageTargetRecord, fingerprint: FingerprintRecord): Promise<DetectionResult> {
  await upsertSourceRiskLog(target, fingerprint);
  const pool = await getComparisonPool(target.type, fingerprint);
  let exactCount = 0;
  let similarCount = 0;

  for (const candidate of pool) {
    if (fingerprint.fileHash && candidate.fileHash && fingerprint.fileHash === candidate.fileHash) {
      await upsertPairLog({
        source: fingerprint,
        matched: candidate,
        matchType: "exact_duplicate",
        similarity: 1,
      });
      exactCount += 1;
      continue;
    }

    const similarity = calculateSimilarity(fingerprint.perceptualHash, candidate.perceptualHash);
    if (similarity !== null && similarity >= SIMILARITY_THRESHOLD) {
      await upsertPairLog({
        source: fingerprint,
        matched: candidate,
        matchType: "high_similarity",
        similarity,
      });
      similarCount += 1;
    }
  }

  return {
    fingerprint,
    exactCount,
    similarCount,
    riskCount: hasSourceRisk(target) ? 1 : 0,
  };
}

async function rebuildOneTarget(type: ImageDedupTargetType, id: number) {
  const target = await getImageTarget(type, id);

  try {
    const fingerprint = await upsertReadyFingerprint(target);
    const result = await detectMatchesForFingerprint(target, fingerprint);

    if (type === IMAGE_DEDUP_TARGET_TYPES.MATERIAL && target.productId) {
      await createOperationLog({
        productId: target.productId,
        action: "IMAGE_DEDUP_CHECK",
        detail: `图片去重检测：materialId=${target.id} / exact=${result.exactCount} / similar=${result.similarCount} / risk=${result.riskCount}`,
      });
    } else if (type === IMAGE_DEDUP_TARGET_TYPES.INSPIRATION) {
      await createInspirationOperationLog({
        inspirationId: target.id,
        action: "IMAGE_DEDUP_CHECK",
        detail: `图片去重检测：inspirationId=${target.id} / exact=${result.exactCount} / similar=${result.similarCount} / risk=${result.riskCount}`,
      });
    }

    return result;
  } catch (error) {
    const fingerprint = await upsertFailureFingerprint(target, error);
    return {
      fingerprint,
      exactCount: 0,
      similarCount: 0,
      riskCount: 1,
    };
  }
}

async function listMaterialTargetIds() {
  const materials = await prisma.material.findMany({
    where: {
      product: { deletedAt: null },
      status: { not: MATERIAL_STATUS.DISCARDED },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  return materials.map((item) => item.id);
}

async function listInspirationTargetIds() {
  const inspirations = await prisma.inspiration.findMany({
    where: {
      status: { notIn: [INSPIRATION_STATUSES.ARCHIVED, INSPIRATION_STATUSES.REJECTED] },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  return inspirations.map((item) => item.id);
}

export async function rebuildImageFingerprint(input: { type: string; id: number }) {
  try {
    assertImageDedupWritable();
    const type = normalizeTargetType(input.type);
    if (!Number.isInteger(input.id) || input.id <= 0) {
      throw createValidationError("图片 ID 无效。");
    }

    return rebuildOneTarget(type, input.id);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function rebuildImageFingerprintsForLibrary(typeInput: string) {
  try {
    assertImageDedupWritable();
    const type = normalizeTargetType(typeInput);
    const ids = type === IMAGE_DEDUP_TARGET_TYPES.MATERIAL ? await listMaterialTargetIds() : await listInspirationTargetIds();
    let exactCount = 0;
    let similarCount = 0;
    let riskCount = 0;
    let failedCount = 0;

    for (const id of ids) {
      const result = await rebuildOneTarget(type, id);
      exactCount += result.exactCount;
      similarCount += result.similarCount;
      riskCount += result.riskCount;
      if (result.fingerprint.status === "failed") {
        failedCount += 1;
      }
    }

    await tryCreateSettingsOperationLog({
      action: "IMAGE_DEDUP_LIBRARY_CHECK",
      detail: `图片去重补建：type=${type} / total=${ids.length} / exact=${exactCount} / similar=${similarCount} / risk=${riskCount} / failed=${failedCount}`,
    });

    return {
      total: ids.length,
      exactCount,
      similarCount,
      riskCount,
      failedCount,
    };
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

function getMatchTypeLabel(matchType: string) {
  if (matchType === "exact_duplicate") return "疑似重复";
  if (matchType === "high_similarity") return "高度相似";
  if (matchType === "source_unknown") return "来源风险";
  if (matchType === "fingerprint_failed") return "检测失败";
  return matchType;
}

function getRelationScopeLabel(scope: string) {
  if (scope === "same_product") return "同商品内";
  if (scope === "material_library") return "全素材库";
  if (scope === "inspiration_box") return "灵感箱";
  if (scope === "source_review") return "来源提示";
  if (scope === "fingerprint") return "指纹生成";
  return "图片库";
}

function buildTargetHref(type: string | null, id: number | null) {
  if (!type || !id) return null;
  if (type === IMAGE_DEDUP_TARGET_TYPES.MATERIAL) return `/materials?materialId=${id}`;
  if (type === IMAGE_DEDUP_TARGET_TYPES.INSPIRATION) return `/inspirations?selectedId=${id}`;
  return null;
}

async function getTargetTitles(keys: Array<{ type: string; id: number }>) {
  const materialIds = keys.filter((item) => item.type === IMAGE_DEDUP_TARGET_TYPES.MATERIAL).map((item) => item.id);
  const inspirationIds = keys.filter((item) => item.type === IMAGE_DEDUP_TARGET_TYPES.INSPIRATION).map((item) => item.id);
  const [materials, inspirations] = await Promise.all([
    materialIds.length > 0
      ? prisma.material.findMany({
          where: { id: { in: materialIds } },
          select: { id: true, product: { select: { name: true, spu: true } } },
        })
      : Promise.resolve([]),
    inspirationIds.length > 0
      ? prisma.inspiration.findMany({
          where: { id: { in: inspirationIds } },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
  ]);

  const titles = new Map<string, string>();
  for (const material of materials) {
    titles.set(`${IMAGE_DEDUP_TARGET_TYPES.MATERIAL}:${material.id}`, `${material.product.name} / ${material.product.spu}`);
  }
  for (const inspiration of inspirations) {
    titles.set(`${IMAGE_DEDUP_TARGET_TYPES.INSPIRATION}:${inspiration.id}`, inspiration.title || `灵感 #${inspiration.id}`);
  }
  return titles;
}

function createEmptySummary(): ImageDedupSummaryView {
  return {
    status: "missing",
    fingerprintId: null,
    exactDuplicateCount: 0,
    similarCount: 0,
    riskCount: 0,
    warningLabel: null,
    latestCheckedAtLabel: null,
    matches: [],
  };
}

async function mapLogsToMatches(input: {
  fingerprint: FingerprintRecord;
  logs: ImageReviewLog[];
}) {
  const targetKeys = input.logs.flatMap((log) => {
    const keys: Array<{ type: string; id: number }> = [];
    if (log.sourceFingerprintId !== input.fingerprint.id) {
      keys.push({ type: log.sourceType, id: log.sourceId });
    }
    if (log.matchedFingerprintId && log.matchedFingerprintId !== input.fingerprint.id && log.matchedType && log.matchedId) {
      keys.push({ type: log.matchedType, id: log.matchedId });
    }
    return keys;
  });
  const titles = await getTargetTitles(targetKeys);

  return input.logs.map((log): ImageSimilarityMatchView => {
    const isSource = log.sourceFingerprintId === input.fingerprint.id;
    const targetType = isSource ? log.matchedType : log.sourceType;
    const targetId = isSource ? log.matchedId : log.sourceId;
    const targetKey = targetType && targetId ? `${targetType}:${targetId}` : "";
    const similarityLabel = typeof log.similarity === "number" ? `${Math.round(log.similarity * 100)}%` : "--";

    return {
      reviewLogId: log.id,
      targetType: targetType && isImageDedupTargetType(targetType) ? targetType : "risk",
      targetId: targetId ?? null,
      title: titles.get(targetKey) ?? (targetId ? `${targetType} #${targetId}` : "原创性风险提示"),
      href: buildTargetHref(targetType, targetId ?? null),
      similarityLabel,
      matchTypeLabel: getMatchTypeLabel(log.matchType),
      relationScopeLabel: getRelationScopeLabel(log.relationScope),
      riskLevel: log.riskLevel === "warning" ? "warning" : "info",
      message: log.message ?? "建议检查是否重复使用。",
      ignored: log.ignored,
      archiveSuggested: log.archiveSuggested,
      userStatus: log.userStatus,
      createdAtLabel: formatDateTime(log.createdAt),
    };
  });
}

async function buildSummaryForFingerprint(fingerprint: FingerprintRecord): Promise<ImageDedupSummaryView> {
  const logs = await prisma.imageReviewLog.findMany({
    where: {
      ignored: false,
      OR: [{ sourceFingerprintId: fingerprint.id }, { matchedFingerprintId: fingerprint.id }],
    },
    orderBy: [{ riskLevel: "desc" }, { similarity: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  const matches = await mapLogsToMatches({ fingerprint, logs });
  const exactDuplicateCount = logs.filter((log) => log.matchType === "exact_duplicate").length;
  const similarCount = logs.filter((log) => log.matchType === "high_similarity").length;
  const riskCount = logs.filter((log) => log.matchType === "source_unknown" || log.matchType === "fingerprint_failed").length;
  const warningLabel =
    fingerprint.status === "failed"
      ? "检测失败"
      : exactDuplicateCount > 0
        ? `疑似重复 ${exactDuplicateCount}`
        : similarCount > 0
          ? `高度相似 ${similarCount}`
          : riskCount > 0
            ? "来源需谨慎"
            : null;

  return {
    status: fingerprint.status === "failed" ? "failed" : "ready",
    fingerprintId: fingerprint.id,
    exactDuplicateCount,
    similarCount,
    riskCount,
    warningLabel,
    latestCheckedAtLabel: formatDateTime(fingerprint.lastCheckedAt),
    matches,
  };
}

export async function getImageDedupSummary(typeInput: string, imageId: number): Promise<ImageDedupSummaryView> {
  try {
    const type = normalizeTargetType(typeInput);
    const fingerprint = await prisma.imageFingerprint.findUnique({
      where: { imageType_imageId: { imageType: type, imageId } },
    });

    if (!fingerprint) {
      return createEmptySummary();
    }

    return buildSummaryForFingerprint(fingerprint);
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getImageDedupSummariesForTargets(typeInput: string, imageIds: number[]) {
  try {
    const type = normalizeTargetType(typeInput);
    const uniqueIds = Array.from(new Set(imageIds.filter((id) => Number.isInteger(id) && id > 0)));
    if (uniqueIds.length === 0) {
      return new Map<number, ImageDedupSummaryView>();
    }

    const fingerprints = await prisma.imageFingerprint.findMany({
      where: { imageType: type, imageId: { in: uniqueIds } },
    });

    const entries = await Promise.all(fingerprints.map(async (fingerprint) => [fingerprint.imageId, await buildSummaryForFingerprint(fingerprint)] as const));
    return new Map<number, ImageDedupSummaryView>(entries);
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function ignoreImageReviewLog(reviewLogId: number) {
  try {
    assertImageDedupWritable();
    if (!Number.isInteger(reviewLogId) || reviewLogId <= 0) {
      throw createValidationError("审阅记录 ID 无效。");
    }

    const log = await prisma.imageReviewLog.update({
      where: { id: reviewLogId },
      data: {
        ignored: true,
        userStatus: "ignored",
      },
    });

    await tryRecordReviewLogAction(log, "IMAGE_DEDUP_IGNORE", "用户手动忽略图片重复/风险提示。");
    return log;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function markImageReviewLogArchiveSuggested(reviewLogId: number) {
  try {
    assertImageDedupWritable();
    if (!Number.isInteger(reviewLogId) || reviewLogId <= 0) {
      throw createValidationError("审阅记录 ID 无效。");
    }

    const log = await prisma.imageReviewLog.update({
      where: { id: reviewLogId },
      data: {
        archiveSuggested: true,
        userStatus: "archive_suggested",
      },
    });

    await tryRecordReviewLogAction(log, "IMAGE_DEDUP_ARCHIVE_SUGGESTED", "用户标记为建议归档，实际归档仍需手动操作。");
    return log;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

async function tryRecordReviewLogAction(log: ImageReviewLog, action: string, detail: string) {
  try {
    if (log.sourceType === IMAGE_DEDUP_TARGET_TYPES.MATERIAL) {
      const material = await prisma.material.findUnique({
        where: { id: log.sourceId },
        select: { productId: true },
      });

      if (material) {
        await createOperationLog({
          productId: material.productId,
          action,
          detail: `${detail} reviewLogId=${log.id} / imageType=material / imageId=${log.sourceId}`,
        });
      }
      return;
    }

    if (log.sourceType === IMAGE_DEDUP_TARGET_TYPES.INSPIRATION) {
      await createInspirationOperationLog({
        inspirationId: log.sourceId,
        action,
        detail: `${detail} reviewLogId=${log.id} / imageType=inspiration / imageId=${log.sourceId}`,
      });
    }
  } catch {
    // Review-state writes should not fail because an auxiliary operation log failed.
  }
}
