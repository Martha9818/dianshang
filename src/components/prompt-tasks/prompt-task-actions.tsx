"use client";

import { useState, useTransition } from "react";
import { cancelPromptTaskAction, markPromptTaskCopiedAction } from "@/app/prompt-tasks/actions";

const buttonClassName =
  "group inline-flex h-9 cursor-pointer items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8] hover:shadow-[0_12px_24px_rgba(59,130,246,0.10)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:transform-none";

export function PromptTaskCopyButton({
  taskCode,
  promptText,
  disabled = false,
}: {
  taskCode: string;
  promptText: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  async function handleCopy() {
    setMessage(null);
    setShowFallback(false);

    try {
      await navigator.clipboard.writeText(promptText);
    } catch {
      setShowFallback(true);
      setMessage("浏览器剪贴板不可用，请手动复制下方 Prompt。");
      return;
    }

    startTransition(async () => {
      const result = await markPromptTaskCopiedAction(taskCode);

      if (!result.success) {
        setMessage(result.error ?? "复制成功，但标记状态失败。");
        return;
      }

      setMessage("已复制 Prompt，并标记为已复制。");
    });
  }

  return (
    <div className="space-y-2">
      <button type="button" disabled={disabled || isPending} onClick={handleCopy} className={buttonClassName}>
        {isPending ? "标记中..." : "一键复制 Prompt"}
      </button>
      {message ? <p className="text-xs leading-5 text-slate-500">{message}</p> : null}
      {showFallback ? (
        <textarea
          readOnly
          value={promptText}
          className="min-h-[160px] w-full rounded-2xl border border-[#E4EAF3] bg-white px-3 py-3 text-xs leading-5 text-slate-600"
        />
      ) : null}
    </div>
  );
}

export function PromptTaskCancelButton({
  taskCode,
  disabled = false,
}: {
  taskCode: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleCancel() {
    if (!window.confirm("确认取消这个 Prompt 任务吗？取消后不能回传图片。")) {
      return;
    }

    startTransition(async () => {
      const result = await cancelPromptTaskAction(taskCode);

      if (!result.success) {
        setMessage(result.error ?? "取消失败。");
        return;
      }

      setMessage("任务已取消。");
    });
  }

  return (
    <div className="space-y-1">
      <button type="button" disabled={disabled || isPending} onClick={handleCancel} className={buttonClassName}>
        {isPending ? "取消中..." : "取消任务"}
      </button>
      {message ? <p className="text-xs leading-5 text-slate-500">{message}</p> : null}
    </div>
  );
}
