import { access } from "node:fs/promises";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  MANUAL_MATERIAL_TYPES,
  MATERIAL_SOURCE,
  MATERIAL_STATUS,
  MATERIAL_STATUSES,
  MATERIAL_TYPES,
  getMaterialImageSourceTypeLabel,
  getMaterialSourceLabel,
  getMaterialStatusTone,
  getMaterialTypeLabel,
  getMaterialUsagePermissionLabel,
  isManualMaterialType,
  isMaterialStatus,
  mapManualMaterialTypeToStorageImageType,
  type MaterialStatus,
  type MaterialTypeCode,
} from "@/lib/modules/materials";
import { BUSINESS_ERROR_CODES, ProductBusinessError, formatDateTime, OPERATION_LOG_ACTIONS } from "@/lib/modules/products";
import { getImageTypeLabel, getPlatformLabel, isPromptImageType, isPromptTaskPlatform } from "@/lib/modules/prompt-task";
import { saveMaterialImage } from "@/lib/services/file-storage-service";
import { getImageDedupSummariesForTargets, getImageDedupSummary } from "@/lib/services/image-dedup";
import { createOperationLog } from "@/lib/services/operation-log-service";
import {
  ensureProductWritesAllowed,
  getRuntimeModeSummary,
  normalizeProductReadError,
  normalizeProductWriteError,
} from "@/lib/services/product-runtime-service";
import {
  getSortDirection,
  normalizeMaterialLibraryQuery,
  type MaterialLibraryQuery,
} from "@/lib/services/query-service";

export type MaterialListFilters = MaterialLibraryQuery;

const materialSelect = {
  id: true,
  productId: true,
  promptTaskId: true,
  platform: true,
  materialType: true,
  filePath: true,
  fileHash: true,
  originalSizeBytes: true,
  thumbnailSizeBytes: true,
  width: true,
  height: true,
  mimeType: true,
  thumbnailPath: true,
  sourceType: true,
  usagePermission: true,
  status: true,
  source: true,
  version: true,
  createdAt: true,
  product: {
    select: {
      id: true,
      name: true,
      spu: true,
    },
  },
  promptTask: {
    select: {
      taskCode: true,
      imageType: true,
    },
  },
} satisfies Prisma.MaterialSelect;

type MaterialRecord = Prisma.MaterialGetPayload<{ select: typeof materialSelect }>;

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function normalizePlatform(platform: string) {
  if (!isPromptTaskPlatform(platform)) {
    throw createValidationError("请选择有效平台。");
  }

  return platform;
}

function normalizePromptImageType(imageType: string) {
  if (!isPromptImageType(imageType)) {
    throw createValidationError("请选择有效图片类型。");
  }

  return imageType;
}

function normalizeManualMaterialType(materialType: string) {
  if (!isManualMaterialType(materialType)) {
    throw createValidationError("请选择有效素材类型。");
  }

  return materialType;
}

function normalizeMaterialStatus(status: string): MaterialStatus {
  if (!isMaterialStatus(status)) {
    throw createValidationError("请选择有效素材状态。");
  }

  return status;
}

function getMaterialTypeFromPromptImageType(imageType: string | null | undefined): MaterialTypeCode {
  if (imageType === "main") return "main_image";
  if (imageType === "detail") return "detail_image";
  if (imageType === "cover") return "cover_image";
  return "prompt_result";
}

function buildMaterialWhere(filters?: MaterialListFilters): Prisma.MaterialWhereInput {
  const andConditions: Prisma.MaterialWhereInput[] = [{ product: { deletedAt: null } }];
  const status = filters?.status?.trim();
  const query = filters?.keyword?.trim();

  if (status) {
    andConditions.push({ status });
  } else {
    andConditions.push({ status: { not: MATERIAL_STATUS.DISCARDED } });
  }

  if (filters?.productId) {
    andConditions.push({ productId: filters.productId });
  }

  if (filters?.platform?.trim()) {
    andConditions.push({ platform: filters.platform.trim() });
  }

  if (filters?.materialType?.trim()) {
    andConditions.push({ materialType: filters.materialType.trim() });
  }

  if (query) {
    andConditions.push({
      OR: [
        { filePath: { contains: query } },
        { product: { name: { contains: query } } },
        { product: { spu: { contains: query } } },
        { promptTask: { taskCode: { contains: query } } },
      ],
    });
  }

  return { AND: andConditions };
}

async function checkFileExists(filePath: string) {
  try {
    const { getUploadsAbsolutePath } = await import("@/lib/services/file-storage-service");
    await access(getUploadsAbsolutePath(filePath));
    return true;
  } catch {
    return false;
  }
}

async function mapMaterial(material: MaterialRecord) {
  const exists = await checkFileExists(material.filePath);
  const thumbnailExists = material.thumbnailPath ? await checkFileExists(material.thumbnailPath) : false;
  const displayPath = thumbnailExists ? material.thumbnailPath : material.filePath;

  return {
    ...material,
    displayPath,
    thumbnailExists,
    platformLabel: getPlatformLabel(material.platform),
    materialTypeLabel: getMaterialTypeLabel(material.materialType),
    sourceLabel: getMaterialSourceLabel(material.source),
    sourceTypeLabel: getMaterialImageSourceTypeLabel(material.sourceType),
    usagePermissionLabel: getMaterialUsagePermissionLabel(material.usagePermission),
    isReferenceOnly: material.usagePermission === "reference_only",
    statusTone: getMaterialStatusTone(material.status),
    formattedCreatedAt: formatDateTime(material.createdAt),
    taskCode: material.promptTask?.taskCode ?? null,
    promptImageTypeLabel: getImageTypeLabel(material.promptTask?.imageType),
    dimensionsLabel: material.width && material.height ? `${material.width} x ${material.height}` : "--",
    originalSizeLabel: formatBytes(material.originalSizeBytes),
    thumbnailSizeLabel: formatBytes(material.thumbnailSizeBytes),
    fileExists: exists,
  };
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function mapMaterials(materials: MaterialRecord[]) {
  return Promise.all(materials.map(mapMaterial));
}

async function getNextMaterialVersion(promptTaskId: number | null, productId?: number) {
  const where: Prisma.MaterialWhereInput = promptTaskId ? { promptTaskId } : { productId, promptTaskId: null };
  const count = await prisma.material.count({ where });
  return `v${count + 1}`;
}

export async function getMaterialById(materialId: number) {
  try {
    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        product: { deletedAt: null },
      },
      select: materialSelect,
    });

    return material ? mapMaterial(material) : null;
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getProductMaterials(productId: number, filters?: Partial<Omit<MaterialListFilters, "productId">>) {
  try {
    const query = normalizeMaterialLibraryQuery({ ...filters, productId });
    const materials = await prisma.material.findMany({
      where: buildMaterialWhere(query),
      orderBy: { createdAt: getSortDirection(query.sort) },
      select: materialSelect,
    });

    return mapMaterials(materials);
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getMaterialLibraryPageData(filters?: MaterialListFilters) {
  try {
    const query = normalizeMaterialLibraryQuery(filters);
    const where = buildMaterialWhere(query);
    const [products, materials, groupedStats, orphanedCount, selectedMaterial] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, spu: true },
      }),
      prisma.material.findMany({
        where,
        orderBy: { createdAt: getSortDirection(query.sort) },
        select: materialSelect,
        take: 200,
      }),
      prisma.material.groupBy({
        by: ["status"],
        where: { product: { deletedAt: null } },
        _count: { _all: true },
      }),
      prisma.material.count({
        where: { product: { deletedAt: { not: null } } },
      }),
      query.materialId ? getMaterialById(query.materialId) : Promise.resolve(null),
    ]);

    const activeTotal = groupedStats
      .filter((item) => item.status !== MATERIAL_STATUS.DISCARDED)
      .reduce((sum, item) => sum + item._count._all, 0);

    const mappedMaterials = await mapMaterials(materials);
    const dedupSummaries = await getImageDedupSummariesForTargets(
      "material",
      mappedMaterials.map((material) => material.id),
    ).catch(() => new Map());
    const selectedDedupSummary = selectedMaterial ? await getImageDedupSummary("material", selectedMaterial.id).catch(() => null) : null;

    return {
      products,
      materials: mappedMaterials.map((material) => ({
        ...material,
        imageDedup: dedupSummaries.get(material.id) ?? null,
      })),
      selectedMaterial: selectedMaterial
        ? {
            ...selectedMaterial,
            imageDedup: selectedDedupSummary,
          }
        : null,
      platforms: ["xianyu", "taobao", "xiaohongshu", "douyin"].map((code) => ({ code, label: getPlatformLabel(code) })),
      materialTypes: MATERIAL_TYPES,
      statuses: MATERIAL_STATUSES,
      manualMaterialTypes: MANUAL_MATERIAL_TYPES,
      stats: {
        total: activeTotal,
        pendingReview: groupedStats.find((item) => item.status === MATERIAL_STATUS.PENDING_REVIEW)?._count._all ?? 0,
        adopted: groupedStats.find((item) => item.status === MATERIAL_STATUS.ADOPTED)?._count._all ?? 0,
        needsEdit: groupedStats.find((item) => item.status === MATERIAL_STATUS.NEEDS_EDIT)?._count._all ?? 0,
        orphanedCount,
      },
      runtime: getRuntimeModeSummary(),
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function createPromptResultMaterial(input: {
  productId: number;
  promptTaskId: number;
  platform: string;
  imageType: string;
  file: File;
}) {
  try {
    ensureProductWritesAllowed();

    const platform = normalizePlatform(input.platform);
    const imageType = normalizePromptImageType(input.imageType);
    const version = await getNextMaterialVersion(input.promptTaskId);
    const storedImage = await saveMaterialImage({
      productId: input.productId,
      platform,
      imageType,
      version,
      file: input.file,
    });

    const material = await prisma.material.create({
      data: {
        productId: input.productId,
        promptTaskId: input.promptTaskId,
        platform,
        materialType: getMaterialTypeFromPromptImageType(imageType),
        filePath: storedImage.filePath,
        fileHash: storedImage.fileHash,
        originalSizeBytes: storedImage.originalSizeBytes,
        thumbnailSizeBytes: storedImage.thumbnailSizeBytes,
        width: storedImage.width,
        height: storedImage.height,
        mimeType: storedImage.mimeType,
        thumbnailPath: storedImage.thumbnailPath,
        sourceType: "ai_generated",
        usagePermission: "needs_review",
        status: MATERIAL_STATUS.PENDING_REVIEW,
        source: MATERIAL_SOURCE.PROMPT_RESULT,
        version,
      },
      select: materialSelect,
    });

    return mapMaterial(material);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function createManualMaterial(input: {
  productId: number;
  platform: string;
  materialType: string;
  file: File;
}) {
  try {
    ensureProductWritesAllowed();

    const platform = normalizePlatform(input.platform);
    const materialType = normalizeManualMaterialType(input.materialType);
    const product = await prisma.product.findFirst({
      where: { id: input.productId, deletedAt: null },
      select: { id: true },
    });

    if (!product) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "商品不存在或已删除。");
    }

    const version = await getNextMaterialVersion(null, product.id);
    const storedImage = await saveMaterialImage({
      productId: product.id,
      platform,
      imageType: mapManualMaterialTypeToStorageImageType(materialType),
      version,
      file: input.file,
    });

    const material = await prisma.material.create({
      data: {
        productId: product.id,
        promptTaskId: null,
        platform,
        materialType,
        filePath: storedImage.filePath,
        fileHash: storedImage.fileHash,
        originalSizeBytes: storedImage.originalSizeBytes,
        thumbnailSizeBytes: storedImage.thumbnailSizeBytes,
        width: storedImage.width,
        height: storedImage.height,
        mimeType: storedImage.mimeType,
        thumbnailPath: storedImage.thumbnailPath,
        sourceType: "own_photo",
        usagePermission: "usable",
        status: MATERIAL_STATUS.PENDING_REVIEW,
        source: MATERIAL_SOURCE.MANUAL_UPLOAD,
        version,
      },
      select: materialSelect,
    });

    await createOperationLog({
      productId: product.id,
      action: OPERATION_LOG_ACTIONS.MANUAL_UPLOAD_MATERIAL,
      detail: `手动上传素材：materialId=${material.id} / ${getPlatformLabel(platform)} / ${getMaterialTypeLabel(materialType)} / ${storedImage.filePath}`,
    });

    return mapMaterial(material);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function updateMaterialStatus(input: {
  materialId: number;
  status: string;
}) {
  try {
    ensureProductWritesAllowed();

    const nextStatus = normalizeMaterialStatus(input.status);
    const material = await prisma.material.findFirst({
      where: { id: input.materialId, product: { deletedAt: null } },
      select: {
        id: true,
        productId: true,
        filePath: true,
        status: true,
      },
    });

    if (!material) {
      throw createValidationError("素材不存在。");
    }

    const oldStatus = material.status ?? "--";
    const updated = await prisma.material.update({
      where: { id: material.id },
      data: { status: nextStatus },
      select: materialSelect,
    });

    await createOperationLog({
      productId: material.productId,
      action: OPERATION_LOG_ACTIONS.UPDATE_MATERIAL_STATUS,
      detail: `素材状态修改：materialId=${material.id} / 旧状态=${oldStatus} / 新状态=${nextStatus} / filePath=${material.filePath}`,
    });

    return mapMaterial(updated);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function getHomeMaterialStats() {
  try {
    const [activeCount, pendingReviewCount] = await Promise.all([
      prisma.material.count({
        where: {
          product: { deletedAt: null },
          status: { not: MATERIAL_STATUS.DISCARDED },
        },
      }),
      prisma.material.count({
        where: {
          product: { deletedAt: null },
          status: MATERIAL_STATUS.PENDING_REVIEW,
        },
      }),
    ]);

    return {
      activeCount,
      pendingReviewCount,
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}
