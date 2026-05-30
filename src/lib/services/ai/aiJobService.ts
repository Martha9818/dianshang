import { prisma } from "@/lib/prisma";
import { BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products";
import type { AIJobCreateInput, AIJobStatus } from "@/lib/services/ai/aiTypes";
import { sanitizeAIErrorSummary, summarizePrompt } from "@/lib/services/ai/aiPromptSanitizer";
import { getRuntimeModeSummary } from "@/lib/services/runtime";
import { notifyAIJobFailed } from "@/lib/services/notificationService";

const RECENT_DUPLICATE_WINDOW_MS = 60_000;
const PREVIEW_AI_MESSAGE = "预览环境只读，请在 Windows 本地验收 AI 调用。";

function ensureLocalAIJobWritesAllowed() {
  const runtime = getRuntimeModeSummary();
  if (!runtime.isWritable) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.AI_CALL_DISABLED, PREVIEW_AI_MESSAGE);
  }
}

export async function createAIJob(input: AIJobCreateInput) {
  ensureLocalAIJobWritesAllowed();

  if (input.idempotencyKey) {
    const duplicate = await prisma.aIJob.findFirst({
      where: {
        jobType: input.jobType,
        idempotencyKey: input.idempotencyKey,
        createdAt: {
          gte: new Date(Date.now() - RECENT_DUPLICATE_WINDOW_MS),
        },
        status: {
          in: ["pending", "running", "success"],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (duplicate) {
      throw new ProductBusinessError(
        BUSINESS_ERROR_CODES.VALIDATION_ERROR,
        "短时间内已有相同 AI 任务，请稍后再试或查看最近 AIJob 状态。",
      );
    }
  }

  return prisma.aIJob.create({
    data: {
      jobType: input.jobType,
      status: "pending",
      idempotencyKey: input.idempotencyKey ?? null,
      relatedProductId: input.relatedProductId ?? null,
      relatedInspirationId: input.relatedInspirationId ?? null,
      inputSummary: input.inputSummary ? summarizePrompt(input.inputSummary) : null,
    },
  });
}

export async function markAIJobRunning(jobId: number) {
  ensureLocalAIJobWritesAllowed();

  return prisma.aIJob.update({
    where: { id: jobId },
    data: {
      status: "running",
      startedAt: new Date(),
    },
  });
}

export async function markAIJobSuccess(jobId: number, resultSummary?: string | null) {
  ensureLocalAIJobWritesAllowed();

  return prisma.aIJob.update({
    where: { id: jobId },
    data: {
      status: "success",
      resultSummary: resultSummary ? summarizePrompt(resultSummary) : null,
      finishedAt: new Date(),
    },
  });
}

export async function markAIJobFailed(jobId: number, error: unknown) {
  ensureLocalAIJobWritesAllowed();

  const updated = await prisma.aIJob.update({
    where: { id: jobId },
    data: {
      status: "failed",
      errorSummary: sanitizeAIErrorSummary(error),
      finishedAt: new Date(),
    },
  });

  await notifyAIJobFailed({
    jobId: updated.id,
    jobType: updated.jobType,
    error,
    relatedProductId: updated.relatedProductId,
    relatedInspirationId: updated.relatedInspirationId,
  });

  return updated;
}

export async function updateAIJobStatus(jobId: number, status: AIJobStatus, summary?: string | null) {
  ensureLocalAIJobWritesAllowed();

  const updated = await prisma.aIJob.update({
    where: { id: jobId },
    data: {
      status,
      resultSummary: status === "success" && summary ? summarizePrompt(summary) : undefined,
      errorSummary: status === "failed" && summary ? sanitizeAIErrorSummary(summary) : undefined,
      finishedAt: status === "success" || status === "failed" || status === "cancelled" ? new Date() : undefined,
      startedAt: status === "running" ? new Date() : undefined,
    },
  });

  if (status === "failed") {
    await notifyAIJobFailed({
      jobId: updated.id,
      jobType: updated.jobType,
      error: summary ?? updated.errorSummary ?? "AI job failed",
      relatedProductId: updated.relatedProductId,
      relatedInspirationId: updated.relatedInspirationId,
    });
  }

  return updated;
}

export async function retryAIJob(sourceJobId: number) {
  ensureLocalAIJobWritesAllowed();

  const source = await prisma.aIJob.findUnique({
    where: { id: sourceJobId },
  });

  if (!source) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, "AIJob 不存在。");
  }

  return prisma.aIJob.create({
    data: {
      jobType: source.jobType,
      status: "pending",
      idempotencyKey: source.idempotencyKey ? `${source.idempotencyKey}:retry:${source.retryCount + 1}` : null,
      relatedProductId: source.relatedProductId,
      relatedInspirationId: source.relatedInspirationId,
      inputSummary: source.inputSummary,
      retryCount: source.retryCount + 1,
    },
  });
}

export async function getRecentAIJobSummary(limit = 5) {
  const runtime = getRuntimeModeSummary();
  if (!runtime.isWritable) {
    return {
      status: "unknown" as const,
      totalRecent: null,
      failedRecent: [],
      entries: [PREVIEW_AI_MESSAGE],
    };
  }

  const jobs = await prisma.aIJob.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      jobType: true,
      status: true,
      errorSummary: true,
      createdAt: true,
    },
  });

  return {
    status: "ok" as const,
    totalRecent: jobs.length,
    failedRecent: jobs
      .filter((job) => job.status === "failed")
      .map((job) => `#${job.id} ${job.jobType}: ${job.errorSummary ?? "unknown"}`),
    entries:
      jobs.length > 0
        ? jobs.map((job) => `#${job.id} ${job.jobType} ${job.status} ${job.createdAt.toISOString()}`)
        : ["暂无 AIJob。"],
  };
}
