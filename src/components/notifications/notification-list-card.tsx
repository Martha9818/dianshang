"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import {
  batchNotificationOperationAction,
} from "@/app/notifications/actions";
import {
  DashboardCard,
  DashboardCardHeader,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  MiniIcon,
  StatusBadge,
  TableActionLink,
  TableScrollArea,
} from "@/components/dashboard/primitives";
import { CleanupOldNotificationsForm, DeleteNotificationForm, MarkNotificationReadForm } from "@/components/notifications/notification-actions";
import { DANGEROUS_CONFIRM_TEXT } from "@/lib/modules/batch/rules";
import { formatDateTime } from "@/lib/modules/products";

const NOTIFICATION_BATCH_FORM_ID = "notification-batch-operation";

type BatchNotificationView = {
  id: number;
  title: string;
  message: string | null;
  level: "success" | "info" | "error" | "warning";
  levelLabel: string;
  type: string;
  typeLabel: string;
  status: "unread" | "read";
  isUnread: boolean;
  relatedType: string | null;
  relatedId: string | null;
  actionUrl: string | null;
  createdAt: Date | string;
};

type NotificationTypeOption = {
  value: string;
  label: string;
  count: number;
};

function levelTone(level: BatchNotificationView["level"]) {
  if (level === "success") return "green" as const;
  if (level === "warning") return "amber" as const;
  if (level === "error") return "red" as const;
  return "blue" as const;
}

function statusTone(status: BatchNotificationView["status"]) {
  return status === "unread" ? ("blue" as const) : ("slate" as const);
}

function getTypeHref(type: string) {
  if (type === "ALL") {
    return "/notifications";
  }

  return `/notifications?type=${type}`;
}

export function NotificationListCard({
  notifications,
  typeOptions,
  isWritable,
}: {
  notifications: BatchNotificationView[];
  typeOptions: NotificationTypeOption[];
  isWritable: boolean;
}) {
  const [state, formAction, isPending] = useActionState(batchNotificationOperationAction, {});
  const [selectedCount, setSelectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const updateSelectedCount = useCallback(() => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      `input[name="ids"][form="${NOTIFICATION_BATCH_FORM_ID}"]`,
    );
    setTotalCount(checkboxes.length);
    setSelectedCount(Array.from(checkboxes).filter((checkbox) => checkbox.checked).length);
  }, []);

  const setAllChecked = useCallback((checked: boolean) => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      `input[name="ids"][form="${NOTIFICATION_BATCH_FORM_ID}"]`,
    );
    checkboxes.forEach((checkbox) => {
      checkbox.checked = checked;
    });
    setTotalCount(checkboxes.length);
    setSelectedCount(checked ? checkboxes.length : 0);
  }, []);

  useEffect(() => {
    const handleChange = (event: Event) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement &&
        target.name === "ids" &&
        target.getAttribute("form") === NOTIFICATION_BATCH_FORM_ID
      ) {
        updateSelectedCount();
      }
    };

    document.addEventListener("change", handleChange);
    const timer = window.setTimeout(updateSelectedCount, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("change", handleChange);
    };
  }, [updateSelectedCount]);

  useEffect(() => {
    if (!state.ok) {
      return;
    }

    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      `input[name="ids"][form="${NOTIFICATION_BATCH_FORM_ID}"]`,
    );
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
    const timer = window.setTimeout(updateSelectedCount, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [state.ok, state.message, updateSelectedCount]);

  return (
    <DashboardCard>
      <DashboardCardHeader
        title="通知列表"
        description="通知只保存脱敏摘要、业务 ID 和安全站内跳转，不保存完整本地路径、API Key 或完整错误堆栈。"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs text-slate-400">已选 {selectedCount} 条</span>
            <button
              type="button"
              onClick={() => setAllChecked(!(totalCount > 0 && selectedCount === totalCount))}
              disabled={isPending || totalCount === 0}
              className="inline-flex h-10 items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] hover:bg-blue-50 disabled:opacity-50"
            >
              {totalCount > 0 && selectedCount === totalCount ? "取消全选" : "全选"}
            </button>
            <button
              type="submit"
              form={NOTIFICATION_BATCH_FORM_ID}
              name="action"
              value="MARK_READ"
              disabled={isPending || !isWritable || selectedCount === 0}
              className="inline-flex h-10 items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] hover:bg-blue-50 disabled:opacity-50"
            >
              <MiniIcon name="bell" className="h-4 w-4" />
              全部标记已读
            </button>
            <button
              type="submit"
              form={NOTIFICATION_BATCH_FORM_ID}
              name="action"
              value="DELETE"
              disabled={isPending || !isWritable || selectedCount === 0}
              className="inline-flex h-10 items-center rounded-xl border border-rose-200 bg-white px-3 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              全部删除
            </button>
            <CleanupOldNotificationsForm disabled={!isWritable} compact />
          </div>
        }
      />

      <form id={NOTIFICATION_BATCH_FORM_ID} action={formAction}>
        <input type="hidden" name="confirmText" value={DANGEROUS_CONFIRM_TEXT} />
      </form>
        {state.message ? (
          <div
            className={[
              "mx-5 mt-4 rounded-2xl border px-4 py-3 text-sm leading-6",
              state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700",
            ].join(" ")}
          >
            {state.message}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 border-b border-[#EEF2F8] px-5 py-3">
          <TableActionLink href={getTypeHref("ALL")}>全部</TableActionLink>
          {typeOptions.map((item) => (
            <TableActionLink key={item.value} href={getTypeHref(item.value)}>
              {item.label} {item.count}
            </TableActionLink>
          ))}
        </div>

        <TableScrollArea>
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeaderCell className="w-[5%]">选择</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[12%]">时间</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[8%]">类型</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[8%]">级别</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[9%]">状态</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[34%] pr-4">内容</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[11%]">关联</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[13%]">操作</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <DataTableRow key={item.id} className={item.isUnread ? "bg-blue-50/30" : undefined}>
                    <DataTableCell>
                      <input
                        type="checkbox"
                        form={NOTIFICATION_BATCH_FORM_ID}
                        name="ids"
                        value={item.id}
                        aria-label={`选择通知 ${item.id}`}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                    </DataTableCell>
                    <DataTableCell className="text-slate-500">{formatDateTime(item.createdAt)}</DataTableCell>
                    <DataTableCell>
                      <StatusBadge label={item.typeLabel} tone="slate" />
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge label={item.levelLabel} tone={levelTone(item.level)} />
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge label={item.status === "unread" ? "未读" : "已读"} tone={statusTone(item.status)} />
                    </DataTableCell>
                    <DataTableCell className="pr-4">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      {item.message ? <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.message}</p> : null}
                    </DataTableCell>
                    <DataTableCell className="text-slate-500">
                      {item.relatedType ? (
                        <span>
                          {item.relatedType}
                          {item.relatedId ? ` #${item.relatedId}` : ""}
                        </span>
                      ) : (
                        "--"
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex flex-wrap gap-2">
                        {item.actionUrl ? <TableActionLink href={item.actionUrl}>打开</TableActionLink> : null}
                        {item.status === "unread" ? (
                          <MarkNotificationReadForm notificationId={item.id} disabled={!isWritable} compact />
                        ) : null}
                        <DeleteNotificationForm notificationId={item.id} disabled={!isWritable} compact />
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))
              ) : (
                <DataTableRow>
                  <DataTableCell colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    暂无通知。
                  </DataTableCell>
                </DataTableRow>
              )}
            </DataTableBody>
          </DataTable>
        </TableScrollArea>
    </DashboardCard>
  );
}
