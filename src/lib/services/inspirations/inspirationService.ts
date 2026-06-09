import { access } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildInspirationConversionDefaults } from "@/lib/modules/inspirations/conversion";
import { buildSpu, BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products";
import { formatDateTime, stringifyJsonStringArray } from "@/lib/modules/products";
import { getUploadsAbsolutePath } from "@/lib/services/file-storage-service";
import { getImageDedupSummariesForTargets } from "@/lib/services/image-dedup";
import { getInspirationFolderSettingView } from "@/lib/services/inspirations/inspirationSettingsService";
import { getLatestScanSummary, getRecentInspirationTaskSummaries, getRecentScanLogs } from "@/lib/services/inspirations/scanLogService";
import {
  INSPIRATION_STATUSES,
  LEGACY_INSPIRATION_STATUSES,
  INSPIRATION_SOURCE_TYPES,
  normalizeInspirationSuggestion,
  type InspirationAISuggestion,
} from "@/lib/services/inspirations/inspirationTypes";
import {
  ensureProductWritesAllowed,
  getRuntimeModeSummary,
  normalizeProductReadError,
  normalizeProductWriteError,
} from "@/lib/services/product-runtime-service";
import { notifyInspirationConverted } from "@/lib/services/notificationService";
import {
  getSortDirection,
  normalizeInspirationListQuery,
  type InspirationListQuery,
} from "@/lib/services/query-service";

const inspirationSelect = {
  id: true,
  title: true,
  note: true,
  imagePath: true,
  thumbnailPath: true,
  fileHash: true,
  sourceType: true,
  usagePermission: true,
  status: true,
  aiSuggestionJson: true,
  aiJobId: true,
  convertedProductId: true,
  reviewedAt: true,
  archivedAt: true,
  rejectedReason: true,
  importedAt: true,
  createdAt: true,
  updatedAt: true,
  aiJob: {
    select: {
      id: true,
      jobType: true,
      status: true,
      errorSummary: true,
      resultSummary: true,
      createdAt: true,
      finishedAt: true,
    },
  },
  convertedProduct: {
    select: {
      id: true,
      name: true,
      spu: true,
      deletedAt: true,
    },
  },
  operationLogs: {
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      action: true,
      detail: true,
      createdAt: true,
    },
  },
  aiDraftJobs: {
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      status: true,
      failureReasonSummary: true,
      rawResponseSummary: true,
      needsUserConfirmation: true,
      retryCount: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.InspirationSelect;

type InspirationRecord = Prisma.InspirationGetPayload<{ select: typeof inspirationSelect }>;

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function createNotFoundError() {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "灵感记录不存在。");
}

function getStatusTone(status: string) {
  if (status === INSPIRATION_STATUSES.PENDING || status === LEGACY_INSPIRATION_STATUSES.PENDING_REVIEW) return "amber" as const;
  if (status === INSPIRATION_STATUSES.REVIEWED) return "blue" as const;
  if (status === INSPIRATION_STATUSES.CONVERTED) return "green" as const;
  if (status === INSPIRATION_STATUSES.ARCHIVED) return "slate" as const;
  if (status === INSPIRATION_STATUSES.REJECTED || status === LEGACY_INSPIRATION_STATUSES.IGNORED) return "red" as const;
  return "slate" as const;
}

function getUsagePermissionTone(permission: string) {
  if (permission === "reference_only") return "amber" as const;
  if (permission === "needs_review") return "violet" as const;
  return "green" as const;
}

function mapStatusLabel(status: string) {
  if (status === INSPIRATION_STATUSES.PENDING || status === LEGACY_INSPIRATION_STATUSES.PENDING_REVIEW) return "待处理";
  if (status === INSPIRATION_STATUSES.REVIEWED) return "已查看";
  if (status === INSPIRATION_STATUSES.CONVERTED) return "已转商品";
  if (status === INSPIRATION_STATUSES.ARCHIVED) return "已归档";
  if (status === INSPIRATION_STATUSES.REJECTED || status === LEGACY_INSPIRATION_STATUSES.IGNORED) return "已放弃";
  return status;
}

function mapUsagePermissionLabel(permission: string) {
  if (permission === "reference_only") return "仅参考";
  if (permission === "needs_review") return "待确认";
  return permission;
}

function mapSourceTypeLabel(sourceType: string) {
  if (sourceType === "folder_manual_scan") return "手动文件夹扫描";
  if (sourceType === "folder_scheduled_scan") return "定时文件夹扫描";
  return sourceType;
}

async function checkFileExists(relativePath: string | null | undefined) {
  if (!relativePath) {
    return false;
  }

  try {
    await access(getUploadsAbsolutePath(relativePath));
    return true;
  } catch {
    return false;
  }
}

function parseSuggestion(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return normalizeInspirationSuggestion(JSON.parse(value) as InspirationAISuggestion);
  } catch {
    return null;
  }
}

function buildInspirationWhere(filters: InspirationListQuery): Prisma.InspirationWhereInput {
  const andConditions: Prisma.InspirationWhereInput[] = [];

  if (filters.status) {
    andConditions.push({ status: filters.status });
  } else {
    andConditions.push({
      status: {
        notIn: [INSPIRATION_STATUSES.ARCHIVED, INSPIRATION_STATUSES.REJECTED, LEGACY_INSPIRATION_STATUSES.IGNORED],
      },
    });
  }

  if (filters.sourceType) {
    andConditions.push({ sourceType: filters.sourceType });
  }

  if (filters.converted === "true") {
    andConditions.push({ convertedProductId: { not: null } });
  } else if (filters.converted === "false") {
    andConditions.push({ convertedProductId: null });
  }

  if (filters.keyword) {
    andConditions.push({
      OR: [
        { title: { contains: filters.keyword } },
        { note: { contains: filters.keyword } },
        { imagePath: { contains: filters.keyword } },
      ],
    });
  }

  return andConditions.length > 0 ? { AND: andConditions } : {};
}

async function mapInspiration(record: InspirationRecord) {
  const fileExists = await checkFileExists(record.imagePath);
  const thumbnailExists = await checkFileExists(record.thumbnailPath);
  return {
    ...record,
    displayPath: thumbnailExists ? record.thumbnailPath : record.imagePath,
    fileExists,
    thumbnailExists,
    fileName: path.basename(record.imagePath),
    fileHashShort: `${record.fileHash.slice(0, 12)}...`,
    statusLabel: mapStatusLabel(record.status),
    statusTone: getStatusTone(record.status),
    usagePermissionLabel: mapUsagePermissionLabel(record.usagePermission),
    usagePermissionTone: getUsagePermissionTone(record.usagePermission),
    sourceTypeLabel: mapSourceTypeLabel(record.sourceType),
    formattedImportedAt: formatDateTime(record.importedAt),
    formattedUpdatedAt: formatDateTime(record.updatedAt),
    formattedReviewedAt: record.reviewedAt ? formatDateTime(record.reviewedAt) : null,
    formattedArchivedAt: record.archivedAt ? formatDateTime(record.archivedAt) : null,
    aiSuggestion: parseSuggestion(record.aiSuggestionJson),
    aiDraftJobs: record.aiDraftJobs.map((job) => ({
      ...job,
      formattedCreatedAt: formatDateTime(job.createdAt),
      formattedUpdatedAt: formatDateTime(job.updatedAt),
    })),
    operationLogs: record.operationLogs.map((log) => ({
      ...log,
      formattedCreatedAt: formatDateTime(log.createdAt),
    })),
    aiJobSummary: record.aiJob
      ? {
          id: record.aiJob.id,
          jobType: record.aiJob.jobType,
          status: record.aiJob.status,
          errorSummary: record.aiJob.errorSummary,
          resultSummary: record.aiJob.resultSummary,
          createdAt: record.aiJob.createdAt.toISOString(),
          finishedAt: record.aiJob.finishedAt?.toISOString() ?? null,
        }
      : null,
    convertedProduct:
      record.convertedProduct && !record.convertedProduct.deletedAt
        ? {
            id: record.convertedProduct.id,
            name: record.convertedProduct.name,
            spu: record.convertedProduct.spu,
          }
        : null,
  };
}

export async function getInspirationPageData(filters?: Partial<InspirationListQuery>) {
  try {
    const runtime = getRuntimeModeSummary();
    const query = normalizeInspirationListQuery(filters);
    const where = buildInspirationWhere(query);
    const [settingView, records, groupedStats, recentScanLogs, latestScan, recentTasks] = await Promise.all([
      getInspirationFolderSettingView(),
      prisma.inspiration.findMany({
        where,
        orderBy: [{ createdAt: getSortDirection(query.sort) }, { id: "desc" }],
        select: inspirationSelect,
        take: 200,
      }),
      prisma.inspiration.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      getRecentScanLogs(8),
      getLatestScanSummary(),
      getRecentInspirationTaskSummaries(8),
    ]);

    const mappedInspirations = await Promise.all(records.map(mapInspiration));
    const inspirations = mappedInspirations.filter((item) => {
      if (query.hasImage === "true") {
        return item.fileExists;
      }

      if (query.hasImage === "false") {
        return !item.fileExists;
      }

      return true;
    });

    const dedupSummaries = await getImageDedupSummariesForTargets(
      "inspiration",
      inspirations.map((item) => item.id),
    ).catch(() => new Map());

    return {
      runtime,
      settingView,
      inspirations: inspirations.map((item) => ({
        ...item,
        imageDedup: dedupSummaries.get(item.id) ?? null,
      })),
      recentScanLogs,
      latestScan,
      recentTasks,
      filters: query,
      sourceTypes: [
        {
          value: INSPIRATION_SOURCE_TYPES.FOLDER_MANUAL_SCAN,
          label: mapSourceTypeLabel(INSPIRATION_SOURCE_TYPES.FOLDER_MANUAL_SCAN),
        },
        {
          value: INSPIRATION_SOURCE_TYPES.FOLDER_SCHEDULED_SCAN,
          label: mapSourceTypeLabel(INSPIRATION_SOURCE_TYPES.FOLDER_SCHEDULED_SCAN),
        },
      ],
      statuses: Object.values(INSPIRATION_STATUSES).map((status) => ({
        value: status,
        label: mapStatusLabel(status),
      })),
      stats: {
        total: inspirations.length,
        pending: groupedStats.find((item) => item.status === INSPIRATION_STATUSES.PENDING)?._count._all ?? 0,
        reviewed: groupedStats.find((item) => item.status === INSPIRATION_STATUSES.REVIEWED)?._count._all ?? 0,
        converted: groupedStats.find((item) => item.status === INSPIRATION_STATUSES.CONVERTED)?._count._all ?? 0,
        archived: groupedStats.find((item) => item.status === INSPIRATION_STATUSES.ARCHIVED)?._count._all ?? 0,
        rejected: groupedStats.find((item) => item.status === INSPIRATION_STATUSES.REJECTED)?._count._all ?? 0,
      },
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function saveInspirationDraft(input: {
  inspirationId: number;
  title?: string | null;
  note?: string | null;
}) {
  ensureProductWritesAllowed();

  try {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.inspiration.update({
        where: { id: input.inspirationId },
        data: {
          title: input.title?.trim() || null,
          note: input.note?.trim() || null,
        },
        select: inspirationSelect,
      });

      await tx.operationLog.create({
        data: {
          relatedInspirationId: updated.id,
          action: "UPDATE_INSPIRATION_NOTE",
          detail: "更新灵感标题或备注。",
        },
      });

      return updated;
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

async function getInspirationForStatusChange(inspirationId: number) {
  const inspiration = await prisma.inspiration.findUnique({
    where: { id: inspirationId },
    select: {
      id: true,
      title: true,
      status: true,
      convertedProductId: true,
    },
  });

  if (!inspiration) {
    throw createNotFoundError();
  }

  return inspiration;
}

function assertNotConvertedForStatusChange(status: string, convertedProductId: number | null) {
  if (status === INSPIRATION_STATUSES.CONVERTED || convertedProductId) {
    throw createValidationError("已转商品的灵感不能再改为查看、归档或放弃。");
  }
}

export async function markReviewed(inspirationId: number) {
  ensureProductWritesAllowed();

  try {
    const inspiration = await getInspirationForStatusChange(inspirationId);
    assertNotConvertedForStatusChange(inspiration.status, inspiration.convertedProductId);

    if (inspiration.status === INSPIRATION_STATUSES.ARCHIVED || inspiration.status === INSPIRATION_STATUSES.REJECTED) {
      throw createValidationError("已归档或已放弃的灵感不能直接标记为已查看。");
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.inspiration.update({
        where: { id: inspirationId },
        data: {
          status: INSPIRATION_STATUSES.REVIEWED,
          reviewedAt: new Date(),
        },
        select: inspirationSelect,
      });

      await tx.operationLog.create({
        data: {
          relatedInspirationId: inspirationId,
          action: "MARK_INSPIRATION_REVIEWED",
          detail: `标记灵感为已查看：${inspiration.title ?? `#${inspirationId}`}`,
        },
      });

      return updated;
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function archiveInspiration(inspirationId: number) {
  ensureProductWritesAllowed();

  try {
    const inspiration = await getInspirationForStatusChange(inspirationId);
    assertNotConvertedForStatusChange(inspiration.status, inspiration.convertedProductId);

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.inspiration.update({
        where: { id: inspirationId },
        data: {
          status: INSPIRATION_STATUSES.ARCHIVED,
          archivedAt: new Date(),
        },
        select: inspirationSelect,
      });

      await tx.operationLog.create({
        data: {
          relatedInspirationId: inspirationId,
          action: "ARCHIVE_INSPIRATION",
          detail: `归档灵感：${inspiration.title ?? `#${inspirationId}`}`,
        },
      });

      return updated;
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function rejectInspiration(input: { inspirationId: number; reason?: string | null }) {
  ensureProductWritesAllowed();

  const reason = input.reason?.trim().slice(0, 160) || null;

  try {
    const inspiration = await getInspirationForStatusChange(input.inspirationId);
    assertNotConvertedForStatusChange(inspiration.status, inspiration.convertedProductId);

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.inspiration.update({
        where: { id: input.inspirationId },
        data: {
          status: INSPIRATION_STATUSES.REJECTED,
          rejectedReason: reason,
        },
        select: inspirationSelect,
      });

      await tx.operationLog.create({
        data: {
          relatedInspirationId: input.inspirationId,
          action: "REJECT_INSPIRATION",
          detail: reason ? `放弃灵感：${reason}` : `放弃灵感：${inspiration.title ?? `#${input.inspirationId}`}`,
        },
      });

      return updated;
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function ignoreInspiration(inspirationId: number) {
  return rejectInspiration({ inspirationId, reason: "用户手动忽略" });
}

async function generateUniqueSpu() {
  const today = new Date();
  let sequence = 1;

  while (true) {
    const candidate = buildSpu(today, sequence);
    const existing = await prisma.product.findUnique({
      where: { spu: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    sequence += 1;
  }
}

function parseLines(value: string | null | undefined) {
  return Array.from(
    new Set(
      String(value ?? "")
        .split(/\r?\n+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export async function convertInspirationToProduct(input: {
  inspirationId: number;
  name: string;
  categoryLevel1?: string | null;
  targetUser?: string | null;
  sellingPointsText?: string | null;
  usageScenesText?: string | null;
  tagsText?: string | null;
  notes?: string | null;
}) {
  ensureProductWritesAllowed();

  const productName = input.name.trim();
  if (!productName) {
    throw createValidationError("转商品时必须填写商品名称。");
  }

  try {
    const inspiration = await prisma.inspiration.findUnique({
      where: { id: input.inspirationId },
      select: {
        id: true,
        title: true,
        note: true,
        imagePath: true,
        status: true,
        convertedProductId: true,
      },
    });

    if (!inspiration) {
      throw createNotFoundError();
    }

    if (inspiration.status === INSPIRATION_STATUSES.CONVERTED || inspiration.convertedProductId) {
      throw createValidationError("当前灵感已经转为正式商品。");
    }

    if (inspiration.status === INSPIRATION_STATUSES.ARCHIVED || inspiration.status === INSPIRATION_STATUSES.REJECTED) {
      throw createValidationError("已归档或已放弃的灵感不能直接转为商品。");
    }

    const spu = await generateUniqueSpu();
    const tags = parseLines(input.tagsText);
    const sellingPoints = parseLines(input.sellingPointsText);
    const usageScenes = parseLines(input.usageScenesText);

    const product = await prisma.$transaction(async (tx) => {
      const createdProduct = await tx.product.create({
        data: {
          spu,
          name: productName,
          categoryLevel1: input.categoryLevel1?.trim() || null,
          tags: stringifyJsonStringArray(tags),
          targetUser: input.targetUser?.trim() || null,
          sellingPoints: sellingPoints.length > 0 ? sellingPoints.join("；") : null,
          usageScenes: usageScenes.length > 0 ? usageScenes.join("；") : null,
          notes: input.notes?.trim() || inspiration.note || null,
          mainImagePath: inspiration.imagePath,
        },
        select: {
          id: true,
          name: true,
        },
      });

      await tx.inspiration.update({
        where: { id: inspiration.id },
        data: {
          status: INSPIRATION_STATUSES.CONVERTED,
          convertedProductId: createdProduct.id,
          reviewedAt: new Date(),
        },
      });

      await tx.operationLog.create({
        data: {
          productId: createdProduct.id,
          relatedInspirationId: inspiration.id,
          action: "CONVERT_INSPIRATION_TO_PRODUCT",
          detail: `从灵感箱转商品：inspirationId=${input.inspirationId} / title=${inspiration.title ?? productName}`,
        },
      });

      return createdProduct;
    });

    await notifyInspirationConverted({
      inspirationId: input.inspirationId,
      productId: product.id,
      productName: product.name,
    });

    return product;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export const convertToProduct = convertInspirationToProduct;

export function buildConversionDefaults(input: {
  title: string | null;
  note: string | null;
  aiSuggestion: InspirationAISuggestion | null;
}) {
  return buildInspirationConversionDefaults(input);
}
