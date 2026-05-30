"use client";

import { useActionState } from "react";
import { uploadManualMaterialAction, uploadPromptTaskResultAction } from "@/app/prompt-tasks/actions";
import { MANUAL_MATERIAL_TYPES } from "@/lib/modules/materials";
import { PROMPT_TASK_PLATFORMS } from "@/lib/modules/prompt-task";

const inputClassName =
  "h-11 w-full rounded-2xl border border-[#E4EAF3] bg-white px-3 text-sm text-slate-700 outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";

type ProductOption = {
  id: number;
  name: string;
  spu: string;
};

export function PromptTaskUploadForm({
  taskCode,
  disabled = false,
}: {
  taskCode: string;
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(uploadPromptTaskResultAction.bind(null, taskCode), { error: null });

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</div>
      ) : null}
      <input
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled || isPending}
        className={inputClassName}
      />
      <button
        type="submit"
        disabled={disabled || isPending}
        className="group inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.24)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#4A86FF,#275FE8)] hover:shadow-[0_20px_42px_rgba(43,115,255,0.32)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:transform-none"
      >
        {isPending ? "上传中..." : "上传生成结果"}
      </button>
    </form>
  );
}

export function ManualMaterialUploadForm({
  products,
  runtimeNotice,
  defaultProductId,
}: {
  products: ProductOption[];
  runtimeNotice?: string | null;
  defaultProductId?: number | null;
}) {
  const [state, formAction, isPending] = useActionState(uploadManualMaterialAction, { error: null });

  return (
    <form action={formAction} className="space-y-4 px-5 py-5">
      {runtimeNotice ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {runtimeNotice}
        </div>
      ) : null}
      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</div>
      ) : null}
      <label className="block">
        <span className="mb-2 block text-sm text-slate-500">商品</span>
        <select name="productId" defaultValue={defaultProductId ?? products[0]?.id ?? ""} disabled={Boolean(runtimeNotice)} className={inputClassName}>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} / {product.spu}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-500">平台</span>
          <select name="platform" disabled={Boolean(runtimeNotice)} className={inputClassName} defaultValue="xiaohongshu">
            {PROMPT_TASK_PLATFORMS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-500">素材类型</span>
          <select name="materialType" disabled={Boolean(runtimeNotice)} className={inputClassName} defaultValue="main_image">
            {MANUAL_MATERIAL_TYPES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-2 block text-sm text-slate-500">图片文件</span>
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={Boolean(runtimeNotice) || isPending}
          className={inputClassName}
        />
      </label>
      <button
        type="submit"
        disabled={Boolean(runtimeNotice) || isPending || products.length === 0}
        className="group inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-[#DCE5F2] bg-white px-5 text-sm font-medium text-[#2563EB] shadow-[0_10px_22px_rgba(59,130,246,0.08)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8] hover:shadow-[0_16px_30px_rgba(59,130,246,0.12)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:transform-none"
      >
        {isPending ? "上传中..." : "手动上传素材"}
      </button>
    </form>
  );
}
