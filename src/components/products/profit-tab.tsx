"use client";

import { useActionState } from "react";
import { ActionButton, DashboardCard, DashboardCardHeader, PageNote } from "@/components/dashboard/primitives";

type SubmitState = {
  error?: string | null;
};

type ProfitView = {
  estimatedPrice: number | null;
  estimatedCost: number | null;
  estimatedShipping: number | null;
  packagingCost: number | null;
  hasCompleteCostData: boolean;
  invalidPrice: boolean;
  estimatedNetProfit: number | null;
  profitRate: number | null;
  formattedEstimatedPrice: string;
  formattedEstimatedCost: string;
  formattedEstimatedShipping: string;
  formattedPackagingCost: string;
  formattedEstimatedNetProfit: string;
  formattedProfitRate: string;
  statusMessage: string;
};

type ProfitFormValues = {
  estimatedPrice: string;
  estimatedCost: string;
  estimatedShipping: string;
  packagingCost: string;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
      {children}
    </label>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4">
      <p className="text-xs font-medium tracking-[0.03em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function ProfitTab({
  productId,
  profitView,
  initialValues,
  runtimeNotice,
  onSubmit,
}: {
  productId: number;
  profitView: ProfitView;
  initialValues: ProfitFormValues;
  runtimeNotice?: string | null;
  onSubmit: (prevState: SubmitState, formData: FormData) => Promise<SubmitState>;
}) {
  const [serverState, formAction, isPending] = useActionState(onSubmit, {});
  const missingCostFields = [
    profitView.estimatedPrice === null ? "售价" : null,
    profitView.estimatedCost === null ? "进货价" : null,
    profitView.estimatedShipping === null ? "运费" : null,
  ].filter((item): item is string => item !== null);
  const profitOutputSummary = profitView.hasCompleteCostData
    ? `当前已形成正式利润结果：单件净利润 ${profitView.formattedEstimatedNetProfit}，利润率 ${profitView.invalidPrice ? "售价无效" : profitView.formattedProfitRate}。`
    : "当前还没凑齐正式利润结果，至少需要售价、进货价和运费三个关键字段。";
  const profitDecisionImpact = profitView.hasCompleteCostData
    ? "利润结果会直接参与正式测试结论；如果利润率不成立或利润过低，最终建议会更保守。"
    : "没有完整利润数据时，测试结论只能停留在待补资料或临时判断，不能形成完整正式结论。";
  const profitAvailabilityMessage =
    missingCostFields.length > 0
      ? `当前缺少：${missingCostFields.join(" / ")}。利润结果暂不可用。`
      : "当前成本关键字段已补齐，可以用这里的利润结果支撑正式测试结论。";

  return (
    <div className="space-y-5 px-5 py-5">
      {runtimeNotice ? <PageNote>{runtimeNotice}</PageNote> : null}
      <section className="grid gap-4 xl:grid-cols-3">
        <DashboardCard className="px-5 py-4">
          <p className="text-xs font-medium tracking-[0.08em] text-slate-400">这个环节在看什么</p>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            这里不是记账，而是快速判断这个商品在当前预估售价和成本下，还有没有值得测试的利润空间。
          </p>
        </DashboardCard>
        <DashboardCard className="px-5 py-4">
          <p className="text-xs font-medium tracking-[0.08em] text-slate-400">这个环节会产出什么</p>
          <p className="mt-2 text-sm leading-7 text-slate-700">{profitOutputSummary}</p>
        </DashboardCard>
        <DashboardCard className="px-5 py-4">
          <p className="text-xs font-medium tracking-[0.08em] text-slate-400">它怎么影响测试结论</p>
          <p className="mt-2 text-sm leading-7 text-slate-700">{profitDecisionImpact}</p>
        </DashboardCard>
      </section>

      <PageNote>{profitAvailabilityMessage}</PageNote>

      <div className="grid gap-5 xl:grid-cols-[0.96fr_1.04fr]">
        <form action={formAction}>
          <DashboardCard>
            <DashboardCardHeader title="成本字段" description="这里补的是正式评估成本信号；保存后会刷新利润结果，并为测试结论提供盈利依据。" />
            <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
              <Field label="预估售价">
                <input name="estimatedPrice" defaultValue={initialValues.estimatedPrice} className={inputClassName} inputMode="decimal" placeholder="0.00" />
              </Field>
              <Field label="预估进货价">
                <input name="estimatedCost" defaultValue={initialValues.estimatedCost} className={inputClassName} inputMode="decimal" placeholder="0.00" />
              </Field>
              <Field label="预估运费">
                <input name="estimatedShipping" defaultValue={initialValues.estimatedShipping} className={inputClassName} inputMode="decimal" placeholder="0.00" />
              </Field>
              <Field label="包装成本">
                <input name="packagingCost" defaultValue={initialValues.packagingCost} className={inputClassName} inputMode="decimal" placeholder="0.00" />
              </Field>
            </div>
            {serverState.error ? (
              <div className="border-t border-[#EEF2F8] bg-rose-50 px-5 py-3 text-sm text-rose-600">{serverState.error}</div>
            ) : null}
            <div className="flex justify-end gap-3 border-t border-[#EEF2F8] px-5 py-4">
              <ActionButton href={`/products/${productId}?tab=${encodeURIComponent("利润测算")}`} variant="ghost">
                重置
              </ActionButton>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#4A86FF,#275FE8)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "保存中..." : "保存成本数据"}
              </button>
            </div>
          </DashboardCard>
        </form>

        <DashboardCard>
          <DashboardCardHeader title="利润结果" description="包装成本为空时按 0 处理；售价、进货价、运费任一缺失时不展示正式利润结果，也不能形成完整测试结论。" />
          <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
            <ResultCard label="预估售价" value={profitView.formattedEstimatedPrice} />
            <ResultCard label="预估进货价" value={profitView.formattedEstimatedCost} />
            <ResultCard label="预估运费" value={profitView.formattedEstimatedShipping} />
            <ResultCard label="包装成本" value={profitView.formattedPackagingCost} />
            <ResultCard label="单件净利润" value={profitView.hasCompleteCostData ? profitView.formattedEstimatedNetProfit : "--"} />
            <ResultCard
              label="利润率"
              value={!profitView.hasCompleteCostData ? "--" : profitView.invalidPrice ? "售价无效" : profitView.formattedProfitRate}
            />
          </div>
          <div className="border-t border-[#EEF2F8] px-5 py-4">
            <PageNote>{profitView.statusMessage}</PageNote>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
