"use server";

import { revalidatePath } from "next/cache";
import { getProductErrorMessage } from "@/lib/modules/products";
import { type CleanupOperationSummary, type FileMaintenancePageData } from "@/lib/modules/cleanup/fileMaintenanceTypes";
import { compactRealProductAndMaterialIds } from "@/lib/services/real-id-maintenance-service";
import {
  moveFilesToTrash,
  parseDeleteSelections,
  parseMoveSelections,
  permanentlyDeleteTrashFiles,
  refreshFileMaintenanceData,
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
  revalidatePath("/products");
  revalidatePath("/materials");
  revalidatePath("/screenshots");
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
    });
    const data = await refreshFileMaintenanceData();
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
      message: getProductErrorMessage(error, "移入回收站失败，请重新扫描后再试。"),
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
    });
    const data = await refreshFileMaintenanceData();
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
      message: getProductErrorMessage(error, "永久删除失败，请重新扫描后再试。"),
    };
  }
}

export async function compactRealIdsAction(
  _state: FileMaintenanceActionState,
  formData: FormData,
): Promise<FileMaintenanceActionState> {
  void _state;

  try {
    const confirmText = String(formData.get("confirmText") ?? "").trim();
    if (confirmText !== "重排真实ID") {
      return {
        ok: false,
        message: "请输入确认文案“重排真实ID”后再执行。",
      };
    }

    const result = await compactRealProductAndMaterialIds();
    const data = await refreshFileMaintenanceData();
    revalidateMaintenancePaths();

    return {
      ok: true,
      message: [
        "真实 ID 整理完成，已先创建本地备份。",
        `商品 ID 改动 ${result.productIdChangeCount} 个，素材 ID 改动 ${result.materialIdChangeCount} 个。`,
        `商品文件夹改名 ${result.productFolderRenameCount} 个，清理已删除商品 ${result.hardDeletedProductCount} 个，清理废弃素材记录 ${result.discardedMaterialCount} 个。`,
      ].join(" "),
      data,
    };
  } catch (error) {
    revalidateMaintenancePaths();
    return {
      ok: false,
      message: getProductErrorMessage(error, "真实 ID 整理失败。系统已在执行前尝试创建本地备份，请检查备份记录后再重试。"),
    };
  }
}
