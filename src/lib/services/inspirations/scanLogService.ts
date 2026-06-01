import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/modules/products";
import {
  ensureProductWritesAllowed,
  normalizeProductReadError,
  normalizeProductWriteError,
} from "@/lib/services/product-runtime-service";

const scanLogSelect = {
  id: true,
  scanType: true,
  folderSummary: true,
  totalFiles: true,
  newFiles: true,
  skippedDuplicates: true,
  failedFiles: true,
  status: true,
  errorSummary: true,
  startedAt: true,
  finishedAt: true,
} satisfies Prisma.ScanLogSelect;

type ScanLogRecord = Prisma.ScanLogGetPayload<{ select: typeof scanLogSelect }>;

function normalizeIds(ids: number[]) {
  return Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)));
}

function getScanLogTone(status: string) {
  if (status === "success") return "green" as const;
  if (status === "partial_failed") return "amber" as const;
  if (status === "failed") return "red" as const;
  return "slate" as const;
}

export function mapScanLog(record: ScanLogRecord) {
  return {
    ...record,
    startedAtIso: record.startedAt.toISOString(),
    finishedAtIso: record.finishedAt?.toISOString() ?? null,
    formattedStartedAt: formatDateTime(record.startedAt),
    formattedFinishedAt: record.finishedAt ? formatDateTime(record.finishedAt) : "--",
    statusTone: getScanLogTone(record.status),
  };
}

export async function recordScanLog(input: {
  scanType: string;
  folderSummary: string;
  totalFiles: number;
  newFiles: number;
  skippedDuplicates: number;
  failedFiles: number;
  status: string;
  errorSummary?: string | null;
  startedAt: Date;
  finishedAt: Date;
}) {
  try {
    const log = await prisma.scanLog.create({
      data: {
        scanType: input.scanType,
        folderSummary: input.folderSummary,
        totalFiles: input.totalFiles,
        newFiles: input.newFiles,
        skippedDuplicates: input.skippedDuplicates,
        failedFiles: input.failedFiles,
        status: input.status,
        errorSummary: input.errorSummary ?? null,
        startedAt: input.startedAt,
        finishedAt: input.finishedAt,
      },
      select: scanLogSelect,
    });

    return mapScanLog(log);
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function getRecentScanLogs(limit = 8) {
  try {
    const logs = await prisma.scanLog.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
      select: scanLogSelect,
    });

    return logs.map(mapScanLog);
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getLatestScanSummary() {
  try {
    const log = await prisma.scanLog.findFirst({
      where: {
        scanType: {
          in: ["manual", "scheduled"],
        },
      },
      orderBy: { startedAt: "desc" },
      select: scanLogSelect,
    });

    return log ? mapScanLog(log) : null;
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getRecentInspirationTaskSummaries(limit = 8) {
  try {
    const [scanJobs, aiDraftJobs] = await Promise.all([
      prisma.inspirationScanJob.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          sourceRelativePath: true,
          status: true,
          failureReasonSummary: true,
          aiDraftGenerated: true,
          needsUserConfirmation: true,
          retryCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.inspirationAiDraftJob.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          inspirationId: true,
          sourceRelativePath: true,
          status: true,
          failureReasonSummary: true,
          rawResponseSummary: true,
          needsUserConfirmation: true,
          retryCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      scanJobs: scanJobs.map((job) => ({
        ...job,
        formattedCreatedAt: formatDateTime(job.createdAt),
        formattedUpdatedAt: formatDateTime(job.updatedAt),
      })),
      aiDraftJobs: aiDraftJobs.map((job) => ({
        ...job,
        formattedCreatedAt: formatDateTime(job.createdAt),
        formattedUpdatedAt: formatDateTime(job.updatedAt),
      })),
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function deleteInspirationScanJobs(ids: number[]) {
  ensureProductWritesAllowed();

  try {
    const normalizedIds = normalizeIds(ids);
    if (normalizedIds.length === 0) {
      return { deletedCount: 0 };
    }

    const result = await prisma.inspirationScanJob.deleteMany({
      where: { id: { in: normalizedIds } },
    });

    return { deletedCount: result.count };
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function deleteInspirationAiDraftJobs(ids: number[]) {
  ensureProductWritesAllowed();

  try {
    const normalizedIds = normalizeIds(ids);
    if (normalizedIds.length === 0) {
      return { deletedCount: 0 };
    }

    const result = await prisma.inspirationAiDraftJob.deleteMany({
      where: { id: { in: normalizedIds } },
    });

    return { deletedCount: result.count };
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}
