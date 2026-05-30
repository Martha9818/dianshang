import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { formatBytes, getBackupDisplayPath, getBackupRootDirectory, getBackupSummary, getRecentBackupLogs } from "@/lib/services/backup-log-service";
import { copyFileOrDirectory, getScopedPathSizeBytes } from "@/lib/services/file-copy-service";
import { ensureLocalDirectory } from "@/lib/services/local-paths";
import { getRuntimeModeSummary, normalizeProductWriteError } from "@/lib/services/product-runtime-service";
import { BackupReadonlyError } from "@/lib/services/thread07-errors";
import { notifyBackupCompleted, notifyBackupFailed } from "@/lib/services/notificationService";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function buildBackupFolderName(date = new Date()) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message.trim() ? error.message : "未知错误";
}

function getSqliteDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const filePrefix = "file:";

  if (!databaseUrl.startsWith(filePrefix)) {
    throw new Error("当前 DATABASE_URL 不是本地 SQLite file 路径，无法执行本地备份。");
  }

  const rawPath = databaseUrl.slice(filePrefix.length);
  return path.isAbsolute(rawPath)
    ? rawPath
    : path.join(/*turbopackIgnore: true*/ process.cwd(), "prisma", rawPath);
}

async function pathExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyOptionalFile(sourcePath: string, targetPath: string) {
  if (await pathExists(sourcePath)) {
    await copyFileOrDirectory(sourcePath, targetPath);
  }
}

export async function copySqliteDatabaseFiles(databasePath: string, targetDir: string) {
  const baseName = path.basename(databasePath);
  await copyFileOrDirectory(databasePath, path.join(targetDir, baseName));

  for (const suffix of ["-wal", "-shm"]) {
    await copyOptionalFile(`${databasePath}${suffix}`, path.join(targetDir, `${baseName}${suffix}`));
  }
}

export { formatBytes, getBackupRootDirectory, getBackupSummary, getRecentBackupLogs };

export async function createManualBackup() {
  const runtime = getRuntimeModeSummary();

  if (!runtime.isWritable) {
    throw new BackupReadonlyError();
  }

  const targetDir = path.join(getBackupRootDirectory(), buildBackupFolderName());
  let logId: number | null = null;

  try {
    await ensureLocalDirectory("backups");
    const log = await prisma.backupLog.create({
      data: {
        backupPath: targetDir,
        status: "进行中",
      },
    });
    logId = log.id;

    await mkdir(targetDir, { recursive: true });
    const uploadsDirectory = await ensureLocalDirectory("uploads");

    const databasePath = getSqliteDatabasePath();
    await copySqliteDatabaseFiles(databasePath, targetDir);
    await copyFileOrDirectory(uploadsDirectory, path.join(targetDir, "uploads"));

    const size = await getScopedPathSizeBytes(getBackupRootDirectory(), targetDir);

    const completedLog = await prisma.backupLog.update({
      where: { id: logId },
      data: {
        status: "成功",
        size,
        errorMessage: null,
      },
    });
    await notifyBackupCompleted({
      backupLogId: completedLog.id,
      displayPath: getBackupDisplayPath(completedLog.backupPath),
    });
    return completedLog;
  } catch (error) {
    const message = getErrorMessage(error);

    if (logId) {
      await prisma.backupLog.update({
        where: { id: logId },
        data: {
          status: "失败",
          errorMessage: message,
        },
      });
    } else {
      await prisma.backupLog.create({
        data: {
          backupPath: targetDir,
          status: "失败",
          errorMessage: message,
        },
      });
    }

    await notifyBackupFailed({ error });
    throw normalizeProductWriteError(error);
  }
}
