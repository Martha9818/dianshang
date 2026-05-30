"use server";

import { revalidatePath } from "next/cache";
import { getProductErrorMessage, OPERATION_LOG_ACTIONS } from "@/lib/modules/products";
import {
  createAIProvider,
  deleteAIProvider,
  disableAIProvider,
  enableAIProvider,
  extractAIProviderFormValues,
  updateAIProvider,
} from "@/lib/services/ai-provider-service";
import { testConnection, testConnectionWithConfig } from "@/lib/services/ai-client";
import {
  createBannedWord,
  deleteBannedWord,
  extractBannedWordFormValues,
  updateBannedWord,
} from "@/lib/services/banned-word-service";
import { tryCreateSettingsOperationLog } from "@/lib/services/operation-log-service";

export async function saveAIProviderAction(formData: FormData) {
  try {
    const values = extractAIProviderFormValues(formData);
    const providerId = Number(formData.get("providerId") ?? "");
    const savedProvider =
      Number.isInteger(providerId) && providerId > 0
        ? await updateAIProvider(providerId, values)
        : await createAIProvider(values);

    revalidatePath("/settings/ai");
    revalidatePath("/copywriting");

    return {
      success: true as const,
      data: {
        id: savedProvider.id,
        enabled: savedProvider.enabled,
        isDefault: savedProvider.isDefault,
        hasApiKey: Boolean(savedProvider.apiKey),
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "保存 AI Provider 失败，请稍后重试。"),
    };
  }
}

export async function deleteAIProviderAction(providerId: number) {
  try {
    await deleteAIProvider(providerId);
    revalidatePath("/settings/ai");
    revalidatePath("/copywriting");
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "删除 AI Provider 失败，请稍后重试。"),
    };
  }
}

export async function disableAIProviderAction(providerId: number) {
  try {
    await disableAIProvider(providerId);
    revalidatePath("/settings/ai");
    revalidatePath("/copywriting");
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "禁用 AI Provider 失败，请稍后重试。"),
    };
  }
}

export async function enableAIProviderAction(providerId: number) {
  try {
    await enableAIProvider(providerId);
    revalidatePath("/settings/ai");
    revalidatePath("/copywriting");
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "启用 AI Provider 失败，请稍后重试。"),
    };
  }
}

export async function testAIProviderConnectionAction(providerId: number) {
  try {
    const result = await testConnection(providerId);
    await tryCreateSettingsOperationLog({
      action: OPERATION_LOG_ACTIONS.TEST_AI_PROVIDER,
      detail: `测试 AI Provider 连接成功：${result.modelName}`,
    });
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "测试连接失败，请稍后重试。"),
    };
  }
}

export async function testAIProviderConnectionWithConfigAction(input: {
  baseUrl: string;
  apiKey: string;
  modelName: string;
  providerType: string;
}) {
  try {
    const result = await testConnectionWithConfig(input);
    await tryCreateSettingsOperationLog({
      action: OPERATION_LOG_ACTIONS.TEST_AI_PROVIDER,
      detail: `测试未保存 AI Provider 配置成功：${result.modelName}`,
    });
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "测试连接失败，请稍后重试。"),
    };
  }
}

export async function saveBannedWordAction(formData: FormData) {
  try {
    const values = extractBannedWordFormValues(formData);
    const wordId = Number(formData.get("wordId") ?? "");

    if (Number.isInteger(wordId) && wordId > 0) {
      await updateBannedWord(wordId, values);
    } else {
      await createBannedWord(values);
    }

    revalidatePath("/settings/banned-words");
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "保存违规词失败，请稍后重试。"),
    };
  }
}

export async function deleteBannedWordAction(wordId: number) {
  try {
    await deleteBannedWord(wordId);
    revalidatePath("/settings/banned-words");
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "删除违规词失败，请稍后重试。"),
    };
  }
}
