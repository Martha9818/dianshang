"use client";

import { useActionState } from "react";
import { ActionButton, MiniIcon } from "@/components/dashboard/primitives";
import { createExcelExportAction } from "@/app/export/actions";

type ExportActionState = {
  ok?: boolean;
  message?: string;
};

async function submitExport(_state: ExportActionState, formData: FormData): Promise<ExportActionState> {
  return createExcelExportAction(formData);
}

export function ExportSubmitForm() {
  const [state, formAction, isPending] = useActionState(submitExport, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="includeCopywritingContent" value="on" />
      <input type="hidden" name="includeImagePaths" value="on" />
      <ActionButton type="submit">
        <MiniIcon name="download" className="h-4 w-4" />
        {isPending ? "正在导出..." : "一键导出 Excel"}
      </ActionButton>
      {state.message ? (
        <p className={["mt-3 text-sm", state.ok ? "text-emerald-600" : "text-amber-600"].join(" ")}>
          {state.message}
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-400">默认包含 6 个 Sheet</p>
      )}
    </form>
  );
}
