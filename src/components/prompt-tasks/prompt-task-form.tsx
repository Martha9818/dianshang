"use client";

import { useActionState, useMemo, useState } from "react";
import { createPromptTaskAction } from "@/app/prompt-tasks/actions";
import {
  getRecommendedSize,
  PROMPT_IMAGE_TYPES,
  PROMPT_TASK_PLATFORMS,
  type PromptImageTypeCode,
  type PromptTaskPlatformCode,
} from "@/lib/modules/prompt-task";

const inputClassName =
  "h-11 w-full rounded-2xl border border-[#E4EAF3] bg-white px-3 text-sm text-slate-700 outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";

type ProductOption = {
  id: number;
  name: string;
  spu: string;
};

export function PromptTaskCreateForm({
  products,
  runtimeNotice,
  defaultProductId,
}: {
  products: ProductOption[];
  runtimeNotice?: string | null;
  defaultProductId?: number | null;
}) {
  const [state, formAction, isPending] = useActionState(createPromptTaskAction, { error: null });
  const [platform, setPlatform] = useState<PromptTaskPlatformCode>("xiaohongshu");
  const [imageType, setImageType] = useState<PromptImageTypeCode>("cover");
  const [recommendedSize, setRecommendedSize] = useState(getRecommendedSize("xiaohongshu", "cover"));

  const selectedProductId = useMemo(() => {
    if (defaultProductId && products.some((product) => product.id === defaultProductId)) {
      return defaultProductId;
    }

    return products[0]?.id ?? "";
  }, [defaultProductId, products]);

  function updatePreset(nextPlatform: PromptTaskPlatformCode, nextImageType: PromptImageTypeCode) {
    setRecommendedSize(getRecommendedSize(nextPlatform, nextImageType));
  }

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
        <span className="mb-2 block text-sm text-slate-500">选择商品</span>
        <select name="productId" defaultValue={selectedProductId} className={inputClassName} disabled={Boolean(runtimeNotice)}>
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
          <select
            name="platform"
            value={platform}
            className={inputClassName}
            disabled={Boolean(runtimeNotice)}
            onChange={(event) => {
              const nextPlatform = event.target.value as PromptTaskPlatformCode;
              setPlatform(nextPlatform);
              updatePreset(nextPlatform, imageType);
            }}
          >
            {PROMPT_TASK_PLATFORMS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-500">图片类型</span>
          <select
            name="imageType"
            value={imageType}
            className={inputClassName}
            disabled={Boolean(runtimeNotice)}
            onChange={(event) => {
              const nextImageType = event.target.value as PromptImageTypeCode;
              setImageType(nextImageType);
              updatePreset(platform, nextImageType);
            }}
          >
            {PROMPT_IMAGE_TYPES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm text-slate-500">推荐尺寸</span>
        <input
          name="recommendedSize"
          value={recommendedSize}
          onChange={(event) => setRecommendedSize(event.target.value)}
          className={inputClassName}
          disabled={Boolean(runtimeNotice)}
        />
      </label>

      <button
        type="submit"
        disabled={isPending || Boolean(runtimeNotice) || products.length === 0}
        className="group inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.24)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#4A86FF,#275FE8)] hover:shadow-[0_20px_42px_rgba(43,115,255,0.32)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:transform-none"
      >
        {isPending ? "生成中..." : "生成 Prompt 任务"}
      </button>
    </form>
  );
}
