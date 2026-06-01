"use client";

type LinkImportDraftDeleteToolbarProps = {
  formId: string;
  disabled: boolean;
  totalCount: number;
};

export function LinkImportDraftDeleteToolbar({
  formId,
  disabled,
  totalCount,
}: LinkImportDraftDeleteToolbarProps) {
  function selectAllDrafts() {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="draftIds"][form="${formId}"]`);
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={selectAllDrafts}
        className="inline-flex h-9 items-center justify-center rounded-xl border border-[#DCE5F2] bg-white px-3 text-xs font-medium text-[#2563EB] hover:bg-blue-50 disabled:opacity-60"
        disabled={disabled || totalCount === 0}
      >
        全选
      </button>
      <button
        type="submit"
        onClick={selectAllDrafts}
        className="inline-flex h-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-medium text-rose-600 disabled:opacity-60"
        disabled={disabled || totalCount === 0}
      >
        全部删除
      </button>
    </div>
  );
}
