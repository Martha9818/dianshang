"use server";

import { revalidatePath } from "next/cache";
import { BackupReadonlyError } from "@/lib/services/thread07-errors";
import { getRuntimeModeSummary } from "@/lib/services/product-runtime-service";
import { sanitizeLogMessage } from "@/lib/services/logging";

const PREVIEW_READONLY_MESSAGE = "预览环境只读，请在 Windows 本地验收。";

export async function createManualBackupAction() {
  try {
    if (!getRuntimeModeSummary().isWritable) {
      return { ok: false, message: PREVIEW_READONLY_MESSAGE };
    }

    const { createManualBackup } = await import(
      /* turbopackIgnore: true */
      "@/lib/services/backup-service"
    );
    await createManualBackup();
    revalidatePath("/");
    revalidatePath("/backup");
    return { ok: true, message: "手动备份完成。" };
  } catch (error) {
    revalidatePath("/");
    revalidatePath("/backup");

    if (error instanceof BackupReadonlyError || (error instanceof Error && error.name === "BackupReadonlyError")) {
      return { ok: false, message: PREVIEW_READONLY_MESSAGE };
    }

    console.error("Manual backup failed", sanitizeLogMessage(error));
    return { ok: false, message: "手动备份失败，请查看最近备份历史中的错误原因。" };
  }
}
