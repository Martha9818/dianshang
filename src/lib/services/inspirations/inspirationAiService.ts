import path from "node:path";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products";
import { generateTextJson } from "@/lib/services/ai-client";
import {
  buildInspirationSuggestionJsonSchema,
  inspirationSuggestionSchema,
  INSPIRATION_AI_JOB_TYPES,
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
    "你是一名谨慎的电商选品助理。",
    "请只根据图片中能直接观察到的信息，输出轻量建议。",
    "不得虚构品牌、材质、功效、价格、成本、销量、认证、供应商、平台规则结论。",
    "如果不确定，请放入 uncertaintyNotes，不要写成确定事实。",
    "输出字段必须为 JSON，并符合既定 schema。",
  ].join("\n");
}

function buildAppliedDraftNote(suggestion: InspirationAISuggestion) {
  const lines = [
    suggestion.shortDescription,
    suggestion.possibleCategory ? `候选类目：${suggestion.possibleCategory}` : null,
    suggestion.sellingPoints.length > 0 ? `可见卖点：${suggestion.sellingPoints.join("；")}` : null,
    suggestion.useScenarios.length > 0 ? `使用场景：${suggestion.useScenarios.join("；")}` : null,
    suggestion.targetAudience.length > 0 ? `目标人群：${suggestion.targetAudience.join("；")}` : null,
    suggestion.styleKeywords.length > 0 ? `风格关键词：${suggestion.styleKeywords.join("、")}` : null,
    "AI 建议，仅供参考。",
  ];

  return lines.filter(Boolean).join("\n");
}

export async function generateInspirationAiSuggestion(inspirationId: number) {
  ensureProductWritesAllowed();

  let aiJobId: number | null = null;

  try {
    const inspiration = await prisma.inspiration.findUnique({
      where: { id: inspirationId },
      select: {
        id: true,
        imagePath: true,
        thumbnailPath: true,
      },
    });

    if (!inspiration) {
      throw createNotFoundError();
    }

    const provider = await getDefaultEnabledAIProvider();
    if (!provider) {
      throw new ProductBusinessError(BUSINESS_ERROR_CODES.DEFAULT_PROVIDER_REQUIRED, "请先配置可用的默认 AI Provider。");
    }

    const aiJob = await createAIJob({
      jobType: INSPIRATION_AI_JOB_TYPES.VISION_SUGGESTION,
      idempotencyKey: `inspiration-vision:${inspirationId}`,
      relatedInspirationId: inspirationId,
      inputSummary: `inspiration vision suggestion inspiration=${inspirationId}`,
    });
    aiJobId = aiJob.id;

    await prisma.inspiration.update({
      where: { id: inspirationId },
      data: { aiJobId },
    });

    await markAIJobRunning(aiJobId);

    const sourceRelativePath = inspiration.thumbnailPath ?? inspiration.imagePath;
    const imageBuffer = await readFile(getUploadsAbsolutePath(sourceRelativePath));
    const mimeType = getMimeTypeFromRelativePath(sourceRelativePath);
    const imageDataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
    const inputSummary = `inspiration vision suggestion inspiration=${inspirationId}`;

    const result = await generateTextJson({
      baseUrl: provider.baseUrl ?? "",
      apiKey: provider.apiKey ?? "",
      modelName: provider.modelName ?? "",
      providerType: provider.providerType,
      prompt: buildVisionPrompt(),
      requestType: "inspiration_vision",
      inputSummary,
      relatedInspirationId: inspirationId,
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
        relatedInspirationId: inspirationId,
        relatedTaskId: aiJobId,
      });
      await markAIJobFailed(aiJobId, validationError);
      throw validationError;
    }

    const normalized = normalizeInspirationSuggestion(structured.data);
    await prisma.inspiration.update({
      where: { id: inspirationId },
      data: {
        aiJobId,
        aiSuggestionJson: JSON.stringify(normalized),
      },
    });

    await markAIJobSuccess(aiJobId, `inspiration suggestion saved inspiration=${inspirationId}`);
    return normalized;
  } catch (error) {
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
      throw createValidationError("当前灵感还没有可应用的 AI 建议。");
    }

    const parsed = JSON.parse(inspiration.aiSuggestionJson) as InspirationAISuggestion;
    const suggestion = normalizeInspirationSuggestion(parsed);

    return prisma.inspiration.update({
      where: { id: inspirationId },
      data: {
        title: suggestion.titleSuggestion || null,
        note: buildAppliedDraftNote(suggestion) || null,
      },
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}
