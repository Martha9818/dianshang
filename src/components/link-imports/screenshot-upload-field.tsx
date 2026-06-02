"use client";

import { useState } from "react";
import { MiniIcon } from "@/components/dashboard/primitives";

export function ScreenshotUploadField({ disabled = false }: { disabled?: boolean }) {
  const [fileName, setFileName] = useState("");

  return (
    <label
      className={[
        "flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#DCE5F2] bg-white px-4 text-sm transition",
        disabled ? "cursor-not-allowed opacity-60" : "hover:border-blue-200 hover:bg-blue-50/40",
      ].join(" ")}
    >
      <input
        type="file"
        name="screenshot"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        disabled={disabled}
        className="sr-only"
        onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
      />
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
          <MiniIcon name="upload" className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block font-medium text-slate-800">上传辅助截图</span>
          <span className="mt-0.5 block truncate text-xs text-slate-400">
            {fileName || "未选择文件，支持 JPG / PNG / WebP"}
          </span>
        </span>
      </span>
      <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-[#2563EB]">
        选择文件
      </span>
    </label>
  );
}
