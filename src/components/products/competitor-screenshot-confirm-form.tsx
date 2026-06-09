"use client";

import { useActionState, useState } from "react";
import { ActionButton, DashboardCard, DashboardCardHeader, PageNote, StatusBadge } from "@/components/dashboard/primitives";
import type { CompetitorFormValues } from "@/lib/services/competitor-service";

type SubmitState = {
  error?: string | null;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400";
const textareaClassName =
  "min-h-[110px] w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <span>{label}</span>
        {required ? <span className="text-rose-500">*</span> : null}
      </div>
      {children}
    </label>
  );
}

export function CompetitorScreenshotConfirmForm({
  productId,
  jobId,
  initialValues,
  runtimeNotice,
  qualityLevel,
  privacyNotes,
  uncertaintyNotes,
  platformOptions,
  heatMetricOptions,
  onSubmit,
}: {
  productId: number;
  jobId: number;
  initialValues: CompetitorFormValues;
  runtimeNotice?: string | null;
  qualityLevel: string | null;
  privacyNotes: string[];
  uncertaintyNotes: string[];
  platformOptions: readonly string[];
  heatMetricOptions: readonly string[];
  onSubmit: (prevState: SubmitState, formData: FormData) => Promise<SubmitState>;
}) {
  const [values, setValues] = useState(initialValues);
  const [serverState, formAction, isPending] = useActionState(onSubmit, {});
  const isWritable = !runtimeNotice;
  const showLowQualityWarning = qualityLevel === "low" || qualityLevel === "failed";

  return (
    <form action={formAction}>
      <DashboardCard>
        <DashboardCardHeader
          title="确认转正式竞品"
          description="AI 草稿只作为预填参考。请在这里补齐正式竞品必填字段，确认后才会创建正式 Competitor 并回写截图草稿状态。"
          action={
            <ActionButton href={`/products/${productId}?tab=competitors`} variant="ghost">
              取消确认
            </ActionButton>
          }
        />
        <div className="space-y-4 px-5 py-5">
          <input type="hidden" name="jobId" value={jobId} />
          <input type="hidden" name="competitorId" value="" />
          <PageNote>确认成功后会复用当前截图草稿的图片作为正式竞品截图，并回写 `job.competitorId` 防止重复确认。</PageNote>
          {runtimeNotice ? <PageNote>{runtimeNotice}</PageNote> : null}
          {showLowQualityWarning ? (
            <PageNote>
              <span className="font-medium text-amber-700">识别质量偏低。</span> 当前截图草稿可能缺字段或识别不准，确认前请逐项人工核对。
            </PageNote>
          ) : null}
          {privacyNotes.length > 0 ? (
            <PageNote>
              <div className="space-y-2">
                <div className="font-medium text-amber-700">隐私提醒</div>
                <ul className="space-y-1">
                  {privacyNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </PageNote>
          ) : null}
          {uncertaintyNotes.length > 0 ? (
            <PageNote>
              <div className="space-y-2">
                <div className="font-medium text-slate-700">不确定项</div>
                <ul className="space-y-1">
                  {uncertaintyNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </PageNote>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={`草稿任务 #${jobId}`} tone="blue" />
            <StatusBadge label={qualityLevel ?? "--"} tone={showLowQualityWarning ? "amber" : "slate"} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="平台" required>
              <select
                name="platform"
                defaultValue={values.platform}
                className={inputClassName}
                disabled={!isWritable}
                onChange={(event) => setValues((current) => ({ ...current, platform: event.target.value }))}
              >
                <option value="">请选择平台</option>
                {platformOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="竞品标题" required>
              <input
                name="title"
                defaultValue={values.title}
                className={inputClassName}
                disabled={!isWritable}
                onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
              />
            </Field>
            <Field label="价格" required>
              <input
                name="price"
                defaultValue={values.price}
                className={inputClassName}
                inputMode="decimal"
                disabled={!isWritable}
                onChange={(event) => setValues((current) => ({ ...current, price: event.target.value }))}
              />
            </Field>
            <Field label="热度指标类型" required>
              <select
                name="heatMetricType"
                defaultValue={values.heatMetricType}
                className={inputClassName}
                disabled={!isWritable}
                onChange={(event) => setValues((current) => ({ ...current, heatMetricType: event.target.value }))}
              >
                <option value="">请选择热度类型</option>
                {heatMetricOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="热度指标数值" required>
              <input
                name="heatMetricValue"
                defaultValue={values.heatMetricValue}
                className={inputClassName}
                inputMode="decimal"
                disabled={!isWritable}
                onChange={(event) => setValues((current) => ({ ...current, heatMetricValue: event.target.value }))}
              />
            </Field>
            <Field label="数据日期" required>
              <input
                type="date"
                name="dataDate"
                defaultValue={values.dataDate}
                className={inputClassName}
                disabled={!isWritable}
                onChange={(event) => setValues((current) => ({ ...current, dataDate: event.target.value }))}
              />
            </Field>
            <Field label="店铺 / 作者">
              <input name="sellerName" defaultValue={values.sellerName} className={inputClassName} disabled={!isWritable} />
            </Field>
            <Field label="链接">
              <input name="link" defaultValue={values.link} className={inputClassName} disabled={!isWritable} />
            </Field>
            <Field label="图片风格">
              <input name="imageStyle" defaultValue={values.imageStyle} className={inputClassName} disabled={!isWritable} />
            </Field>
            <div className="md:col-span-2 xl:col-span-3">
              <Field label="主要卖点">
                <textarea name="sellingPoint" defaultValue={values.sellingPoint} className={textareaClassName} disabled={!isWritable} />
              </Field>
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <Field label="用户痛点 / 差评">
                <textarea name="painPoint" defaultValue={values.painPoint} className={textareaClassName} disabled={!isWritable} />
              </Field>
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <Field label="备注">
                <textarea name="notes" defaultValue={values.notes} className={textareaClassName} disabled={!isWritable} />
              </Field>
            </div>
          </div>
        </div>
        {serverState.error ? (
          <div className="border-t border-[#EEF2F8] bg-rose-50 px-5 py-3 text-sm text-rose-600">{serverState.error}</div>
        ) : null}
        <div className="flex justify-end gap-3 border-t border-[#EEF2F8] px-5 py-4">
          <ActionButton href={`/products/${productId}?tab=competitors`} variant="ghost">
            返回竞品页
          </ActionButton>
          <button
            type="submit"
            disabled={!isWritable || isPending}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#4A86FF,#275FE8)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "确认中..." : "确认并创建正式竞品"}
          </button>
        </div>
      </DashboardCard>
    </form>
  );
}
