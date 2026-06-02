import { access, mkdir, readdir, rename, rm, rmdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  FILE_MAINTENANCE_SCOPES,
  PREVIEW_FILE_MAINTENANCE_MESSAGE,
  type CleanupOperationSummary,
  type FileMaintenanceItem,
  type FileMaintenancePageData,
  type FileMaintenanceScope,
  type TrashFileItem,
} from "@/lib/modules/cleanup/fileMaintenanceTypes";
import { BUSINESS_ERROR_CODES, ProductBusinessError, formatDateTime } from "@/lib/modules/products";
import {
  ensureLocalDirectory,
  getLocalDirectoryPath,
  type LocalDirectoryKey,
} from "@/lib/services/local-paths";
import { assertPathLength, assertSafeRelativePath, createShortFileName } from "@/lib/services/local-paths/pathSafetyService";
import { logError, sanitizeLogMessage } from "@/lib/services/logging";
import { notifyCleanupCompleted } from "@/lib/services/notificationService";
import { buildReadonlyRuntimeMessage, getRuntimeModeSummary } from "@/lib/services/runtime";
import { normalizeProductReadError } from "@/lib/services/product-runtime-service";

const OLD_EXPORT_DAYS = 30;
const OLD_BACKUP_DAYS = 30;
const MAX_SCAN_FILES_PER_SCOPE = 1500;
const MAX_CLEANUP_LOG_FILE_SIZE = 2_147_483_647;
const SKIPPED_FILE_NAMES = new Set([".gitkeep", ".DS_Store", "Thumbs.db"]);

type FileReference = {
  relatedType: string;
  relatedId: string;
  active: boolean;
  reason: string;
};

type ScopedPath = {
  appRelativePath: string;
  scopeRelativePath: string;
  absolutePath: string;
};

type ScopedFilesystemEntry = {
  relativePath: string;
  absolutePath: string;
  stats: Awaited<ReturnType<typeof stat>>;
  itemKind: "file" | "directory";
};

type MoveSelection = {
  scope: FileMaintenanceScope;
  relativePath: string;
};

type DeleteSelection = {
  trashRelativePath: string;
};

function isFileMaintenanceScope(value: string): value is FileMaintenanceScope {
  return (FILE_MAINTENANCE_SCOPES as readonly string[]).includes(value);
}

function normalizeSeparators(value: string) {
  return value.replaceAll("\\", "/");
}

function stripScopePrefix(scope: FileMaintenanceScope | "trash", relativePath: string) {
  const normalized = normalizeSeparators(relativePath).replace(/^\/+/, "");
  return normalized.startsWith(`${scope}/`) ? normalized.slice(scope.length + 1) : normalized;
}

function hasUnsafeSegment(relativePath: string) {
  return normalizeSeparators(relativePath)
    .split("/")
    .some((segment) => segment === "." || segment === "..");
}

function assertInsideDirectory(root: string, targetPath: string) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedRoot, resolvedTarget);

  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "文件路径无效，请重新扫描后再操作。");
  }

  return resolvedTarget;
}

function resolveScopedPath(scope: FileMaintenanceScope, relativePath: string): ScopedPath {
  const scopeRelativePath = stripScopePrefix(scope, relativePath);

  if (hasUnsafeSegment(scopeRelativePath)) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "文件路径无效，请重新扫描后再操作。");
  }

  const safeRelativePath = assertSafeRelativePath(scopeRelativePath);
  const root = getLocalDirectoryPath(scope);
  const absolutePath = assertInsideDirectory(root, path.resolve(root, safeRelativePath));
  assertPathLength(absolutePath);

  return {
    appRelativePath: `${scope}/${normalizeSeparators(safeRelativePath)}`,
    scopeRelativePath: normalizeSeparators(safeRelativePath),
    absolutePath,
  };
}

function resolveTrashPath(trashRelativePath: string) {
  const scopeRelativePath = stripScopePrefix("trash", trashRelativePath);

  if (hasUnsafeSegment(scopeRelativePath)) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "回收站文件路径无效，请重新扫描后再操作。");
  }

  const safeRelativePath = assertSafeRelativePath(scopeRelativePath);
  const trashRoot = getLocalDirectoryPath("trash");
  const absolutePath = assertInsideDirectory(trashRoot, path.resolve(trashRoot, safeRelativePath));
  assertPathLength(absolutePath);

  return {
    trashRelativePath: `trash/${normalizeSeparators(safeRelativePath)}`,
    trashScopeRelativePath: normalizeSeparators(safeRelativePath),
    absolutePath,
  };
}

function buildTrashDestination(scope: FileMaintenanceScope, originalScopeRelativePath: string) {
  const timestamp = createShortFileName({ prefix: `${scope}-${new Date().toISOString().replace(/[:.]/g, "-")}` }).replace(/\.[^.]+$/, "");
  const trashScopeRelativePath = normalizeSeparators(path.join(scope, timestamp, originalScopeRelativePath));
  const trashRoot = getLocalDirectoryPath("trash");
  const absolutePath = assertInsideDirectory(trashRoot, path.resolve(trashRoot, trashScopeRelativePath));
  assertPathLength(absolutePath);

  return {
    trashRelativePath: `trash/${trashScopeRelativePath}`,
    absolutePath,
  };
}

function toFileSizeNumber(value: number | bigint | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = typeof value === "bigint" ? Number(value) : value;
  return Number.isFinite(numeric) ? Math.max(0, numeric) : null;
}

function formatBytes(value: number | bigint | null | undefined) {
  const numeric = toFileSizeNumber(value);

  if (!numeric || numeric <= 0) {
    return "--";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = numeric;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatNullableDate(value: Date | null) {
  return value ? formatDateTime(value) : "--";
}

function getFileType(relativePath: string, itemKind: "file" | "directory" = "file") {
  if (itemKind === "directory") {
    return "DIR";
  }

  const extension = path.extname(relativePath).replace(".", "").toLowerCase();
  return extension ? extension.toUpperCase() : "FILE";
}

function getOldCutoff(days: number) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function clampCleanupLogSize(value: number | bigint | null | undefined) {
  const numeric = toFileSizeNumber(value);

  if (numeric === null || !Number.isFinite(numeric)) {
    return null;
  }

  return Math.max(0, Math.min(MAX_CLEANUP_LOG_FILE_SIZE, Math.floor(numeric)));
}

function getReadonlyMaintenanceData(runtime = getRuntimeModeSummary()): FileMaintenancePageData {
  return {
    runtime,
    scannedAt: null,
    readonlyMessage: PREVIEW_FILE_MAINTENANCE_MESSAGE,
    items: [],
    trashItems: [],
    logs: [],
    stats: {
      total: 0,
      movable: 0,
      missing: 0,
      trash: 0,
      byScope: { uploads: 0, exports: 0, backups: 0 },
    },
  };
}

function buildStats(items: FileMaintenanceItem[], trashItems: TrashFileItem[]) {
  return {
    total: items.length,
    movable: items.filter((item) => item.canMoveToTrash).length,
    missing: items.filter((item) => !item.exists).length,
    trash: trashItems.length,
    byScope: {
      uploads: items.filter((item) => item.scope === "uploads").length,
      exports: items.filter((item) => item.scope === "exports").length,
      backups: items.filter((item) => item.scope === "backups").length,
    },
  };
}

async function pathExists(absolutePath: string) {
  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function listFilesUnderScope(scope: FileMaintenanceScope | "trash") {
  const root = await ensureLocalDirectory(scope as LocalDirectoryKey);
  const entries: ScopedFilesystemEntry[] = [];
  let limitReached = false;

  function canCollectMore() {
    return !limitReached && entries.length < MAX_SCAN_FILES_PER_SCOPE;
  }

  async function collectEntry(input: Omit<ScopedFilesystemEntry, "stats">) {
    if (!canCollectMore()) {
      limitReached = true;
      return;
    }

    entries.push({
      ...input,
      stats: await stat(input.absolutePath),
    });
    limitReached = entries.length >= MAX_SCAN_FILES_PER_SCOPE;
  }

  async function walk(currentPath: string): Promise<boolean> {
    if (limitReached) {
      return true;
    }

    const directoryEntries = await readdir(currentPath, { withFileTypes: true });
    let hasVisibleChildren = false;

    for (const entry of directoryEntries) {
      if (limitReached) {
        break;
      }

      const absolutePath = path.join(currentPath, entry.name);
      const relativeToRoot = normalizeSeparators(path.relative(root, absolutePath));

      if (!relativeToRoot || hasUnsafeSegment(relativeToRoot)) {
        continue;
      }

      if (entry.isDirectory()) {
        const childHasVisibleChildren = await walk(absolutePath);
        if (!childHasVisibleChildren && canCollectMore()) {
          await collectEntry({
            relativePath: `${scope}/${relativeToRoot}`,
            absolutePath,
            itemKind: "directory",
          });
        }
        hasVisibleChildren = true;
        continue;
      }

      if (!entry.isFile() || SKIPPED_FILE_NAMES.has(entry.name)) {
        continue;
      }

      await collectEntry({
        relativePath: `${scope}/${relativeToRoot}`,
        absolutePath,
        itemKind: "file",
      });
      hasVisibleChildren = true;
    }

    return hasVisibleChildren;
  }

  try {
    await walk(root);
  } catch (error) {
    await logError(`File maintenance scan failed for ${scope}: ${sanitizeLogMessage(error)}`);
  }

  return entries;
}

function addReference(map: Map<string, FileReference[]>, relativePath: string | null | undefined, reference: FileReference) {
  if (!relativePath?.trim()) {
    return;
  }

  const normalized = normalizeSeparators(relativePath).replace(/^\/+/, "");
  const appRelativePath = normalized.startsWith("uploads/") ? normalized : `uploads/${normalized}`;

  if (hasUnsafeSegment(appRelativePath)) {
    return;
  }

  const current = map.get(appRelativePath) ?? [];
  current.push(reference);
  map.set(appRelativePath, current);
}

async function collectUploadReferences() {
  const map = new Map<string, FileReference[]>();

  const [products, competitors, materials, inspirations] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, deletedAt: true, mainImagePath: true },
    }),
    prisma.competitor.findMany({
      select: {
        id: true,
        screenshotPath: true,
        product: { select: { id: true, deletedAt: true } },
      },
    }),
    prisma.material.findMany({
      select: {
        id: true,
        filePath: true,
        thumbnailPath: true,
        product: { select: { id: true, deletedAt: true } },
      },
    }),
    prisma.inspiration.findMany({
      select: { id: true, imagePath: true, thumbnailPath: true, status: true },
    }),
  ]);

  for (const product of products) {
    addReference(map, product.mainImagePath, {
      relatedType: "Product.mainImage",
      relatedId: String(product.id),
      active: product.deletedAt === null,
      reason: product.deletedAt ? "关联商品已软删除。" : "正在使用的商品主图。",
    });
  }

  for (const competitor of competitors) {
    addReference(map, competitor.screenshotPath, {
      relatedType: "Competitor.screenshot",
      relatedId: String(competitor.id),
      active: competitor.product.deletedAt === null,
      reason: competitor.product.deletedAt ? "关联商品已软删除，竞品截图不再属于活跃商品。" : "正在使用的竞品截图。",
    });
  }

  for (const material of materials) {
    const reference = {
      relatedType: "Material.file",
      relatedId: String(material.id),
      active: material.product.deletedAt === null,
      reason: material.product.deletedAt ? "关联商品已软删除，素材可人工清理。" : "正在使用的素材文件。",
    };
    addReference(map, material.filePath, reference);
    addReference(map, material.thumbnailPath, { ...reference, relatedType: "Material.thumbnail" });
  }

  for (const inspiration of inspirations) {
    const active = !["archived", "rejected"].includes(inspiration.status);
    const reference = {
      relatedType: "Inspiration.image",
      relatedId: String(inspiration.id),
      active,
      reason: active ? "正在使用的灵感图片。" : "关联灵感已归档或拒绝，可人工清理。",
    };
    addReference(map, inspiration.imagePath, reference);
    addReference(map, inspiration.thumbnailPath, { ...reference, relatedType: "Inspiration.thumbnail" });
  }

  return map;
}

function getPrimaryReference(references: FileReference[] | undefined) {
  if (!references?.length) {
    return null;
  }

  return references.find((reference) => reference.active) ?? references[0];
}

function buildUploadItem(input: {
  relativePath: string;
  stats: Awaited<ReturnType<typeof stat>> | null;
  references: FileReference[] | undefined;
  exists: boolean;
  itemKind: "file" | "directory";
}): FileMaintenanceItem {
  const primaryReference = getPrimaryReference(input.references);
  const hasActiveReference = Boolean(input.references?.some((reference) => reference.active));
  const hasSoftDeletedReference = Boolean(input.references?.length && !hasActiveReference);
  const fileName = path.basename(input.relativePath);

  if (input.itemKind === "directory") {
    return {
      id: input.relativePath,
      scope: "uploads",
      relativePath: input.relativePath,
      itemKind: "directory",
      fileName,
      fileType: getFileType(input.relativePath, "directory"),
      fileSize: null,
      fileSizeLabel: "--",
      modifiedAt: input.stats?.mtime.toISOString() ?? null,
      modifiedAtLabel: formatNullableDate(input.stats?.mtime ?? null),
      exists: input.exists,
      relatedType: null,
      relatedId: null,
      relationStatus: "orphan",
      relationStatusLabel: "空目录",
      recommendation: "move_to_trash",
      recommendationLabel: "建议移入回收站",
      reason: "目录中没有文件，也没有活跃业务引用；可通过现有回收站流程手动清理。",
      canMoveToTrash: true,
      warningLevel: "warning",
    };
  }

  if (!input.exists) {
    return {
      id: input.relativePath,
      scope: "uploads",
      relativePath: input.relativePath,
      itemKind: "file",
      fileName,
      fileType: getFileType(input.relativePath, "file"),
      fileSize: null,
      fileSizeLabel: "--",
      modifiedAt: null,
      modifiedAtLabel: "--",
      exists: false,
      relatedType: primaryReference?.relatedType ?? null,
      relatedId: primaryReference?.relatedId ?? null,
      relationStatus: "missing_file",
      relationStatusLabel: "文件缺失",
      recommendation: "missing_file",
      recommendationLabel: "仅提示缺失，不自动改数据库",
      reason: "数据库仍有文件记录，但本地文件不存在。",
      canMoveToTrash: false,
      warningLevel: "warning",
    };
  }

  if (hasActiveReference) {
    return {
      id: input.relativePath,
      scope: "uploads",
      relativePath: input.relativePath,
      itemKind: "file",
      fileName,
      fileType: getFileType(input.relativePath, "file"),
      fileSize: toFileSizeNumber(input.stats?.size),
      fileSizeLabel: formatBytes(input.stats?.size),
      modifiedAt: input.stats?.mtime.toISOString() ?? null,
      modifiedAtLabel: formatNullableDate(input.stats?.mtime ?? null),
      exists: true,
      relatedType: primaryReference?.relatedType ?? null,
      relatedId: primaryReference?.relatedId ?? null,
      relationStatus: "active_reference",
      relationStatusLabel: "有效关联",
      recommendation: "keep",
      recommendationLabel: "保留",
      reason: primaryReference?.reason ?? "数据库仍有关联。",
      canMoveToTrash: false,
      warningLevel: "info",
    };
  }

  if (hasSoftDeletedReference) {
    return {
      id: input.relativePath,
      scope: "uploads",
      relativePath: input.relativePath,
      itemKind: "file",
      fileName,
      fileType: getFileType(input.relativePath, "file"),
      fileSize: toFileSizeNumber(input.stats?.size),
      fileSizeLabel: formatBytes(input.stats?.size),
      modifiedAt: input.stats?.mtime.toISOString() ?? null,
      modifiedAtLabel: formatNullableDate(input.stats?.mtime ?? null),
      exists: true,
      relatedType: primaryReference?.relatedType ?? null,
      relatedId: primaryReference?.relatedId ?? null,
      relationStatus: "soft_deleted_reference",
      relationStatusLabel: "软删除对象关联",
      recommendation: "review_before_trash",
      recommendationLabel: "人工确认后移入回收站",
      reason: primaryReference?.reason ?? "仅关联已软删除对象。",
      canMoveToTrash: true,
      warningLevel: "warning",
    };
  }

  return {
    id: input.relativePath,
    scope: "uploads",
    relativePath: input.relativePath,
    itemKind: "file",
    fileName,
    fileType: getFileType(input.relativePath, "file"),
    fileSize: toFileSizeNumber(input.stats?.size),
    fileSizeLabel: formatBytes(input.stats?.size),
    modifiedAt: input.stats?.mtime.toISOString() ?? null,
    modifiedAtLabel: formatNullableDate(input.stats?.mtime ?? null),
    exists: true,
    relatedType: null,
    relatedId: null,
    relationStatus: "orphan",
    relationStatusLabel: "孤儿文件",
    recommendation: "move_to_trash",
    recommendationLabel: "建议移入回收站",
    reason: "未在商品主图、竞品截图、素材或灵感记录中找到关联。",
    canMoveToTrash: true,
    warningLevel: "warning",
  };
}

async function buildUploadItems() {
  const [entries, references] = await Promise.all([listFilesUnderScope("uploads"), collectUploadReferences()]);
  const items = entries.map((entry) =>
    buildUploadItem({
      relativePath: entry.relativePath,
      stats: entry.stats,
      references: references.get(entry.relativePath),
      exists: true,
      itemKind: entry.itemKind,
    }),
  );

  const existingPaths = new Set(entries.map((entry) => entry.relativePath));
  for (const [relativePath, fileReferences] of references.entries()) {
    if (existingPaths.has(relativePath)) {
      continue;
    }

    items.push(buildUploadItem({ relativePath, stats: null, references: fileReferences, exists: false, itemKind: "file" }));
  }

  return items;
}

function buildGeneratedFileItem(input: {
  scope: "exports" | "backups";
  relativePath: string;
  stats: Awaited<ReturnType<typeof stat>>;
  isOld: boolean;
  relatedType: string | null;
  relatedId: string | null;
}): FileMaintenanceItem {
  const isBackup = input.scope === "backups";
  const canMove = input.isOld;

  return {
    id: input.relativePath,
    scope: input.scope,
    relativePath: input.relativePath,
    itemKind: "file",
    fileName: path.basename(input.relativePath),
    fileType: getFileType(input.relativePath, "file"),
    fileSize: toFileSizeNumber(input.stats.size),
    fileSizeLabel: formatBytes(input.stats.size),
    modifiedAt: input.stats.mtime.toISOString(),
    modifiedAtLabel: formatNullableDate(input.stats.mtime),
    exists: true,
    relatedType: input.relatedType,
    relatedId: input.relatedId,
    relationStatus: input.relatedType ? "log_reference" : "orphan",
    relationStatusLabel: input.relatedType ? "操作日志关联" : "无日志关联",
    recommendation: canMove ? (isBackup ? "backup_warning" : "move_to_trash") : "keep",
    recommendationLabel: canMove ? (isBackup ? "旧备份，可谨慎移入回收站" : "旧导出，建议移入回收站") : "保留",
    reason: canMove
      ? isBackup
        ? `修改时间超过 ${OLD_BACKUP_DAYS} 天；备份删除后无法用于恢复。`
        : `修改时间超过 ${OLD_EXPORT_DAYS} 天。`
      : "未达到旧文件阈值。",
    canMoveToTrash: canMove,
    warningLevel: canMove ? (isBackup ? "danger" : "warning") : "info",
  };
}

function buildDirectoryItem(input: {
  scope: FileMaintenanceScope;
  relativePath: string;
  stats: Awaited<ReturnType<typeof stat>>;
}): FileMaintenanceItem {
  return {
    id: input.relativePath,
    scope: input.scope,
    relativePath: input.relativePath,
    itemKind: "directory",
    fileName: path.basename(input.relativePath),
    fileType: getFileType(input.relativePath, "directory"),
    fileSize: null,
    fileSizeLabel: "--",
    modifiedAt: input.stats.mtime.toISOString(),
    modifiedAtLabel: formatNullableDate(input.stats.mtime),
    exists: true,
    relatedType: null,
    relatedId: null,
    relationStatus: "orphan",
    relationStatusLabel: "空目录",
    recommendation: "move_to_trash",
    recommendationLabel: "建议移入回收站",
    reason: "目录中没有文件，保留意义较低；可按现有回收站流程手动清理。",
    canMoveToTrash: true,
    warningLevel: "warning",
  };
}

function buildMissingLogItem(input: {
  scope: "exports" | "backups";
  relativePath: string;
  relatedType: string;
  relatedId: string;
}): FileMaintenanceItem {
  return {
    id: input.relativePath,
    scope: input.scope,
    relativePath: input.relativePath,
    itemKind: "file",
    fileName: path.basename(input.relativePath),
    fileType: getFileType(input.relativePath, "file"),
    fileSize: null,
    fileSizeLabel: "--",
    modifiedAt: null,
    modifiedAtLabel: "--",
    exists: false,
    relatedType: input.relatedType,
    relatedId: input.relatedId,
    relationStatus: "missing_file",
    relationStatusLabel: "文件缺失",
    recommendation: "missing_file",
    recommendationLabel: "仅提示缺失，不自动改数据库",
    reason: "数据库日志仍有文件记录，但本地文件不存在。",
    canMoveToTrash: false,
    warningLevel: "warning",
  };
}

async function collectExportLogReferences() {
  const exportsRoot = getLocalDirectoryPath("exports");
  const logs = await prisma.exportLog.findMany({ select: { id: true, filePath: true, fileName: true } });
  const map = new Map<string, { relatedType: string; relatedId: string }>();

  for (const log of logs) {
    try {
      const resolved = path.resolve(log.filePath);
      const relative = path.relative(exportsRoot, resolved);
      const inside = relative && !relative.startsWith("..") && !path.isAbsolute(relative);
      const fallback = log.fileName ? log.fileName : path.basename(log.filePath);
      const relativePath = inside ? normalizeSeparators(relative) : normalizeSeparators(fallback);

      if (!relativePath || hasUnsafeSegment(relativePath)) {
        continue;
      }

      map.set(`exports/${relativePath}`, { relatedType: "ExportLog", relatedId: String(log.id) });
    } catch {
      // Ignore malformed legacy paths; the scanner will still show real files.
    }
  }

  return map;
}

async function collectBackupLogReferences() {
  const backupsRoot = getLocalDirectoryPath("backups");
  const logs = await prisma.backupLog.findMany({ select: { id: true, backupPath: true } });
  const map = new Map<string, { relatedType: string; relatedId: string; exists: boolean }>();

  for (const log of logs) {
    try {
      const resolved = path.resolve(log.backupPath);
      const relative = path.relative(backupsRoot, resolved);
      const inside = relative && !relative.startsWith("..") && !path.isAbsolute(relative);

      if (!inside || hasUnsafeSegment(relative)) {
        continue;
      }

      map.set(`backups/${normalizeSeparators(relative)}`, {
        relatedType: "BackupLog",
        relatedId: String(log.id),
        exists: await pathExists(resolved),
      });
    } catch {
      // Ignore malformed legacy paths.
    }
  }

  return map;
}

async function buildExportItems() {
  const [entries, references] = await Promise.all([listFilesUnderScope("exports"), collectExportLogReferences()]);
  const oldCutoff = getOldCutoff(OLD_EXPORT_DAYS);
  const items = entries.map((file) => {
    if (file.itemKind === "directory") {
      return buildDirectoryItem({ scope: "exports", relativePath: file.relativePath, stats: file.stats });
    }

    const reference = references.get(file.relativePath) ?? null;
    return buildGeneratedFileItem({
      scope: "exports",
      relativePath: file.relativePath,
      stats: file.stats,
      isOld: file.stats.mtime.getTime() < oldCutoff,
      relatedType: reference?.relatedType ?? null,
      relatedId: reference?.relatedId ?? null,
    });
  });
  const existingPaths = new Set(entries.map((file) => file.relativePath));

  for (const [relativePath, reference] of references.entries()) {
    if (!existingPaths.has(relativePath)) {
      items.push(buildMissingLogItem({ scope: "exports", relativePath, ...reference }));
    }
  }

  return items;
}

async function buildBackupItems() {
  const [entries, references] = await Promise.all([listFilesUnderScope("backups"), collectBackupLogReferences()]);
  const oldCutoff = getOldCutoff(OLD_BACKUP_DAYS);

  const items = entries.map((file) => {
    if (file.itemKind === "directory") {
      return buildDirectoryItem({ scope: "backups", relativePath: file.relativePath, stats: file.stats });
    }

    const reference = Array.from(references.entries()).find(([backupPath]) => file.relativePath === backupPath || file.relativePath.startsWith(`${backupPath}/`));
    return buildGeneratedFileItem({
      scope: "backups",
      relativePath: file.relativePath,
      stats: file.stats,
      isOld: file.stats.mtime.getTime() < oldCutoff,
      relatedType: reference?.[1].relatedType ?? null,
      relatedId: reference?.[1].relatedId ?? null,
    });
  });
  const existingPaths = new Set(entries.map((file) => file.relativePath));

  for (const [relativePath, reference] of references.entries()) {
    if (!reference.exists && !existingPaths.has(relativePath)) {
      items.push(buildMissingLogItem({ scope: "backups", relativePath, relatedType: reference.relatedType, relatedId: reference.relatedId }));
    }
  }

  return items;
}

async function buildTrashItems(): Promise<TrashFileItem[]> {
  const files = await listFilesUnderScope("trash");
  const moveLogs = await prisma.cleanupLog.findMany({
    where: {
      action: "move_to_trash",
      trashRelativePath: { in: files.map((file) => file.relativePath) },
    },
    orderBy: { createdAt: "desc" },
  });

  return files.map((file) => {
    const log = moveLogs.find((item) => item.trashRelativePath === file.relativePath) ?? null;

    return {
      id: file.relativePath,
      trashRelativePath: file.relativePath,
      originalRelativePath: log?.originalRelativePath ?? null,
      itemKind: file.itemKind,
      fileName: path.basename(file.relativePath),
      fileType: getFileType(file.relativePath, file.itemKind),
      fileSize: file.itemKind === "directory" ? null : toFileSizeNumber(file.stats.size),
      fileSizeLabel: file.itemKind === "directory" ? "--" : formatBytes(file.stats.size),
      modifiedAt: file.stats.mtime.toISOString(),
      modifiedAtLabel: formatNullableDate(file.stats.mtime),
    };
  });
}

export async function getRecentCleanupLogs(limit = 10) {
  return prisma.cleanupLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getInitialFileMaintenancePageData(): Promise<FileMaintenancePageData> {
  const runtime = getRuntimeModeSummary();

  if (!runtime.isWritable) {
    return getReadonlyMaintenanceData(runtime);
  }

  try {
    const logs = await getRecentCleanupLogs();
    return {
      runtime,
      scannedAt: null,
      readonlyMessage: null,
      items: [],
      trashItems: [],
      logs,
      stats: {
        total: 0,
        movable: 0,
        missing: 0,
        trash: 0,
        byScope: { uploads: 0, exports: 0, backups: 0 },
      },
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

async function collectFileMaintenanceData(): Promise<Omit<FileMaintenancePageData, "scannedAt" | "logs">> {
  const runtime = getRuntimeModeSummary();

  if (!runtime.isWritable) {
    const readonlyData = getReadonlyMaintenanceData(runtime);
    return {
      runtime: readonlyData.runtime,
      readonlyMessage: readonlyData.readonlyMessage,
      items: readonlyData.items,
      trashItems: readonlyData.trashItems,
      stats: readonlyData.stats,
    };
  }

  const [uploads, exports, backups, trashItems] = await Promise.all([
    buildUploadItems(),
    buildExportItems(),
    buildBackupItems(),
    buildTrashItems(),
  ]);
  const items = [...uploads, ...exports, ...backups].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  const stats = buildStats(items, trashItems);

  return {
    runtime,
    readonlyMessage: null,
    items,
    trashItems,
    stats,
  };
}

export async function scanFileMaintenance(): Promise<FileMaintenancePageData> {
  const runtime = getRuntimeModeSummary();

  if (!runtime.isWritable) {
    return getReadonlyMaintenanceData(runtime);
  }

  try {
    const scanData = await collectFileMaintenanceData();
    const stats = scanData.stats;
    const log = await prisma.cleanupLog.create({
      data: {
        action: "scan",
        fileScope: "all",
        status: "success",
        reason: `扫描完成：文件 ${stats.total}，建议移入回收站 ${stats.movable}，缺失 ${stats.missing}，回收站 ${stats.trash}。`,
      },
    });

    await notifyCleanupCompleted({
      summary: `文件扫描完成：发现 ${stats.total} 个本地文件记录，${stats.movable} 个建议人工清理。`,
      actionUrl: "/maintenance/files",
    });

    return {
      ...scanData,
      scannedAt: log.createdAt.toISOString(),
      logs: await getRecentCleanupLogs(),
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

function parseMoveSelection(value: string): MoveSelection | null {
  try {
    const parsed = JSON.parse(value) as Partial<MoveSelection>;
    if (!parsed.scope || !isFileMaintenanceScope(parsed.scope) || !parsed.relativePath) {
      return null;
    }

    return { scope: parsed.scope, relativePath: String(parsed.relativePath) };
  } catch {
    return null;
  }
}

function parseDeleteSelection(value: string): DeleteSelection | null {
  try {
    const parsed = JSON.parse(value) as Partial<DeleteSelection>;
    if (!parsed.trashRelativePath) {
      return null;
    }

    return { trashRelativePath: String(parsed.trashRelativePath) };
  } catch {
    return null;
  }
}

export function parseMoveSelections(values: FormDataEntryValue[]) {
  return values
    .filter((value): value is string => typeof value === "string")
    .map(parseMoveSelection)
    .filter((value): value is MoveSelection => Boolean(value));
}

export function parseDeleteSelections(values: FormDataEntryValue[]) {
  return values
    .filter((value): value is string => typeof value === "string")
    .map(parseDeleteSelection)
    .filter((value): value is DeleteSelection => Boolean(value));
}

async function createStartedCleanupLog(data: Omit<Prisma.CleanupLogUncheckedCreateInput, "status">) {
  return prisma.cleanupLog.create({
    data: {
      ...data,
      status: "skipped",
      reason: data.reason ?? "操作已开始，等待文件系统结果。",
    },
  });
}

async function updateCleanupLog(logId: number, status: "success" | "failed" | "skipped", reason: string) {
  try {
    await prisma.cleanupLog.update({
      where: { id: logId },
      data: { status, reason: sanitizeLogMessage(reason) },
    });
  } catch (error) {
    await logError(`CleanupLog update failed: ${sanitizeLogMessage(error)}`);
  }
}

async function assertMoveAllowed(selection: MoveSelection) {
  const data = await collectFileMaintenanceData();
  const item = data.items.find((candidate) => candidate.scope === selection.scope && candidate.relativePath === selection.relativePath);

  if (!item || !item.canMoveToTrash || !item.exists) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "该文件当前不允许移入回收站，请重新扫描后再操作。");
  }

  return item;
}

async function removeEmptyTrashParents(startPath: string) {
  const trashRoot = path.resolve(getLocalDirectoryPath("trash"));
  let current = path.dirname(startPath);

  while (current.startsWith(trashRoot) && current !== trashRoot) {
    try {
      await rmdir(current);
      current = path.dirname(current);
    } catch {
      break;
    }
  }
}

export async function moveFilesToTrash(input: {
  selections: MoveSelection[];
}): Promise<CleanupOperationSummary> {
  const runtime = getRuntimeModeSummary();

  if (!runtime.isWritable) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.PREVIEW_READONLY, buildReadonlyRuntimeMessage(runtime.mode));
  }

  if (input.selections.length === 0) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "请先选择要移入回收站的文件。");
  }

  const summary: CleanupOperationSummary = { successCount: 0, failedCount: 0, skippedCount: 0, errors: [] };

  for (const selection of input.selections) {
    let logId: number | null = null;
    let original: ScopedPath | null = null;

    try {
      const item = await assertMoveAllowed(selection);
      original = resolveScopedPath(selection.scope, selection.relativePath);
      const originalStats = await stat(original.absolutePath);
      const destination = buildTrashDestination(selection.scope, original.scopeRelativePath);

      const log = await createStartedCleanupLog({
        action: "move_to_trash",
        fileScope: selection.scope,
        originalRelativePath: original.appRelativePath,
        trashRelativePath: destination.trashRelativePath,
        fileSize: clampCleanupLogSize(originalStats.size),
        relatedType: item.relatedType,
        relatedId: item.relatedId,
        reason: "准备移入应用内回收站。",
      });
      logId = log.id;

      await mkdir(path.dirname(destination.absolutePath), { recursive: true });
      await rename(original.absolutePath, destination.absolutePath);
      await updateCleanupLog(log.id, "success", "已移入应用内回收站。");
      summary.successCount += 1;
    } catch (error) {
      const reason = sanitizeLogMessage(error) || "移入回收站失败。";
      if (logId) {
        await updateCleanupLog(logId, "failed", reason);
      } else {
        try {
          await prisma.cleanupLog.create({
            data: {
              action: "move_to_trash",
              fileScope: selection.scope,
              originalRelativePath: original?.appRelativePath ?? selection.relativePath,
              status: "failed",
              reason,
            },
          });
        } catch (logErrorValue) {
          await logError(`CleanupLog create failed before move: ${sanitizeLogMessage(logErrorValue)}`);
        }
      }
      summary.failedCount += 1;
      summary.errors.push({ relativePath: selection.relativePath, reason });
    }
  }

  await notifyCleanupCompleted({
    summary: `移入回收站完成：成功 ${summary.successCount}，失败 ${summary.failedCount}，跳过 ${summary.skippedCount}。`,
    actionUrl: "/maintenance/files",
  });

  return summary;
}

export async function permanentlyDeleteTrashFiles(input: {
  selections: DeleteSelection[];
}): Promise<CleanupOperationSummary> {
  const runtime = getRuntimeModeSummary();

  if (!runtime.isWritable) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.PREVIEW_READONLY, buildReadonlyRuntimeMessage(runtime.mode));
  }

  if (input.selections.length === 0) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "请先选择要永久删除的回收站文件。");
  }

  const summary: CleanupOperationSummary = { successCount: 0, failedCount: 0, skippedCount: 0, errors: [] };

  for (const selection of input.selections) {
    let logId: number | null = null;

    try {
      const trash = resolveTrashPath(selection.trashRelativePath);
      const trashStats = await stat(trash.absolutePath);
      const isTrashFile = trashStats.isFile();
      const isTrashDirectory = trashStats.isDirectory();

      if (!isTrashFile && !isTrashDirectory) {
        throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "永久删除只允许处理应用回收站中的文件或空目录。");
      }

      const moveLog = await prisma.cleanupLog.findFirst({
        where: { action: "move_to_trash", trashRelativePath: trash.trashRelativePath },
        orderBy: { createdAt: "desc" },
      });
      const log = await createStartedCleanupLog({
        action: "permanent_delete",
        fileScope: "trash",
        originalRelativePath: moveLog?.originalRelativePath ?? null,
        trashRelativePath: trash.trashRelativePath,
        fileSize: clampCleanupLogSize(trashStats.size),
        relatedType: moveLog?.relatedType ?? null,
        relatedId: moveLog?.relatedId ?? null,
        reason: "准备永久删除应用内回收站文件。",
      });
      logId = log.id;

      if (isTrashDirectory) {
        const nestedEntries = await readdir(trash.absolutePath);
        if (nestedEntries.length > 0) {
          throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "目录已不再为空，请重新扫描后再操作。");
        }
        await rm(trash.absolutePath, { recursive: true, force: true });
      } else {
        await unlink(trash.absolutePath);
      }
      await removeEmptyTrashParents(trash.absolutePath);
      await updateCleanupLog(log.id, "success", "已从应用内回收站永久删除。");
      summary.successCount += 1;
    } catch (error) {
      const reason = sanitizeLogMessage(error) || "永久删除失败。";
      if (logId) {
        await updateCleanupLog(logId, "failed", reason);
      } else {
        try {
          await prisma.cleanupLog.create({
            data: {
              action: "permanent_delete",
              fileScope: "trash",
              trashRelativePath: selection.trashRelativePath,
              status: "failed",
              reason,
            },
          });
        } catch (logErrorValue) {
          await logError(`CleanupLog create failed before permanent delete: ${sanitizeLogMessage(logErrorValue)}`);
        }
      }
      summary.failedCount += 1;
      summary.errors.push({ relativePath: selection.trashRelativePath, reason });
    }
  }

  await notifyCleanupCompleted({
    summary: `永久删除完成：成功 ${summary.successCount}，失败 ${summary.failedCount}，跳过 ${summary.skippedCount}。`,
    actionUrl: "/maintenance/files",
  });

  return summary;
}

export async function clearAcceptanceFiles(relativePaths: string[]) {
  for (const relativePath of relativePaths) {
    try {
      if (!relativePath.includes("thread06-acceptance")) {
        throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "验收清理只允许删除 thread06-acceptance 临时文件。");
      }

      if (relativePath.startsWith("trash/")) {
        const trash = resolveTrashPath(relativePath);
        await rm(trash.absolutePath, { force: true, recursive: true });
        continue;
      }

      const scope = FILE_MAINTENANCE_SCOPES.find((item) => relativePath.startsWith(`${item}/`));
      if (scope) {
        const scoped = resolveScopedPath(scope, relativePath);
        await rm(scoped.absolutePath, { force: true, recursive: true });
      }
    } catch {
      // Acceptance cleanup must not mask the real assertion result.
    }
  }
}
