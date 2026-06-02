import { access, mkdir, rename, rm, unlink } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MATERIAL_STATUS } from "@/lib/modules/materials";
import { getUploadsAbsolutePath } from "@/lib/services/file-storage-service";
import { ensureLocalDirectory } from "@/lib/services/local-paths";
import { ensureProductWritesAllowed, normalizeProductWriteError } from "@/lib/services/product-runtime-service";

type IdMapping = {
  oldId: number;
  newId: number;
};

type StagedProductDirectory = IdMapping & {
  oldPath: string;
  newPath: string;
  tempPath: string;
  finalized: boolean;
};

type CompactRealIdsPlan = {
  deletedProductIds: number[];
  discardedMaterialPaths: Array<string | null>;
  productMappings: IdMapping[];
  materialMappings: IdMapping[];
};

export type CompactRealIdsResult = {
  backupCreated: boolean;
  hardDeletedProductCount: number;
  discardedMaterialCount: number;
  productIdChangeCount: number;
  materialIdChangeCount: number;
  productFolderRenameCount: number;
  removedProductFolderCount: number;
  removedDiscardedMaterialFileCount: number;
};

const PRODUCT_PATH_COLUMNS = [
  { table: "Product", column: "mainImagePath" },
  { table: "Competitor", column: "screenshotPath" },
  { table: "Material", column: "filePath" },
  { table: "Material", column: "thumbnailPath" },
  { table: "ScreenshotRecognitionJob", column: "imagePath" },
  { table: "ScreenshotRecognitionJob", column: "thumbnailPath" },
  { table: "LinkImportDraft", column: "screenshotPath" },
  { table: "LinkImportDraft", column: "screenshotThumbnailPath" },
  { table: "ImageFingerprint", column: "relativePath" },
] as const;

function compactMap<T extends { id: number }>(items: T[]): IdMapping[] {
  return items.map((item, index) => ({ oldId: item.id, newId: index + 1 }));
}

function changedOnly(mappings: IdMapping[]) {
  return mappings.filter((mapping) => mapping.oldId !== mapping.newId);
}

function getMappingValue(mappings: IdMapping[], oldId: number) {
  return mappings.find((mapping) => mapping.oldId === oldId)?.newId ?? null;
}

async function pathExists(targetPath: string) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function assertInsideDirectory(root: string, targetPath: string) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(targetPath);

  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("维护路径超出允许范围，已停止真实 ID 整理。");
  }

  return resolvedTarget;
}

function resolveProductDirectory(productsRoot: string, productId: number) {
  return assertInsideDirectory(productsRoot, path.join(productsRoot, String(productId)));
}

async function removeDiscardedMaterialFiles(relativePaths: Array<string | null>) {
  let removedCount = 0;
  const seen = new Set<string>();

  for (const relativePath of relativePaths) {
    if (!relativePath || seen.has(relativePath)) continue;
    seen.add(relativePath);

    try {
      await unlink(getUploadsAbsolutePath(relativePath));
      removedCount += 1;
    } catch {
      // Missing discarded-material files are fine; file cleanup can handle remaining orphans.
    }
  }

  return removedCount;
}

async function removeProductDirectories(productIds: number[], productsRoot: string) {
  let removedCount = 0;

  for (const productId of productIds) {
    const directoryPath = resolveProductDirectory(productsRoot, productId);
    if (!(await pathExists(directoryPath))) continue;
    await rm(directoryPath, { recursive: true, force: true });
    removedCount += 1;
  }

  return removedCount;
}

async function stageProductDirectories(input: {
  mappings: IdMapping[];
  productsRoot: string;
  tempRoot: string;
}) {
  const staged: StagedProductDirectory[] = [];

  for (const mapping of changedOnly(input.mappings)) {
    const oldPath = resolveProductDirectory(input.productsRoot, mapping.oldId);
    const newPath = resolveProductDirectory(input.productsRoot, mapping.newId);
    if (!(await pathExists(oldPath))) continue;

    const tempPath = assertInsideDirectory(input.tempRoot, path.join(input.tempRoot, `product-${mapping.oldId}`));
    await rename(oldPath, tempPath);
    staged.push({ ...mapping, oldPath, newPath, tempPath, finalized: false });
  }

  return staged;
}

async function finalizeProductDirectories(staged: StagedProductDirectory[]) {
  let renamedCount = 0;

  for (const item of staged) {
    if (await pathExists(item.newPath)) {
      await rm(item.newPath, { recursive: true, force: true });
    }

    await rename(item.tempPath, item.newPath);
    item.finalized = true;
    renamedCount += 1;
  }

  return renamedCount;
}

async function rollbackProductDirectories(staged: StagedProductDirectory[]) {
  for (const item of [...staged].reverse()) {
    try {
      if (item.finalized && (await pathExists(item.newPath))) {
        if (await pathExists(item.oldPath)) {
          await rm(item.oldPath, { recursive: true, force: true });
        }
        await rename(item.newPath, item.oldPath);
        continue;
      }

      if (!item.finalized && (await pathExists(item.tempPath))) {
        if (await pathExists(item.oldPath)) {
          await rm(item.oldPath, { recursive: true, force: true });
        }
        await rename(item.tempPath, item.oldPath);
      }
    } catch {
      // The automatic backup is the recovery point if filesystem rollback is incomplete.
    }
  }
}

async function buildCompactPlan(): Promise<CompactRealIdsPlan> {
  const [deletedProducts, discardedMaterials, activeProducts, activeMaterials] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: { not: null } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    }),
    prisma.material.findMany({
      where: { status: MATERIAL_STATUS.DISCARDED },
      select: { filePath: true, thumbnailPath: true },
    }),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    }),
    prisma.material.findMany({
      where: {
        status: { not: MATERIAL_STATUS.DISCARDED },
        product: { deletedAt: null },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    }),
  ]);

  return {
    deletedProductIds: deletedProducts.map((product) => product.id),
    discardedMaterialPaths: discardedMaterials.flatMap((material) => [material.filePath, material.thumbnailPath]),
    productMappings: compactMap(activeProducts),
    materialMappings: compactMap(activeMaterials),
  };
}

async function rewriteProductPathColumns(tx: Prisma.TransactionClient, productMappings: IdMapping[]) {
  for (const mapping of changedOnly(productMappings)) {
    const oldPrefix = `uploads/products/${mapping.oldId}/`;
    const newPrefix = `uploads/products/${mapping.newId}/`;

    for (const target of PRODUCT_PATH_COLUMNS) {
      await tx.$executeRawUnsafe(
        `UPDATE "${target.table}" SET "${target.column}" = replace("${target.column}", ?, ?) WHERE "${target.column}" LIKE ?`,
        oldPrefix,
        newPrefix,
        `${oldPrefix}%`,
      );
    }
  }
}

async function updatePrimaryKeys(tx: Prisma.TransactionClient, table: "Product" | "Material", mappings: IdMapping[]) {
  const changed = changedOnly(mappings);

  for (const mapping of changed) {
    await tx.$executeRawUnsafe(`UPDATE "${table}" SET "id" = ? WHERE "id" = ?`, -mapping.oldId, mapping.oldId);
  }

  for (const mapping of changed) {
    await tx.$executeRawUnsafe(`UPDATE "${table}" SET "id" = ? WHERE "id" = ?`, mapping.newId, -mapping.oldId);
  }
}

async function updateScreenshotSourceIds(tx: Prisma.TransactionClient, input: {
  productMappings: IdMapping[];
  materialMappings: IdMapping[];
}) {
  for (const mapping of changedOnly(input.productMappings)) {
    await tx.screenshotRecognitionJob.updateMany({
      where: { sourceType: "product", sourceId: String(mapping.oldId) },
      data: { sourceId: String(mapping.newId) },
    });
  }

  for (const mapping of changedOnly(input.materialMappings)) {
    await tx.screenshotRecognitionJob.updateMany({
      where: { sourceType: "material", sourceId: String(mapping.oldId) },
      data: { sourceId: String(mapping.newId) },
    });
  }
}

async function updateImageFingerprintIds(tx: Prisma.TransactionClient, materialMappings: IdMapping[]) {
  const changed = changedOnly(materialMappings);

  for (const mapping of changed) {
    await tx.$executeRawUnsafe(
      `UPDATE "ImageFingerprint" SET "imageId" = ? WHERE "imageType" = ? AND "imageId" = ?`,
      -mapping.oldId,
      "material",
      mapping.oldId,
    );
  }

  for (const mapping of changed) {
    await tx.$executeRawUnsafe(
      `UPDATE "ImageFingerprint" SET "imageId" = ? WHERE "imageType" = ? AND "imageId" = ?`,
      mapping.newId,
      "material",
      -mapping.oldId,
    );
  }
}

async function deleteInactiveMaterialImageReferences(tx: Prisma.TransactionClient, activeMaterialIds: number[]) {
  if (activeMaterialIds.length === 0) {
    await tx.imageFingerprint.deleteMany({ where: { imageType: "material" } });
    await tx.imageReviewLog.deleteMany({
      where: {
        OR: [{ sourceType: "material" }, { matchedType: "material" }],
      },
    });
    return;
  }

  await tx.imageReviewLog.deleteMany({
    where: {
      OR: [
        { sourceType: "material", sourceId: { notIn: activeMaterialIds } },
        { matchedType: "material", matchedId: { notIn: activeMaterialIds } },
      ],
    },
  });
  await tx.imageFingerprint.deleteMany({
    where: {
      imageType: "material",
      imageId: { notIn: activeMaterialIds },
    },
  });
}

async function clearDeletedScreenshotSources(tx: Prisma.TransactionClient) {
  await tx.screenshotRecognitionJob.updateMany({
    where: { sourceType: "product", productId: null },
    data: { sourceId: null },
  });
  await tx.screenshotRecognitionJob.updateMany({
    where: { sourceType: "material", materialId: null },
    data: { sourceId: null },
  });
}

async function updateImageFingerprintProductIds(tx: Prisma.TransactionClient, productMappings: IdMapping[]) {
  for (const mapping of changedOnly(productMappings)) {
    await tx.imageFingerprint.updateMany({
      where: { productId: mapping.oldId },
      data: { productId: mapping.newId },
    });
  }
}

async function updateImageReviewLogIds(tx: Prisma.TransactionClient, materialMappings: IdMapping[]) {
  for (const mapping of changedOnly(materialMappings)) {
    await tx.imageReviewLog.updateMany({
      where: { sourceType: "material", sourceId: mapping.oldId },
      data: { sourceId: mapping.newId },
    });
    await tx.imageReviewLog.updateMany({
      where: { matchedType: "material", matchedId: mapping.oldId },
      data: { matchedId: mapping.newId },
    });
  }
}

function rewriteProductActionUrl(value: string | null, productMappings: IdMapping[]) {
  if (!value) return value;

  for (const mapping of changedOnly(productMappings)) {
    const exact = `/products/${mapping.oldId}`;
    if (value === exact) return `/products/${mapping.newId}`;
    if (value.startsWith(`${exact}?`)) return value.replace(exact, `/products/${mapping.newId}`);
    if (value.startsWith(`${exact}/`)) return value.replace(exact, `/products/${mapping.newId}`);
  }

  return value;
}

async function updateNotifications(tx: Prisma.TransactionClient, productMappings: IdMapping[]) {
  const notifications = await tx.appNotification.findMany({
    where: {
      OR: [{ relatedType: "Product" }, { actionUrl: { contains: "/products/" } }],
    },
    select: { id: true, relatedType: true, relatedId: true, actionUrl: true },
  });

  for (const notification of notifications) {
    const data: { relatedId?: string | null; actionUrl?: string | null } = {};

    if (notification.relatedType === "Product" && notification.relatedId) {
      const nextId = getMappingValue(productMappings, Number(notification.relatedId));
      if (nextId) data.relatedId = String(nextId);
    }

    const nextUrl = rewriteProductActionUrl(notification.actionUrl, productMappings);
    if (nextUrl !== notification.actionUrl) data.actionUrl = nextUrl;

    if (Object.keys(data).length > 0) {
      await tx.appNotification.update({ where: { id: notification.id }, data });
    }
  }
}

async function updateCleanupLogRelatedIds(tx: Prisma.TransactionClient, input: {
  productMappings: IdMapping[];
  materialMappings: IdMapping[];
}) {
  for (const mapping of changedOnly(input.productMappings)) {
    await tx.cleanupLog.updateMany({
      where: { relatedType: "Product.mainImage", relatedId: String(mapping.oldId) },
      data: { relatedId: String(mapping.newId) },
    });
  }

  for (const mapping of changedOnly(input.materialMappings)) {
    await tx.cleanupLog.updateMany({
      where: {
        relatedType: { in: ["Material.file", "Material.thumbnail"] },
        relatedId: String(mapping.oldId),
      },
      data: { relatedId: String(mapping.newId) },
    });
  }
}

async function updateSqliteSequence(tx: Prisma.TransactionClient, tableName: "Product" | "Material", maxId: number) {
  await tx.$executeRawUnsafe(`DELETE FROM "sqlite_sequence" WHERE "name" = ?`, tableName);
  await tx.$executeRawUnsafe(`INSERT INTO "sqlite_sequence" ("name", "seq") VALUES (?, ?)`, tableName, maxId);
}

async function applyDatabaseCompaction(plan: CompactRealIdsPlan) {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");

  await prisma.$transaction(async (tx) => {
    await tx.material.deleteMany({ where: { status: MATERIAL_STATUS.DISCARDED } });
    await tx.product.deleteMany({ where: { deletedAt: { not: null } } });
    await deleteInactiveMaterialImageReferences(
      tx,
      plan.materialMappings.map((mapping) => mapping.oldId),
    );
    await clearDeletedScreenshotSources(tx);

    await rewriteProductPathColumns(tx, plan.productMappings);
    await updatePrimaryKeys(tx, "Product", plan.productMappings);
    await updateImageFingerprintProductIds(tx, plan.productMappings);

    await updateImageFingerprintIds(tx, plan.materialMappings);
    await updateImageReviewLogIds(tx, plan.materialMappings);
    await updatePrimaryKeys(tx, "Material", plan.materialMappings);
    await updateScreenshotSourceIds(tx, {
      productMappings: plan.productMappings,
      materialMappings: plan.materialMappings,
    });
    await updateNotifications(tx, plan.productMappings);
    await updateCleanupLogRelatedIds(tx, {
      productMappings: plan.productMappings,
      materialMappings: plan.materialMappings,
    });
    await updateSqliteSequence(tx, "Product", plan.productMappings.length);
    await updateSqliteSequence(tx, "Material", plan.materialMappings.length);

    await tx.operationLog.create({
      data: {
        action: "COMPACT_REAL_IDS",
        detail: `开发期真实 ID 整理：products=${changedOnly(plan.productMappings).length} / materials=${changedOnly(plan.materialMappings).length}`,
      },
    });
  });
}

export async function compactRealProductAndMaterialIds(): Promise<CompactRealIdsResult> {
  ensureProductWritesAllowed();

  let staged: StagedProductDirectory[] = [];

  try {
    const plan = await buildCompactPlan();
    const { createManualBackup } = await import(
      /* turbopackIgnore: true */
      "@/lib/services/backup-service"
    );
    await createManualBackup();

    const uploadsRoot = await ensureLocalDirectory("uploads");
    const productsRoot = path.join(uploadsRoot, "products");
    await mkdir(productsRoot, { recursive: true });

    const removedDiscardedMaterialFileCount = await removeDiscardedMaterialFiles(plan.discardedMaterialPaths);
    const activeOldProductIds = new Set(plan.productMappings.map((mapping) => mapping.oldId));
    const orphanFinalTargetIds = changedOnly(plan.productMappings)
      .map((mapping) => mapping.newId)
      .filter((newId) => !activeOldProductIds.has(newId));
    const removedProductFolderCount = await removeProductDirectories(
      Array.from(new Set([...plan.deletedProductIds, ...orphanFinalTargetIds])),
      productsRoot,
    );

    const tempRoot = assertInsideDirectory(
      productsRoot,
      path.join(productsRoot, `__real-id-maintenance-${Date.now()}`),
    );
    await mkdir(tempRoot, { recursive: true });

    staged = await stageProductDirectories({
      mappings: plan.productMappings,
      productsRoot,
      tempRoot,
    });

    const productFolderRenameCount = await finalizeProductDirectories(staged);

    try {
      await applyDatabaseCompaction(plan);
    } catch (error) {
      await rollbackProductDirectories(staged);
      throw error;
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }

    return {
      backupCreated: true,
      hardDeletedProductCount: plan.deletedProductIds.length,
      discardedMaterialCount: plan.discardedMaterialPaths.length / 2,
      productIdChangeCount: changedOnly(plan.productMappings).length,
      materialIdChangeCount: changedOnly(plan.materialMappings).length,
      productFolderRenameCount,
      removedProductFolderCount,
      removedDiscardedMaterialFileCount,
    };
  } catch (error) {
    if (staged.length > 0) {
      await rollbackProductDirectories(staged);
    }

    throw normalizeProductWriteError(error);
  }
}
