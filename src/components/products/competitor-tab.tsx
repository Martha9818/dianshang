"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ActionButton,
  DashboardCard,
  DashboardCardHeader,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  PageNote,
  StatCard,
  TableActionLink,
  TableScrollArea,
} from "@/components/dashboard/primitives";
import type { CompetitorFormValues } from "@/lib/services/competitor-service";

type SubmitState = {
  error?: string | null;
};

type DeleteActionState = {
  success: boolean;
  error?: string | null;
};

type CompetitorView = {
  id: number;
  platform: string;
  title: string;
  price: number;
  heatMetricType: string;
  heatMetricValue: number;
  sellerName: string | null;
  link: string | null;
  screenshotPath: string | null;
  sellingPoint: string | null;
  painPoint: string | null;
  imageStyle: string | null;
  dataDate: Date;
  notes: string | null;
  formattedPrice: string;
  formattedHeatMetricValue: string;
  formattedDataDate: string;
};

type CompetitorStatsView = {
  validCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  averagePrice: number | null;
  medianPrice: number | null;
  maxHeatMetricValue: number | null;
  averageHeatMetricValue: number | null;
  platformCount: number;
  latestDataDate: Date | null;
  sufficiencyMessage: string;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50";
const textareaClassName =
  "min-h-[110px] w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

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

function formatOptionalNumber(value: number | null) {
  if (value === null) {
    return "--";
  }

  return value.toFixed(2);
}

function formatDate(value: Date | null) {
  if (!value) {
    return "--";
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CompetitorTab({
  productId,
  competitors,
  stats,
  initialValues,
  runtimeNotice,
  formMode,
  onSubmit,
  onDelete,
  platformOptions,
  heatMetricOptions,
}: {
  productId: number;
  competitors: CompetitorView[];
  stats: CompetitorStatsView;
  initialValues: CompetitorFormValues;
  runtimeNotice?: string | null;
  formMode: "create" | "edit";
  onSubmit: (prevState: SubmitState, formData: FormData) => Promise<SubmitState>;
  onDelete: (productId: number, competitorId: number) => Promise<DeleteActionState>;
  platformOptions: readonly string[];
  heatMetricOptions: readonly string[];
}) {
  const [values, setValues] = useState(initialValues);
  const [serverState, formAction, isPending] = useActionState(onSubmit, {});
  const [isDeleting, startDeleting] = useTransition();
  const screenshotPath = useMemo(
    () => (values.id ? competitors.find((item) => String(item.id) === values.id)?.screenshotPath ?? null : null),
    [competitors, values.id],
  );
  const formKey = `${formMode}-${initialValues.id ?? "new"}`;
  const competitorGap = Math.max(0, 3 - stats.validCount);
  const latestDataLabel = formatDate(stats.latestDataDate);
  const competitorOutputSummary =
    stats.validCount > 0
      ? `当前已整理 ${stats.validCount} 条正式竞品参考，覆盖 ${stats.platformCount} 个平台，最新数据日期为 ${latestDataLabel}。`
      : "当前还没有正式竞品参考，建议先录入第一条竞品。";
  const competitorDecisionImpact =
    stats.validCount >= 3
      ? "竞品门槛已齐，这里的数据可以继续供 AI 机会分析和测试结论页使用。"
      : `正式测试结论至少需要 3 个有效竞品；当前还差 ${competitorGap} 个。`;
  const competitorProgressMessage =
    stats.validCount >= 3
      ? `当前有效竞品：${stats.validCount} / 3，已经达到正式测试结论的竞品门槛。`
      : `当前有效竞品：${stats.validCount} / 3，还差 ${competitorGap} 个竞品，正式评分会偏保守。`;

  return (
    <div className="space-y-5 px-5 py-5">
      <section className="grid gap-4 xl:grid-cols-3">
        <DashboardCard className="px-5 py-4">
          <p className="text-xs font-medium tracking-[0.08em] text-slate-400">这个环节在看什么</p>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            先把真实竞品补齐，确认别人卖什么、卖多少钱、热度如何，以及卖点和差评集中在哪。
          </p>
        </DashboardCard>
        <DashboardCard className="px-5 py-4">
          <p className="text-xs font-medium tracking-[0.08em] text-slate-400">这个环节会产出什么</p>
          <p className="mt-2 text-sm leading-7 text-slate-700">{competitorOutputSummary}</p>
        </DashboardCard>
        <DashboardCard className="px-5 py-4">
          <p className="text-xs font-medium tracking-[0.08em] text-slate-400">它怎么影响测试结论</p>
          <p className="mt-2 text-sm leading-7 text-slate-700">{competitorDecisionImpact}</p>
        </DashboardCard>
      </section>

      <PageNote>{competitorProgressMessage}</PageNote>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="有效竞品数量" value={String(stats.validCount)} delta="Thread 02" tone="blue" compact icon={<span />} />
        <StatCard label="平台数量" value={String(stats.platformCount)} delta="Thread 02" tone="green" compact icon={<span />} />
        <StatCard
          label="最新数据日期"
          value={formatDate(stats.latestDataDate)}
          delta="Thread 02"
          tone="amber"
          compact
          icon={<span />}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardCard className="px-5 py-4">
          <p className="text-sm text-slate-500">最低价 / 最高价</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatOptionalNumber(stats.minPrice)} / {formatOptionalNumber(stats.maxPrice)}
          </p>
        </DashboardCard>
        <DashboardCard className="px-5 py-4">
          <p className="text-sm text-slate-500">平均价 / 中位价</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatOptionalNumber(stats.averagePrice)} / {formatOptionalNumber(stats.medianPrice)}
          </p>
        </DashboardCard>
        <DashboardCard className="px-5 py-4">
          <p className="text-sm text-slate-500">最高热度 / 平均热度</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatOptionalNumber(stats.maxHeatMetricValue)} / {formatOptionalNumber(stats.averageHeatMetricValue)}
          </p>
        </DashboardCard>
      </section>

      <PageNote>{stats.sufficiencyMessage}</PageNote>
      {runtimeNotice ? <PageNote>{runtimeNotice}</PageNote> : null}

      <DashboardCard>
        <DashboardCardHeader
          title="竞品列表"
          description="这里沉淀的是正式竞品参考，会作为后续 AI 机会分析和测试结论的市场依据。"
          action={
            <div className="flex flex-wrap gap-2">
              <TableActionLink href="/link-imports?purpose=competitor_reference">链接导入</TableActionLink>
              <TableActionLink href={`/products/${productId}?tab=competitor-analysis`}>竞品智能分析</TableActionLink>
              <TableActionLink href={`/screenshots?sourceType=competitor&productId=${productId}`}>竞品截图识别</TableActionLink>
            </div>
          }
        />
        <TableScrollArea>
          <DataTable className="min-w-[980px]">
            <DataTableHead>
              <tr>
                <DataTableHeaderCell className="w-[10%]">平台</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[24%]">竞品标题</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[10%]">价格</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[12%]">热度类型</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[10%]">热度数值</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[12%]">数据日期</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[8%]">截图</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[14%]">操作</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {competitors.length > 0 ? (
                competitors.map((competitor) => (
                  <DataTableRow key={competitor.id}>
                    <DataTableCell>{competitor.platform}</DataTableCell>
                    <DataTableCell>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{competitor.title}</p>
                        <p className="truncate text-xs text-slate-400">{competitor.sellerName ?? competitor.link ?? "--"}</p>
                      </div>
                    </DataTableCell>
                    <DataTableCell>{competitor.formattedPrice}</DataTableCell>
                    <DataTableCell>{competitor.heatMetricType}</DataTableCell>
                    <DataTableCell>{competitor.formattedHeatMetricValue}</DataTableCell>
                    <DataTableCell>{competitor.formattedDataDate}</DataTableCell>
                    <DataTableCell>
                      {competitor.screenshotPath ? (
                        <Link
                          href={`/api/uploads/${competitor.screenshotPath.replace(/^uploads[\\/]/, "")}`}
                          target="_blank"
                          className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]"
                        >
                          查看
                        </Link>
                      ) : (
                        "--"
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/products/${productId}?tab=${encodeURIComponent("竞品数据")}&editCompetitorId=${competitor.id}`}
                          className="inline-flex h-10 items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8]"
                        >
                          编辑
                        </Link>
                        <Link
                          href={`/screenshots?sourceType=competitor&sourceId=${competitor.id}&productId=${productId}`}
                          className="inline-flex h-10 items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8]"
                        >
                          截图识别
                        </Link>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => {
                            const firstConfirm = window.confirm("确认删除这个竞品吗？");
                            if (!firstConfirm) {
                              return;
                            }

                            const secondConfirm = window.confirm("请再次确认删除。此操作会物理删除竞品记录。");
                            if (!secondConfirm) {
                              return;
                            }

                            startDeleting(async () => {
                              const result = await onDelete(productId, competitor.id);
                              if (!result.success) {
                                window.alert(result.error ?? "删除竞品失败，请稍后重试。");
                                return;
                              }

                              window.location.href = `/products/${productId}?tab=${encodeURIComponent("竞品数据")}`;
                            });
                          }}
                          className="inline-flex h-10 items-center rounded-xl border border-rose-200 px-3 text-sm font-medium text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          删除
                        </button>
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))
              ) : (
                <DataTableRow>
                  <DataTableCell colSpan={8} className="py-10 text-center text-sm text-slate-400">
                    暂无竞品数据，先录入第一个竞品。
                  </DataTableCell>
                </DataTableRow>
              )}
            </DataTableBody>
          </DataTable>
        </TableScrollArea>
      </DashboardCard>

      <form key={formKey} action={formAction}>
        <DashboardCard>
          <DashboardCardHeader
            title={formMode === "edit" ? "编辑竞品" : "新增竞品"}
            description="支持录入价格、热度、日期、卖点、痛点和截图。"
            action={
              formMode === "edit" ? (
                <ActionButton href={`/products/${productId}?tab=${encodeURIComponent("竞品数据")}`} variant="ghost">
                  取消编辑
                </ActionButton>
              ) : undefined
            }
          />
          <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-3">
            <input type="hidden" name="competitorId" value={values.id ?? ""} />
            <Field label="平台" required>
              <select
                name="platform"
                defaultValue={values.platform}
                className={inputClassName}
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
                placeholder="请输入竞品标题"
                onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
              />
            </Field>
            <Field label="价格" required>
              <input
                name="price"
                defaultValue={values.price}
                className={inputClassName}
                inputMode="decimal"
                placeholder="0.00"
                onChange={(event) => setValues((current) => ({ ...current, price: event.target.value }))}
              />
            </Field>
            <Field label="热度指标类型" required>
              <select
                name="heatMetricType"
                defaultValue={values.heatMetricType}
                className={inputClassName}
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
                placeholder="0"
                onChange={(event) => setValues((current) => ({ ...current, heatMetricValue: event.target.value }))}
              />
            </Field>
            <Field label="数据日期" required>
              <input
                type="date"
                name="dataDate"
                defaultValue={values.dataDate}
                className={inputClassName}
                onChange={(event) => setValues((current) => ({ ...current, dataDate: event.target.value }))}
              />
            </Field>
            <Field label="店铺 / 作者">
              <input name="sellerName" defaultValue={values.sellerName} className={inputClassName} placeholder="可选" />
            </Field>
            <Field label="链接">
              <input name="link" defaultValue={values.link} className={inputClassName} placeholder="可选" />
            </Field>
            <Field label="图片风格">
              <input name="imageStyle" defaultValue={values.imageStyle} className={inputClassName} placeholder="可选" />
            </Field>
            <div className="md:col-span-2 xl:col-span-3">
              <Field label="竞品截图">
                <input type="file" name="screenshot" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className={inputClassName} />
                {screenshotPath ? (
                  <p className="mt-2 text-xs text-slate-400">
                    当前截图：
                    <Link
                      href={`/api/uploads/${screenshotPath.replace(/^uploads[\\/]/, "")}`}
                      target="_blank"
                      className="ml-1 text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      查看
                    </Link>
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">支持 jpg / jpeg / png / webp，单张最大 10MB。</p>
                )}
              </Field>
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <Field label="主要卖点">
                <textarea name="sellingPoint" defaultValue={values.sellingPoint} className={textareaClassName} placeholder="可选" />
              </Field>
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <Field label="用户痛点 / 差评">
                <textarea name="painPoint" defaultValue={values.painPoint} className={textareaClassName} placeholder="可选" />
              </Field>
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <Field label="备注">
                <textarea name="notes" defaultValue={values.notes} className={textareaClassName} placeholder="可选" />
              </Field>
            </div>
          </div>
          {serverState.error ? (
            <div className="border-t border-[#EEF2F8] bg-rose-50 px-5 py-3 text-sm text-rose-600">{serverState.error}</div>
          ) : null}
          <div className="flex justify-end gap-3 border-t border-[#EEF2F8] px-5 py-4">
            <ActionButton href={`/products/${productId}?tab=${encodeURIComponent("竞品数据")}`} variant="ghost">
              重置
            </ActionButton>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#4A86FF,#275FE8)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "保存中..." : formMode === "edit" ? "保存竞品" : "新增竞品"}
            </button>
          </div>
        </DashboardCard>
      </form>
    </div>
  );
}
