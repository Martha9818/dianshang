"use server";

import { revalidatePath } from "next/cache";
import { getProductErrorMessage } from "@/lib/modules/products";
import {
  MOVE_TO_TRASH_CONFIRM_TEXT,
  PERMANENT_DELETE_CONFIRM_TEXT,
  type CleanupOperationSummary,
  type FileMaintenancePageData,
} from "@/lib/modules/cleanup/fileMaintenanceTypes";
import {
  moveFilesToTrash,
  parseDeleteSelections,
  parseMoveSelections,
  permanentlyDeleteTrashFiles,
  scanFileMaintenance,
} from "@/lib/services/fileMaintenanceService";

export type FileMaintenanceActionState = {
  ok?: boolean;
  message?: string;
  data?: FileMaintenancePageData;
  result?: CleanupOperationSummary;
};

function revalidateMaintenancePaths() {
  revalidatePath("/");
  revalidatePath("/maintenance/files");
  revalidatePath("/system/diagnostics");
  revalidatePath("/notifications");
}

export async function scanFileMaintenanceAction(
  _state?: FileMaintenanceActionState,
  _formData?: FormData,
): Promise<FileMaintenanceActionState> {
  void _state;
  void _formData;

  try {
    const data = await scanFileMaintenance();
    return {
      ok: true,
      message: data.readonlyMessage ?? `扫描完成：发现 ${data.stats.total} 个文件项，${data.stats.movable} 个建议人工清理。`,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      message: getProductErrorMessage(error, "文件扫描失败，请稍后重试。"),
    };
  }
}

export async function moveFilesToTrashAction(
  _state: FileMaintenanceActionState,
  formData: FormData,
): Promise<FileMaintenanceActionState> {
  void _state;

  try {
    const result = await moveFilesToTrash({
      selections: parseMoveSelections(formData.getAll("items")),
      confirmText: String(formData.get("confirmText") ?? ""),
    });
    const data = await scanFileMaintenance();
    revalidateMaintenancePaths();

    return {
      ok: result.failedCount === 0,
      message: `移入回收站完成：成功 ${result.successCount}，失败 ${result.failedCount}，跳过 ${result.skippedCount}。`,
      result,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      message: getProductErrorMessage(error, `移入回收站失败，请确认已输入“${MOVE_TO_TRASH_CONFIRM_TEXT}”。`),
    };
  }
}

export async function permanentlyDeleteTrashFilesAction(
  _state: FileMaintenanceActionState,
  formData: FormData,
): Promise<FileMaintenanceActionState> {
  void _state;

  try {
    const result = await permanentlyDeleteTrashFiles({
      selections: parseDeleteSelections(formData.getAll("items")),
      confirmText: String(formData.get("confirmText") ?? ""),
    });
    const data = await scanFileMaintenance();
    revalidateMaintenancePaths();

    return {
      ok: result.failedCount === 0,
      message: `永久删除完成：成功 ${result.successCount}，失败 ${result.failedCount}，跳过 ${result.skippedCount}。`,
      result,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      message: getProductErrorMessage(error, `永久删除失败，请确认已输入“${PERMANENT_DELETE_CONFIRM_TEXT}”。`),
    };
  }
}
