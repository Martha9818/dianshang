"use server";

import { revalidatePath } from "next/cache";
import {
  INSPIRATION_CONVERSION_CONFIRM_FIELD,
  INSPIRATION_CONVERSION_CONFIRM_VALUE,
} from "@/lib/modules/inspirations/conversion";
import { getProductErrorMessage } from "@/lib/modules/products";
import { getRuntimeModeSummary } from "@/lib/services/product-runtime-service";
import {
  ignoreImageReviewLog,
  markImageReviewLogArchiveSuggested,
  rebuildImageFingerprint,
  rebuildImageFingerprintsForLibrary,
} from "@/lib/services/image-dedup";
import {
  applyInspirationAiSuggestion,
  archiveInspiration,
  convertInspirationToProduct,
  deleteInspirationAiDraftJobs,
  deleteInspirationScanLogs,
  deleteInspirationScanJobs,
  generateInspirationAiSuggestion,
  ignoreInspirationAiDraft,
  ignoreInspiration,
  markReviewed,
  rejectInspiration,
  retryFailedInspirationScanJob,
  retryInspirationAiDraftJob,
  runManualInspirationScan,
  runScheduledInspirationScanIfDue,
  saveInspirationDraft,
  saveInspirationFolderPath,
  saveInspirationScanConfig,
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

function parseTaskIds(formData: FormData, fieldName: string) {
  return formData
    .getAll(fieldName)
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

export async function saveInspirationScanConfigAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const result = await saveInspirationScanConfig({
      enabled: formData.get("scanEnabled") === "on",
      intervalMinutes: String(formData.get("scanIntervalMinutes") ?? "30"),
    });
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "保存灵感定时扫描配置失败，请稍后重试。"),
    };
  }
}

export async function runScheduledInspirationScanAction() {
  try {
    if (!getRuntimeModeSummary().isWritable) {
      return { success: true as const, data: { skipped: true as const, reason: "readonly_runtime" } };
    }

    const result = await runScheduledInspirationScanIfDue();
    if (!result.skipped) {
      revalidateInspirations();
      revalidatePath("/");
    }
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "定时扫描失败，不影响手动扫描。"),
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

export async function ignoreInspirationAiDraftAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const inspirationId = parsePositiveId(formData.get("inspirationId"), "灵感记录");
    const result = await ignoreInspirationAiDraft(inspirationId);
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "忽略 AI 草稿失败，请稍后重试。"),
    };
  }
}

export async function retryInspirationAiDraftJobAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const aiDraftJobId = parsePositiveId(formData.get("aiDraftJobId"), "AI 草稿任务");
    const result = await retryInspirationAiDraftJob(aiDraftJobId);
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "重试 AI 草稿任务失败，请稍后重试。"),
    };
  }
}

export async function retryInspirationScanJobAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const scanJobId = parsePositiveId(formData.get("scanJobId"), "扫描任务");
    const result = await retryFailedInspirationScanJob(scanJobId);
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "重试扫描任务失败，请稍后重试。"),
    };
  }
}

export async function deleteInspirationScanJobsAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const result = await deleteInspirationScanJobs(parseTaskIds(formData, "scanJobIds"));
    revalidateInspirations();
    return { success: true as const, data: result, message: `已删除 ${result.deletedCount} 条扫描任务记录。` };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "删除扫描任务记录失败，请稍后重试。"),
    };
  }
}

export async function deleteInspirationAiDraftJobsAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const result = await deleteInspirationAiDraftJobs(parseTaskIds(formData, "aiDraftJobIds"));
    revalidateInspirations();
    return { success: true as const, data: result, message: `已删除 ${result.deletedCount} 条 AI 草稿任务记录。` };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "删除 AI 草稿任务记录失败，请稍后重试。"),
    };
  }
}

export async function deleteInspirationScanLogsAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const result = await deleteInspirationScanLogs(parseTaskIds(formData, "scanLogIds"));
    revalidateInspirations();
    return { success: true as const, data: result, message: `已删除 ${result.deletedCount} 条 ScanLog 记录。` };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "删除 ScanLog 记录失败，请稍后重试。"),
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
    if (String(formData.get(INSPIRATION_CONVERSION_CONFIRM_FIELD) ?? "") !== INSPIRATION_CONVERSION_CONFIRM_VALUE) {
      throw new Error("请先确认 AI 预填信息后再创建商品。");
    }
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

export async function rebuildInspirationFingerprintAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const inspirationId = parsePositiveId(formData.get("inspirationId"), "灵感记录");
    const result = await rebuildImageFingerprint({ type: "inspiration", id: inspirationId });
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "图片去重检测失败，请稍后重试。"),
    };
  }
}

export async function rebuildInspirationLibraryFingerprintsAction(_prevState: unknown, _formData: FormData) {
  void _prevState;
  void _formData;
  try {
    const result = await rebuildImageFingerprintsForLibrary("inspiration");
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "灵感相似度检查失败，请稍后重试。"),
    };
  }
}

export async function ignoreInspirationImageReviewLogAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const reviewLogId = parsePositiveId(formData.get("reviewLogId"), "审阅记录");
    const result = await ignoreImageReviewLog(reviewLogId);
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "忽略图片重复提示失败，请稍后重试。"),
    };
  }
}

export async function markInspirationImageReviewLogArchiveSuggestedAction(_prevState: unknown, formData: FormData) {
  void _prevState;
  try {
    const reviewLogId = parsePositiveId(formData.get("reviewLogId"), "审阅记录");
    const result = await markImageReviewLogArchiveSuggested(reviewLogId);
    revalidateInspirations();
    return { success: true as const, data: result };
  } catch (error) {
    return {
      success: false as const,
      error: getProductErrorMessage(error, "标记建议归档失败，请稍后重试。"),
    };
  }
}
