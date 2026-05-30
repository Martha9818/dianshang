"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  ActionButton,
  DashboardCard,
  DashboardCardHeader,
  MiniIcon,
  PageNote,
  StatusBadge,
} from "@/components/dashboard/primitives";
import { ProductImage } from "@/components/products/product-image";
import {
  applyInspirationAiSuggestionAction,
  archiveInspirationAction,
  convertInspirationToProductAction,
  generateInspirationAiSuggestionAction,
  markInspirationReviewedAction,
  rejectInspirationAction,
  runInspirationScanAction,
  saveInspirationDraftAction,
  saveInspirationFolderAction,
} from "@/app/inspirations/actions";
import type { InspirationAISuggestion } from "@/lib/services/inspirations/inspirationTypes";

type InspirationView = {
  id: number;
  title: string | null;
  note: string | null;
  imagePath: string;
  thumbnailPath: string | null;
  displayPath: string | null;
  fileName: string;
  fileHashShort: string;
  status: string;
  statusLabel: string;
  statusTone: "amber" | "green" | "slate" | "red" | "violet" | "blue";
  usagePermission: string;
  usagePermissionLabel: string;
  usagePermissionTone: "amber" | "green" | "slate" | "red" | "violet" | "blue";
  sourceTypeLabel: string;
  fileExists: boolean;
  thumbnailExists: boolean;
  formattedImportedAt: string;
  formattedUpdatedAt: string;
  formattedReviewedAt: string | null;
  formattedArchivedAt: string | null;
  rejectedReason: string | null;
  aiSuggestion: InspirationAISuggestion | null;
  operationLogs: Array<{
    id: number;
    action: string;
    detail: string | null;
    formattedCreatedAt: string;
  }>;
  aiJobSummary: {
    id: number;
    jobType: string;
    status: string;
    errorSummary: string | null;
    resultSummary: string | null;
    createdAt: string;
    finishedAt: string | null;
  } | null;
  convertedProduct: {
    id: number;
    name: string;
    spu: string;
  } | null;
};

type ScanLogView = {
  id: number;
  scanType: string;
  folderSummary: string;
  totalFiles: number;
  newFiles: number;
  skippedDuplicates: number;
  failedFiles: number;
  status: string;
  errorSummary: string | null;
  formattedStartedAt: string;
  formattedFinishedAt: string;
  statusTone: "amber" | "green" | "slate" | "red" | "violet" | "blue";
};

type InspirationsPageData = {
  runtime: {
    isWritable: boolean;
  };
  settingView: {
    configured: boolean;
    displayPath: string | null;
  };
  inspirations: InspirationView[];
  recentScanLogs: ScanLogView[];
  stats: {
    total: number;
    pending: number;
    reviewed: number;
    converted: number;
    archived: number;
    rejected: number;
  };
  filters: {
    keyword: string | null;
    sourceType: string | null;
    status: string | null;
    converted: "true" | "false" | null;
    hasImage: "true" | "false" | null;
    sort: string;
  };
  sourceTypes: Array<{ value: string; label: string }>;
  statuses: Array<{ value: string; label: string }>;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";
const textareaClassName =
  "min-h-[108px] w-full resize-y rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";

function getSelectedInspiration(inspirations: InspirationView[], selectedId: number | null) {
  if (selectedId === null) {
    return inspirations[0] ?? null;
  }

  return inspirations.find((item) => item.id === selectedId) ?? inspirations[0] ?? null;
}

function buildConversionDefaults(input: {
  title: string | null;
  note: string | null;
  aiSuggestion: InspirationAISuggestion | null;
}) {
  const aiSuggestion = input.aiSuggestion;
  return {
    name: input.title?.trim() || aiSuggestion?.titleSuggestion || "",
    categoryLevel1: aiSuggestion?.possibleCategory || "",
    targetUser: aiSuggestion?.targetAudience.join("；") || "",
    sellingPointsText: aiSuggestion?.sellingPoints.join("\n") || "",
    usageScenesText: aiSuggestion?.useScenarios.join("\n") || "",
    tagsText: aiSuggestion?.styleKeywords.join("\n") || "",
    notes:
      input.note?.trim() ||
      [aiSuggestion?.shortDescription, aiSuggestion?.uncertaintyNotes.join("；")].filter(Boolean).join("\n"),
  };
}

function getConversionDefaults(selected: InspirationView | null) {
  if (!selected) {
    return {
      name: "",
      categoryLevel1: "",
      targetUser: "",
      sellingPointsText: "",
      usageScenesText: "",
      tagsText: "",
      notes: "",
    };
  }

  return buildConversionDefaults({
    title: selected.title,
    note: selected.note,
    aiSuggestion: selected.aiSuggestion,
  });
}

export function InspirationManager({ data, readonlyNotice }: { data: InspirationsPageData; readonlyNotice: string | null }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(data.inspirations[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "reviewed" | "converted" | "archived" | "rejected">("all");

  const [folderState, folderAction, folderPending] = useActionState(saveInspirationFolderAction, {
    success: false,
    error: "",
  });
  const [scanState, scanAction, scanPending] = useActionState(runInspirationScanAction, {
    success: false,
    error: "",
  });
  const [draftState, draftAction, draftPending] = useActionState(saveInspirationDraftAction, {
    success: false,
    error: "",
  });
  const [aiState, aiAction, aiPending] = useActionState(generateInspirationAiSuggestionAction, {
    success: false,
    error: "",
  });
  const [applyState, applyAction, applyPending] = useActionState(applyInspirationAiSuggestionAction, {
    success: false,
    error: "",
  });
  const [reviewState, reviewAction, reviewPending] = useActionState(markInspirationReviewedAction, {
    success: false,
    error: "",
  });
  const [archiveState, archiveAction, archivePending] = useActionState(archiveInspirationAction, {
    success: false,
    error: "",
  });
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectInspirationAction, {
    success: false,
    error: "",
  });
  const [convertState, convertAction, convertPending] = useActionState(convertInspirationToProductAction, {
    success: false,
    error: "",
  });

  const visibleInspirations = useMemo(() => {
    if (statusFilter === "all") {
      return data.inspirations;
    }

    return data.inspirations.filter((item) => item.status === statusFilter);
  }, [data.inspirations, statusFilter]);

  const effectiveSelectedId = useMemo(() => {
    const selectedExists = data.inspirations.some((item) => item.id === selectedId);
    if (selectedExists) {
      return selectedId;
    }

    return visibleInspirations[0]?.id ?? data.inspirations[0]?.id ?? null;
  }, [data.inspirations, selectedId, visibleInspirations]);

  const selectedInspiration = getSelectedInspiration(data.inspirations, effectiveSelectedId);
  const conversionDefaults = useMemo(() => getConversionDefaults(selectedInspiration), [selectedInspiration]);
  const selectedIsConverted = selectedInspiration?.status === "converted" || Boolean(selectedInspiration?.convertedProduct);
  const selectedIsClosed = selectedInspiration?.status === "archived" || selectedInspiration?.status === "rejected";

  useEffect(() => {
    if (convertState.success && convertState.data?.id) {
      router.push(`/products/${convertState.data.id}`);
    }
  }, [convertState.data, convertState.success, router]);

  const formKey = selectedInspiration ? `${selectedInspiration.id}-${selectedInspiration.formattedUpdatedAt}` : "empty";

  return (
    <div className="space-y-5">
      {readonlyNotice ? <PageNote>{readonlyNotice}</PageNote> : null}

      <section className="grid gap-4 xl:grid-cols-5">
        <StatCard label="灵感总数" value={String(data.stats.total)} delta="默认隐藏归档/放弃" tone="blue" />
        <StatCard label="待处理" value={String(data.stats.pending)} delta="手动扫描结果" tone="amber" />
        <StatCard label="已查看" value={String(data.stats.reviewed)} delta="待决定下一步" tone="blue" />
        <StatCard label="已转商品" value={String(data.stats.converted)} delta="需确认后创建" tone="green" />
        <StatCard label="已放弃" value={String(data.stats.rejected)} delta={`归档 ${data.stats.archived}`} tone="slate" />
      </section>

      <DashboardCard className="px-5 py-5">
        <form action="/inspirations" method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_170px_160px_160px_150px_160px_auto] xl:items-end">
          <FilterField label="标题关键词">
            <input name="q" defaultValue={data.filters.keyword ?? ""} placeholder="搜索标题 / 备注 / 文件名" className={inputClassName} />
          </FilterField>
          <FilterField label="来源平台">
            <select name="sourceType" defaultValue={data.filters.sourceType ?? ""} className={inputClassName}>
              <option value="">全部来源</option>
              {data.sourceTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="处理状态">
            <select name="status" defaultValue={data.filters.status ?? ""} className={inputClassName}>
              <option value="">全部状态</option>
              {data.statuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="转商品">
            <select name="converted" defaultValue={data.filters.converted ?? ""} className={inputClassName}>
              <option value="">全部</option>
              <option value="true">已转商品</option>
              <option value="false">未转商品</option>
            </select>
          </FilterField>
          <FilterField label="图片">
            <select name="hasImage" defaultValue={data.filters.hasImage ?? ""} className={inputClassName}>
              <option value="">全部</option>
              <option value="true">图片可用</option>
              <option value="false">图片缺失</option>
            </select>
          </FilterField>
          <FilterField label="创建时间">
            <select name="sort" defaultValue={data.filters.sort} className={inputClassName}>
              <option value="createdAt_desc">从新到旧</option>
              <option value="createdAt_asc">从旧到新</option>
            </select>
          </FilterField>
          <button type="submit" className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white">
            筛选
          </button>
        </form>
      </DashboardCard>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardCard className="px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[1.15rem] font-semibold text-slate-900">灵感文件夹</h2>
              <p className="mt-1 text-sm text-slate-500">本地手动扫描，Vercel 仅只读展示。</p>
            </div>
            <StatusBadge label={data.settingView.configured ? "已设置" : "未设置"} tone={data.settingView.configured ? "green" : "amber"} />
          </div>

          <form action={folderAction} className="mt-5 space-y-3">
            <input
              name="folderPath"
              className={inputClassName}
              placeholder="输入 Windows 本地灵感文件夹完整路径"
              defaultValue=""
              disabled={folderPending || !data.runtime.isWritable}
            />
            <div className="flex flex-wrap gap-2">
              <ActionButton type="submit" variant="secondary">
                {folderPending ? "保存中..." : "保存路径"}
              </ActionButton>
              <button
                formAction={scanAction}
                type="submit"
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.24)] disabled:opacity-70"
                disabled={scanPending || !data.runtime.isWritable}
              >
                <MiniIcon name="spark" className="h-4 w-4" />
                {scanPending ? "扫描中..." : "手动扫描"}
              </button>
            </div>
          </form>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>当前设置：{data.settingView.displayPath ?? "未设置"}</p>
            {folderState.error ? <p className="text-rose-600">{folderState.error}</p> : null}
            {scanState.error ? <p className="text-rose-600">{scanState.error}</p> : null}
            {scanState.success ? (
              <p className="text-emerald-600">
                扫描完成：新增 {scanState.data?.newFiles ?? 0}，跳过 {scanState.data?.skippedDuplicates ?? 0}，失败 {scanState.data?.failedFiles ?? 0}
              </p>
            ) : null}
          </div>
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader
            title="灵感列表"
            description="缩略图、状态、去重摘要和 AI 建议都只作为待处理参考。"
            action={
              <div className="flex flex-wrap gap-2">
                {[
                  ["all", "全部"],
                  ["pending", "待处理"],
                  ["reviewed", "已查看"],
                  ["converted", "已转商品"],
                  ["archived", "已归档"],
                  ["rejected", "已放弃"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value as typeof statusFilter)}
                    className={[
                      "inline-flex h-10 items-center rounded-xl border px-3 text-sm font-medium",
                      statusFilter === value ? "border-blue-200 bg-blue-50 text-[#2563EB]" : "border-[#E4EAF3] bg-white text-slate-500",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
          />
          <div className="grid gap-3 px-5 py-5 md:grid-cols-2">
            {visibleInspirations.length > 0 ? (
              visibleInspirations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={[
                    "group flex flex-col rounded-[24px] border p-4 text-left transition hover:-translate-y-[1px] hover:shadow-[0_18px_36px_rgba(59,130,246,0.08)]",
                    selectedInspiration?.id === item.id ? "border-blue-200 bg-[#F8FBFF]" : "border-[#EEF2F8] bg-white",
                  ].join(" ")}
                >
                  <ProductImage src={item.displayPath} alt={item.imagePath} label="IMG" square missing={!item.fileExists} />
                  <div className="mt-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge label={item.statusLabel} tone={item.statusTone} />
                      <StatusBadge label={item.usagePermissionLabel} tone={item.usagePermissionTone} />
                    </div>
                    <p className="line-clamp-2 min-h-[48px] text-sm font-medium text-slate-900">{item.title ?? item.fileName}</p>
                    <p className="line-clamp-2 text-xs leading-5 text-slate-500">{item.note ?? "AI 建议仅供参考，尚未写入正式商品。"}</p>
                    <p className="text-xs text-slate-400">{item.fileHashShort} · {item.formattedImportedAt}</p>
                  </div>
                </button>
              ))
            ) : (
              <PageNote>当前筛选条件下没有灵感记录。</PageNote>
            )}
          </div>
        </DashboardCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
        <DashboardCard>
          <DashboardCardHeader
            title="灵感详情"
            description={selectedInspiration ? "这里可以保存备注、标记查看、归档、放弃或确认转为商品。" : "请选择左侧一条灵感记录。"}
          />
          {selectedInspiration ? (
            <div className="space-y-4 px-5 py-5">
              <div className="grid gap-4 xl:grid-cols-[0.52fr_0.48fr]">
                <ProductImage src={selectedInspiration.displayPath} alt={selectedInspiration.imagePath} label="IMG" large missing={!selectedInspiration.fileExists} />
                <div className="space-y-3 text-sm text-slate-600">
                  <DetailRow label="文件名" value={selectedInspiration.fileName} />
                  <DetailRow label="来源类型" value={selectedInspiration.sourceTypeLabel} />
                  <DetailRow label="使用权限" value={selectedInspiration.usagePermissionLabel} badgeTone={selectedInspiration.usagePermissionTone} />
                  <DetailRow label="状态" value={selectedInspiration.statusLabel} badgeTone={selectedInspiration.statusTone} />
                  <DetailRow label="hash" value={selectedInspiration.fileHashShort} />
                  <DetailRow label="导入时间" value={selectedInspiration.formattedImportedAt} />
                  <DetailRow label="更新时间" value={selectedInspiration.formattedUpdatedAt} />
                  <DetailRow label="查看时间" value={selectedInspiration.formattedReviewedAt ?? "--"} />
                  <DetailRow label="归档时间" value={selectedInspiration.formattedArchivedAt ?? "--"} />
                  <DetailRow label="放弃原因" value={selectedInspiration.rejectedReason ?? "--"} />
                  <DetailRow label="AIJob" value={selectedInspiration.aiJobSummary ? `#${selectedInspiration.aiJobSummary.id} · ${selectedInspiration.aiJobSummary.status}` : "--"} />
                  <DetailRow label="转商品" value={selectedInspiration.convertedProduct ? `${selectedInspiration.convertedProduct.name} (#${selectedInspiration.convertedProduct.id})` : "--"} />
                </div>
              </div>

              <form action={draftAction} key={formKey} className="space-y-3 rounded-[24px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4">
                <input type="hidden" name="inspirationId" value={selectedInspiration.id} />
                <Field label="草稿标题">
                  <input name="title" className={inputClassName} defaultValue={selectedInspiration.title ?? ""} disabled={!data.runtime.isWritable} />
                </Field>
                <Field label="草稿备注">
                  <textarea name="note" className={textareaClassName} defaultValue={selectedInspiration.note ?? ""} disabled={!data.runtime.isWritable} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <ActionButton type="submit" variant="secondary">
                    {draftPending ? "保存中..." : "保存草稿"}
                  </ActionButton>
                  <button
                    formAction={aiAction}
                    type="submit"
                    className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white disabled:opacity-70"
                    disabled={aiPending || selectedIsConverted || selectedIsClosed}
                  >
                    <MiniIcon name="spark" className="h-4 w-4" />
                    {aiPending ? "识图中..." : "AI 识图建议"}
                  </button>
                  <button
                    formAction={applyAction}
                    type="submit"
                    className="inline-flex h-12 items-center rounded-2xl border border-[#DCE5F2] px-5 text-sm font-medium text-[#2563EB] disabled:opacity-70"
                    disabled={applyPending || !selectedInspiration.aiSuggestion || selectedIsConverted || selectedIsClosed}
                  >
                    应用到草稿
                  </button>
                  <button
                    formAction={reviewAction}
                    type="submit"
                    className="inline-flex h-12 items-center rounded-2xl border border-[#DCE5F2] px-5 text-sm font-medium text-slate-600 disabled:opacity-70"
                    disabled={reviewPending || selectedIsConverted || selectedIsClosed}
                  >
                    标记已查看
                  </button>
                  <button
                    formAction={archiveAction}
                    type="submit"
                    className="inline-flex h-12 items-center rounded-2xl border border-[#DCE5F2] px-5 text-sm font-medium text-slate-600 disabled:opacity-70"
                    disabled={archivePending || selectedIsConverted || selectedIsClosed}
                  >
                    归档
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                  <Field label="放弃原因">
                    <input
                      name="rejectedReason"
                      className={inputClassName}
                      placeholder="简短记录为什么不继续处理"
                      disabled={selectedIsConverted || selectedIsClosed}
                    />
                  </Field>
                  <button
                    formAction={rejectAction}
                    type="submit"
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-rose-200 px-5 text-sm font-medium text-rose-600 disabled:opacity-70"
                    disabled={rejectPending || selectedIsConverted || selectedIsClosed}
                  >
                    放弃
                  </button>
                </div>
                {draftState.error ? <p className="text-sm text-rose-600">{draftState.error}</p> : null}
                {aiState.error ? <p className="text-sm text-rose-600">{aiState.error}</p> : null}
                {applyState.error ? <p className="text-sm text-rose-600">{applyState.error}</p> : null}
                {reviewState.error ? <p className="text-sm text-rose-600">{reviewState.error}</p> : null}
                {archiveState.error ? <p className="text-sm text-rose-600">{archiveState.error}</p> : null}
                {rejectState.error ? <p className="text-sm text-rose-600">{rejectState.error}</p> : null}
                {selectedInspiration.aiSuggestion ? (
                  <div className="rounded-2xl border border-[#EEF2F8] bg-white px-4 py-4 text-sm leading-7 text-slate-600">
                    <p className="font-medium text-slate-900">AI 建议，仅供参考</p>
                    <p className="mt-2">{selectedInspiration.aiSuggestion.shortDescription}</p>
                    <p className="mt-2">类目：{selectedInspiration.aiSuggestion.possibleCategory}</p>
                    <p className="mt-2">卖点：{selectedInspiration.aiSuggestion.sellingPoints.join("；") || "--"}</p>
                    <p className="mt-2">场景：{selectedInspiration.aiSuggestion.useScenarios.join("；") || "--"}</p>
                    <p className="mt-2">不确定项：{selectedInspiration.aiSuggestion.uncertaintyNotes.join("；") || "--"}</p>
                  </div>
                ) : (
                  <PageNote>这里会显示 AI 识图建议，但不会自动写入正式商品。</PageNote>
                )}
              </form>

              {convertState.error ? <p className="text-sm text-rose-600">{convertState.error}</p> : null}
              <div className="rounded-[24px] border border-[#EEF2F8] bg-white px-4 py-4">
                <h3 className="text-sm font-semibold text-slate-900">处理记录</h3>
                <div className="mt-3 space-y-3">
                  {selectedInspiration.operationLogs.length > 0 ? (
                    selectedInspiration.operationLogs.map((log) => (
                      <div key={log.id} className="rounded-2xl bg-[#F8FAFD] px-3 py-3 text-sm text-slate-600">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-slate-800">{log.action}</span>
                          <span className="text-xs text-slate-400">{log.formattedCreatedAt}</span>
                        </div>
                        <p className="mt-1 leading-6">{log.detail ?? "--"}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">暂无处理记录。</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-5 py-5">
              <PageNote>暂无可查看的灵感记录。</PageNote>
            </div>
          )}
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader title="转为商品确认" description="只有用户确认提交后，才会创建正式 Product。" />
          {selectedInspiration ? (
            <form
              action={convertAction}
              key={`${formKey}-convert`}
              className="space-y-3 px-5 py-5"
              onSubmit={(event) => {
                if (selectedIsConverted || selectedIsClosed) {
                  event.preventDefault();
                  return;
                }

                if (!window.confirm("确认把这条灵感转为正式商品？转商品后不能重复转换。")) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="inspirationId" value={selectedInspiration.id} />
              {selectedIsConverted ? (
                <PageNote>这条灵感已转为商品，不能重复转商品。</PageNote>
              ) : selectedIsClosed ? (
                <PageNote>已归档或已放弃的灵感不再进入转商品流程。</PageNote>
              ) : null}
              <Field label="商品名称">
                <input name="name" className={inputClassName} defaultValue={conversionDefaults.name} disabled={!data.runtime.isWritable} />
              </Field>
              <Field label="一级类目">
                <input name="categoryLevel1" className={inputClassName} defaultValue={conversionDefaults.categoryLevel1} disabled={!data.runtime.isWritable} />
              </Field>
              <Field label="目标用户">
                <input name="targetUser" className={inputClassName} defaultValue={conversionDefaults.targetUser} disabled={!data.runtime.isWritable} />
              </Field>
              <Field label="卖点草稿">
                <textarea name="sellingPointsText" className={textareaClassName} defaultValue={conversionDefaults.sellingPointsText} disabled={!data.runtime.isWritable} />
              </Field>
              <Field label="使用场景">
                <textarea name="usageScenesText" className={textareaClassName} defaultValue={conversionDefaults.usageScenesText} disabled={!data.runtime.isWritable} />
              </Field>
              <Field label="标签">
                <textarea name="tagsText" className={textareaClassName} defaultValue={conversionDefaults.tagsText} disabled={!data.runtime.isWritable} />
              </Field>
              <Field label="备注">
                <textarea name="notes" className={textareaClassName} defaultValue={conversionDefaults.notes} disabled={!data.runtime.isWritable} />
              </Field>
              <button
                type="submit"
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white disabled:opacity-70"
                disabled={convertPending || selectedIsConverted || selectedIsClosed}
              >
                {convertPending ? "创建中..." : "确认转为商品"}
              </button>
            </form>
          ) : (
            <div className="px-5 py-5">
              <PageNote>先选择一条灵感记录，再填写确认表单。</PageNote>
            </div>
          )}
        </DashboardCard>
      </section>

      <DashboardCard>
        <DashboardCardHeader title="最近 ScanLog" description="只显示脱敏摘要，不展示完整本地路径。" />
        <div className="overflow-x-auto px-5 py-4">
          <table className="min-w-full table-fixed text-left text-sm text-slate-600">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3 text-xs font-medium">时间</th>
                <th className="pb-3 text-xs font-medium">文件夹</th>
                <th className="pb-3 text-xs font-medium">状态</th>
                <th className="pb-3 text-xs font-medium">新增</th>
                <th className="pb-3 text-xs font-medium">去重</th>
                <th className="pb-3 text-xs font-medium">失败</th>
                <th className="pb-3 text-xs font-medium">错误摘要</th>
              </tr>
            </thead>
            <tbody>
              {data.recentScanLogs.length > 0 ? (
                data.recentScanLogs.map((log) => (
                  <tr key={log.id} className="border-t border-[#F0F3F8]">
                    <td className="py-4">{log.formattedStartedAt}</td>
                    <td className="py-4 break-all">{log.folderSummary}</td>
                    <td className="py-4">
                      <StatusBadge label={log.status} tone={log.statusTone} />
                    </td>
                    <td className="py-4">{log.newFiles}</td>
                    <td className="py-4">{log.skippedDuplicates}</td>
                    <td className="py-4">{log.failedFiles}</td>
                    <td className="py-4 text-rose-600">{log.errorSummary ?? "--"}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-[#F0F3F8]">
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    暂无 ScanLog。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}

function StatCard({ label, value, delta, tone }: { label: string; value: string; delta: string; tone: "blue" | "amber" | "green" | "slate" }) {
  return (
    <DashboardCard className="h-full p-5">
      <div className="space-y-2">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-[2.4rem] font-semibold tracking-[-0.06em] text-slate-900">{value}</p>
        <p className={tone === "green" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : tone === "blue" ? "text-blue-600" : "text-slate-500"}>{delta}</p>
      </div>
    </DashboardCard>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
      {children}
    </label>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 px-1 text-sm text-slate-500">{label}</div>
      {children}
    </label>
  );
}

function DetailRow({
  label,
  value,
  badgeTone,
}: {
  label: string;
  value: string;
  badgeTone?: "blue" | "amber" | "green" | "violet" | "red" | "slate";
}) {
  return (
    <div className="grid gap-1 md:grid-cols-[92px_1fr]">
      <span className="text-slate-400">{label}</span>
      <div className="min-w-0 break-all">
        {badgeTone ? <StatusBadge label={value} tone={badgeTone} /> : <span>{value}</span>}
      </div>
    </div>
  );
}
