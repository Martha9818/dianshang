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
import { BatchOperationForm } from "@/components/batch/batch-operation-form";
import { ProductImage } from "@/components/products/product-image";
import {
  applyInspirationAiSuggestionAction,
  archiveInspirationAction,
  batchInspirationOperationAction,
  convertInspirationToProductAction,
  generateInspirationAiSuggestionAction,
  ignoreInspirationAiDraftAction,
  markInspirationReviewedAction,
  rejectInspirationAction,
  retryInspirationAiDraftJobAction,
  retryInspirationScanJobAction,
  runInspirationScanAction,
  saveInspirationDraftAction,
  saveInspirationFolderAction,
  saveInspirationScanConfigAction,
} from "@/app/inspirations/actions";
import type { InspirationAISuggestion } from "@/lib/services/inspirations/inspirationTypes";

const INSPIRATION_BATCH_FORM_ID = "inspiration-batch-operation";

const inspirationBatchOperations = [
  {
    value: "MARK_REVIEWED",
    label: "批量标记已查看",
    impact: "只修改已选灵感的查看状态，不会转为商品。",
  },
  {
    value: "ARCHIVE",
    label: "批量归档",
    dangerous: true,
    impact: "已选灵感会从默认列表隐藏，不会删除图片或转为商品。",
  },
  {
    value: "REJECT",
    label: "批量放弃",
    dangerous: true,
    impact: "已选灵感会标记为已放弃，不会删除图片或转为商品。",
  },
];

type Tone = "amber" | "green" | "slate" | "red" | "violet" | "blue";

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
  statusTone: Tone;
  usagePermission: string;
  usagePermissionLabel: string;
  usagePermissionTone: Tone;
  sourceTypeLabel: string;
  fileExists: boolean;
  formattedImportedAt: string;
  formattedUpdatedAt: string;
  formattedReviewedAt: string | null;
  formattedArchivedAt: string | null;
  rejectedReason: string | null;
  aiSuggestion: InspirationAISuggestion | null;
  aiDraftJobs: Array<{
    id: number;
    status: string;
    failureReasonSummary: string | null;
    rawResponseSummary: string | null;
    needsUserConfirmation: boolean;
    retryCount: number;
    formattedCreatedAt: string;
    formattedUpdatedAt: string;
  }>;
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
  statusTone: Tone;
};

type TaskSummary = {
  id: number;
  sourceRelativePath: string;
  status: string;
  failureReasonSummary: string | null;
  needsUserConfirmation: boolean;
  retryCount: number;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
};

type InspirationsPageData = {
  runtime: {
    isWritable: boolean;
  };
  settingView: {
    configured: boolean;
    displayPath: string | null;
    scanEnabled: boolean;
    scanIntervalMinutes: number;
  };
  inspirations: InspirationView[];
  recentScanLogs: ScanLogView[];
  latestScan: ScanLogView | null;
  recentTasks: {
    scanJobs: Array<TaskSummary & { aiDraftGenerated: boolean }>;
    aiDraftJobs: Array<TaskSummary & { inspirationId: number; rawResponseSummary: string | null }>;
  };
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
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400";
const textareaClassName =
  "min-h-[108px] w-full resize-y rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400";
const primaryButtonClassName =
  "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.20)] disabled:opacity-60";
const secondaryButtonClassName =
  "inline-flex h-12 items-center justify-center rounded-2xl border border-[#DCE5F2] bg-white px-5 text-sm font-medium text-[#2563EB] disabled:opacity-60";
const dangerButtonClassName =
  "inline-flex h-12 items-center justify-center rounded-2xl border border-rose-200 bg-white px-5 text-sm font-medium text-rose-600 disabled:opacity-60";

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
    categoryLevel1: aiSuggestion?.possibleCategory || aiSuggestion?.possibleProductType || "",
    targetUser: aiSuggestion?.targetAudience.join("；") || "",
    sellingPointsText: aiSuggestion?.sellingPoints.join("\n") || "",
    usageScenesText: aiSuggestion?.useScenarios.join("\n") || "",
    tagsText: [...(aiSuggestion?.styleKeywords ?? []), ...(aiSuggestion?.colors ?? [])].join("\n"),
    notes:
      input.note?.trim() ||
      [
        aiSuggestion?.draftLabel,
        aiSuggestion?.shortDescription,
        aiSuggestion?.riskNotes.join("；"),
        aiSuggestion?.uncertaintyNotes.join("；"),
      ]
        .filter(Boolean)
        .join("\n"),
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

function getTaskTone(status: string): Tone {
  if (status === "success") return "green";
  if (status === "failed") return "red";
  if (status === "processing") return "blue";
  if (status === "skipped") return "slate";
  return "amber";
}

export function InspirationManager({ data, readonlyNotice }: { data: InspirationsPageData; readonlyNotice: string | null }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(data.inspirations[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState("all");

  const [folderState, folderAction, folderPending] = useActionState(saveInspirationFolderAction, {
    success: false,
    error: "",
  });
  const [scanConfigState, scanConfigAction, scanConfigPending] = useActionState(saveInspirationScanConfigAction, {
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
  const [ignoreDraftState, ignoreDraftAction, ignoreDraftPending] = useActionState(ignoreInspirationAiDraftAction, {
    success: false,
    error: "",
  });
  const [retryAiState, retryAiAction, retryAiPending] = useActionState(retryInspirationAiDraftJobAction, {
    success: false,
    error: "",
  });
  const [, retryScanAction, retryScanPending] = useActionState(retryInspirationScanJobAction, {
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
  const latestFailedAiDraft = selectedInspiration?.aiDraftJobs.find((job) => job.status === "failed") ?? null;

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
        <StatCard label="待处理" value={String(data.stats.pending)} delta="扫描后进入草稿" tone="amber" />
        <StatCard label="已查看" value={String(data.stats.reviewed)} delta="等待后续判断" tone="blue" />
        <StatCard label="已转商品" value={String(data.stats.converted)} delta="必须用户确认" tone="green" />
        <StatCard label="已放弃" value={String(data.stats.rejected)} delta={`归档 ${data.stats.archived}`} tone="slate" />
      </section>

      <DashboardCard className="px-5 py-5">
        <form action="/inspirations" method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_170px_160px_160px_150px_160px_auto] xl:items-end">
          <FilterField label="关键词">
            <input name="q" defaultValue={data.filters.keyword ?? ""} placeholder="标题 / 备注 / 文件名" className={inputClassName} />
          </FilterField>
          <FilterField label="来源">
            <select name="sourceType" defaultValue={data.filters.sourceType ?? ""} className={inputClassName}>
              <option value="">全部来源</option>
              {data.sourceTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="状态">
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
          <button type="submit" className={primaryButtonClassName}>
            筛选
          </button>
        </form>
      </DashboardCard>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardCard className="px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[1.15rem] font-semibold text-slate-900">灵感文件夹扫描</h2>
              <p className="mt-1 text-sm text-slate-500">应用运行期间按配置触发；关闭应用或预览环境不会继续扫描。</p>
            </div>
            <StatusBadge label={data.settingView.configured ? "已设置" : "未设置"} tone={data.settingView.configured ? "green" : "amber"} />
          </div>

          <form action={folderAction} className="mt-5 space-y-3">
            <Field label="本地灵感扫描目录">
              <input
                name="folderPath"
                className={inputClassName}
                placeholder="输入 Windows 本地灵感文件夹完整路径"
                defaultValue=""
                disabled={folderPending || !data.runtime.isWritable}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <ActionButton type="submit" variant="secondary">
                {folderPending ? "保存中..." : "保存目录"}
              </ActionButton>
              <button formAction={scanAction} type="submit" className={primaryButtonClassName} disabled={scanPending || !data.runtime.isWritable}>
                <MiniIcon name="spark" className="h-4 w-4" />
                {scanPending ? "扫描中..." : "立即扫描并生成 AI 草稿"}
              </button>
            </div>
          </form>

          <form action={scanConfigAction} className="mt-5 grid gap-3 rounded-[24px] border border-[#EEF2F8] bg-[#FBFDFF] p-4 md:grid-cols-[1fr_180px_auto] md:items-end">
            <label className="flex min-h-12 items-center gap-3 text-sm font-medium text-slate-700">
              <input
                name="scanEnabled"
                type="checkbox"
                defaultChecked={data.settingView.scanEnabled}
                disabled={!data.runtime.isWritable || scanConfigPending}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              启用应用内定时扫描
            </label>
            <Field label="扫描间隔">
              <select
                name="scanIntervalMinutes"
                defaultValue={String(data.settingView.scanIntervalMinutes)}
                className={inputClassName}
                disabled={!data.runtime.isWritable || scanConfigPending}
              >
                <option value="10">10 分钟</option>
                <option value="30">30 分钟</option>
                <option value="60">1 小时</option>
              </select>
            </Field>
            <button type="submit" className={secondaryButtonClassName} disabled={!data.runtime.isWritable || scanConfigPending}>
              {scanConfigPending ? "保存中..." : "保存定时配置"}
            </button>
          </form>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>当前目录：{data.settingView.displayPath ?? "未设置"}</p>
            <p>
              定时扫描：{data.settingView.scanEnabled ? `启用，每 ${data.settingView.scanIntervalMinutes} 分钟` : "停用"}；最后扫描：
              {data.latestScan ? `${data.latestScan.formattedStartedAt} / ${data.latestScan.status}` : "暂无"}
            </p>
            {data.latestScan ? (
              <p>
                最后结果：新增 {data.latestScan.newFiles}，重复 {data.latestScan.skippedDuplicates}，失败 {data.latestScan.failedFiles}
              </p>
            ) : null}
            {folderState.error ? <p className="text-rose-600">{folderState.error}</p> : null}
            {scanConfigState.error ? <p className="text-rose-600">{scanConfigState.error}</p> : null}
            {scanState.error ? <p className="text-rose-600">{scanState.error}</p> : null}
            {scanState.success ? (
              <p className="text-emerald-600">
                扫描完成：新增 {scanState.data?.newFiles ?? 0}，重复 {scanState.data?.skippedDuplicates ?? 0}，文件失败 {scanState.data?.failedFiles ?? 0}，AI 草稿失败 {scanState.data?.aiDraftFailed ?? 0}
              </p>
            ) : null}
          </div>
        </DashboardCard>

        <BatchOperationForm
          formId={INSPIRATION_BATCH_FORM_ID}
          action={batchInspirationOperationAction}
          operations={inspirationBatchOperations}
          disabled={!data.runtime.isWritable}
        >
          <DashboardCard>
            <DashboardCardHeader
              title="灵感列表"
              description="图片导入后只进入灵感草稿，AI 识图也只作为待确认草稿。"
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
                      onClick={() => setStatusFilter(value)}
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
                  <div
                    key={item.id}
                    className={[
                      "flex flex-col rounded-[24px] border p-4 text-left transition hover:-translate-y-[1px] hover:shadow-[0_18px_36px_rgba(59,130,246,0.08)]",
                      selectedInspiration?.id === item.id ? "border-blue-200 bg-[#F8FBFF]" : "border-[#EEF2F8] bg-white",
                    ].join(" ")}
                  >
                    <span className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                      <input
                        type="checkbox"
                        form={INSPIRATION_BATCH_FORM_ID}
                        name="ids"
                        value={item.id}
                        aria-label={`选择 ${item.title ?? item.fileName}`}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      选择
                    </span>
                    <button type="button" onClick={() => setSelectedId(item.id)} className="text-left">
                      <ProductImage src={item.displayPath} alt={item.imagePath} label="IMG" square missing={!item.fileExists} />
                      <div className="mt-4 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge label={item.statusLabel} tone={item.statusTone} />
                          <StatusBadge label={item.usagePermissionLabel} tone={item.usagePermissionTone} />
                          {item.aiSuggestion ? <StatusBadge label="AI 草稿待确认" tone="violet" /> : null}
                        </div>
                        <p className="line-clamp-2 min-h-[48px] text-sm font-medium text-slate-900">{item.title ?? item.fileName}</p>
                        <p className="line-clamp-2 text-xs leading-5 text-slate-500">{item.note ?? "尚未应用 AI 草稿。"}</p>
                        <p className="text-xs text-slate-400">{item.fileHashShort} · {item.formattedImportedAt}</p>
                      </div>
                    </button>
                  </div>
                ))
              ) : (
                <PageNote>当前筛选条件下没有灵感记录。</PageNote>
              )}
            </div>
          </DashboardCard>
        </BatchOperationForm>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
        <DashboardCard>
          <DashboardCardHeader
            title="灵感详情"
            description={selectedInspiration ? "查看图片、AI 草稿、任务状态，并手动确认下一步。" : "请选择一条灵感记录。"}
          />
          {selectedInspiration ? (
            <div className="space-y-4 px-5 py-5">
              <div className="grid gap-4 xl:grid-cols-[0.52fr_0.48fr]">
                <ProductImage src={selectedInspiration.displayPath} alt={selectedInspiration.imagePath} label="IMG" large missing={!selectedInspiration.fileExists} />
                <div className="space-y-3 text-sm text-slate-600">
                  <DetailRow label="文件名" value={selectedInspiration.fileName} />
                  <DetailRow label="来源" value={selectedInspiration.sourceTypeLabel} />
                  <DetailRow label="权限" value={selectedInspiration.usagePermissionLabel} badgeTone={selectedInspiration.usagePermissionTone} />
                  <DetailRow label="状态" value={selectedInspiration.statusLabel} badgeTone={selectedInspiration.statusTone} />
                  <DetailRow label="hash" value={selectedInspiration.fileHashShort} />
                  <DetailRow label="导入" value={selectedInspiration.formattedImportedAt} />
                  <DetailRow label="更新" value={selectedInspiration.formattedUpdatedAt} />
                  <DetailRow label="查看" value={selectedInspiration.formattedReviewedAt ?? "--"} />
                  <DetailRow label="归档" value={selectedInspiration.formattedArchivedAt ?? "--"} />
                  <DetailRow label="放弃" value={selectedInspiration.rejectedReason ?? "--"} />
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
                    className={primaryButtonClassName}
                    disabled={aiPending || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}
                  >
                    <MiniIcon name="spark" className="h-4 w-4" />
                    {aiPending ? "识图中..." : "AI 识图草稿"}
                  </button>
                  <button
                    formAction={applyAction}
                    type="submit"
                    className={secondaryButtonClassName}
                    disabled={applyPending || !selectedInspiration.aiSuggestion || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}
                  >
                    确认并应用到灵感备注
                  </button>
                  <button
                    formAction={ignoreDraftAction}
                    type="submit"
                    className={secondaryButtonClassName}
                    disabled={ignoreDraftPending || !selectedInspiration.aiSuggestion || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}
                  >
                    忽略 AI 草稿
                  </button>
                  {latestFailedAiDraft ? (
                    <>
                      <input type="hidden" name="aiDraftJobId" value={latestFailedAiDraft.id} />
                      <button formAction={retryAiAction} type="submit" className={secondaryButtonClassName} disabled={retryAiPending || !data.runtime.isWritable}>
                        重试 AI 草稿任务
                      </button>
                    </>
                  ) : null}
                  <button formAction={reviewAction} type="submit" className={secondaryButtonClassName} disabled={reviewPending || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}>
                    标记已查看
                  </button>
                  <button formAction={archiveAction} type="submit" className={secondaryButtonClassName} disabled={archivePending || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}>
                    归档
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                  <Field label="放弃原因">
                    <input name="rejectedReason" className={inputClassName} placeholder="简短记录为什么不继续处理" disabled={!data.runtime.isWritable || selectedIsConverted || selectedIsClosed} />
                  </Field>
                  <button formAction={rejectAction} type="submit" className={dangerButtonClassName} disabled={rejectPending || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}>
                    放弃
                  </button>
                </div>
                <ActionMessages
                  messages={[
                    draftState.error,
                    aiState.error,
                    applyState.error,
                    ignoreDraftState.error,
                    retryAiState.error,
                    reviewState.error,
                    archiveState.error,
                    rejectState.error,
                  ]}
                />
                <AiDraftPanel suggestion={selectedInspiration.aiSuggestion} />
              </form>

              <div className="rounded-[24px] border border-[#EEF2F8] bg-white px-4 py-4">
                <h3 className="text-sm font-semibold text-slate-900">AI 草稿任务</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {selectedInspiration.aiDraftJobs.length > 0 ? (
                    selectedInspiration.aiDraftJobs.map((job) => (
                      <div key={job.id} className="rounded-2xl bg-[#F8FAFD] px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge label={job.status} tone={getTaskTone(job.status)} />
                          <span>#{job.id}</span>
                          <span>确认：{job.needsUserConfirmation ? "需要" : "已处理"}</span>
                          <span>重试 {job.retryCount}</span>
                        </div>
                        <p className="mt-1 text-slate-500">{job.rawResponseSummary ?? job.failureReasonSummary ?? "无摘要"}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400">暂无 AI 草稿任务。</p>
                  )}
                </div>
              </div>

              <OperationLogList logs={selectedInspiration.operationLogs} />
            </div>
          ) : (
            <div className="px-5 py-5">
              <PageNote>暂无可查看的灵感记录。</PageNote>
            </div>
          )}
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader title="转为商品确认" description="只有用户确认提交后，才会创建正式 Product；AI 草稿不会自动成为事实字段。" />
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
              {selectedIsConverted ? <PageNote>这条灵感已转为商品，不能重复转商品。</PageNote> : null}
              {selectedIsClosed ? <PageNote>已归档或已放弃的灵感不再进入转商品流程。</PageNote> : null}
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
              {convertState.error ? <p className="text-sm text-rose-600">{convertState.error}</p> : null}
              <button type="submit" className={primaryButtonClassName} disabled={convertPending || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}>
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

      <section className="grid gap-4 xl:grid-cols-2">
        <TaskTable
          title="最近扫描任务"
          empty="暂无扫描任务。"
          tasks={data.recentTasks.scanJobs}
          retryAction={retryScanAction}
          retryPending={retryScanPending}
          retryFieldName="scanJobId"
        />
        <TaskTable
          title="最近 AI 草稿任务"
          empty="暂无 AI 草稿任务。"
          tasks={data.recentTasks.aiDraftJobs}
          retryAction={retryAiAction}
          retryPending={retryAiPending}
          retryFieldName="aiDraftJobId"
        />
      </section>

      <DashboardCard>
        <DashboardCardHeader title="最近 ScanLog" description="只显示脱敏摘要，不展示完整本地路径。" />
        <div className="overflow-x-auto px-5 py-4">
          <table className="min-w-full table-fixed text-left text-sm text-slate-600">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3 text-xs font-medium">时间</th>
                <th className="pb-3 text-xs font-medium">类型</th>
                <th className="pb-3 text-xs font-medium">文件夹摘要</th>
                <th className="pb-3 text-xs font-medium">状态</th>
                <th className="pb-3 text-xs font-medium">新增</th>
                <th className="pb-3 text-xs font-medium">重复</th>
                <th className="pb-3 text-xs font-medium">失败</th>
                <th className="pb-3 text-xs font-medium">错误摘要</th>
              </tr>
            </thead>
            <tbody>
              {data.recentScanLogs.length > 0 ? (
                data.recentScanLogs.map((log) => (
                  <tr key={log.id} className="border-t border-[#F0F3F8]">
                    <td className="py-4">{log.formattedStartedAt}</td>
                    <td className="py-4">{log.scanType}</td>
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
                  <td colSpan={8} className="py-8 text-center text-slate-400">
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

function AiDraftPanel({ suggestion }: { suggestion: InspirationAISuggestion | null }) {
  if (!suggestion) {
    return <PageNote>这里会显示 AI 识图草稿，但不会自动写入正式商品字段。</PageNote>;
  }

  const rows = [
    ["可能商品类型", suggestion.possibleProductType || suggestion.possibleCategory || "--"],
    ["颜色", suggestion.colors.join("；") || "--"],
    ["材质", suggestion.materials.join("；") || "--"],
    ["风格", suggestion.styleKeywords.join("；") || "--"],
    ["适合平台", suggestion.suitablePlatforms.join("；") || "--"],
    ["卖点建议", suggestion.sellingPoints.join("；") || "--"],
    ["风险提示", suggestion.riskNotes.join("；") || "--"],
    ["文案方向", suggestion.copywritingDirections.join("；") || "--"],
    ["不确定项", suggestion.uncertaintyNotes.join("；") || "--"],
  ];

  return (
    <div className="rounded-2xl border border-[#EEF2F8] bg-white px-4 py-4 text-sm leading-7 text-slate-600">
      <p className="font-medium text-slate-900">{suggestion.draftLabel || "AI 草稿 / 待用户确认"}</p>
      <p className="mt-2">{suggestion.shortDescription}</p>
      <div className="mt-3 grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 md:grid-cols-[92px_1fr]">
            <span className="text-slate-400">{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskTable({
  title,
  empty,
  tasks,
  retryAction,
  retryPending,
  retryFieldName,
}: {
  title: string;
  empty: string;
  tasks: TaskSummary[];
  retryAction: (payload: FormData) => void;
  retryPending: boolean;
  retryFieldName: string;
}) {
  return (
    <DashboardCard>
      <DashboardCardHeader title={title} description="失败任务支持手动重试，不做无限自动重试。" />
      <div className="space-y-3 px-5 py-4">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <form key={task.id} action={retryAction} className="rounded-2xl border border-[#EEF2F8] bg-white px-4 py-4 text-sm text-slate-600">
              <input type="hidden" name={retryFieldName} value={task.id} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={task.status} tone={getTaskTone(task.status)} />
                  <span>#{task.id}</span>
                  <span className="break-all">{task.sourceRelativePath}</span>
                </div>
                <button type="submit" className={secondaryButtonClassName} disabled={retryPending || task.status !== "failed"}>
                  重试
                </button>
              </div>
              <p className="mt-2 text-slate-400">创建 {task.formattedCreatedAt}，更新 {task.formattedUpdatedAt}，重试 {task.retryCount}</p>
              {task.failureReasonSummary ? <p className="mt-2 text-rose-600">{task.failureReasonSummary}</p> : null}
            </form>
          ))
        ) : (
          <PageNote>{empty}</PageNote>
        )}
      </div>
    </DashboardCard>
  );
}

function OperationLogList({ logs }: { logs: InspirationView["operationLogs"] }) {
  return (
    <div className="rounded-[24px] border border-[#EEF2F8] bg-white px-4 py-4">
      <h3 className="text-sm font-semibold text-slate-900">处理记录</h3>
      <div className="mt-3 space-y-3">
        {logs.length > 0 ? (
          logs.map((log) => (
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
  );
}

function ActionMessages({ messages }: { messages: Array<string | undefined> }) {
  const visibleMessages = messages.filter(Boolean);
  if (visibleMessages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {visibleMessages.map((message, index) => (
        <p key={`${message}-${index}`} className="text-sm text-rose-600">
          {message}
        </p>
      ))}
    </div>
  );
}

function StatCard({ label, value, delta, tone }: { label: string; value: string; delta: string; tone: "blue" | "amber" | "green" | "slate" }) {
  return (
    <DashboardCard className="h-full p-5">
      <div className="space-y-2">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-[2.4rem] font-semibold text-slate-900">{value}</p>
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
  badgeTone?: Tone;
}) {
  return (
    <div className="grid gap-1 md:grid-cols-[72px_1fr]">
      <span className="text-slate-400">{label}</span>
      <div className="min-w-0 break-all">
        {badgeTone ? <StatusBadge label={value} tone={badgeTone} /> : <span>{value}</span>}
      </div>
    </div>
  );
}
