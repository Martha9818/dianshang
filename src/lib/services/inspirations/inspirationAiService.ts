import path from "node:path";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products";
import { generateTextJson } from "@/lib/services/ai-client";
import {
  buildInspirationSuggestionJsonSchema,
  inspirationSuggestionSchema,
  INSPIRATION_AI_JOB_TYPES,
  INSPIRATION_TASK_STATUSES,
  normalizeInspirationSuggestion,
  type InspirationAISuggestion,
} from "@/lib/services/inspirations/inspirationTypes";
import {
  createAIJob,
  createAIRequestLog,
  markAIJobFailed,
  markAIJobRunning,
  markAIJobSuccess,
  validateJsonAIOutput,
} from "@/lib/services/ai";
import { sanitizeAIErrorSummary, summarizePrompt } from "@/lib/services/ai/aiPromptSanitizer";
import { getDefaultEnabledAIProvider } from "@/lib/services/ai-provider-service";
import { getUploadsAbsolutePath } from "@/lib/services/file-storage-service";
import { ensureProductWritesAllowed, normalizeProductWriteError } from "@/lib/services/product-runtime-service";

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function createNotFoundError() {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.PRODUCT_NOT_FOUND, "灵感记录不存在。");
}

function getMimeTypeFromRelativePath(relativePath: string) {
  const extension = path.extname(relativePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  return "image/webp";
}

function buildVisionPrompt() {
  return [
    "You are a cautious ecommerce product inspiration assistant.",
    "Use only directly visible information from the image. Do not invent brand, sales, certification, supplier, price, platform policy, or any fact that cannot be observed.",
    "Return only one valid JSON object. Do not wrap it in markdown. Do not add explanatory text outside JSON.",
    'Set draftLabel exactly to "AI 草稿 / 待用户确认".',
    "All fields below are required. Use an empty string or empty array when uncertain.",
    JSON.stringify({
      titleSuggestion: "short title suggestion",
      shortDescription: "one or two cautious sentences about visible content",
      possibleCategory: "possible category",
      possibleProductType: "possible product type",
      colors: ["visible colors"],
      materials: ["possible visible materials"],
      styleKeywords: ["style keywords"],
      suitablePlatforms: ["possible ecommerce platforms or empty when uncertain"],
      visibleElements: ["directly visible elements"],
      useScenarios: ["possible usage scenarios"],
      targetAudience: ["possible target audience"],
      sellingPoints: ["cautious selling point suggestions"],
      riskNotes: ["risks or facts requiring user confirmation"],
      copywritingDirections: ["possible copywriting directions"],
      uncertaintyNotes: ["uncertain points"],
      draftLabel: "AI 草稿 / 待用户确认",
    }),
  ].join("\n");
}

function buildAppliedDraftNote(suggestion: InspirationAISuggestion) {
  const lines = [
    "AI 草稿 / 待用户确认",
    suggestion.shortDescription,
    suggestion.possibleProductType ? `可能商品类型：${suggestion.possibleProductType}` : null,
    suggestion.possibleCategory ? `候选类目：${suggestion.possibleCategory}` : null,
    suggestion.colors.length > 0 ? `颜色：${suggestion.colors.join("；")}` : null,
    suggestion.materials.length > 0 ? `可能材质：${suggestion.materials.join("；")}` : null,
    suggestion.styleKeywords.length > 0 ? `风格：${suggestion.styleKeywords.join("；")}` : null,
    suggestion.suitablePlatforms.length > 0 ? `适合平台：${suggestion.suitablePlatforms.join("；")}` : null,
    suggestion.sellingPoints.length > 0 ? `卖点建议：${suggestion.sellingPoints.join("；")}` : null,
    suggestion.copywritingDirections.length > 0 ? `文案方向：${suggestion.copywritingDirections.join("；")}` : null,
    suggestion.riskNotes.length > 0 ? `风险提示：${suggestion.riskNotes.join("；")}` : null,
    suggestion.uncertaintyNotes.length > 0 ? `不确定项：${suggestion.uncertaintyNotes.join("；")}` : null,
  ];

  return lines.filter(Boolean).join("\n");
}

function buildDraftRawSummary(suggestion: InspirationAISuggestion) {
  return summarizePrompt(
    [
      suggestion.draftLabel,
      suggestion.shortDescription,
      suggestion.possibleProductType,
      suggestion.colors.join("/"),
      suggestion.materials.join("/"),
      suggestion.riskNotes.join("/"),
    ]
      .filter(Boolean)
      .join(" | "),
    300,
  );
}

async function createDraftJob(input: {
  inspirationId: number;
  sourceRelativePath: string;
  retryCount?: number;
}) {
  return prisma.inspirationAiDraftJob.create({
    data: {
      inspirationId: input.inspirationId,
      sourceRelativePath: input.sourceRelativePath,
      status: INSPIRATION_TASK_STATUSES.PENDING,
      needsUserConfirmation: true,
      retryCount: input.retryCount ?? 0,
    },
  });
}

async function generateInspirationAiDraft(input: {
  inspirationId: number;
  aiDraftJobId?: number | null;
  retryCount?: number;
}) {
  ensureProductWritesAllowed();

  let aiJobId: number | null = null;
  let aiDraftJobId = input.aiDraftJobId ?? null;

  try {
    const inspiration = await prisma.inspiration.findUnique({
      where: { id: input.inspirationId },
      select: {
        id: true,
        imagePath: true,
        thumbnailPath: true,
      },
    });

    if (!inspiration) {
      throw createNotFoundError();
    }

    const sourceRelativePath = inspiration.thumbnailPath ?? inspiration.imagePath;
    if (!aiDraftJobId) {
      const draftJob = await createDraftJob({
        inspirationId: inspiration.id,
        sourceRelativePath,
        retryCount: input.retryCount,
      });
      aiDraftJobId = draftJob.id;
    }

    await prisma.inspirationAiDraftJob.update({
      where: { id: aiDraftJobId },
      data: {
        status: INSPIRATION_TASK_STATUSES.PROCESSING,
        sourceRelativePath,
        startedAt: new Date(),
        failureReasonSummary: null,
      },
    });

    const provider = await getDefaultEnabledAIProvider();
    if (!provider) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.DEFAULT_PROVIDER_REQUIRED, "请先配置可用的默认 AI Provider。");
    }

    const aiJob = await createAIJob({
      jobType: INSPIRATION_AI_JOB_TYPES.AUTO_VISION_DRAFT,
      idempotencyKey: `inspiration-vision:${inspiration.id}:draft:${aiDraftJobId}`,
      relatedInspirationId: inspiration.id,
      inputSummary: `inspiration vision draft inspiration=${inspiration.id}`,
    });
    aiJobId = aiJob.id;

    await prisma.$transaction([
      prisma.inspiration.update({
        where: { id: inspiration.id },
        data: { aiJobId },
      }),
      prisma.inspirationAiDraftJob.update({
        where: { id: aiDraftJobId },
        data: { aiJobId },
      }),
    ]);

    await markAIJobRunning(aiJobId);

    const imageBuffer = await readFile(getUploadsAbsolutePath(sourceRelativePath));
    const mimeType = getMimeTypeFromRelativePath(sourceRelativePath);
    const imageDataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
    const inputSummary = `inspiration vision draft inspiration=${inspiration.id}`;

    const result = await generateTextJson({
      baseUrl: provider.baseUrl ?? "",
      apiKey: provider.apiKey ?? "",
      modelName: provider.modelName ?? "",
      providerType: provider.providerType,
      prompt: buildVisionPrompt(),
      requestType: "inspiration_vision",
      inputSummary,
      relatedInspirationId: inspiration.id,
      relatedTaskId: aiJobId,
      preferStructuredOutput: true,
      responseSchema: buildInspirationSuggestionJsonSchema(),
      imageDataUrl,
    });

    const structured = validateJsonAIOutput(result.content, inspirationSuggestionSchema);
    if (!structured.success) {
      const validationError = new ProductBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, structured.errorSummary);
      await createAIRequestLog({
        provider: provider.providerType,
        model: provider.modelName ?? "unknown",
        requestType: "inspiration_vision",
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        durationMs: result.durationMs,
        success: false,
        errorSummary: validationError.message,
        inputSummary,
        relatedInspirationId: inspiration.id,
        relatedTaskId: aiJobId,
      });
      await markAIJobFailed(aiJobId, validationError);
      throw validationError;
    }

    const normalized = normalizeInspirationSuggestion(structured.data);
    const rawResponseSummary = buildDraftRawSummary(normalized);
    await prisma.$transaction([
      prisma.inspiration.update({
        where: { id: inspiration.id },
        data: {
          aiJobId,
          aiSuggestionJson: JSON.stringify(normalized),
        },
      }),
      prisma.inspirationAiDraftJob.update({
        where: { id: aiDraftJobId },
        data: {
          status: INSPIRATION_TASK_STATUSES.SUCCESS,
          rawResponseSummary,
          needsUserConfirmation: true,
          finishedAt: new Date(),
        },
      }),
    ]);

    await markAIJobSuccess(aiJobId, `AI draft saved inspiration=${inspiration.id}`);
    return normalized;
  } catch (error) {
    const failureSummary = sanitizeAIErrorSummary(error);
    if (aiDraftJobId !== null) {
      try {
        await prisma.inspirationAiDraftJob.update({
          where: { id: aiDraftJobId },
          data: {
            status: INSPIRATION_TASK_STATUSES.FAILED,
            failureReasonSummary: failureSummary,
            finishedAt: new Date(),
          },
        });
      } catch {
        // Keep the original error.
      }
    }

    if (aiJobId !== null) {
      try {
        await markAIJobFailed(aiJobId, error);
      } catch {
        // Keep the original error.
      }
    }

    throw normalizeProductWriteError(error);
  }
}

export async function generateInspirationAiSuggestion(inspirationId: number) {
  return generateInspirationAiDraft({ inspirationId });
}

export async function generateAutomaticInspirationAiDraft(inspirationId: number) {
  return generateInspirationAiDraft({ inspirationId });
}

export async function retryInspirationAiDraftJob(aiDraftJobId: number) {
  ensureProductWritesAllowed();

  try {
    const source = await prisma.inspirationAiDraftJob.findUnique({
      where: { id: aiDraftJobId },
      select: {
        id: true,
        inspirationId: true,
        status: true,
        retryCount: true,
      },
    });

    if (!source) {
      throw createValidationError("AI 草稿任务不存在。");
    }

    if (source.status !== INSPIRATION_TASK_STATUSES.FAILED) {
      throw createValidationError("只有失败的 AI 草稿任务可以手动重试。");
    }

    const retryJob = await createDraftJob({
      inspirationId: source.inspirationId,
      sourceRelativePath: "",
      retryCount: source.retryCount + 1,
    });

    return generateInspirationAiDraft({
      inspirationId: source.inspirationId,
      aiDraftJobId: retryJob.id,
      retryCount: source.retryCount + 1,
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function ignoreInspirationAiDraft(inspirationId: number) {
  ensureProductWritesAllowed();

  try {
    const inspiration = await prisma.inspiration.findUnique({
      where: { id: inspirationId },
      select: { id: true, aiSuggestionJson: true },
    });

    if (!inspiration) {
      throw createNotFoundError();
    }

    if (!inspiration.aiSuggestionJson) {
      throw createValidationError("当前灵感没有可忽略的 AI 草稿。");
    }

    await prisma.$transaction([
      prisma.inspiration.update({
        where: { id: inspirationId },
        data: { aiSuggestionJson: null },
      }),
      prisma.inspirationAiDraftJob.updateMany({
        where: {
          inspirationId,
          status: INSPIRATION_TASK_STATUSES.SUCCESS,
        },
        data: {
          status: INSPIRATION_TASK_STATUSES.SKIPPED,
          needsUserConfirmation: false,
          finishedAt: new Date(),
        },
      }),
      prisma.operationLog.create({
        data: {
          relatedInspirationId: inspirationId,
          action: "IGNORE_INSPIRATION_AI_DRAFT",
          detail: "用户忽略 AI 草稿，未写入正式商品字段。",
        },
      }),
    ]);

    return { success: true };
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function applyInspirationAiSuggestion(inspirationId: number) {
  ensureProductWritesAllowed();

  try {
    const inspiration = await prisma.inspiration.findUnique({
      where: { id: inspirationId },
      select: {
        id: true,
        aiSuggestionJson: true,
      },
    });

    if (!inspiration) {
      throw createNotFoundError();
    }

    if (!inspiration.aiSuggestionJson) {
      throw createValidationError("当前灵感还没有可应用的 AI 草稿。");
    }

    const parsed = JSON.parse(inspiration.aiSuggestionJson) as Partial<InspirationAISuggestion>;
    const suggestion = normalizeInspirationSuggestion(parsed);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.inspiration.update({
        where: { id: inspirationId },
        data: {
          title: suggestion.titleSuggestion || null,
          note: buildAppliedDraftNote(suggestion) || null,
        },
      });

      await tx.inspirationAiDraftJob.updateMany({
        where: { inspirationId, status: INSPIRATION_TASK_STATUSES.SUCCESS },
        data: { needsUserConfirmation: false },
      });

      await tx.operationLog.create({
        data: {
          relatedInspirationId: inspirationId,
          action: "APPLY_INSPIRATION_AI_DRAFT",
          detail: "用户确认并应用 AI 草稿到灵感备注，未自动写入正式商品字段。",
        },
      });

      return updated;
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}
