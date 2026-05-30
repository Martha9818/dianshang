"use server";

import { getDiagnosticsSnapshot } from "@/lib/services/diagnostics";
import { logError } from "@/lib/services/logging";
import { isLocalWritable } from "@/lib/services/runtime";

export async function getDiagnosticsSummaryAction() {
  const snapshot = await getDiagnosticsSnapshot();

  return {
    ok: true,
    markdown: snapshot.summaryMarkdown,
  };
}

export async function writeDiagnosticsTestErrorAction() {
  if (!isLocalWritable()) {
    return {
      ok: false,
      message: "预览环境只读，不写入真实本地日志。",
    };
  }

  await logError(
    "Diagnostics test error: controlled local log write. apiKey=sk-test-redacted-input path=E:\\example\\secret\\dev.db prompt=This prompt text is intentionally long and must be redacted before it appears in diagnostics.",
  );

  return {
    ok: true,
    message: "已写入一条脱敏测试错误，请刷新诊断摘要查看 error.log 最近记录。",
  };
}
