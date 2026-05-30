import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getLocalDirectoryDisplayPath, getLocalDirectoryPath } from "@/lib/services/local-paths/localPathsService";
import { sanitizeFileName } from "@/lib/services/local-paths/pathSafetyService";
import { normalizeProductReadError } from "@/lib/services/product-runtime-service";

export function getBackupRootDirectory() {
  return getLocalDirectoryPath("backups");
}

export function getBackupDisplayPath(backupPath?: string | null) {
  const fallback = getLocalDirectoryDisplayPath("backups");
  const rawPath = backupPath?.trim();

  if (!rawPath) {
    return fallback;
  }

  const backupRoot = path.resolve(getBackupRootDirectory());

  try {
    const resolvedPath = path.resolve(rawPath);
    const relativePath = path.relative(backupRoot, resolvedPath);
    const isInsideBackupRoot =
      relativePath && relativePath !== "." && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);

    if (!relativePath || relativePath === ".") {
      return fallback;
    }

    if (isInsideBackupRoot) {
      const safeSegments = relativePath
        .split(/[\\/]+/)
        .filter(Boolean)
        .map((segment) => sanitizeFileName(segment, "backup"));

      return safeSegments.length > 0 ? `${fallback}${safeSegments.join("/")}/` : fallback;
    }
  } catch {
    // Fall back to a basename-only label below.
  }

  const normalizedPath = rawPath.replace(/[\\/]+$/g, "");
  const fallbackName = normalizedPath.split(/[\\/]+/).filter(Boolean).at(-1) ?? normalizedPath;
  const safeName = sanitizeFileName(fallbackName, "backup");

  return safeName ? `${fallback}${safeName}/` : fallback;
}

export async function getRecentBackupLogs(limit = 8) {
  try {
    const logs = await prisma.backupLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return logs.map((log) => ({
      ...log,
      backupDisplayPath: getBackupDisplayPath(log.backupPath),
    }));
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getBackupSummary() {
  try {
    const [latest, count] = await Promise.all([
      prisma.backupLog.findFirst({
        where: { status: "成功" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.backupLog.count(),
    ]);

    return {
      latest,
      count,
      backupRoot: getBackupRootDirectory(),
      backupRootDisplayPath: getBackupDisplayPath(getBackupRootDirectory()),
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export function formatBytes(value: number | null | undefined) {
  if (!value || value <= 0) {
    return "--";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
