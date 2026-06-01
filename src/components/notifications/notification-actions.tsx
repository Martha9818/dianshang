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

function ActionMessage({ state, compact = false }: { state: ActionState; compact?: boolean }) {
  if (!state.message) {
    return null;
  }

  return (
    <p className={["text-xs", compact ? "mt-1" : "mt-2", state.ok ? "text-emerald-600" : "text-amber-600"].join(" ")}>
      {state.message}
    </p>
  );
}

function inlineButtonClassName(compact: boolean, tone: "blue" | "rose" = "blue") {
  return [
    "inline-flex items-center rounded-xl border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    compact ? "h-10" : "h-9",
    tone === "rose"
      ? "border-rose-200/80 text-rose-600 hover:bg-rose-50"
      : "border-[#DCE5F2] text-[#2563EB] hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50",
  ].join(" ");
}

export function MarkNotificationReadForm({
  notificationId,
  disabled = false,
  compact = false,
}: {
  notificationId: number;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(markNotificationReadAction, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="notificationId" value={notificationId} />
      <button type="submit" disabled={isPending || disabled} className={inlineButtonClassName(compact)}>
        {isPending ? "处理中..." : "标记已读"}
      </button>
      <ActionMessage state={state} compact={compact} />
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

export function DeleteNotificationForm({
  notificationId,
  disabled = false,
  compact = false,
}: {
  notificationId: number;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(deleteNotificationAction, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="notificationId" value={notificationId} />
      <button type="submit" disabled={isPending || disabled} className={inlineButtonClassName(compact, "rose")}>
        {isPending ? "删除中..." : "删除"}
      </button>
      <ActionMessage state={state} compact={compact} />
    </form>
  );
}

export function CleanupOldNotificationsForm({
  disabled = false,
  compact = false,
}: {
  disabled?: boolean;
  compact?: boolean;
}) {
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
      {compact ? (
        <button type="submit" disabled={isPending || disabled} className={inlineButtonClassName(true)}>
          清理旧通知
        </button>
      ) : (
        <ActionButton type="submit" variant="ghost" disabled={isPending || disabled}>
          <MiniIcon name="ban" className="h-4 w-4" />
          {isPending ? "清理中..." : "清理旧通知"}
        </ActionButton>
      )}
      <ActionMessage state={state} compact={compact} />
    </form>
  );
}
