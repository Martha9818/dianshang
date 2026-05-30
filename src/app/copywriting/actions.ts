"use server";

import { revalidatePath } from "next/cache";
import { type CopywritingPlatform } from "@/lib/modules/copywriting/prompts";
import { getProductErrorMessage } from "@/lib/modules/products";
import {
  clearCopywritingUsedMark,
  generateMultiPlatformCopywritingPackage,
  generatePlatformCopywriting,
  markCopywritingAsUsed,
  saveManualCopywriting,
  type CopywritingFormValues,
} from "@/lib/services/copywriting-service";

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
      error: getProductErrorMessage(error, "生成文案失败，请稍后重试。"),
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
      error: getProductErrorMessage(error, "生成多平台文案包失败，请稍后重试。"),
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
