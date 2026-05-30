import { prisma } from "@/lib/prisma";
import {
  buildSpu,
  BUSINESS_ERROR_CODES,
  deriveProductStatus,
  ProductBusinessError,
  stringifyJsonStringArray,
  type ProductMutationInput,
} from "@/lib/modules/products";
import { OPERATION_LOG_ACTIONS, PRODUCT_STATUS_VALUES, type ProductStatus } from "@/lib/modules/products/constants";
import { createOperationLog } from "@/lib/services/operation-log-service";
import { ensureProductWritesAllowed, normalizeProductWriteError } from "@/lib/services/product-runtime-service";
import { notifyProductCreated, notifyProductDeleted } from "@/lib/services/notificationService";

const productMutationSelect = {
  id: true,
  spu: true,
  name: true,
  status: true,
  mainImagePath: true,
  categoryLevel1: true,
  categoryLevel2: true,
  tags: true,
  targetUser: true,
  targetPlatforms: true,
  estimatedPrice: true,
  estimatedCost: true,
  estimatedShipping: true,
  packagingCost: true,
  sellingPoints: true,
  painPoints: true,
  usageScenes: true,
  categoryRisk: true,
  returnRisk: true,
  explanationCost: true,
  contentVisualLevel: true,
  sceneClarityLevel: true,
  videoFitLevel: true,
  comparisonDemoLevel: true,
  notes: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function createNotFoundError() {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "商品不存在或已删除。");
}

function normalizeProductStatus(status: string): ProductStatus {
  if (!(PRODUCT_STATUS_VALUES as readonly string[]).includes(status)) {
    throw createValidationError("请选择有效商品状态。");
  }

  return status as ProductStatus;
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

function buildMutationData(input: ProductMutationInput, currentStatus?: string | null) {
  const nextStatus = deriveProductStatus({
    currentStatus,
    estimatedCost: input.estimatedCost,
    estimatedShipping: input.estimatedShipping,
    packagingCost: input.packagingCost,
    targetPlatforms: input.targetPlatforms,
    sellingPoints: input.sellingPoints,
  });

  return {
    name: input.name,
    categoryLevel1: input.categoryLevel1,
    categoryLevel2: input.categoryLevel2,
    tags: stringifyJsonStringArray(input.tags),
    targetUser: input.targetUser,
    targetPlatforms: stringifyJsonStringArray(input.targetPlatforms),
    estimatedPrice: input.estimatedPrice,
    estimatedCost: input.estimatedCost,
    estimatedShipping: input.estimatedShipping,
    packagingCost: input.packagingCost,
    sellingPoints: input.sellingPoints,
    painPoints: input.painPoints,
    usageScenes: input.usageScenes,
    categoryRisk: input.categoryRisk,
    returnRisk: input.returnRisk,
    explanationCost: input.explanationCost,
    contentVisualLevel: input.contentVisualLevel,
    sceneClarityLevel: input.sceneClarityLevel,
    videoFitLevel: input.videoFitLevel,
    comparisonDemoLevel: input.comparisonDemoLevel,
    notes: input.notes,
    status: nextStatus,
  };
}

async function uploadMainImageAndTrack(productId: number, file: File) {
  const { saveProductMainImage } = await import("@/lib/services/file-storage-service");
  const mainImagePath = await saveProductMainImage(productId, file);

  await prisma.product.update({
    where: { id: productId },
    data: { mainImagePath },
  });

  await createOperationLog({
    productId,
    action: OPERATION_LOG_ACTIONS.UPLOAD_MAIN_IMAGE,
    detail: "上传了商品主图",
  });

  return mainImagePath;
}

export async function createProduct(input: {
  values: ProductMutationInput;
  mainImage?: File | null;
}) {
  if (!input.values.name.trim()) {
    throw createValidationError("商品名称不能为空。");
  }

  ensureProductWritesAllowed();

  try {
    const spu = await generateUniqueSpu();
    const mutationData = buildMutationData(input.values, "待分析");

    const product = await prisma.product.create({
      data: {
        spu,
        ...mutationData,
      },
      select: productMutationSelect,
    });

    await createOperationLog({
      productId: product.id,
      action: OPERATION_LOG_ACTIONS.CREATE_PRODUCT,
      detail: `创建商品 ${product.name}`,
    });

    if (product.status !== "待分析") {
      await createOperationLog({
        productId: product.id,
        action: OPERATION_LOG_ACTIONS.CHANGE_STATUS,
        detail: `状态变更为 ${product.status}`,
      });
    }

    if (input.mainImage) {
      await uploadMainImageAndTrack(product.id, input.mainImage);
    }

    await notifyProductCreated({ productId: product.id, productName: product.name });
    return product;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function updateProduct(
  productId: number,
  input: {
    values: ProductMutationInput;
    mainImage?: File | null;
  },
) {
  if (!input.values.name.trim()) {
    throw createValidationError("商品名称不能为空。");
  }

  ensureProductWritesAllowed();

  try {
    const existing = await prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
      select: productMutationSelect,
    });

    if (!existing) {
      throw createNotFoundError();
    }

    const mutationData = buildMutationData(input.values, existing.status);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: mutationData,
      select: productMutationSelect,
    });

    await createOperationLog({
      productId,
      action: OPERATION_LOG_ACTIONS.UPDATE_PRODUCT,
      detail: `编辑商品 ${updated.name}`,
    });

    if (existing.status !== updated.status) {
      await createOperationLog({
        productId,
        action: OPERATION_LOG_ACTIONS.CHANGE_STATUS,
        detail: `状态由 ${existing.status} 变更为 ${updated.status}`,
      });
    }

    if (input.mainImage) {
      await uploadMainImageAndTrack(productId, input.mainImage);
    }

    return updated;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function softDeleteProduct(productId: number) {
  ensureProductWritesAllowed();

  try {
    const existing = await prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!existing) {
      throw createNotFoundError();
    }

    await prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });

    await createOperationLog({
      productId,
      action: OPERATION_LOG_ACTIONS.DELETE_PRODUCT,
      detail: `删除商品 ${existing.name}`,
    });
    await notifyProductDeleted({ productId, productName: existing.name });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function updateProductStatus(input: { productId: number; status: string }) {
  ensureProductWritesAllowed();

  try {
    const nextStatus = normalizeProductStatus(input.status);
    const existing = await prisma.product.findFirst({
      where: {
        id: input.productId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) {
      throw createNotFoundError();
    }

    if (existing.status === nextStatus) {
      return existing;
    }

    const updated = await prisma.product.update({
      where: { id: input.productId },
      data: { status: nextStatus },
      select: productMutationSelect,
    });

    await createOperationLog({
      productId: input.productId,
      action: OPERATION_LOG_ACTIONS.CHANGE_STATUS,
      detail: `状态由 ${existing.status} 变更为 ${nextStatus}`,
    });

    return updated;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}
