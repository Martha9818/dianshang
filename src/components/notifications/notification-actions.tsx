"use client";

import { useActionState } from "react";
import {
  cleanupOldNotificationsAction,
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/notifications/actions";
import { ActionButton, MiniIcon } from "@/components/dashboard/primitives";
import type { NotificationType } from "@/lib/services/notificationService";

type ActionState = {
  ok?: boolean;
  message?: string;
};

function ActionMessage({ state }: { state: ActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p className={["mt-2 text-xs", state.ok ? "text-emerald-600" : "text-amber-600"].join(" ")}>
      {state.message}
    </p>
  );
}

export function MarkNotificationReadForm({ notificationId, disabled = false }: { notificationId: number; disabled?: boolean }) {
  const [state, formAction, isPending] = useActionState(markNotificationReadAction, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="notificationId" value={notificationId} />
      <button
        type="submit"
        disabled={isPending || disabled}
        className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] transition hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "处理中..." : "标记已读"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function MarkAllNotificationsReadForm({
  type,
  disabled,
}: {
  type: NotificationType | "ALL";
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(markAllNotificationsReadAction, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="type" value={type} />
      <ActionButton type="submit" variant="secondary" disabled={isPending || disabled}>
        <MiniIcon name="bell" className="h-4 w-4" />
        {isPending ? "处理中..." : "全部标记已读"}
      </ActionButton>
      {disabled ? <input type="hidden" name="previewDisabled" value="true" /> : null}
      <ActionMessage state={state} />
    </form>
  );
}

export function DeleteNotificationForm({ notificationId, disabled = false }: { notificationId: number; disabled?: boolean }) {
  const [state, formAction, isPending] = useActionState(deleteNotificationAction, {});

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }

        if (!window.confirm("确定删除这条通知吗？删除后不可恢复。")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="notificationId" value={notificationId} />
      <button
        type="submit"
        disabled={isPending || disabled}
        className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-rose-200/80 px-3 text-sm font-medium text-rose-600 transition hover:-translate-y-[1px] hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "删除中..." : "删除"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function CleanupOldNotificationsForm({ disabled = false }: { disabled?: boolean }) {
  const [state, formAction, isPending] = useActionState(cleanupOldNotificationsAction, {});

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }

        if (!window.confirm("确定清理 30 天前的已读通知吗？此操作不可恢复。")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="daysToKeep" value="30" />
      <ActionButton type="submit" variant="ghost" disabled={isPending || disabled}>
        <MiniIcon name="ban" className="h-4 w-4" />
        {isPending ? "清理中..." : "清理旧通知"}
      </ActionButton>
      <ActionMessage state={state} />
    </form>
  );
}
