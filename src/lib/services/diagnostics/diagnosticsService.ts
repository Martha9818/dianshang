import { access, readdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ensureSqliteStabilityPragmas, prisma } from "@/lib/prisma";
import { getRecentAIJobSummary, getRecentAIRequestLogSummary } from "@/lib/services/ai";
import { buildDiagnosticsMarkdown, sanitizeDiagnosticText } from "@/lib/services/diagnostics/diagnosticsSanitizer";
import type {
  DiagnosticsAIStatus,
  DiagnosticsDatabaseStatus,
  DiagnosticsImageStorageStatus,
  DiagnosticsInspirationStatus,
  DiagnosticsRecentErrors,
  DiagnosticsRuntimeMode,
  DiagnosticsSnapshot,
} from "@/lib/services/diagnostics/diagnosticsTypes";
import { getLocalDirectoryPath, getLogsFilePath, inspectLocalRuntimeDirectories } from "@/lib/services/local-paths";
import { getRuntimeModeSummary } from "@/lib/services/runtime";

const PREVIEW_READONLY_MESSAGE = "当前为预览环境，只读展示，请在 Windows 本地进行写操作验收。";
const PREVIEW_WRITE_MESSAGE = "预览环境只读，请在 Windows 本地验收。";

function getAppVersion() {
  return process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.ECOMPILOT_APP_VERSION ?? "unknown";
}

function getDiagnosticsRuntimeMode(): DiagnosticsRuntimeMode {
  const runtime = getRuntimeModeSummary();

  if (runtime.isVercel) {
    return "vercel";
  }

  if (runtime.mode === "local") {
    return "local";
  }

  if (runtime.mode === "preview" || runtime.mode === "cloud") {
    return "vercel";
  }

  return "unknown";
}

function getOsSummary(runtimeMode: DiagnosticsRuntimeMode) {
  if (runtimeMode !== "local") {
    return "unknown";
  }

  return sanitizeDiagnosticText(`${os.type()} ${os.release()} ${os.arch()}`);
}

function formatNullableDate(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

function getSafeErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error) || !error.message.trim()) {
    return fallback;
  }

  const firstLine = error.message.split(/\r?\n/)[0] ?? fallback;
  return sanitizeDiagnosticText(firstLine.slice(0, 180));
}

async function getDatabaseStatus(isWritableRuntime: boolean): Promise<DiagnosticsDatabaseStatus> {
  const sqlitePragmas = await ensureSqliteStabilityPragmas();

  if (!isWritableRuntime) {
    return {
      status: "unknown",
      canConnect: false,
      message: "预览环境不连接本地 SQLite，请在 Windows 本地验收数据库状态。",
      counts: {
        products: null,
        materials: null,
        inspirations: null,
        copywritings: null,
        multiPlatformCopywritings: null,
        promptTasks: null,
        backups: null,
        exports: null,
      },
      latestBackup: null,
      latestExport: null,
      sqlitePragmas,
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    const [products, materials, inspirations, copywritings, multiPlatformCopywritings, promptTasks, backups, exportsCount, latestBackup, latestExport] =
      await Promise.all([
        prisma.product.count({ where: { deletedAt: null } }),
        prisma.material.count(),
        prisma.inspiration.count(),
        prisma.copywriting.count(),
        prisma.copywriting
          .groupBy({
            by: ["productId", "platform"],
            where: {
              platform: {
                not: null,
              },
            },
          })
          .then((rows) => rows.length),
        prisma.promptTask.count(),
        prisma.backupLog.count(),
        prisma.exportLog.count(),
        prisma.backupLog.findFirst({ orderBy: { createdAt: "desc" }, select: { status: true, createdAt: true } }),
        prisma.exportLog.findFirst({ orderBy: { createdAt: "desc" }, select: { status: true, createdAt: true } }),
      ]);

    return {
      status: "ok",
      canConnect: true,
      message: "Prisma / SQLite 可连接。",
      counts: {
        products,
        materials,
        inspirations,
        copywritings,
        multiPlatformCopywritings,
        promptTasks,
        backups,
        exports: exportsCount,
      },
      latestBackup: latestBackup ? `status=${latestBackup.status}, time=${formatNullableDate(latestBackup.createdAt)}` : null,
      latestExport: latestExport ? `status=${latestExport.status}, time=${formatNullableDate(latestExport.createdAt)}` : null,
      sqlitePragmas,
    };
  } catch (error) {
    return {
      status: "error",
      canConnect: false,
      message: getSafeErrorMessage(error, "数据库读取失败，请在 Windows 本地检查 SQLite 和 Prisma 状态。"),
      counts: {
        products: null,
        materials: null,
        inspirations: null,
        copywritings: null,
        multiPlatformCopywritings: null,
        promptTasks: null,
        backups: null,
        exports: null,
      },
      latestBackup: null,
      latestExport: null,
      sqlitePragmas,
    };
  }
}

async function readRecentLogLines(fileName: "app.log" | "error.log", limit = 5) {
  try {
    const content = await readFile(getLogsFilePath(fileName), "utf8");
    return content
      .split(/\r?\n/)
      .map((line) => sanitizeDiagnosticText(line.trim()))
      .filter(Boolean)
      .slice(-limit);
  } catch {
    return [];
  }
}

async function getRecentErrors(isWritableRuntime: boolean): Promise<DiagnosticsRecentErrors> {
  if (!isWritableRuntime) {
    return {
      status: "unknown",
      message: "预览环境不读取真实本地日志。",
      entries: ["Vercel 预览日志仅使用平台控制台，不写入 logs/。"],
    };
  }

  const [appLines, errorLines] = await Promise.all([readRecentLogLines("app.log", 3), readRecentLogLines("error.log", 5)]);

  if (errorLines.length > 0) {
    return {
      status: "warning",
      message: "已读取 error.log 最近脱敏错误摘要。",
      entries: errorLines,
    };
  }

  return {
    status: "ok",
    message: appLines.length > 0 ? "暂无 error.log 错误，显示 app.log 最近摘要。" : "暂无本地日志记录。",
    entries: appLines.length > 0 ? appLines : ["暂无"],
  };
}

async function getAIStatus(isWritableRuntime: boolean): Promise<DiagnosticsAIStatus> {
  if (!isWritableRuntime) {
    return {
      status: "unknown",
      message: "预览环境只读，请在 Windows 本地验收 AI 调用。",
      settingsConfigured: null,
      providerCount: null,
      recentJobCount: null,
      recentJobs: ["预览环境不读取本地 AIJob。"],
      recentFailedJobs: [],
      recentCopywritingFailedJobs: ["预览环境不读取本地 copywriting AIJob。"],
      recentRequestLogs: ["预览环境不读取本地 AIRequestLog。"],
      recentCopywritingRequestLogs: ["预览环境不读取本地 copywriting AIRequestLog。"],
      estimatedCostTotal: null,
    };
  }

  try {
    const [providerCount, configuredProviderCount, jobSummary, requestLogSummary, recentCopywritingFailedJobs, recentCopywritingRequestLogs] = await Promise.all([
      prisma.aIProvider.count(),
      prisma.aIProvider.count({
        where: {
          enabled: true,
          apiKey: {
            not: null,
          },
          modelName: {
            not: null,
          },
        },
      }),
      getRecentAIJobSummary(5),
      getRecentAIRequestLogSummary(5),
      prisma.aIJob.findMany({
        where: {
          jobType: {
            in: ["copywriting", "copywriting_multi_platform"],
          },
          status: "failed",
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          jobType: true,
          errorSummary: true,
          createdAt: true,
        },
      }),
      prisma.aIRequestLog.findMany({
        where: {
          requestType: "copywriting",
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          createdAt: true,
          provider: true,
          model: true,
          success: true,
          errorSummary: true,
        },
      }),
    ]);

    const estimatedCostTotal =
      requestLogSummary.totalEstimatedCost === null
        ? null
        : `≈${requestLogSummary.totalEstimatedCost.toFixed(8)} ${requestLogSummary.currency ?? "USD"}`;

    return {
      status: configuredProviderCount > 0 ? "ok" : "warning",
      message: configuredProviderCount > 0 ? "AI 设置存在，不显示 API Key。" : "AI 未配置或未启用，不显示 API Key。",
      settingsConfigured: configuredProviderCount > 0,
      providerCount,
      recentJobCount: jobSummary.totalRecent,
      recentJobs: jobSummary.entries.map(sanitizeDiagnosticText),
      recentFailedJobs: jobSummary.failedRecent.map(sanitizeDiagnosticText),
      recentCopywritingFailedJobs:
        recentCopywritingFailedJobs.length > 0
          ? recentCopywritingFailedJobs.map((job) =>
              sanitizeDiagnosticText(`#${job.id} ${job.jobType}: ${job.errorSummary ?? "unknown"}`),
            )
          : ["暂无最近 copywriting AIJob 失败。"],
      recentRequestLogs: requestLogSummary.entries.map(sanitizeDiagnosticText),
      recentCopywritingRequestLogs:
        recentCopywritingRequestLogs.length > 0
          ? recentCopywritingRequestLogs.map((entry) =>
              sanitizeDiagnosticText(
                `${entry.createdAt.toISOString()} ${entry.provider}/${entry.model} ${entry.success ? "success" : `failed: ${entry.errorSummary ?? "unknown"}`}`,
              ),
            )
          : ["暂无最近 copywriting AIRequestLog。"],
      estimatedCostTotal,
    };
  } catch (error) {
    return {
      status: "error",
      message: getSafeErrorMessage(error, "AI 诊断读取失败，请在 Windows 本地检查数据库状态。"),
      settingsConfigured: null,
      providerCount: null,
      recentJobCount: null,
      recentJobs: ["AIJob 读取失败。"],
      recentFailedJobs: [],
      recentCopywritingFailedJobs: ["copywriting AIJob 读取失败。"],
      recentRequestLogs: ["AIRequestLog 读取失败。"],
      recentCopywritingRequestLogs: ["copywriting AIRequestLog 读取失败。"],
      estimatedCostTotal: null,
    };
  }
}

async function countUploadEntries(directoryPath: string): Promise<{ files: number; directories: number }> {
  let files = 0;
  let directories = 0;
  const entries = await readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      directories += 1;
      const child = await countUploadEntries(path.join(directoryPath, entry.name));
      files += child.files;
      directories += child.directories;
    } else if (entry.isFile()) {
      files += 1;
    }
  }

  return { files, directories };
}

async function getImageStorageStatus(isWritableRuntime: boolean): Promise<DiagnosticsImageStorageStatus> {
  if (!isWritableRuntime) {
    return {
      status: "unknown",
      message: "预览环境只读，不读取本地 uploads 图片文件。",
      materialTotal: null,
      withThumbnail: null,
      missingFiles: null,
      referenceOnly: null,
      uploadsSummary: "uploads/: readonly preview",
    };
  }

  try {
    const [materialTotal, withThumbnail, referenceOnly, materials] = await Promise.all([
      prisma.material.count({ where: { product: { deletedAt: null } } }),
      prisma.material.count({ where: { product: { deletedAt: null }, thumbnailPath: { not: null } } }),
      prisma.material.count({ where: { product: { deletedAt: null }, usagePermission: "reference_only" } }),
      prisma.material.findMany({
        where: { product: { deletedAt: null } },
        select: { filePath: true, thumbnailPath: true },
        take: 200,
      }),
    ]);

    const uploadsRoot = getLocalDirectoryPath("uploads");
    let missingFiles = 0;

    for (const material of materials) {
      const relativePath = (material.thumbnailPath ?? material.filePath).replaceAll("\\", "/").replace(/^uploads\//, "");
      try {
        await access(path.join(uploadsRoot, relativePath));
      } catch {
        missingFiles += 1;
      }
    }

    let uploadsSummary = "uploads/: unavailable";
    try {
      const counts = await countUploadEntries(uploadsRoot);
      uploadsSummary = `uploads/: files=${counts.files}, directories=${counts.directories}`;
    } catch {
      uploadsSummary = "uploads/: not accessible";
    }

    return {
      status: missingFiles > 0 ? "warning" : "ok",
      message: missingFiles > 0 ? "部分素材文件或缩略图缺失，请在素材库中复核。" : "图片存储摘要正常。",
      materialTotal,
      withThumbnail,
      missingFiles,
      referenceOnly,
      uploadsSummary,
    };
  } catch (error) {
    return {
      status: "error",
      message: getSafeErrorMessage(error, "图片存储摘要读取失败，请在 Windows 本地检查数据库和 uploads 目录。"),
      materialTotal: null,
      withThumbnail: null,
      missingFiles: null,
      referenceOnly: null,
      uploadsSummary: "uploads/: unknown",
    };
  }
}

async function getInspirationStatus(isWritableRuntime: boolean): Promise<DiagnosticsInspirationStatus> {
  if (!isWritableRuntime) {
    return {
      status: "unknown",
      message: "预览环境只读，不读取真实灵感文件夹或本地灵感库。",
      total: null,
      pendingReview: null,
      recentScanLogs: ["预览环境不读取本地 ScanLog。"],
      recentFailedScans: ["预览环境不读取本地失败扫描摘要。"],
      recentFailedVisionJobs: ["预览环境不读取本地灵感识图 AIJob。"],
    };
  }

  try {
    const [total, pendingReview, recentScanLogs, failedScanLogs, failedVisionJobs] = await Promise.all([
      prisma.inspiration.count(),
      prisma.inspiration.count({
        where: { status: "pending_review" },
      }),
      prisma.scanLog.findMany({
        orderBy: { startedAt: "desc" },
        take: 5,
        select: {
          startedAt: true,
          folderSummary: true,
          status: true,
          newFiles: true,
          skippedDuplicates: true,
          failedFiles: true,
        },
      }),
      prisma.scanLog.findMany({
        where: {
          status: {
            in: ["partial_failed", "failed"],
          },
        },
        orderBy: { startedAt: "desc" },
        take: 5,
        select: {
          startedAt: true,
          folderSummary: true,
          status: true,
          errorSummary: true,
        },
      }),
      prisma.aIJob.findMany({
        where: {
          jobType: "inspiration_vision",
          status: "failed",
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          errorSummary: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      status: failedScanLogs.length > 0 ? "warning" : "ok",
      message: total > 0 ? "灵感箱与扫描摘要可读取。" : "当前还没有灵感记录。",
      total,
      pendingReview,
      recentScanLogs:
        recentScanLogs.length > 0
          ? recentScanLogs.map((log) =>
              sanitizeDiagnosticText(
                `${log.startedAt.toISOString()} ${log.folderSummary} status=${log.status} new=${log.newFiles} duplicates=${log.skippedDuplicates} failed=${log.failedFiles}`,
              ),
            )
          : ["暂无最近 ScanLog。"],
      recentFailedScans:
        failedScanLogs.length > 0
          ? failedScanLogs.map((log) =>
              sanitizeDiagnosticText(
                `${log.startedAt.toISOString()} ${log.folderSummary} ${log.status}: ${log.errorSummary ?? "unknown"}`,
              ),
            )
          : ["暂无最近失败扫描。"],
      recentFailedVisionJobs:
        failedVisionJobs.length > 0
          ? failedVisionJobs.map((job) =>
              sanitizeDiagnosticText(`${job.createdAt.toISOString()} #${job.id}: ${job.errorSummary ?? "unknown"}`),
            )
          : ["暂无最近失败识图 AIJob。"],
    };
  } catch (error) {
    return {
      status: "error",
      message: getSafeErrorMessage(error, "灵感摘要读取失败，请在 Windows 本地检查数据库状态。"),
      total: null,
      pendingReview: null,
      recentScanLogs: ["ScanLog 读取失败。"],
      recentFailedScans: ["失败扫描摘要读取失败。"],
      recentFailedVisionJobs: ["灵感识图 AIJob 读取失败。"],
    };
  }
}

export async function getDiagnosticsSnapshot(): Promise<DiagnosticsSnapshot> {
  const runtime = getRuntimeModeSummary();
  const runtimeMode = getDiagnosticsRuntimeMode();
  const isWritableRuntime = runtimeMode === "local" && runtime.isWritable;
  const directories = (await inspectLocalRuntimeDirectories({ autoCreate: true })).map((directory) => ({
    key: directory.key,
    label: directory.label,
    displayPath: directory.displayPath,
    exists: directory.exists,
    writable: directory.writable,
    status: directory.status,
    message: directory.message,
  }));
  const ai = await getAIStatus(isWritableRuntime);
  const images = await getImageStorageStatus(isWritableRuntime);
  const inspirations = await getInspirationStatus(isWritableRuntime);
  const snapshotWithoutSummary = {
    app: {
      appVersion: getAppVersion(),
      runtimeMode,
      runtimeServiceMode: runtime.mode,
      runtimeServiceLabel: runtime.label,
      isVercel: runtime.isVercel,
      generatedAt: new Date().toISOString(),
      nodeVersion: process.version || "unknown",
      osSummary: getOsSummary(runtimeMode),
      isWritableRuntime,
      readonlyMessage: runtime.readonlyMessage ?? (isWritableRuntime ? null : PREVIEW_READONLY_MESSAGE),
    },
    database: await getDatabaseStatus(isWritableRuntime),
    directories,
    recentErrors: await getRecentErrors(isWritableRuntime),
    ai,
    images,
    inspirations,
    recentAiFailures: ai.recentFailedJobs.length > 0 ? ai.recentFailedJobs.join("；") : "暂无最近 AIJob 失败。",
  };

  return {
    ...snapshotWithoutSummary,
    summaryMarkdown: buildDiagnosticsMarkdown(snapshotWithoutSummary),
  };
}

export function getPreviewWriteMessage() {
  return PREVIEW_WRITE_MESSAGE;
}
