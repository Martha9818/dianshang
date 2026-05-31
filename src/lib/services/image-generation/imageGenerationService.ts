import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUSINESS_ERROR_CODES, ProductBusinessError, OPERATION_LOG_ACTIONS } from "@/lib/modules/products";
import { getImageTypeLabel, getPlatformLabel } from "@/lib/modules/prompt-task";
import { MATERIAL_SOURCE, MATERIAL_STATUS } from "@/lib/modules/materials";
import { createAIClient, createAIJob, markAIJobFailed, markAIJobRunning, markAIJobSuccess, sanitizeAIErrorSummary, summarizePrompt } from "@/lib/services/ai";
import { getDefaultEnabledAIProvider, getImageGenerationSettings } from "@/lib/services/ai-provider-service";
import { detectBannedWords, getBannedWords } from "@/lib/services/banned-word-service";
import { saveMaterialImageBuffer } from "@/lib/services/file-storage-service";
import { createAppNotification } from "@/lib/services/notificationService";
import { createOperationLog } from "@/lib/services/operation-log-service";
import { ensureProductWritesAllowed, getRuntimeModeSummary, normalizeProductReadError, normalizeProductWriteError } from "@/lib/services/product-runtime-service";

export const IMAGE_GENERATION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

const PREVIEW_IMAGE_GENERATION_MESSAGE = "预览环境只读，请在 Windows 本地验收 API 生图。";

const imageGenerationJobSelect = {
  id: true,
  promptTaskId: true,
  productId: true,
  provider: true,
  model: true,
  size: true,
  quality: true,
  promptVersion: true,
  promptUse: true,
  status: true,
  resultMaterialId: true,
  errorSummary: true,
  parameterSummaryJson: true,
  createdAt: true,
  updatedAt: true,
  resultMaterial: {
    select: {
      id: true,
      filePath: true,
      thumbnailPath: true,
      sourceType: true,
      status: true,
      version: true,
    },
  },
} satisfies Prisma.ImageGenerationJobSelect;

type ImageGenerationJobRecord = Prisma.ImageGenerationJobGetPayload<{ select: typeof imageGenerationJobSelect }>;

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function ensureImageGenerationWritesAllowed() {
  if (!getRuntimeModeSummary().isWritable) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.PREVIEW_READONLY, PREVIEW_IMAGE_GENERATION_MESSAGE);
  }

  ensureProductWritesAllowed();
}

function getMaterialTypeFromPromptImageType(imageType: string | null | undefined) {
  if (imageType === "main") return "main_image";
  if (imageType === "detail") return "detail_image";
  if (imageType === "cover") return "cover_image";
  return "prompt_result";
}

function isHighCostImageConfig(input: { model?: string | null; quality?: string | null; size?: string | null }) {
  const model = input.model?.toLowerCase() ?? "";
  const quality = input.quality?.toLowerCase() ?? "";
  const size = input.size?.toLowerCase() ?? "";

  return (
    quality === "hd" ||
    quality === "high" ||
    size === "1024x1792" ||
    size === "1792x1024" ||
    /dall-e-3|gpt-image|imagen|flux-pro|high/.test(model)
  );
}

function mapImageGenerationJob(job: ImageGenerationJobRecord) {
  return {
    ...job,
    statusLabel: getImageGenerationStatusLabel(job.status),
    resultDisplayPath: job.resultMaterial?.thumbnailPath ?? job.resultMaterial?.filePath ?? null,
  };
}

function getImageGenerationStatusLabel(status: string) {
  if (status === IMAGE_GENERATION_STATUS.PENDING) return "待处理";
  if (status === IMAGE_GENERATION_STATUS.PROCESSING) return "生成中";
  if (status === IMAGE_GENERATION_STATUS.SUCCESS) return "成功";
  if (status === IMAGE_GENERATION_STATUS.FAILED) return "失败";
  if (status === IMAGE_GENERATION_STATUS.CANCELLED) return "已取消";
  return status;
}

function buildParameterSummary(input: {
  provider: string;
  model: string;
  size: string;
  quality: string | null;
  promptVersion: string | null;
  promptUse: string | null;
}) {
  return JSON.stringify({
    provider: input.provider,
    model: input.model,
    size: input.size,
    quality: input.quality,
    promptVersion: input.promptVersion,
    promptUse: input.promptUse,
  });
}

async function getNextGeneratedMaterialVersion(promptTaskId: number) {
  const count = await prisma.material.count({ where: { promptTaskId } });
  return `v${count + 1}`;
}

async function notifyImageGenerationSuccess(input: { jobId: number; materialId: number; productId: number; taskCode: string }) {
  await createAppNotification({
    type: "AI",
    level: "success",
    title: "API 生图完成",
    message: `Prompt 任务 ${input.taskCode} 的生成图已保存到素材库。`,
    relatedType: "ImageGenerationJob",
    relatedId: input.jobId,
    actionUrl: `/products/${input.productId}?tab=materials`,
    dedupeKey: `image-generation-success:${input.jobId}:${input.materialId}`,
  });
}

async function notifyImageGenerationFailed(input: { jobId: number; productId: number; taskCode: string; error: unknown }) {
  await createAppNotification({
    type: "AI",
    level: "error",
    title: "API 生图失败",
    message: `Prompt 任务 ${input.taskCode}：${sanitizeAIErrorSummary(input.error)}`,
    relatedType: "ImageGenerationJob",
    relatedId: input.jobId,
    actionUrl: `/prompt-tasks?taskCode=${encodeURIComponent(input.taskCode)}`,
    dedupeKey: `image-generation-failed:${input.jobId}`,
  });
}

export async function getImageGenerationPanelData(promptTaskId: number | null) {
  try {
    const [settings, provider, recentJobs] = await Promise.all([
      getImageGenerationSettings(),
      getDefaultEnabledAIProvider("image"),
      promptTaskId
        ? prisma.imageGenerationJob.findMany({
            where: { promptTaskId },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 5,
            select: imageGenerationJobSelect,
          })
        : Promise.resolve([]),
    ]);

    return {
      settings,
      provider: provider
        ? {
            id: provider.id,
            name: provider.name,
            modelName: provider.modelName,
            enabled: provider.enabled,
            hasApiKey: Boolean(provider.apiKey),
          }
        : null,
      isConfigured: settings.enabled && Boolean(provider?.apiKey && provider.baseUrl),
      isHighCost: isHighCostImageConfig({
        model: provider?.modelName,
        quality: settings.defaultQuality,
        size: settings.defaultSize,
      }),
      recentJobs: recentJobs.map(mapImageGenerationJob),
      previewMessage: getRuntimeModeSummary().isWritable ? null : PREVIEW_IMAGE_GENERATION_MESSAGE,
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function generateImageForPromptTask(input: {
  taskCode: string;
  promptVersion?: string | null;
  promptUse?: string | null;
}) {
  let imageJobId: number | null = null;
  let aiJobId: number | null = null;
  let taskCodeForNotification = input.taskCode;
  let productIdForNotification: number | null = null;

  try {
    ensureImageGenerationWritesAllowed();

    const [settings, provider, task, bannedWords] = await Promise.all([
      getImageGenerationSettings(),
      getDefaultEnabledAIProvider("image"),
      prisma.promptTask.findUnique({
        where: { taskCode: input.taskCode },
        select: {
          id: true,
          taskCode: true,
          productId: true,
          platform: true,
          imageType: true,
          recommendedSize: true,
          promptText: true,
          status: true,
          version: true,
          product: {
            select: {
              id: true,
              deletedAt: true,
            },
          },
        },
      }),
      getBannedWords(),
    ]);

    if (!task || task.product.deletedAt) {
      throw createValidationError("找不到可用的 Prompt 任务。");
    }

    taskCodeForNotification = task.taskCode;
    productIdForNotification = task.productId;

    if (!settings.enabled) {
      throw createValidationError("API 生图尚未启用，请先到 AI 设置中启用。");
    }

    if (!provider || !provider.enabled || (provider.purpose ?? "text") !== "image") {
      throw createValidationError("请先配置并启用默认的 API 生图 Provider。");
    }

    if (!provider.baseUrl || !provider.apiKey) {
      throw createValidationError("API 生图 Provider 缺少 Base URL 或 API Key。");
    }

    const promptText = task.promptText?.trim();
    if (!promptText) {
      throw createValidationError("Prompt 内容为空，不能生图。");
    }

    const riskScan = detectBannedWords({
      title: promptText,
      bannedWords,
    });

    const promptVersion = input.promptVersion?.trim() || task.version || "v1";
    const promptUse = input.promptUse?.trim() || getImageTypeLabel(task.imageType);
    const imageModelName = provider.modelName?.trim() || "未指定模型";
    const parameterSummaryJson = buildParameterSummary({
      provider: provider.name,
      model: imageModelName,
      size: settings.defaultSize,
      quality: settings.defaultQuality,
      promptVersion,
      promptUse,
    });

    const aiJob = await createAIJob({
      jobType: "image_generation",
      idempotencyKey: `prompt-task:${task.id}:${Date.now()}`,
      relatedProductId: task.productId,
      inputSummary: `PromptTask ${task.taskCode} / ${promptVersion} / ${promptUse}`,
    });
    aiJobId = aiJob.id;

    const imageJob = await prisma.imageGenerationJob.create({
      data: {
        promptTaskId: task.id,
        productId: task.productId,
        aiJobId,
        provider: provider.name,
        model: imageModelName,
        size: settings.defaultSize,
        quality: settings.defaultQuality,
        promptVersion,
        promptUse,
        status: IMAGE_GENERATION_STATUS.PENDING,
        parameterSummaryJson,
      },
      select: imageGenerationJobSelect,
    });
    imageJobId = imageJob.id;

    if (riskScan.hits.length > 0) {
      throw createValidationError("Prompt 命中风险词，请先调整后再使用 API 生图。");
    }

    await markAIJobRunning(aiJobId);
    await prisma.imageGenerationJob.update({
      where: { id: imageJobId },
      data: { status: IMAGE_GENERATION_STATUS.PROCESSING },
    });

    const client = createAIClient({
      providerType: provider.providerType,
      providerName: provider.name,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      modelName: provider.modelName?.trim() ?? "",
    });
    const result = await client.generateImage({
      prompt: promptText,
      size: settings.defaultSize,
      quality: settings.defaultQuality,
      requestType: "image_generation",
      inputSummary: summarizePrompt(`PromptTask ${task.taskCode} ${promptUse}`),
      relatedProductId: task.productId,
      relatedTaskId: imageJobId,
      jobId: aiJobId,
    });

    const version = await getNextGeneratedMaterialVersion(task.id);
    const storedImage = await saveMaterialImageBuffer({
      productId: task.productId,
      platform: task.platform ?? "xianyu",
      imageType: task.imageType ?? "prompt",
      version,
      buffer: result.imageBuffer,
      mimeType: result.mimeType,
    });

    const material = await prisma.material.create({
      data: {
        productId: task.productId,
        promptTaskId: task.id,
        platform: task.platform ?? "xianyu",
        materialType: getMaterialTypeFromPromptImageType(task.imageType),
        filePath: storedImage.filePath,
        fileHash: storedImage.fileHash,
        originalSizeBytes: storedImage.originalSizeBytes,
        thumbnailSizeBytes: storedImage.thumbnailSizeBytes,
        width: storedImage.width,
        height: storedImage.height,
        mimeType: storedImage.mimeType,
        thumbnailPath: storedImage.thumbnailPath,
        sourceType: "ai_generated",
        usagePermission: "needs_review",
        status: MATERIAL_STATUS.PENDING_REVIEW,
        source: MATERIAL_SOURCE.PROMPT_RESULT,
        version,
      },
    });

    const [updatedJob] = await prisma.$transaction([
      prisma.imageGenerationJob.update({
        where: { id: imageJobId },
        data: {
          status: IMAGE_GENERATION_STATUS.SUCCESS,
          resultMaterialId: material.id,
        },
        select: imageGenerationJobSelect,
      }),
      prisma.promptTask.update({
        where: { id: task.id },
        data: {
          status: "已回传",
          version,
        },
      }),
    ]);

    await markAIJobSuccess(aiJobId, `image generation saved material=${material.id}`);
    await createOperationLog({
      productId: task.productId,
      action: OPERATION_LOG_ACTIONS.UPLOAD_PROMPT_RESULT,
      detail: `API 生图入库：task=${task.taskCode} / materialId=${material.id} / ${getPlatformLabel(task.platform)} / ${getImageTypeLabel(task.imageType)} / ${parameterSummaryJson}`,
    });
    await notifyImageGenerationSuccess({
      jobId: imageJobId,
      materialId: material.id,
      productId: task.productId,
      taskCode: task.taskCode,
    });

    return mapImageGenerationJob(updatedJob);
  } catch (error) {
    const safeError = normalizeProductWriteError(error);

    if (imageJobId) {
      await prisma.imageGenerationJob
        .update({
          where: { id: imageJobId },
          data: {
            status: IMAGE_GENERATION_STATUS.FAILED,
            errorSummary: sanitizeAIErrorSummary(safeError),
          },
        })
        .catch(() => null);
    }

    if (aiJobId) {
      await markAIJobFailed(aiJobId, safeError).catch(() => null);
    }

    if (imageJobId && productIdForNotification) {
      await notifyImageGenerationFailed({
        jobId: imageJobId,
        productId: productIdForNotification,
        taskCode: taskCodeForNotification,
        error: safeError,
      });
    }

    throw safeError;
  }
}
