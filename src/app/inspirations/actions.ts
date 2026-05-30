"use server";

import { revalidatePath } from "next/cache";
import { getProductErrorMessage } from "@/lib/modules/products";
import {
  applyInspirationAiSuggestion,
  convertInspirationToProduct,
  generateInspirationAiSuggestion,
  ignoreInspiration,
  runManualInspirationScan,
  saveInspirationDraft,
  saveInspirationFolderPath,
} from "@/lib/services/inspirations";

function revalidateInspirations() {
  revalidatePath("/inspirations");
  revalidatePath("/system/diagnostics");
}

export async function saveInspirationFolderAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const folderPath = String(formData.get("folderPath") ?? "");
    const result = await saveInspirationFolderPath(folderPath);
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "保存灵感文件夹失败，请稍后重试。"),
    };
  }
}

export async function runInspirationScanAction(_prevState: unknown, _formData: FormData) {
  void _prevState;
  void _formData;
  try {
    const result = await runManualInspirationScan();
    revalidateInspirations();
    revalidatePath("/");
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "手动扫描失败，请稍后重试。"),
    };
  }
}

export async function saveInspirationDraftAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const inspirationId = Number(formData.get("inspirationId") ?? "");
    const title = String(formData.get("title") ?? "");
    const note = String(formData.get("note") ?? "");

    const result = await saveInspirationDraft({
      inspirationId,
      title,
      note,
    });

    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "保存灵感草稿失败，请稍后重试。"),
    };
  }
}

export async function generateInspirationAiSuggestionAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const inspirationId = Number(formData.get("inspirationId") ?? "");
    const result = await generateInspirationAiSuggestion(inspirationId);
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "AI 识图建议失败，请稍后重试。"),
    };
  }
}

export async function applyInspirationAiSuggestionAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const inspirationId = Number(formData.get("inspirationId") ?? "");
    const result = await applyInspirationAiSuggestion(inspirationId);
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "应用 AI 建议失败，请稍后重试。"),
    };
  }
}

export async function ignoreInspirationAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const inspirationId = Number(formData.get("inspirationId") ?? "");
    const result = await ignoreInspiration(inspirationId);
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "忽略灵感失败，请稍后重试。"),
    };
  }
}

export async function convertInspirationToProductAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const inspirationId = Number(formData.get("inspirationId") ?? "");
    const result = await convertInspirationToProduct({
      inspirationId,
      name: String(formData.get("name") ?? ""),
      categoryLevel1: String(formData.get("categoryLevel1") ?? ""),
      targetUser: String(formData.get("targetUser") ?? ""),
      sellingPointsText: String(formData.get("sellingPointsText") ?? ""),
      usageScenesText: String(formData.get("usageScenesText") ?? ""),
      tagsText: String(formData.get("tagsText") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });

    revalidatePath("/inspirations");
    revalidatePath("/products");
    revalidatePath(`/products/${result.id}`);
    revalidatePath("/");
    revalidatePath("/system/diagnostics");

    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "转为商品失败，请稍后重试。"),
    };
  }
}
