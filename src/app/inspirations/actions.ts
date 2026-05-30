"use server";

import { revalidatePath } from "next/cache";
import { getProductErrorMessage } from "@/lib/modules/products";
import {
  applyInspirationAiSuggestion,
  archiveInspiration,
  convertInspirationToProduct,
  generateInspirationAiSuggestion,
  ignoreInspiration,
  markReviewed,
  rejectInspiration,
  runManualInspirationScan,
  saveInspirationDraft,
  saveInspirationFolderPath,
} from "@/lib/services/inspirations";
import { type BatchOperationResult } from "@/lib/modules/batch/rules";
import { runBatchOperation } from "@/lib/services/batchOperationService";

type BatchActionState = {
  ok?: boolean;
  message?: string;
  result?: BatchOperationResult;
};

function revalidateInspirations() {
  revalidatePath("/inspirations");
  revalidatePath("/system/diagnostics");
  revalidatePath("/");
}

function parsePositiveId(value: FormDataEntryValue | null, label: string) {
  const id = Number(value ?? "");
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} 无效。`);
  }

  return id;
}

function parseBatchIds(formData: FormData) {
  return formData
    .getAll("ids")
    .map((value) => Number(value))
    .filter((id) => Number.isInteger(id) && id > 0);
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
    const inspirationId = parsePositiveId(formData.get("inspirationId"), "灵感记录");
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
    const inspirationId = parsePositiveId(formData.get("inspirationId"), "灵感记录");
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
    const inspirationId = parsePositiveId(formData.get("inspirationId"), "灵感记录");
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
    const inspirationId = parsePositiveId(formData.get("inspirationId"), "灵感记录");
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

export async function markInspirationReviewedAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const inspirationId = parsePositiveId(formData.get("inspirationId"), "灵感记录");
    const result = await markReviewed(inspirationId);
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "标记已查看失败，请稍后重试。"),
    };
  }
}

export async function archiveInspirationAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const inspirationId = parsePositiveId(formData.get("inspirationId"), "灵感记录");
    const result = await archiveInspiration(inspirationId);
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "归档灵感失败，请稍后重试。"),
    };
  }
}

export async function rejectInspirationAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const inspirationId = parsePositiveId(formData.get("inspirationId"), "灵感记录");
    const reason = String(formData.get("rejectedReason") ?? "");
    const result = await rejectInspiration({ inspirationId, reason });
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "放弃灵感失败，请稍后重试。"),
    };
  }
}

export async function convertInspirationToProductAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const inspirationId = parsePositiveId(formData.get("inspirationId"), "灵感记录");
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

export async function batchInspirationOperationAction(
  _state: BatchActionState,
  formData: FormData,
): Promise<BatchActionState> {
  void _state;

  try {
    const result = await runBatchOperation({
      entity: "INSPIRATION",
      action: String(formData.get("action") ?? ""),
      ids: parseBatchIds(formData),
      confirmText: String(formData.get("confirmText") ?? ""),
    });

    revalidateInspirations();
    return {
      ok: result.failedCount === 0,
      message: `批量操作完成：成功 ${result.successCount}，失败 ${result.failedCount}，跳过 ${result.skippedCount}。`,
      result,
    };
  } catch (error) {
    return {
      ok: false,
      message: getProductErrorMessage(error, "批量操作失败，请稍后重试。"),
    };
  }
}
