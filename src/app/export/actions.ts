"use server";

import { revalidatePath } from "next/cache";
import { createExcelExport } from "@/lib/services/export-service";
import { ExportReadonlyError } from "@/lib/services/thread07-errors";
import { getRuntimeModeSummary } from "@/lib/services/product-runtime-service";
import { sanitizeLogMessage } from "@/lib/services/logging";

const PREVIEW_READONLY_MESSAGE = "预览环境只读，请在 Windows 本地验收。";

export async function createExcelExportAction(formData: FormData) {
  try {
    if (!getRuntimeModeSummary().isWritable) {
      return { ok: false, message: PREVIEW_READONLY_MESSAGE };
    }

    await createExcelExport({
      includeCopywritingContent: formData.get("includeCopywritingContent") === "on",
      includeImagePaths: formData.get("includeImagePaths") === "on",
    });
    revalidatePath("/");
    revalidatePath("/export");
    return { ok: true, message: "Excel 导出完成。" };
  } catch (error) {
    revalidatePath("/");
    revalidatePath("/export");

    if (error instanceof ExportReadonlyError || (error instanceof Error && error.name === "ExportReadonlyError")) {
      return { ok: false, message: PREVIEW_READONLY_MESSAGE };
    }

    console.error("Excel export failed", sanitizeLogMessage(error));
    return { ok: false, message: "Excel 导出失败，请查看最近导出记录中的错误原因。" };
  }
}
