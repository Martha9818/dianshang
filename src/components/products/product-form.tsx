"use client";

import { useActionState, useMemo, useState } from "react";
import {
  ActionButton,
  DashboardCard,
  DashboardCardHeader,
  MiniIcon,
  PageNote,
  StatusBadge,
} from "@/components/dashboard/primitives";
import { ProductImage } from "@/components/products/product-image";
import { useUnsavedChangesGuard } from "@/components/products/unsaved-changes-guard";
import {
  CATEGORY_RISK_VALUES,
  COMPARISON_DEMO_VALUES,
  EXPLANATION_COST_VALUES,
  LEVEL_THREE_VALUES,
  RETURN_RISK_VALUES,
  TARGET_PLATFORM_VALUES,
  VIDEO_FIT_VALUES,
  type ProductFormValues,
} from "@/lib/modules/products";

type SubmitState = {
  error?: string | null;
};

const textareaClassName =
  "min-h-[108px] w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50";
const compactTextareaClassName =
  "min-h-[92px] w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50";
const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50";
const selectClassName = `${inputClassName} appearance-none`;
const sectionClassName = "rounded-[24px] border border-[#E8EEF6] bg-[#FBFDFF] p-5";

function FormField({
  label,
  required,
  children,
  description,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <span>{label}</span>
        {required ? <span className="text-rose-500">*</span> : null}
      </div>
      {children}
      {description ? <p className="mt-2 text-xs leading-6 text-slate-400">{description}</p> : null}
    </label>
  );
}

function SelectField({
  name,
  value,
  placeholder,
  options,
  onChange,
}: {
  name: string;
  value: string;
  placeholder: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <select name={name} value={value} onChange={(event) => onChange(event.target.value)} className={selectClassName}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description ? <p className="mt-1 text-xs leading-6 text-slate-400">{description}</p> : null}
    </div>
  );
}

export function ProductForm({
  mode,
  initialValues,
  productMeta,
  runtimeNotice,
  submitAction,
}: {
  mode: "create" | "edit";
  initialValues: ProductFormValues;
  productMeta?: {
    id: number;
    spu: string;
    status: string;
    mainImagePath?: string | null;
  };
  runtimeNotice?: string | null;
  submitAction: (prevState: SubmitState, formData: FormData) => Promise<SubmitState>;
}) {
  const [values, setValues] = useState(initialValues);
  const [isDirty, setIsDirty] = useState(false);
  const [previewName, setPreviewName] = useState("");
  const [serverState, formAction, isSubmitting] = useActionState(submitAction, {});

  useUnsavedChangesGuard({
    isDirty,
    resetDirty: () => setIsDirty(false),
  });

  const previewLabel = useMemo(() => {
    const name = values.name.trim();
    if (name) {
      return name.slice(0, 3).toUpperCase();
    }

    return "IMG";
  }, [values.name]);

  function updateValue<Key extends keyof ProductFormValues>(key: Key, nextValue: ProductFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: nextValue }));
    setIsDirty(true);
  }

  return (
    <form action={formAction} className="space-y-5">
      <DashboardCard>
        <DashboardCardHeader
          title={mode === "create" ? "新增商品" : "编辑商品"}
          description={
            mode === "create"
              ? "先建立商品基础档案，再逐步接入评分、文案、素材与后续工作流。"
              : "更新商品基础信息。SPU 为系统生成字段，创建后只读。"
          }
          action={
            <div className="flex items-center gap-3">
              {productMeta ? <StatusBadge label={productMeta.status} tone="blue" /> : null}
              {productMeta ? (
                <span className="rounded-full border border-[#DCE5F2] bg-white px-3 py-1 text-xs font-medium text-slate-500">
                  {productMeta.spu}
                </span>
              ) : null}
            </div>
          }
        />

        {runtimeNotice ? (
          <div className="px-5 pt-5">
            <PageNote>{runtimeNotice}</PageNote>
          </div>
        ) : null}

        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.62fr)_minmax(0,1.38fr)]">
            <div className={sectionClassName}>
              <SectionTitle title="商品主图" description="支持 jpg / jpeg / png / webp，单张最大 10MB。" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center xl:flex-col xl:items-start 2xl:flex-row 2xl:items-center">
                <ProductImage src={productMeta?.mainImagePath} alt="商品主图预览" label={previewLabel} square />
                <div className="min-w-0">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#DCE5F2] bg-white px-4 py-2.5 text-sm font-medium text-[#2563EB] transition-all duration-200 hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8] hover:shadow-[0_14px_28px_rgba(59,130,246,0.10)] focus-within:outline-none focus-within:ring-4 focus-within:ring-blue-100">
                    <MiniIcon name="upload" className="h-4 w-4" />
                    选择主图
                    <input
                      type="file"
                      name="mainImage"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        setPreviewName(file?.name ?? "");
                        setIsDirty(true);
                      }}
                    />
                  </label>
                  <p className="mt-2 max-w-[260px] truncate text-xs text-slate-400">{previewName || "未选择新图片"}</p>
                </div>
              </div>
              {productMeta ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <FormField label="SPU">
                    <input value={productMeta.spu} readOnly className={`${inputClassName} bg-slate-50 text-slate-500`} />
                  </FormField>
                  <FormField label="当前状态">
                    <input value={productMeta.status} readOnly className={`${inputClassName} bg-slate-50 text-slate-500`} />
                  </FormField>
                </div>
              ) : null}
            </div>

            <div className={sectionClassName}>
              <SectionTitle title="基础档案" description="商品名称、类目、人群和标签集中填写，避免右侧单列过长。" />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="商品名称" required>
                  <input
                    name="name"
                    value={values.name}
                    onChange={(event) => updateValue("name", event.target.value)}
                    className={inputClassName}
                    placeholder="请输入商品名称"
                  />
                </FormField>
                <FormField label="目标人群">
                  <input
                    name="targetUser"
                    value={values.targetUser}
                    onChange={(event) => updateValue("targetUser", event.target.value)}
                    className={inputClassName}
                    placeholder="如：租房青年、通勤白领"
                  />
                </FormField>
                <FormField label="一级类目">
                  <input
                    name="categoryLevel1"
                    value={values.categoryLevel1}
                    onChange={(event) => updateValue("categoryLevel1", event.target.value)}
                    className={inputClassName}
                    placeholder="请输入一级类目"
                  />
                </FormField>
                <FormField label="二级类目">
                  <input
                    name="categoryLevel2"
                    value={values.categoryLevel2}
                    onChange={(event) => updateValue("categoryLevel2", event.target.value)}
                    className={inputClassName}
                    placeholder="请输入二级类目"
                  />
                </FormField>
                <div className="md:col-span-2">
                  <FormField label="商品标签" description="使用逗号、顿号或换行分隔多个标签。">
                    <textarea
                      name="tagsText"
                      value={values.tagsText}
                      onChange={(event) => updateValue("tagsText", event.target.value)}
                      className={compactTextareaClassName}
                      placeholder="如：高颜值、宿舍神器、易出片"
                    />
                  </FormField>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-5">
              <div className={sectionClassName}>
                <SectionTitle title="目标平台" description="选择准备投放或观察的平台。" />
                <div className="flex flex-wrap gap-3">
                  {TARGET_PLATFORM_VALUES.map((platform) => {
                    const checked = values.targetPlatforms.includes(platform);
                    return (
                      <label
                        key={platform}
                        className={[
                          "inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-within:outline-none focus-within:ring-4 focus-within:ring-blue-100",
                          checked
                            ? "border-blue-200 bg-blue-50 text-[#2563EB] hover:-translate-y-[1px] hover:border-blue-300 hover:bg-blue-100 hover:text-[#1D4ED8] hover:shadow-[0_14px_28px_rgba(59,130,246,0.10)]"
                            : "border-[#E4EAF3] bg-white text-slate-600 hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563EB] hover:shadow-[0_14px_28px_rgba(59,130,246,0.10)]",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          name="targetPlatforms"
                          value={platform}
                          checked={checked}
                          onChange={(event) => {
                            const nextValues = event.target.checked
                              ? [...values.targetPlatforms, platform]
                              : values.targetPlatforms.filter((item) => item !== platform);
                            updateValue("targetPlatforms", nextValues);
                          }}
                          className="sr-only"
                        />
                        <span>{platform}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={sectionClassName}>
                <SectionTitle title="利润测算输入" description="售价、进货价、运费和包装成本会进入利润测算。" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="预估售价">
                    <input
                      name="estimatedPrice"
                      value={values.estimatedPrice}
                      onChange={(event) => updateValue("estimatedPrice", event.target.value)}
                      className={inputClassName}
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </FormField>
                  <FormField label="预估进货价">
                    <input
                      name="estimatedCost"
                      value={values.estimatedCost}
                      onChange={(event) => updateValue("estimatedCost", event.target.value)}
                      className={inputClassName}
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </FormField>
                  <FormField label="预估运费">
                    <input
                      name="estimatedShipping"
                      value={values.estimatedShipping}
                      onChange={(event) => updateValue("estimatedShipping", event.target.value)}
                      className={inputClassName}
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </FormField>
                  <FormField label="包装成本">
                    <input
                      name="packagingCost"
                      value={values.packagingCost}
                      onChange={(event) => updateValue("packagingCost", event.target.value)}
                      className={inputClassName}
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </FormField>
                </div>
              </div>
            </div>

            <div className={sectionClassName}>
              <SectionTitle title="内容判断" description="卖点、痛点和使用场景并排填写，减少页面纵向拉长。" />
              <div className="grid gap-4 lg:grid-cols-3">
                <FormField label="核心卖点" description="会影响后续状态流转与文案生成。">
                  <textarea
                    name="sellingPoints"
                    value={values.sellingPoints}
                    onChange={(event) => updateValue("sellingPoints", event.target.value)}
                    className={textareaClassName}
                    placeholder="请输入核心卖点"
                  />
                </FormField>
                <FormField label="用户痛点">
                  <textarea
                    name="painPoints"
                    value={values.painPoints}
                    onChange={(event) => updateValue("painPoints", event.target.value)}
                    className={textareaClassName}
                    placeholder="请输入用户痛点"
                  />
                </FormField>
                <FormField label="使用场景">
                  <textarea
                    name="usageScenes"
                    value={values.usageScenes}
                    onChange={(event) => updateValue("usageScenes", event.target.value)}
                    className={textareaClassName}
                    placeholder="请输入使用场景"
                  />
                </FormField>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
            <div className={sectionClassName}>
              <SectionTitle title="评分信号" description="这些选项会用于商品初筛和后续评估，不清楚时可以先留空。" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <FormField label="品类风险">
                  <SelectField
                    name="categoryRisk"
                    value={values.categoryRisk}
                    placeholder="请选择"
                    options={CATEGORY_RISK_VALUES}
                    onChange={(value) => updateValue("categoryRisk", value)}
                  />
                </FormField>
                <FormField label="退货退款风险">
                  <SelectField
                    name="returnRisk"
                    value={values.returnRisk}
                    placeholder="请选择"
                    options={RETURN_RISK_VALUES}
                    onChange={(value) => updateValue("returnRisk", value)}
                  />
                </FormField>
                <FormField label="商品解释成本">
                  <SelectField
                    name="explanationCost"
                    value={values.explanationCost}
                    placeholder="请选择"
                    options={EXPLANATION_COST_VALUES}
                    onChange={(value) => updateValue("explanationCost", value)}
                  />
                </FormField>
                <FormField label="内容表现力">
                  <SelectField
                    name="contentVisualLevel"
                    value={values.contentVisualLevel}
                    placeholder="请选择"
                    options={LEVEL_THREE_VALUES}
                    onChange={(value) => updateValue("contentVisualLevel", value)}
                  />
                </FormField>
                <FormField label="使用场景清晰度">
                  <SelectField
                    name="sceneClarityLevel"
                    value={values.sceneClarityLevel}
                    placeholder="请选择"
                    options={LEVEL_THREE_VALUES}
                    onChange={(value) => updateValue("sceneClarityLevel", value)}
                  />
                </FormField>
                <FormField label="短视频展示适配">
                  <SelectField
                    name="videoFitLevel"
                    value={values.videoFitLevel}
                    placeholder="请选择"
                    options={VIDEO_FIT_VALUES}
                    onChange={(value) => updateValue("videoFitLevel", value)}
                  />
                </FormField>
                <FormField label="对比展示能力">
                  <SelectField
                    name="comparisonDemoLevel"
                    value={values.comparisonDemoLevel}
                    placeholder="请选择"
                    options={COMPARISON_DEMO_VALUES}
                    onChange={(value) => updateValue("comparisonDemoLevel", value)}
                  />
                </FormField>
              </div>
            </div>

            <div className={sectionClassName}>
              <SectionTitle title="备注" description="记录其他暂时无法归类的信息。" />
              <FormField label="补充说明">
                <textarea
                  name="notes"
                  value={values.notes}
                  onChange={(event) => updateValue("notes", event.target.value)}
                  className="min-h-[188px] w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  placeholder="请输入补充说明"
                />
              </FormField>
            </div>
          </div>
        </div>

        {serverState.error ? (
          <div className="border-t border-[#EEF2F8] bg-rose-50 px-5 py-3 text-sm text-rose-600">{serverState.error}</div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 border-t border-[#EEF2F8] px-5 py-4">
          <ActionButton href={productMeta ? `/products/${productMeta.id}` : "/products"} variant="ghost">
            取消
          </ActionButton>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#4A86FF,#275FE8)] hover:shadow-[0_20px_42px_rgba(43,115,255,0.34)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_16px_36px_rgba(43,115,255,0.28)]"
          >
            {isSubmitting ? "保存中..." : "保存商品"}
          </button>
        </div>
      </DashboardCard>
    </form>
  );
}
