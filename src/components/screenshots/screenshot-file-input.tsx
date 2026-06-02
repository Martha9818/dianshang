"use client";

import { useId, useState } from "react";
import { MiniIcon } from "@/components/dashboard/primitives";

export function ScreenshotFileInput({
  disabled = false,
  name = "image",
}: {
  disabled?: boolean;
  name?: string;
}) {
  const inputId = useId();
  const [fileName, setFileName] = useState("");

  return (
    <div>
      <label
        htmlFor={inputId}
        className={[
          "flex min-h-[72px] items-center justify-center rounded-2xl border border-[#E4EAF3] bg-white transition",
          disabled ? "cursor-not-allowed bg-slate-50 opacity-60" : "cursor-pointer hover:border-blue-200 hover:bg-blue-50/30",
        ].join(" ")}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] shadow-[0_12px_24px_rgba(59,130,246,0.12)]">
          <MiniIcon name="upload" className="h-5 w-5" />
        </span>
      </label>
      <input
        id={inputId}
        type="file"
        name={name}
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        disabled={disabled}
        className="sr-only"
        onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
      />
      <p className="mt-2 truncate text-xs leading-5 text-slate-400">{fileName || "未选择文件"}</p>
    </div>
  );
}
