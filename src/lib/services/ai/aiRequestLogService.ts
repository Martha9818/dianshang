import { prisma } from "@/lib/prisma";
import { estimateAICost } from "@/lib/services/ai/aiCostEstimator";
import type { AIRequestLogInput } from "@/lib/services/ai/aiTypes";
import { sanitizeAIErrorSummary, summarizePrompt } from "@/lib/services/ai/aiPromptSanitizer";
import { isLocalWritable } from "@/lib/services/runtime";

export async function createAIRequestLog(input: AIRequestLogInput) {
  if (!isLocalWritable()) {
    return null;
  }

  const cost = estimateAICost({
    provider: input.provider,
    model: input.model,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
  });

  return prisma.aIRequestLog.create({
    data: {
      provider: input.provider,
      model: input.model,
      requestType: input.requestType,
      inputTokens: input.inputTokens ?? null,
      outputTokens: input.outputTokens ?? null,
      estimatedCost: cost.estimatedCost,
      currency: cost.currency,
      unitPriceSnapshot: cost.unitPriceSnapshot,
      durationMs: input.durationMs ?? null,
      success: input.success,
      errorSummary: input.errorSummary ? sanitizeAIErrorSummary(input.errorSummary) : null,
      inputSummary: input.inputSummary ? summarizePrompt(input.inputSummary) : null,
      relatedProductId: input.relatedProductId ?? null,
      relatedInspirationId: input.relatedInspirationId ?? null,
      relatedTaskId: input.relatedTaskId ?? null,
    },
  });
}

export async function getRecentAIRequestLogSummary(limit = 5) {
  if (!isLocalWritable()) {
    return {
      status: "unknown" as const,
      totalEstimatedCost: null,
      currency: null,
      entries: ["预览环境不读取本地 AIRequestLog。"],
    };
  }

  const [recent, aggregate] = await Promise.all([
    prisma.aIRequestLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        provider: true,
        model: true,
        requestType: true,
        success: true,
        errorSummary: true,
        estimatedCost: true,
        currency: true,
        createdAt: true,
      },
    }),
    prisma.aIRequestLog.aggregate({
      _sum: {
        estimatedCost: true,
      },
      where: {
        estimatedCost: {
          not: null,
        },
      },
    }),
  ]);

  return {
    status: "ok" as const,
    totalEstimatedCost: aggregate._sum.estimatedCost ?? null,
    currency: recent.find((entry) => entry.currency)?.currency ?? "USD",
    entries:
      recent.length > 0
        ? recent.map((entry) => {
            const result = entry.success ? "success" : `failed: ${entry.errorSummary ?? "unknown"}`;
            const cost = entry.estimatedCost === null ? "cost=unknown" : `cost≈${entry.estimatedCost} ${entry.currency ?? ""}`;
            return `${entry.createdAt.toISOString()} ${entry.requestType} ${entry.provider}/${entry.model} ${result} ${cost}`.trim();
          })
        : ["暂无 AIRequestLog。"],
  };
}
