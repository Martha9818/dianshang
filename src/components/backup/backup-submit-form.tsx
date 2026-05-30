"use client";

import { useActionState } from "react";
import { ActionButton, MiniIcon } from "@/components/dashboard/primitives";
import { createManualBackupAction } from "@/app/backup/actions";

type BackupActionState = {
  ok?: boolean;
  message?: string;
};

async function submitBackup(): Promise<BackupActionState> {
  return createManualBackupAction();
}

export function BackupSubmitForm() {
  const [state, formAction, isPending] = useActionState(submitBackup, {});

  return (
    <form action={formAction}>
      <ActionButton type="submit">
        <MiniIcon name="backup" className="h-4 w-4" />
        {isPending ? "正在备份..." : "立即备份"}
      </ActionButton>
      {state.message ? (
        <p className={["mt-3 text-sm", state.ok ? "text-emerald-600" : "text-amber-600"].join(" ")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
