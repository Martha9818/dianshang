"use client";

import type { ReactNode } from "react";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardCard, MiniIcon, PageNote } from "@/components/dashboard/primitives";
import { DANGEROUS_CONFIRM_TEXT, type BatchOperationResult } from "@/lib/modules/batch/rules";

type BatchActionState = {
  ok?: boolean;
  message?: string;
  result?: BatchOperationResult;
};

type BatchOperationOption = {
  value: string;
  label: string;
  dangerous?: boolean;
  impact: string;
  requiresStatus?: boolean;
};

type StatusOption = {
  value: string;
  label: string;
};

export function BatchOperationForm({
  children,
  formId,
  action,
  operations,
  statusOptions = [],
  disabled = false,
  selectAllLabel = "全选",
}: {
  children: ReactNode;
  formId: string;
  action: (state: BatchActionState, formData: FormData) => Promise<BatchActionState>;
  operations: BatchOperationOption[];
  statusOptions?: StatusOption[];
  disabled?: boolean;
  selectAllLabel?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(action, {});
  const [selectedCount, setSelectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAction, setSelectedAction] = useState(operations[0]?.value ?? "");
  const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]?.value ?? "");
  const [confirmText, setConfirmText] = useState("");

  const selectedOperation = useMemo(
    () => operations.find((operation) => operation.value === selectedAction) ?? operations[0] ?? null,
    [operations, selectedAction],
  );
  const selectedStatusLabel = useMemo(
    () => statusOptions.find((status) => status.value === selectedStatus)?.label ?? selectedStatus,
    [selectedStatus, statusOptions],
  );
  const needsDangerConfirm = Boolean(selectedOperation?.dangerous);
  const isDangerConfirmed = !needsDangerConfirm || confirmText.trim() === DANGEROUS_CONFIRM_TEXT;
  const canSubmit =
    !disabled &&
    !isPending &&
    selectedCount > 0 &&
    (!selectedOperation?.requiresStatus || Boolean(selectedStatus)) &&
    isDangerConfirmed;

  const updateSelectedCount = useCallback(() => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(`input[name="ids"][form="${formId}"]`);
    setTotalCount(checkboxes.length);
    setSelectedCount(Array.from(checkboxes).filter((checkbox) => checkbox.checked).length);
  }, [formId]);

  function setAllChecked(checked: boolean) {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(`input[name="ids"][form="${formId}"]`);
    checkboxes.forEach((checkbox) => {
      checkbox.checked = checked;
    });
    setTotalCount(checkboxes.length);
    setSelectedCount(checked ? checkboxes.length : 0);
  }

  function toggleAllChecked() {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(`input[name="ids"][form="${formId}"]`);
    setAllChecked(!(checkboxes.length > 0 && selectedCount === checkboxes.length));
  }

  useEffect(() => {
    const handleChange = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.name === "ids" && target.getAttribute("form") === formId) {
        updateSelectedCount();
      }
    };

    document.addEventListener("change", handleChange);
    const initialCountTimer = window.setTimeout(updateSelectedCount, 0);
    return () => {
      window.clearTimeout(initialCountTimer);
      document.removeEventListener("change", handleChange);
    };
  }, [formId, updateSelectedCount]);

  return (
    <div className="space-y-4">
      <form
        id={formId}
        ref={formRef}
        action={formAction}
        onSubmit={(event) => {
          const currentSelectedCount = document.querySelectorAll<HTMLInputElement>(
            `input[name="ids"][form="${formId}"]:checked`,
          ).length;
          setSelectedCount(currentSelectedCount);
          if (currentSelectedCount === 0) {
            event.preventDefault();
            window.alert("请先选择要批量操作的记录。");
            return;
          }

          if (selectedOperation?.dangerous) {
            const confirmed = window.confirm(
              `${selectedOperation.label}\n选中 ${currentSelectedCount} 条。\n${selectedOperation.impact}\n确认继续？`,
            );
            if (!confirmed) {
              event.preventDefault();
            }
          }
        }}
      >
        <DashboardCard className="px-4 py-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
            <div className="min-w-[120px]">
              <p className="mb-2 px-1 text-sm text-slate-500">已选择</p>
              <div className="flex h-12 items-center rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm font-semibold text-slate-800">
                {selectedCount} 条
              </div>
            </div>
            <div className="min-w-[220px]">
              <p className="mb-2 px-1 text-sm text-slate-500">批量操作</p>
              <select
                name="action"
                value={selectedAction}
                onChange={(event) => {
                  const nextAction = event.target.value;
                  const nextOperation = operations.find((operation) => operation.value === nextAction) ?? null;
                  setSelectedAction(nextAction);
                  setConfirmText("");
                  if (nextOperation?.requiresStatus) {
                    setSelectedStatus((currentStatus) =>
                      statusOptions.some((status) => status.value === currentStatus) ? currentStatus : (statusOptions[0]?.value ?? ""),
                    );
                  }
                }}
                disabled={isPending}
                className="h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
              >
                {operations.map((operation) => (
                  <option key={operation.value} value={operation.value}>
                    {operation.label}
                  </option>
                ))}
              </select>
            </div>
            {selectedOperation?.requiresStatus ? (
              <div className="min-w-[180px]">
                <p className="mb-2 px-1 text-sm text-slate-500">目标状态</p>
                <select
                  name="status"
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  disabled={isPending}
                  className="h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {selectedOperation?.dangerous ? (
              <div className="min-w-[220px] xl:flex-1">
                <p className="mb-2 px-1 text-sm text-slate-500">二次确认</p>
                <input
                  key={selectedAction}
                  name="confirmText"
                  placeholder={DANGEROUS_CONFIRM_TEXT}
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  disabled={isPending}
                  className="h-12 w-full rounded-2xl border border-rose-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50 disabled:opacity-60"
                />
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleAllChecked}
                disabled={isPending || disabled || totalCount === 0}
                className="inline-flex h-12 cursor-pointer items-center justify-center rounded-2xl border border-[#E4EAF3] bg-white px-5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {totalCount > 0 && selectedCount === totalCount ? "取消全选" : selectAllLabel}
              </button>
              <button
                type="button"
                onClick={() => setAllChecked(false)}
                disabled={isPending || disabled || selectedCount === 0}
                className="inline-flex h-12 cursor-pointer items-center justify-center rounded-2xl border border-[#E4EAF3] bg-white px-5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                清空
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MiniIcon name="shield" className="h-4 w-4" />
                {isPending ? "处理中..." : "执行"}
              </button>
            </div>
          </div>
          {selectedOperation ? (
            <div className="mt-3 rounded-2xl border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-3 text-sm leading-6 text-slate-600">
              <p className="font-medium text-slate-800">
                {selectedOperation.requiresStatus
                  ? `本次会把 ${selectedCount} 条记录改为“${selectedStatusLabel || "未选择"}”。`
                  : `本次会对 ${selectedCount} 条记录执行“${selectedOperation.label}”。`}
              </p>
              <p className="mt-1 text-slate-500">{selectedOperation.impact}</p>
              {selectedOperation.dangerous && !isDangerConfirmed ? (
                <p className="mt-1 text-rose-600">请输入“{DANGEROUS_CONFIRM_TEXT}”后才能执行。</p>
              ) : null}
            </div>
          ) : null}
          {disabled ? <p className="mt-3 text-sm text-amber-600">预览环境只读，请在 Windows 本地验收。</p> : null}
          {state.message ? (
            <div
              className={[
                "mt-3 rounded-2xl border px-4 py-3 text-sm leading-6",
                state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700",
              ].join(" ")}
            >
              <p>{state.message}</p>
              {state.result ? (
                <p>
                  结果：成功 {state.result.successCount}，失败 {state.result.failedCount}，跳过 {state.result.skippedCount}。
                </p>
              ) : null}
              {state.result?.errors.length ? (
                <ul className="mt-2 space-y-1">
                  {state.result.errors.map((error) => (
                    <li key={`${error.id}-${error.reason}`}>
                      {error.id > 0 ? `#${error.id}：` : ""}
                      {error.reason}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </DashboardCard>
      </form>
      {selectedOperation?.dangerous ? (
        <PageNote>危险批量操作会显示影响范围，并要求输入“{DANGEROUS_CONFIRM_TEXT}”。</PageNote>
      ) : null}
      {children}
    </div>
  );
}
