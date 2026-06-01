"use client";

import { useActionState } from "react";
import {
  deleteLinkImportDraftsInlineAction,
  type LinkImportDraftDeleteActionState,
} from "@/app/link-imports/actions";

type LinkImportDraftDeleteToolbarProps = {
  formId: string;
  disabled: boolean;
  purpose: string;
  status: string;
  draftIds: number[];
};

export function LinkImportDraftDeleteToolbar({
  formId,
  disabled,
  purpose,
  status,
  draftIds,
}: LinkImportDraftDeleteToolbarProps) {
  const initialState: LinkImportDraftDeleteActionState = { success: false };
  const [state, formAction, pending] = useActionState(deleteLinkImportDraftsInlineAction, initialState);
  const totalCount = draftIds.length;

  function selectAllDrafts() {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="draftIds"][form="${formId}"]`);
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  return (
    <form id={formId} action={formAction} className="flex flex-wrap items-center gap-2 border-b border-[#EEF2F8] px-5 py-3">
      <input type="hidden" name="purpose" value={purpose} />
      <input type="hidden" name="status" value={status} />
      {draftIds.map((draftId) => (
        <input key={draftId} type="hidden" name="allDraftIds" value={draftId} />
      ))}
      <button
        type="button"
        onClick={selectAllDrafts}
        className="inline-flex h-9 items-center justify-center rounded-xl border border-[#DCE5F2] bg-white px-3 text-xs font-medium text-[#2563EB] hover:bg-blue-50 disabled:opacity-60"
        disabled={pending || disabled || totalCount === 0}
      >
        全选
      </button>
      <button
        type="submit"
        onClick={selectAllDrafts}
        className="inline-flex h-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-medium text-rose-600 disabled:opacity-60"
        disabled={pending || disabled || totalCount === 0}
      >
        {pending ? "删除中..." : "全部删除"}
      </button>
      <span className="text-xs leading-5 text-slate-400">只删除链接草稿记录，不删除已转灵感、商品/竞品关联或截图文件。</span>
      {state.message ? <span className="text-xs text-emerald-600">{state.message}</span> : null}
      {state.error ? <span className="text-xs text-rose-600">{state.error}</span> : null}
    </form>
  );
}
