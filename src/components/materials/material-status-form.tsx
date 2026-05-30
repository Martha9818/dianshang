"use client";

import { useFormStatus } from "react-dom";
import { updateMaterialStatusAndRedirectAction, discardMaterialAndRedirectAction } from "@/app/materials/actions";
import { MATERIAL_STATUS } from "@/lib/modules/materials";

function SubmitButton({
  children,
  tone = "default",
  confirmMessage,
}: {
  children: React.ReactNode;
  tone?: "default" | "danger";
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={[
        "inline-flex h-10 cursor-pointer items-center rounded-xl border px-3 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-60",
        tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
          : "border-[#DCE5F2] bg-white text-[#2563EB] hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8]",
      ].join(" ")}
    >
      {pending ? "处理中..." : children}
    </button>
  );
}

export function MaterialStatusButton({
  materialId,
  status,
  sourceUrl,
  children,
}: {
  materialId: number;
  status: string;
  sourceUrl: string;
  children: React.ReactNode;
}) {
  return (
    <form action={updateMaterialStatusAndRedirectAction}>
      <input type="hidden" name="materialId" value={materialId} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="sourceUrl" value={sourceUrl} />
      <SubmitButton>{children}</SubmitButton>
    </form>
  );
}

export function MaterialDiscardButton({
  materialId,
  sourceUrl,
  children = "弃用素材",
}: {
  materialId: number;
  sourceUrl: string;
  children?: React.ReactNode;
}) {
  return (
    <form action={discardMaterialAndRedirectAction}>
      <input type="hidden" name="materialId" value={materialId} />
      <input type="hidden" name="status" value={MATERIAL_STATUS.DISCARDED} />
      <input type="hidden" name="sourceUrl" value={sourceUrl} />
      <SubmitButton tone="danger" confirmMessage="确认将这个素材标记为已弃用吗？文件不会被物理删除。">
        {children}
      </SubmitButton>
    </form>
  );
}
