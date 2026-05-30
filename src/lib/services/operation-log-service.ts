import { prisma } from "@/lib/prisma";
import { ensureProductWritesAllowed, normalizeProductReadError, normalizeProductWriteError } from "@/lib/services/product-runtime-service";

export async function createOperationLog(input: {
  productId: number;
  action: string;
  detail?: string | null;
}) {
  try {
    ensureProductWritesAllowed();

    return prisma.operationLog.create({
      data: {
        productId: input.productId,
        action: input.action,
        detail: input.detail ?? null,
      },
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function createInspirationOperationLog(input: {
  inspirationId: number;
  action: string;
  detail?: string | null;
  productId?: number | null;
}) {
  try {
    ensureProductWritesAllowed();

    return prisma.operationLog.create({
      data: {
        productId: input.productId ?? null,
        relatedInspirationId: input.inspirationId,
        action: input.action,
        detail: input.detail ?? null,
      },
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function createSettingsOperationLog(input: {
  action: string;
  detail?: string | null;
}) {
  ensureProductWritesAllowed();

  const linkedProduct = await prisma.product.findFirst({
    where: { deletedAt: null },
    orderBy: { id: "asc" },
    select: { id: true },
  });

  if (!linkedProduct) {
    return null;
  }

  return prisma.operationLog.create({
    data: {
      productId: linkedProduct.id,
      action: input.action,
      detail: input.detail ?? null,
    },
  });
}

export async function tryCreateSettingsOperationLog(input: {
  action: string;
  detail?: string | null;
}) {
  try {
    return await createSettingsOperationLog(input);
  } catch {
    return null;
  }
}

export async function getProductOperationLogs(productId: number) {
  try {
    return prisma.operationLog.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getInspirationOperationLogs(inspirationId: number) {
  try {
    return prisma.operationLog.findMany({
      where: { relatedInspirationId: inspirationId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}
