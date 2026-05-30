"use server";

import { revalidatePath } from "next/cache";
import { BackupReadonlyError } from "@/lib/services/thread07-errors";

export async function createManualBackupAction() {
  try {
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
      return { ok: false, message: error.message };
    }

    console.error("Manual backup failed", error);
    return { ok: false, message: "手动备份失败，请查看最近备份历史中的错误原因。" };
  }
}
