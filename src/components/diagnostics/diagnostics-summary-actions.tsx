"use client";

import { useState, useTransition } from "react";
import { getDiagnosticsSummaryAction, writeDiagnosticsTestErrorAction } from "@/app/system/diagnostics/actions";

type ActionState = {
  tone: "idle" | "success" | "error";
  message: string;
};

function buildFileName() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `ecompilot-diagnostics-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.md`;
}

function downloadMarkdown(markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = buildFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function DiagnosticsSummaryActions({ markdown }: { markdown: string }) {
  const [summary, setSummary] = useState(markdown);
  const [state, setState] = useState<ActionState>({
    tone: "idle",
    message: "诊断摘要已脱敏，可直接复制给 ChatGPT / Claude 辅助排查。",
  });
  const [isPending, startTransition] = useTransition();

  const refreshSummary = async () => {
    const result = await getDiagnosticsSummaryAction();
    setSummary(result.markdown);
    return result.markdown;
  };

  const handleCopy = () => {
    startTransition(async () => {
      try {
        const latest = await refreshSummary();
        await navigator.clipboard.writeText(latest);
        setState({ tone: "success", message: "已复制脱敏诊断摘要。" });
      } catch {
        setState({ tone: "error", message: "复制失败，请手动选择下方摘要文本。" });
      }
    });
  };

  const handleDownload = () => {
    startTransition(async () => {
      try {
        const latest = await refreshSummary();
        downloadMarkdown(latest);
        setState({ tone: "success", message: "已生成浏览器下载，不会写入服务器本地磁盘。" });
      } catch {
        setState({ tone: "error", message: "导出失败，请稍后重试或复制摘要文本。" });
      }
    });
  };

  const handleWriteTestError = () => {
    startTransition(async () => {
      try {
        const result = await writeDiagnosticsTestErrorAction();
        const latest = await refreshSummary();
        setSummary(latest);
        setState({ tone: result.ok ? "success" : "error", message: result.message });
      } catch {
        setState({ tone: "error", message: "测试错误日志写入失败，请检查 logs/ 目录权限。" });
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={handleCopy}
          disabled={isPending}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl bg-[#2563EB] px-5 text-sm font-medium text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-[1px] hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "处理中..." : "复制诊断摘要"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isPending}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-[#DCE5F2] bg-white px-5 text-sm font-medium text-[#2563EB] transition hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "处理中..." : "导出诊断摘要"}
        </button>
        <button
          type="button"
          onClick={handleWriteTestError}
          disabled={isPending}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 text-sm font-medium text-amber-700 transition hover:-translate-y-[1px] hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
        >
          {isPending ? "处理中..." : "测试写入"}
        </button>
      </div>

      <p
        className={[
          "text-sm leading-6",
          state.tone === "success" ? "text-emerald-600" : state.tone === "error" ? "text-rose-600" : "text-slate-500",
        ].join(" ")}
      >
        {state.message}
      </p>

      <textarea
        readOnly
        value={summary}
        aria-label="脱敏诊断摘要"
        className="h-[220px] w-full resize-y overflow-auto rounded-2xl border border-[#E4EAF3] bg-[#F8FBFF] p-4 font-mono text-xs leading-6 text-slate-600 outline-none lg:h-[260px]"
      />
    </div>
  );
}
