import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUSINESS_ERROR_CODES, OPERATION_LOG_ACTIONS, ProductBusinessError } from "@/lib/modules/products";
import { tryCreateSettingsOperationLog } from "@/lib/services/operation-log-service";
import { ensureProductWritesAllowed, normalizeProductReadError, normalizeProductWriteError } from "@/lib/services/product-runtime-service";

export type AIProviderFormValues = {
  id?: string;
  name: string;
  providerType: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  purpose: string;
  enabled: boolean;
  isDefault: boolean;
};

export type ImageGenerationSettingsFormValues = {
  enabled: boolean;
  defaultSize: string;
  defaultQuality: string;
  costHint: string;
};

type ProviderMutationInput = {
  name: string;
  providerType: string;
  baseUrl: string;
  apiKey: string | null;
  modelName: string;
  purpose: string;
  enabled: boolean;
  isDefault: boolean;
};

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

const AI_PROVIDER_PURPOSES = new Set(["text", "image"]);
const IMAGE_GENERATION_SETTING_KEYS = {
  enabled: "imageGeneration.enabled",
  defaultSize: "imageGeneration.defaultSize",
  defaultQuality: "imageGeneration.defaultQuality",
  costHint: "imageGeneration.costHint",
} as const;

const DEFAULT_IMAGE_GENERATION_SETTINGS: ImageGenerationSettingsFormValues = {
  enabled: false,
  defaultSize: "1024x1024",
  defaultQuality: "standard",
  costHint: "API 生图可能产生额外费用；请确认模型、尺寸和质量后再手动生成。",
};

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function createProviderNotFoundError() {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.PROVIDER_NOT_FOUND, "AI Provider 不存在。");
}

function createProviderInUseError(name: string) {
  return new ProductBusinessError(
    BUSINESS_ERROR_CODES.PROVIDER_IN_USE,
    `Provider“${name}”已被文案记录使用，当前只允许禁用，不建议物理删除。`,
  );
}

function buildMaskedApiKey(apiKey: string | null) {
  if (!apiKey) {
    return "--";
  }

  return "已配置";
}

function normalizeProviderInput(values: AIProviderFormValues): ProviderMutationInput {
  const name = values.name.trim();
  const providerType = values.providerType.trim() || "openai-compatible";
  const baseUrl = values.baseUrl.trim();
  const modelName = values.modelName.trim();
  const purpose = values.purpose.trim() || "text";
  const apiKey = normalizeOptionalText(values.apiKey);

  if (!name) {
    throw createValidationError("Provider 名称不能为空。");
  }

  if (providerType !== "openai-compatible") {
    throw createValidationError("MVP 仅支持 openai-compatible 类型。");
  }

  if (!baseUrl) {
    throw createValidationError("Base URL 不能为空。");
  }

  if (!modelName) {
    throw createValidationError("模型名不能为空。");
  }

  if (!AI_PROVIDER_PURPOSES.has(purpose)) {
    throw createValidationError("Provider 用途仅支持 text 或 image。");
  }

  return {
    name,
    providerType,
    baseUrl,
    apiKey,
    modelName,
    purpose,
    enabled: values.enabled,
    isDefault: values.isDefault && values.enabled,
  };
}

async function ensureSingleDefaultProvider(tx: Prisma.TransactionClient, providerId: number, purpose: string) {
  await tx.aIProvider.updateMany({
    where: {
      id: { not: providerId },
      purpose,
    },
    data: {
      isDefault: false,
    },
  });
}

export function extractAIProviderFormValues(formData: FormData): AIProviderFormValues {
  return {
    id: String(formData.get("providerId") ?? ""),
    name: String(formData.get("name") ?? ""),
    providerType: String(formData.get("providerType") ?? "openai-compatible"),
    baseUrl: String(formData.get("baseUrl") ?? ""),
    apiKey: String(formData.get("apiKey") ?? ""),
    modelName: String(formData.get("modelName") ?? ""),
    purpose: String(formData.get("purpose") ?? "text"),
    enabled: String(formData.get("enabled") ?? "") === "on",
    isDefault: String(formData.get("isDefault") ?? "") === "on",
  };
}

export function extractImageGenerationSettingsFormValues(formData: FormData): ImageGenerationSettingsFormValues {
  return {
    enabled: String(formData.get("imageGenerationEnabled") ?? "") === "on",
    defaultSize: String(formData.get("imageGenerationSize") ?? DEFAULT_IMAGE_GENERATION_SETTINGS.defaultSize),
    defaultQuality: String(formData.get("imageGenerationQuality") ?? DEFAULT_IMAGE_GENERATION_SETTINGS.defaultQuality),
    costHint: String(formData.get("imageGenerationCostHint") ?? DEFAULT_IMAGE_GENERATION_SETTINGS.costHint),
  };
}

function normalizeImageGenerationSettings(values: ImageGenerationSettingsFormValues): ImageGenerationSettingsFormValues {
  const defaultSize = values.defaultSize.trim() || DEFAULT_IMAGE_GENERATION_SETTINGS.defaultSize;
  const defaultQuality = values.defaultQuality.trim() || DEFAULT_IMAGE_GENERATION_SETTINGS.defaultQuality;
  const costHint = values.costHint.trim() || DEFAULT_IMAGE_GENERATION_SETTINGS.costHint;

  if (!/^\d{2,5}x\d{2,5}$/.test(defaultSize)) {
    throw createValidationError("生图尺寸格式应类似 1024x1024。");
  }

  return {
    enabled: values.enabled,
    defaultSize,
    defaultQuality,
    costHint: costHint.slice(0, 300),
  };
}

export async function getAISettingsPageData() {
  try {
    const providers = await prisma.aIProvider.findMany({
      orderBy: [{ isDefault: "desc" }, { enabled: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        providerType: true,
        baseUrl: true,
        modelName: true,
        purpose: true,
        enabled: true,
        isDefault: true,
        apiKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const settingsRows = await prisma.appSetting.findMany({
      where: {
        key: {
          in: Object.values(IMAGE_GENERATION_SETTING_KEYS),
        },
      },
    });
    const settings = new Map(settingsRows.map((item) => [item.key, item.value]));

    return {
      providers: providers.map(({ apiKey, ...provider }) => ({
        ...provider,
        hasApiKey: Boolean(apiKey),
        maskedApiKey: buildMaskedApiKey(apiKey),
      })),
      defaultProviderId: providers.find((provider) => provider.isDefault && provider.enabled && (provider.purpose ?? "text") === "text")?.id ?? null,
      imageGenerationSettings: {
        enabled: settings.get(IMAGE_GENERATION_SETTING_KEYS.enabled) === "true",
        defaultSize: settings.get(IMAGE_GENERATION_SETTING_KEYS.defaultSize) ?? DEFAULT_IMAGE_GENERATION_SETTINGS.defaultSize,
        defaultQuality: settings.get(IMAGE_GENERATION_SETTING_KEYS.defaultQuality) ?? DEFAULT_IMAGE_GENERATION_SETTINGS.defaultQuality,
        costHint: settings.get(IMAGE_GENERATION_SETTING_KEYS.costHint) ?? DEFAULT_IMAGE_GENERATION_SETTINGS.costHint,
      },
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getAIProviderById(providerId: number) {
  try {
    const provider = await prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw createProviderNotFoundError();
    }

    return provider;
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getDefaultEnabledAIProvider(purpose = "text") {
  try {
    return await prisma.aIProvider.findFirst({
      where: {
        enabled: true,
        isDefault: true,
        purpose,
      },
    });
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getImageGenerationSettings() {
  try {
    const settingsRows = await prisma.appSetting.findMany({
      where: {
        key: {
          in: Object.values(IMAGE_GENERATION_SETTING_KEYS),
        },
      },
    });
    const settings = new Map(settingsRows.map((item) => [item.key, item.value]));

    return {
      enabled: settings.get(IMAGE_GENERATION_SETTING_KEYS.enabled) === "true",
      defaultSize: settings.get(IMAGE_GENERATION_SETTING_KEYS.defaultSize) ?? DEFAULT_IMAGE_GENERATION_SETTINGS.defaultSize,
      defaultQuality: settings.get(IMAGE_GENERATION_SETTING_KEYS.defaultQuality) ?? DEFAULT_IMAGE_GENERATION_SETTINGS.defaultQuality,
      costHint: settings.get(IMAGE_GENERATION_SETTING_KEYS.costHint) ?? DEFAULT_IMAGE_GENERATION_SETTINGS.costHint,
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function updateImageGenerationSettings(values: ImageGenerationSettingsFormValues) {
  ensureProductWritesAllowed();

  const input = normalizeImageGenerationSettings(values);

  try {
    await prisma.$transaction([
      prisma.appSetting.upsert({
        where: { key: IMAGE_GENERATION_SETTING_KEYS.enabled },
        create: { key: IMAGE_GENERATION_SETTING_KEYS.enabled, value: input.enabled ? "true" : "false" },
        update: { value: input.enabled ? "true" : "false" },
      }),
      prisma.appSetting.upsert({
        where: { key: IMAGE_GENERATION_SETTING_KEYS.defaultSize },
        create: { key: IMAGE_GENERATION_SETTING_KEYS.defaultSize, value: input.defaultSize },
        update: { value: input.defaultSize },
      }),
      prisma.appSetting.upsert({
        where: { key: IMAGE_GENERATION_SETTING_KEYS.defaultQuality },
        create: { key: IMAGE_GENERATION_SETTING_KEYS.defaultQuality, value: input.defaultQuality },
        update: { value: input.defaultQuality },
      }),
      prisma.appSetting.upsert({
        where: { key: IMAGE_GENERATION_SETTING_KEYS.costHint },
        create: { key: IMAGE_GENERATION_SETTING_KEYS.costHint, value: input.costHint },
        update: { value: input.costHint },
      }),
    ]);

    await tryCreateSettingsOperationLog({
      action: OPERATION_LOG_ACTIONS.UPDATE_AI_PROVIDER,
      detail: `更新 API 生图设置：enabled=${input.enabled} / size=${input.defaultSize} / quality=${input.defaultQuality}`,
    });

    return input;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function createAIProvider(values: AIProviderFormValues) {
  ensureProductWritesAllowed();

  const input = normalizeProviderInput(values);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const provider = await tx.aIProvider.create({
        data: input,
      });

      if (provider.isDefault) {
        await ensureSingleDefaultProvider(tx, provider.id, provider.purpose ?? "text");
      }

      return provider;
    });

    await tryCreateSettingsOperationLog({
      action: OPERATION_LOG_ACTIONS.CREATE_AI_PROVIDER,
      detail: `新增 AI Provider ${created.name}`,
    });

    return created;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function updateAIProvider(providerId: number, values: AIProviderFormValues) {
  ensureProductWritesAllowed();

  const input = normalizeProviderInput(values);

  try {
    const existing = await prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!existing) {
      throw createProviderNotFoundError();
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.aIProvider.update({
        where: { id: providerId },
        data: {
          name: input.name,
          providerType: input.providerType,
          baseUrl: input.baseUrl,
          apiKey: input.apiKey ?? existing.apiKey,
          modelName: input.modelName,
          purpose: input.purpose,
          enabled: input.enabled,
          isDefault: input.isDefault,
        },
      });

      if (updated.isDefault) {
        await ensureSingleDefaultProvider(tx, updated.id, updated.purpose ?? "text");
      }

      return updated;
    });

    await tryCreateSettingsOperationLog({
      action: OPERATION_LOG_ACTIONS.UPDATE_AI_PROVIDER,
      detail: `更新 AI Provider ${updated.name}`,
    });

    return updated;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function deleteAIProvider(providerId: number) {
  ensureProductWritesAllowed();

  try {
    const [provider, usageCount] = await Promise.all([
      prisma.aIProvider.findUnique({
        where: { id: providerId },
      }),
      prisma.copywriting.count({
        where: { providerId },
      }),
    ]);

    if (!provider) {
      throw createProviderNotFoundError();
    }

    if (usageCount > 0) {
      throw createProviderInUseError(provider.name);
    }

    await prisma.aIProvider.delete({
      where: { id: providerId },
    });

    await tryCreateSettingsOperationLog({
      action: OPERATION_LOG_ACTIONS.DELETE_AI_PROVIDER,
      detail: `删除 AI Provider ${provider.name}`,
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function disableAIProvider(providerId: number) {
  ensureProductWritesAllowed();

  try {
    const provider = await prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw createProviderNotFoundError();
    }

    const disabled = await prisma.aIProvider.update({
      where: { id: providerId },
      data: {
        enabled: false,
        isDefault: false,
      },
    });

    await tryCreateSettingsOperationLog({
      action: OPERATION_LOG_ACTIONS.DELETE_AI_PROVIDER,
      detail: `禁用 AI Provider ${disabled.name}`,
    });

    return disabled;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function enableAIProvider(providerId: number) {
  ensureProductWritesAllowed();

  try {
    const provider = await prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw createProviderNotFoundError();
    }

    const enabled = await prisma.aIProvider.update({
      where: { id: providerId },
      data: {
        enabled: true,
      },
    });

    await tryCreateSettingsOperationLog({
      action: OPERATION_LOG_ACTIONS.UPDATE_AI_PROVIDER,
      detail: `启用 AI Provider ${enabled.name}`,
    });

    return enabled;
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export function sanitizeProviderErrorMessage(message: string) {
  return message.replace(/sk-[A-Za-z0-9-_]+/g, "****");
}
