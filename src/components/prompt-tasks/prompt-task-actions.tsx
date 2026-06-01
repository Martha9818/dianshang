"use client";

import { useState, useTransition } from "react";
import {
  cancelPromptTaskAction,
  deleteFailedImageGenerationJobAction,
  generatePromptTaskImageAction,
  markPromptTaskCopiedAction,
} from "@/app/prompt-tasks/actions";

const buttonClassName =
  "group inline-flex h-11 min-w-[128px] cursor-pointer items-center justify-center rounded-2xl border border-[#DCE5F2] bg-white px-4 text-sm font-medium text-[#2563EB] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8] hover:shadow-[0_12px_24px_rgba(59,130,246,0.10)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:transform-none";

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

export function PromptTaskImageGenerationButton({
  taskCode,
  promptVersion,
  promptUse,
  promptVersionOptions = [promptVersion],
  promptUseOptions = [promptUse],
  costHint,
  providerLabel,
  disabled = false,
  highCost = false,
}: {
  taskCode: string;
  promptVersion: string;
  promptUse: string;
  promptVersionOptions?: string[];
  promptUseOptions?: string[];
  costHint: string;
  providerLabel: string;
  disabled?: boolean;
  highCost?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPromptVersion, setSelectedPromptVersion] = useState(promptVersion);
  const [selectedPromptUse, setSelectedPromptUse] = useState(promptUse);

  function handleGenerate() {
    setMessage(null);
    const firstConfirmed = window.confirm(`${costHint}\n\n将使用 ${providerLabel} 为当前 Prompt 生成 1 张图片，并保存到素材库。确认继续？`);
    if (!firstConfirmed) {
      return;
    }

    if (highCost) {
      const secondConfirmed = window.confirm("当前模型、尺寸或质量可能属于高成本配置。本次只生成 1 张图，仍要继续吗？");
      if (!secondConfirmed) {
        return;
      }
    }

    startTransition(async () => {
      const result = await generatePromptTaskImageAction({
        taskCode,
        promptVersion: selectedPromptVersion,
        promptUse: selectedPromptUse,
      });

      if (!result.success) {
        setMessage(result.error ?? "API 生图失败。");
        return;
      }

      setMessage(result.data?.materialId ? `生成完成，素材 #${result.data.materialId} 已入库。` : "生成完成，结果已入库。");
    });
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          value={selectedPromptVersion}
          onChange={(event) => setSelectedPromptVersion(event.target.value)}
          disabled={disabled || isPending}
          className="h-11 rounded-2xl border border-[#DCE5F2] bg-white px-3 text-xs text-slate-600 outline-none disabled:opacity-60"
        >
          {Array.from(new Set(promptVersionOptions.filter(Boolean))).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={selectedPromptUse}
          onChange={(event) => setSelectedPromptUse(event.target.value)}
          disabled={disabled || isPending}
          className="h-11 rounded-2xl border border-[#DCE5F2] bg-white px-3 text-xs text-slate-600 outline-none disabled:opacity-60"
        >
          {Array.from(new Set(promptUseOptions.filter(Boolean))).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <button type="button" disabled={disabled || isPending} onClick={handleGenerate} className={buttonClassName}>
        {isPending ? "生成中..." : "使用 API 生图"}
      </button>
      {message ? <p className="text-xs leading-5 text-slate-500">{message}</p> : null}
    </div>
  );
}

export function FailedImageGenerationJobDeleteButton({
  jobId,
  taskCode,
}: {
  jobId: number;
  taskCode: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleDelete() {
    setMessage(null);
    startTransition(async () => {
      const result = await deleteFailedImageGenerationJobAction({ jobId, taskCode });
      if (!result.success) {
        setMessage(result.error ?? "删除失败记录失败。");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        className="opacity-0 transition-opacity group-hover/job:opacity-100 group-focus-within/job:opacity-100 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
      >
        {isPending ? "删除中..." : "删除"}
      </button>
      {message ? <span className="text-xs text-rose-600">{message}</span> : null}
    </div>
  );
}
