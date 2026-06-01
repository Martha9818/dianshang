"use server";

import { revalidatePath } from "next/cache";
import { type CopywritingPlatform } from "@/lib/modules/copywriting/prompts";
import { getProductErrorMessage } from "@/lib/modules/products";
import {
  clearCopywritingUsedMark,
  deleteCopywriting,
  deleteCopywritings,
  generateMultiPlatformCopywritingPackage,
  generatePlatformCopywriting,
  markCopywritingAsUsed,
  saveManualCopywriting,
  type CopywritingFormValues,
} from "@/lib/services/copywriting-service";

function getCopywritingAIErrorMessage(error: unknown, fallbackMessage: string) {
  const message = getProductErrorMessage(error, fallbackMessage);

  if (/网络超时/i.test(message)) {
    return `${message} 文案包会一次生成 4 个平台共 12 条文案，当前 Provider 响应较慢时更容易超时；如果仍频繁出现，请先检查 Provider 稳定性，或先按单平台生成。`;
  }

  if (/连接 AI 服务失败|Base URL|模型不可用|model/i.test(message)) {
    return `${message} 如果当前切换的是豆包，请确认 Base URL 使用火山方舟 OpenAI 兼容地址（例如 https://ark.cn-beijing.volces.com/api/v3 ），模型名填写 Endpoint ID，并确认该模型支持文本对话。`;
  }

  return message;
}

export async function generateCopywritingAction(input: {
  productId: number;
  platform: CopywritingPlatform;
  providerId?: number | null;
}) {
  try {
    const result = await generatePlatformCopywriting(input);
    revalidatePath("/copywriting");
    revalidatePath("/");
    revalidatePath(`/products/${input.productId}`);
    revalidatePath("/system/diagnostics");
    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    return {
      success: false as const,
      error: getCopywritingAIErrorMessage(error, "生成文案失败，请稍后重试。"),
    };
  }
}

export async function generateMultiPlatformCopywritingAction(input: {
  productId: number;
  providerId?: number | null;
  retryFromAiJobId?: number | null;
}) {
  try {
    const result = await generateMultiPlatformCopywritingPackage(input);
    revalidatePath("/copywriting");
    revalidatePath("/");
    revalidatePath(`/products/${input.productId}`);
    revalidatePath("/system/diagnostics");
    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    return {
      success: false as const,
      error: getCopywritingAIErrorMessage(error, "生成多平台文案包失败，请稍后重试。"),
    };
  }
}

export async function saveManualCopywritingAction(values: CopywritingFormValues) {
  try {
    const result = await saveManualCopywriting(values);
    revalidatePath("/copywriting");
    revalidatePath("/");
    revalidatePath(`/products/${values.productId}`);
    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "保存文案失败，请稍后重试。"),
    };
  }
}

export async function markCopywritingUsedAction(input: {
  copywritingId: number;
  productId: number;
  platform: CopywritingPlatform;
  usageNote?: string | null;
}) {
  try {
    const result = await markCopywritingAsUsed(input);
    revalidatePath("/copywriting");
    revalidatePath(`/products/${input.productId}`);
    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "标记实际使用版本失败，请稍后重试。"),
    };
  }
}

export async function clearCopywritingUsedAction(input: { copywritingId: number; productId: number }) {
  try {
    const result = await clearCopywritingUsedMark(input.copywritingId);
    revalidatePath("/copywriting");
    revalidatePath(`/products/${input.productId}`);
    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "取消实际使用标记失败，请稍后重试。"),
    };
  }
}

export async function deleteCopywritingAction(input: { copywritingId: number; productId: number }) {
  try {
    const result = await deleteCopywriting(input.copywritingId, input.productId);
    revalidatePath("/copywriting");
    revalidatePath("/");
    revalidatePath(`/products/${input.productId}`);
    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "删除文案失败，请稍后重试。"),
    };
  }
}

export async function deleteCopywritingsAction(input: { copywritingIds: number[] }) {
  try {
    const result = await deleteCopywritings(input.copywritingIds);
    revalidatePath("/copywriting");
    revalidatePath("/");
    for (const productId of result.productIds) {
      revalidatePath(`/products/${productId}`);
    }
    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "批量删除文案失败，请稍后重试。"),
    };
  }
}
