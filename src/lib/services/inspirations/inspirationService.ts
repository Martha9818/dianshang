import { access } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildSpu, BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products";
import { formatDateTime, stringifyJsonStringArray } from "@/lib/modules/products";
import { getUploadsAbsolutePath } from "@/lib/services/file-storage-service";
import { getInspirationFolderSettingView } from "@/lib/services/inspirations/inspirationSettingsService";
import { getRecentScanLogs } from "@/lib/services/inspirations/scanLogService";
import {
  INSPIRATION_STATUSES,
  INSPIRATION_SOURCE_TYPES,
  normalizeInspirationSuggestion,
  type InspirationAISuggestion,
} from "@/lib/services/inspirations/inspirationTypes";
import { createOperationLog } from "@/lib/services/operation-log-service";
import {
  ensureProductWritesAllowed,
  getRuntimeModeSummary,
  normalizeProductReadError,
  normalizeProductWriteError,
} from "@/lib/services/product-runtime-service";
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
} satisfies Prisma.InspirationSelect;

type InspirationRecord = Prisma.InspirationGetPayload<{ select: typeof inspirationSelect }>;

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function createNotFoundError() {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "灵感记录不存在。");
}

function getStatusTone(status: string) {
  if (status === INSPIRATION_STATUSES.PENDING_REVIEW) return "amber" as const;
  if (status === INSPIRATION_STATUSES.CONVERTED) return "green" as const;
  if (status === INSPIRATION_STATUSES.IGNORED) return "slate" as const;
  return "slate" as const;
}

function getUsagePermissionTone(permission: string) {
  if (permission === "reference_only") return "amber" as const;
  if (permission === "needs_review") return "violet" as const;
  return "green" as const;
}

function mapStatusLabel(status: string) {
  if (status === INSPIRATION_STATUSES.PENDING_REVIEW) return "待审核";
  if (status === INSPIRATION_STATUSES.CONVERTED) return "已转商品";
  if (status === INSPIRATION_STATUSES.IGNORED) return "已忽略";
  return status;
}

function mapUsagePermissionLabel(permission: string) {
  if (permission === "reference_only") return "仅参考";
  if (permission === "needs_review") return "待确认";
  return permission;
}

function mapSourceTypeLabel(sourceType: string) {
  if (sourceType === "folder_manual_scan") return "手动文件夹扫描";
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
    aiSuggestion: parseSuggestion(record.aiSuggestionJson),
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
    const [settingView, records, groupedStats, recentScanLogs] = await Promise.all([
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

    return {
      runtime,
      settingView,
      inspirations,
      recentScanLogs,
      filters: query,
      sourceTypes: [
        {
          value: INSPIRATION_SOURCE_TYPES.FOLDER_MANUAL_SCAN,
          label: mapSourceTypeLabel(INSPIRATION_SOURCE_TYPES.FOLDER_MANUAL_SCAN),
        },
      ],
      statuses: Object.values(INSPIRATION_STATUSES).map((status) => ({
        value: status,
        label: mapStatusLabel(status),
      })),
      stats: {
        total: inspirations.length,
        pendingReview: groupedStats.find((item) => item.status === INSPIRATION_STATUSES.PENDING_REVIEW)?._count._all ?? 0,
        ignored: groupedStats.find((item) => item.status === INSPIRATION_STATUSES.IGNORED)?._count._all ?? 0,
        converted: groupedStats.find((item) => item.status === INSPIRATION_STATUSES.CONVERTED)?._count._all ?? 0,
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
    return await prisma.inspiration.update({
      where: { id: input.inspirationId },
      data: {
        title: input.title?.trim() || null,
        note: input.note?.trim() || null,
      },
      select: inspirationSelect,
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function ignoreInspiration(inspirationId: number) {
  ensureProductWritesAllowed();

  try {
    return await prisma.inspiration.update({
      where: { id: inspirationId },
      data: {
        status: INSPIRATION_STATUSES.IGNORED,
      },
      select: inspirationSelect,
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
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
      },
    });

    if (!inspiration) {
      throw createNotFoundError();
    }

    if (inspiration.status === INSPIRATION_STATUSES.CONVERTED) {
      throw createValidationError("当前灵感已经转为正式商品。");
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
        },
      });

      return createdProduct;
    });

    await createOperationLog({
      productId: product.id,
      action: "CONVERT_INSPIRATION_TO_PRODUCT",
      detail: `从灵感箱转商品：inspirationId=${input.inspirationId} / title=${inspiration.title ?? productName}`,
    });

    return product;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export function buildConversionDefaults(input: {
  title: string | null;
  note: string | null;
  aiSuggestion: InspirationAISuggestion | null;
}) {
  const aiSuggestion = input.aiSuggestion;
  return {
    name: input.title?.trim() || aiSuggestion?.titleSuggestion || "",
    categoryLevel1: aiSuggestion?.possibleCategory || "",
    targetUser: aiSuggestion?.targetAudience.join("；") || "",
    sellingPointsText: aiSuggestion?.sellingPoints.join("\n") || "",
    usageScenesText: aiSuggestion?.useScenarios.join("\n") || "",
    tagsText: aiSuggestion?.styleKeywords.join("\n") || "",
    notes:
      input.note?.trim() ||
      [aiSuggestion?.shortDescription, aiSuggestion?.uncertaintyNotes.join("；")].filter(Boolean).join("\n"),
  };
}
