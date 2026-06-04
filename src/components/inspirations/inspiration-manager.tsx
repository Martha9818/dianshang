"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ActionButton,
  DashboardCard,
  DashboardCardHeader,
  MiniIcon,
  PageNote,
  StatusBadge,
} from "@/components/dashboard/primitives";
import { ProductImage } from "@/components/products/product-image";
import { AutoFilterForm } from "@/components/ui/auto-filter-form";
import {
  applyInspirationAiSuggestionAction,
  archiveInspirationAction,
  batchInspirationOperationAction,
  convertInspirationToProductAction,
  deleteInspirationAiDraftJobsAction,
  deleteInspirationScanLogsAction,
  deleteInspirationScanJobsAction,
  generateInspirationAiSuggestionAction,
  ignoreInspirationAiDraftAction,
  ignoreInspirationImageReviewLogAction,
  markInspirationImageReviewLogArchiveSuggestedAction,
  markInspirationReviewedAction,
  rejectInspirationAction,
  rebuildInspirationFingerprintAction,
  rebuildInspirationLibraryFingerprintsAction,
  retryInspirationAiDraftJobAction,
  retryInspirationScanJobAction,
  runInspirationScanAction,
  saveInspirationDraftAction,
  saveInspirationFolderAction,
  saveInspirationScanConfigAction,
} from "@/app/inspirations/actions";
import {
  buildInspirationInboxCardSummary,
  buildInspirationInboxPrimaryFields,
  getInspirationInboxAiStatus,
  type InspirationInboxSource,
} from "@/components/inspirations/inspiration-inbox-view";
import { DANGEROUS_CONFIRM_TEXT } from "@/lib/modules/batch/rules";
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

type ImageDedupSummary = {
  status: "missing" | "ready" | "failed";
  fingerprintId: number | null;
  exactDuplicateCount: number;
  similarCount: number;
  riskCount: number;
  warningLabel: string | null;
  latestCheckedAtLabel: string | null;
  matches: Array<{
    reviewLogId: number;
    targetType: "material" | "inspiration" | "risk";
    targetId: number | null;
    title: string;
    href: string | null;
    similarityLabel: string;
    matchTypeLabel: string;
    relationScopeLabel: string;
    riskLevel: "info" | "warning";
    message: string;
    ignored: boolean;
    archiveSuggested: boolean;
    userStatus: string;
    createdAtLabel: string;
  }>;
};

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
  imageDedup: ImageDedupSummary | null;
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
  rawResponseSummary?: string | null;
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

type InboxField = { label: string; value: string; isPlaceholder?: boolean };
type BatchActionState = {
  ok?: boolean;
  message?: string;
};

const inputClassName =
  "h-12 w-full rounded-[20px] border border-[#D8E0EB] bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#6B8ECF] focus:ring-4 focus:ring-[#E6EEF9] disabled:bg-[#F6F7F8] disabled:text-slate-400";
const textareaClassName =
  "min-h-[108px] w-full resize-y rounded-[20px] border border-[#D8E0EB] bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-[#6B8ECF] focus:ring-4 focus:ring-[#E6EEF9] disabled:bg-[#F6F7F8] disabled:text-slate-400";
const primaryButtonClassName =
  "inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#365B8C,#213B61)] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(33,59,97,0.18)] disabled:opacity-60";
const secondaryButtonClassName =
  "inline-flex h-12 items-center justify-center rounded-[18px] border border-[#D5DEE8] bg-white px-5 text-sm font-medium text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.04)] disabled:opacity-60";
const dangerButtonClassName =
  "inline-flex h-12 items-center justify-center rounded-[18px] border border-rose-200 bg-[#FFF8F7] px-5 text-sm font-medium text-rose-600 disabled:opacity-60";

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

function getInboxFieldValue(fields: InboxField[], label: string, fallback = "待补充") {
  return fields.find((field) => field.label === label)?.value ?? fallback;
}

function buildInsightGroups(fields: InboxField[]) {
  const groups = [
    {
      title: "候选判断",
      description: "先确认这条灵感值不值得继续做成商品方向。",
      labels: ["AI 草稿状态", "候选商品名", "候选价格", "商品类型", "类目建议"],
    },
    {
      title: "人群与卖点",
      description: "把目标人群、场景和卖点先看透，再决定是否跟进。",
      labels: ["目标人群", "用户痛点", "使用场景", "核心卖点"],
    },
    {
      title: "表达与渠道",
      description: "用于判断内容方向、平台适配和后续包装空间。",
      labels: ["建议平台", "标签", "可见文字摘要", "规格线索"],
    },
    {
      title: "风险与下一步",
      description: "把风险、内容表现力和下一步建议收在一起看。",
      labels: ["风险提示", "内容表现力", "短视频适配", "对比展示能力", "下一步建议"],
    },
    {
      title: "识别质量与初筛",
      description: "这些字段只在已有事实基础上展示，不会生成额外结论。",
      labels: ["识别质量", "草稿初筛分", "初筛结论"],
    },
  ];

  return groups
    .map((group) => ({
      ...group,
      fields: group.labels
        .map((label) => fields.find((field) => field.label === label))
        .filter((field): field is InboxField => Boolean(field)),
    }))
    .filter((group) => group.fields.length > 0);
}

function getTaskTone(status: string): Tone {
  if (status === "success") return "green";
  if (status === "failed") return "red";
  if (status === "processing") return "blue";
  if (status === "skipped") return "slate";
  return "amber";
}

function looksLikeRawAiResponse(summary: string) {
  const normalized = summary.trim();
  return (
    normalized.startsWith("{") ||
    normalized.startsWith("[") ||
    normalized.includes("\"error\"") ||
    normalized.includes("\"message\"") ||
    normalized.includes("invalid_request_error") ||
    normalized.includes("Request id:")
  );
}

function getAiTaskSummary(
  failureReasonSummary: string | null,
  rawResponseSummary: string | null | undefined,
  fallback: string | null = null,
) {
  if (failureReasonSummary) {
    return looksLikeRawAiResponse(failureReasonSummary) ? "AI 原始响应已隐藏，仅保留任务状态。" : failureReasonSummary;
  }

  if (rawResponseSummary) {
    return "AI 原始响应已隐藏，仅保留任务状态。";
  }

  return fallback;
}

export function InspirationManager({ data, readonlyNotice }: { data: InspirationsPageData; readonlyNotice: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSelectedId = Number(searchParams.get("selectedId") ?? "");
  const [selectedId, setSelectedId] = useState<number | null>(
    Number.isInteger(initialSelectedId) && initialSelectedId > 0 ? initialSelectedId : data.inspirations[0]?.id ?? null,
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [scanLogExpanded, setScanLogExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedBatchAction, setSelectedBatchAction] = useState(inspirationBatchOperations[0]?.value ?? "");
  const [batchConfirmText, setBatchConfirmText] = useState("");

  const [batchState, batchAction, batchPending] = useActionState<BatchActionState, FormData>(batchInspirationOperationAction, { ok: false, message: "" });
  const [folderState, folderAction, folderPending] = useActionState(saveInspirationFolderAction, { success: false, error: "" });
  const [scanConfigState, scanConfigAction, scanConfigPending] = useActionState(saveInspirationScanConfigAction, { success: false, error: "" });
  const [scanState, scanAction, scanPending] = useActionState(runInspirationScanAction, { success: false, error: "" });
  const [dedupLibraryState, dedupLibraryAction, dedupLibraryPending] = useActionState(rebuildInspirationLibraryFingerprintsAction, { success: false, error: "" });
  const [dedupState, dedupAction, dedupPending] = useActionState(rebuildInspirationFingerprintAction, { success: false, error: "" });
  const [dedupIgnoreState, dedupIgnoreAction, dedupIgnorePending] = useActionState(ignoreInspirationImageReviewLogAction, { success: false, error: "" });
  const [dedupArchiveState, dedupArchiveAction, dedupArchivePending] = useActionState(markInspirationImageReviewLogArchiveSuggestedAction, { success: false, error: "" });
  const [draftState, draftAction, draftPending] = useActionState(saveInspirationDraftAction, { success: false, error: "" });
  const [aiState, aiAction, aiPending] = useActionState(generateInspirationAiSuggestionAction, { success: false, error: "" });
  const [applyState, applyAction, applyPending] = useActionState(applyInspirationAiSuggestionAction, { success: false, error: "" });
  const [ignoreDraftState, ignoreDraftAction, ignoreDraftPending] = useActionState(ignoreInspirationAiDraftAction, { success: false, error: "" });
  const [retryAiState, retryAiAction, retryAiPending] = useActionState(retryInspirationAiDraftJobAction, { success: false, error: "" });
  const [, retryScanAction, retryScanPending] = useActionState(retryInspirationScanJobAction, { success: false, error: "" });
  const [deleteScanJobsState, deleteScanJobsAction, deleteScanJobsPending] = useActionState(deleteInspirationScanJobsAction, { success: false, error: "" });
  const [deleteAiDraftJobsState, deleteAiDraftJobsAction, deleteAiDraftJobsPending] = useActionState(deleteInspirationAiDraftJobsAction, { success: false, error: "" });
  const [deleteScanLogsState, deleteScanLogsAction, deleteScanLogsPending] = useActionState(deleteInspirationScanLogsAction, { success: false, error: "" });
  const [reviewState, reviewAction, reviewPending] = useActionState(markInspirationReviewedAction, { success: false, error: "" });
  const [archiveState, archiveAction, archivePending] = useActionState(archiveInspirationAction, { success: false, error: "" });
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectInspirationAction, { success: false, error: "" });
  const [convertState, convertAction, convertPending] = useActionState(convertInspirationToProductAction, { success: false, error: "" });

  const visibleInspirations = useMemo(() => {
    if (statusFilter === "all") {
      return data.inspirations;
    }

    return data.inspirations.filter((item) => item.status === statusFilter);
  }, [data.inspirations, statusFilter]);
  const visibleInspirationIds = useMemo(() => visibleInspirations.map((item) => item.id), [visibleInspirations]);
  const effectiveSelectedIds = useMemo(() => selectedIds.filter((id) => visibleInspirationIds.includes(id)), [selectedIds, visibleInspirationIds]);
  const selectedCount = effectiveSelectedIds.length;
  const selectedOperation = inspirationBatchOperations.find((operation) => operation.value === selectedBatchAction) ?? inspirationBatchOperations[0];
  const allVisibleSelected = visibleInspirationIds.length > 0 && visibleInspirationIds.every((id) => effectiveSelectedIds.includes(id));

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
  const selectedInboxSummary = selectedInspiration ? buildInspirationInboxCardSummary(selectedInspiration) : null;
  const selectedInboxFields = selectedInspiration ? buildInspirationInboxPrimaryFields(selectedInspiration) : [];
  const selectedAiStatus = selectedInspiration ? getInspirationInboxAiStatus(selectedInspiration) : null;
  const selectedCandidatePrice = getInboxFieldValue(selectedInboxFields, "候选价格");
  const selectedPlatform = getInboxFieldValue(selectedInboxFields, "建议平台", "信息不足");
  const selectedCategory = getInboxFieldValue(selectedInboxFields, "类目建议");
  const selectedNextStep = getInboxFieldValue(selectedInboxFields, "下一步建议", "先生成 AI 草稿，再决定保留、放弃或转商品。");
  const visibleScanLogs = scanLogExpanded ? data.recentScanLogs : data.recentScanLogs.slice(0, 4);
  const recentScanLogIds = useMemo(() => data.recentScanLogs.map((log) => log.id), [data.recentScanLogs]);

  useEffect(() => {
    if (convertState.success && convertState.data?.id) {
      router.push(`/products/${convertState.data.id}`);
    }
  }, [convertState.data, convertState.success, router]);

  function toggleSelection(id: number, checked: boolean) {
    setSelectedIds((current) => (checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id)));
  }

  function selectAllVisible() {
    setSelectedIds(visibleInspirationIds);
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function updateListQuery(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    if (effectiveSelectedId) {
      params.set("selectedId", String(effectiveSelectedId));
    }

    router.push(`/inspirations?${params.toString()}`);
  }

  const formKey = selectedInspiration ? `${selectedInspiration.id}-${selectedInspiration.formattedUpdatedAt}` : "empty";

  return (
    <div className="space-y-5">
      {readonlyNotice ? <PageNote>{readonlyNotice}</PageNote> : null}

      <section className="rounded-[28px] border border-[#E6DDD1] bg-[linear-gradient(180deg,#FDFBF7_0%,#FAF7F1_100%)] px-5 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-[720px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A8CA7]">Desk Snapshot</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              第一屏只保留队列状态和审核进度，让左侧候选、中栏图片、右侧 AI 草稿自然成为主流程。
            </p>
          </div>
          <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-2 xl:min-w-[360px]">
            <div className="rounded-[20px] border border-white/70 bg-white/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">队列状态</p>
              <p className="mt-1 font-medium text-slate-700">
                当前 {visibleInspirations.length} 条可见，待处理 {data.stats.pending} 条
              </p>
            </div>
            <div className="rounded-[20px] border border-white/70 bg-white/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">当前任务</p>
              <p className="mt-1 font-medium text-slate-700">
                {selectedInspiration ? `正在审核 #${selectedInspiration.id}` : "先从左侧选择一条灵感"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 xl:grid-cols-5">
          <StatCard label="灵感总数" value={String(data.stats.total)} delta="队列规模" tone="blue" />
          <StatCard label="待处理" value={String(data.stats.pending)} delta="优先初筛" tone="amber" />
          <StatCard label="已查看" value={String(data.stats.reviewed)} delta="待继续判断" tone="violet" />
          <StatCard label="已转商品" value={String(data.stats.converted)} delta="人工确认后创建" tone="green" />
          <StatCard label="已放弃 / 归档" value={`${data.stats.rejected} / ${data.stats.archived}`} delta="默认下沉" tone="sky" />
        </div>
      </section>

      <DashboardCard className="border-[#E6DED4] bg-[#F8F5EF] px-4 py-4 shadow-none">
        <AutoFilterForm action="/inspirations" className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1.2fr)_160px_160px_160px_150px] xl:items-end">
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
        </AutoFilterForm>
      </DashboardCard>

      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)_430px] xl:items-start">
        <DashboardCard className="overflow-hidden border-[#E4DDD4] bg-[#FFFEFC] shadow-[0_18px_40px_rgba(15,23,42,0.04)] xl:sticky xl:top-6 xl:flex xl:h-[calc(100vh-10.5rem)] xl:flex-col">
          <form
            id={INSPIRATION_BATCH_FORM_ID}
            action={batchAction}
            className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col"
            onSubmit={(event) => {
              if (selectedCount === 0) {
                event.preventDefault();
                window.alert("请先选择要批量处理的灵感。");
                return;
              }

              if (selectedOperation?.dangerous && batchConfirmText.trim() !== DANGEROUS_CONFIRM_TEXT) {
                event.preventDefault();
                window.alert(`危险操作前，请先输入“${DANGEROUS_CONFIRM_TEXT}”确认。`);
              }
            }}
          >
            {effectiveSelectedIds.map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <input type="hidden" name="action" value={selectedBatchAction} />
            <div className="border-b border-[#EEF2F8] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Queue</p>
                  <h2 className="mt-2 text-[1.08rem] font-semibold tracking-[-0.02em] text-slate-900">
                    待处理候选 ({visibleInspirations.length})
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">先从这里快速挑图，再进入中栏主舞台和右栏初筛。</p>
                </div>
                <div className="w-[138px] shrink-0">
                  <select
                    value={data.filters.sort}
                    onChange={(event) => updateListQuery("sort", event.target.value)}
                    className="h-10 w-full rounded-[14px] border border-[#D8E0EB] bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6B8ECF] focus:ring-4 focus:ring-[#E6EEF9]"
                  >
                    <option value="createdAt_desc">最新优先</option>
                    <option value="createdAt_asc">最早优先</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
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
                      "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition",
                      statusFilter === value
                        ? "border-[#90A8C6] bg-[#EEF3FA] text-[#294A72]"
                        : "border-[#E2E7EE] bg-white text-slate-500 hover:border-[#CBD6E3] hover:text-slate-700",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 px-4 py-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
              {visibleInspirations.length > 0 ? (
                visibleInspirations.map((item) => {
                  const summary = buildInspirationInboxCardSummary(item);
                  const aiStatus = getInspirationInboxAiStatus(item);
                  const itemFields = buildInspirationInboxPrimaryFields(item);
                  const priceField = getInboxFieldValue(itemFields, "候选价格");
                  const nextStepField = getInboxFieldValue(itemFields, "下一步建议", "待补充");

                  return (
                    <article
                      key={item.id}
                      className={[
                        "rounded-[24px] border p-3 transition",
                        selectedInspiration?.id === item.id
                          ? "border-[#9DB3CC] bg-[linear-gradient(180deg,#F7FAFD_0%,#F3F7FB_100%)] shadow-[0_18px_34px_rgba(41,74,114,0.08)]"
                          : "border-[#ECE7DE] bg-white hover:border-[#D6E0EA] hover:shadow-[0_14px_30px_rgba(15,23,42,0.05)]",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={effectiveSelectedIds.includes(item.id)}
                          onChange={(event) => toggleSelection(item.id, event.target.checked)}
                          aria-label={`选择 ${item.title ?? item.fileName}`}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <button type="button" onClick={() => setSelectedId(item.id)} className="min-w-0 flex-1 text-left">
                          <div className="grid gap-3 sm:grid-cols-[88px_minmax(0,1fr)]">
                            <div className="overflow-hidden rounded-[18px] border border-[#ECE7DE] bg-[#F7F8FA]">
                              <ProductImage src={item.displayPath} alt={item.imagePath} label="IMG" square missing={!item.fileExists} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge label={aiStatus.label} tone={aiStatus.tone} />
                                <StatusBadge label={item.statusLabel} tone={item.statusTone} />
                              </div>
                              <h3 className="mt-3 line-clamp-2 text-[1rem] font-semibold tracking-[-0.02em] text-slate-900">
                                {summary.title}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{summary.subtitle}</p>
                              <div className="mt-3 grid gap-2 text-[12px] text-slate-600">
                                <div className="grid grid-cols-[72px_1fr] gap-2">
                                  <span className="text-slate-400">候选价格</span>
                                  <span className="line-clamp-1">{priceField}</span>
                                </div>
                                <div className="grid grid-cols-[72px_1fr] gap-2">
                                  <span className="text-slate-400">商品类型</span>
                                  <span className="line-clamp-1">{summary.productType}</span>
                                </div>
                                <div className="grid grid-cols-[72px_1fr] gap-2">
                                  <span className="text-slate-400">下一步</span>
                                  <span className="line-clamp-2">{nextStepField}</span>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                                <span>{item.sourceTypeLabel}</span>
                                <span>·</span>
                                <span>{item.formattedImportedAt}</span>
                                {item.imageDedup?.warningLabel ? (
                                  <>
                                    <span>·</span>
                                    <span className="text-amber-600">{item.imageDedup.warningLabel}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <PageNote>当前筛选条件下还没有可处理的灵感。可以先扫描图片，或调整筛选后继续处理。</PageNote>
              )}
            </div>

            <div className="border-t border-[#EEF2F8] bg-[#FCFBF8] px-4 py-4">
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Batch Desk</p>
                    <p className="mt-1 text-sm text-slate-600">
                      已选择 <span className="font-semibold text-slate-900">{selectedCount}</span> 条，批量操作只做状态整理。
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={selectAllVisible} className={secondaryButtonClassName} disabled={visibleInspirationIds.length === 0 || allVisibleSelected}>
                      全选
                    </button>
                    <button type="button" onClick={clearSelection} className={secondaryButtonClassName} disabled={selectedCount === 0}>
                      清空
                    </button>
                  </div>
                </div>
                <select
                  value={selectedBatchAction}
                  onChange={(event) => {
                    const nextAction = event.target.value;
                    const nextOperation = inspirationBatchOperations.find((operation) => operation.value === nextAction);
                    setSelectedBatchAction(nextAction);
                    if (!nextOperation?.dangerous) {
                      setBatchConfirmText("");
                    }
                  }}
                  className={inputClassName}
                  disabled={batchPending || !data.runtime.isWritable}
                >
                  {inspirationBatchOperations.map((operation) => (
                    <option key={operation.value} value={operation.value}>
                      {operation.label}
                    </option>
                  ))}
                </select>
                {selectedOperation?.dangerous ? (
                  <input
                    value={batchConfirmText}
                    onChange={(event) => setBatchConfirmText(event.target.value)}
                    placeholder={DANGEROUS_CONFIRM_TEXT}
                    className={inputClassName}
                    disabled={batchPending || !data.runtime.isWritable}
                  />
                ) : null}
                <button type="submit" className={primaryButtonClassName} disabled={batchPending || selectedCount === 0 || !data.runtime.isWritable}>
                  {batchPending ? "执行中..." : "执行批量操作"}
                </button>
                <p className="text-xs leading-5 text-slate-500">{selectedOperation?.impact ?? "只修改已选灵感状态，不会自动创建正式商品。"}</p>
                {batchState.message ? (
                  <p className={batchState.ok ? "text-sm text-emerald-600" : "text-sm text-rose-600"}>{batchState.message}</p>
                ) : null}
              </div>
            </div>
          </form>
        </DashboardCard>

        <DashboardCard className="overflow-hidden border-[#E4DDD4] bg-[#FFFEFC] shadow-[0_18px_40px_rgba(15,23,42,0.05)] xl:sticky xl:top-6 xl:flex xl:h-[calc(100vh-10.5rem)] xl:flex-col">
          {selectedInspiration ? (
            <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EEF2F8] py-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Stage</p>
                  <h2 className="mt-2 line-clamp-2 text-[1.38rem] font-semibold tracking-[-0.03em] text-slate-900">
                    {selectedInboxSummary?.title ?? selectedInspiration.title ?? "待补充标题"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {selectedInboxSummary?.subtitle ?? "先通过图片和已有线索做快速理解，右侧再看完整 AI 初筛草稿。"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedAiStatus ? <StatusBadge label={selectedAiStatus.label} tone={selectedAiStatus.tone} /> : null}
                  <StatusBadge label={selectedInspiration.statusLabel} tone={selectedInspiration.statusTone} />
                  <StatusBadge label={selectedInspiration.usagePermissionLabel} tone={selectedInspiration.usagePermissionTone} />
                  {selectedInspiration.convertedProduct ? <StatusBadge label={`已转商品 #${selectedInspiration.convertedProduct.id}`} tone="green" /> : null}
                </div>
              </div>

              <div className="mt-4 flex min-h-0 flex-1 flex-col">
                <div className="flex-1 rounded-[34px] border border-[#E6DDD1] bg-[radial-gradient(circle_at_top,#F7F0E4_0%,#F5F7FB_44%,#FBFAF7_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <div className="flex h-full min-h-[340px] items-center justify-center overflow-hidden rounded-[28px] border border-white/70 bg-white/70">
                    <ProductImage src={selectedInspiration.displayPath} alt={selectedInspiration.imagePath} label="IMG" large missing={!selectedInspiration.fileExists} />
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-3 rounded-[18px] border border-[#E6EAF0] bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
                      <div className="h-10 w-10 overflow-hidden rounded-[12px] border border-[#E8E2D8] bg-[#F4F6F8]">
                        <ProductImage src={selectedInspiration.displayPath} alt={selectedInspiration.imagePath} label="1" square missing={!selectedInspiration.fileExists} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-medium text-slate-700">当前主图</p>
                        <p className="text-[11px] text-slate-400">{selectedInspiration.fileName}</p>
                      </div>
                    </div>
                    <div className="inline-flex items-center rounded-[18px] border border-[#E6EAF0] bg-white px-3 py-2 text-xs text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
                      {selectedInspiration.sourceTypeLabel} · {selectedInspiration.formattedImportedAt}
                    </div>
                    {selectedInspiration.imageDedup?.warningLabel ? (
                      <div className="inline-flex items-center rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        {selectedInspiration.imageDedup.warningLabel}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(260px,0.85fr)]">
                    <div className="rounded-[28px] border border-[#ECE4D8] bg-[#FBF7F1] px-4 py-4">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">AI 草稿速览</p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{selectedInboxSummary?.subtitle ?? "尚未生成 AI 草稿。"}</p>
                      <p className="mt-4 text-xs leading-6 text-slate-500">{selectedAiStatus?.description ?? "先生成 AI 草稿，再决定保留、放弃或转商品。"}</p>
                    </div>

                    <div className="rounded-[28px] border border-[#E8ECEF] bg-white px-4 py-4">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">买手速看</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <MiniFact label="候选价格" value={selectedCandidatePrice} />
                        <MiniFact label="商品类型" value={selectedInboxSummary?.productType ?? "信息不足"} />
                        <MiniFact label="建议平台" value={selectedPlatform} />
                        <MiniFact label="类目建议" value={selectedCategory} />
                        <MiniFact label="目标人群" value={selectedInboxSummary?.targetAudience ?? "信息不足"} />
                        <MiniFact label="下一步" value={selectedNextStep} />
                      </div>
                    </div>
                  </div>

                  <form action={draftAction} key={formKey} className="rounded-[28px] border border-[#E6EAF0] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.03)]">
                    <input type="hidden" name="inspirationId" value={selectedInspiration.id} />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Notes</p>
                        <h3 className="mt-2 text-sm font-semibold text-slate-900">人工备注与草稿标题</h3>
                      </div>
                      <ActionButton type="submit" variant="secondary" disabled={!data.runtime.isWritable}>
                        {draftPending ? "保存中..." : "保存备注"}
                      </ActionButton>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <Field label="草稿标题">
                        <input name="title" className={inputClassName} defaultValue={selectedInspiration.title ?? ""} disabled={!data.runtime.isWritable} />
                      </Field>
                      <Field label="人工备注">
                        <textarea name="note" className="min-h-[138px] w-full rounded-[22px] border border-[#D8DEE8] bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-[#89A7C9] focus:ring-2 focus:ring-[#D7E4F4]" defaultValue={selectedInspiration.note ?? ""} disabled={!data.runtime.isWritable} />
                      </Field>
                      <ActionMessages messages={[draftState.error]} />
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-5 py-5">
              <PageNote>还没有灵感草稿。先把图片放进灵感箱，或用补充截图识别导入后再回这里查看。</PageNote>
            </div>
          )}
        </DashboardCard>

        <div id="inspiration-convert-panel" className="xl:sticky xl:top-6 xl:h-[calc(100vh-10.5rem)] xl:overflow-hidden">
          <div className="space-y-4 xl:h-full xl:overflow-y-auto xl:pr-1">
            {selectedInspiration ? (
              <>
                <AiDraftPanel source={selectedInspiration} fields={selectedInboxFields} aiStatus={selectedAiStatus} />

                <form className="space-y-4 rounded-[30px] border border-[#E4DDD4] bg-[#FFFDFC] px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Decision Desk</p>
                      <h3 className="mt-2 text-[1.12rem] font-semibold tracking-[-0.02em] text-slate-900">保留 / 放弃 / 转商品</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">右栏只承载决策，避免再把首屏拉回后台表单状态。</p>
                    </div>
                    <a href="#convert-form-panel" className={secondaryButtonClassName}>
                      查看转商品表单
                    </a>
                  </div>

                  <div className="grid gap-3">
                    <div className="grid gap-3">
                      <button formAction={reviewAction} type="submit" className={primaryButtonClassName} disabled={reviewPending || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}>
                        {reviewPending ? "处理中..." : "保留并继续跟进"}
                      </button>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button formAction={archiveAction} type="submit" className={secondaryButtonClassName} disabled={archivePending || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}>
                          归档
                        </button>
                        <a href="#convert-form-panel" className={secondaryButtonClassName}>
                          转商品
                        </a>
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-[24px] border border-[#F1E4E1] bg-[#FFFBFA] p-4">
                      <Field label="放弃原因">
                        <input name="rejectedReason" className={inputClassName} placeholder="简短记录为什么不继续处理" disabled={!data.runtime.isWritable || selectedIsConverted || selectedIsClosed} />
                      </Field>
                      <button formAction={rejectAction} type="submit" className={dangerButtonClassName} disabled={rejectPending || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}>
                        放弃
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[24px] border border-[#ECE8E1] bg-[#FBFAF7] p-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">辅助处理</p>
                      <p className="mt-2 text-sm text-slate-500">补信息、补识别、重新生成时再用，不抢主决策层级。</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        formAction={aiAction}
                        type="submit"
                        className={secondaryButtonClassName}
                        disabled={aiPending || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}
                      >
                        <MiniIcon name="spark" className="h-4 w-4" />
                        {aiPending ? "识图中..." : "AI 识图草稿"}
                      </button>
                      <Link href={`/screenshots?sourceType=inspiration&sourceId=${selectedInspiration.id}`} className={secondaryButtonClassName}>
                        补充截图识别
                      </Link>
                      <Link href="/link-imports?purpose=inspiration" className={secondaryButtonClassName}>
                        补录来源链接
                      </Link>
                      <button
                        formAction={applyAction}
                        type="submit"
                        className={secondaryButtonClassName}
                        disabled={applyPending || !selectedInspiration.aiSuggestion || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}
                      >
                        应用到灵感备注
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
                    </div>
                  </div>

                  <ActionMessages
                    messages={[
                      aiState.error,
                      applyState.error,
                      ignoreDraftState.error,
                      retryAiState.error,
                      reviewState.error,
                      archiveState.error,
                      rejectState.error,
                    ]}
                  />
                </form>
              </>
            ) : (
              <DashboardCard className="border-[#E8E2D8] bg-[#FFFDFC] px-5 py-5">
                <PageNote>先从左侧收件箱队列选择一条灵感，再查看 AI 洞察与操作区。</PageNote>
              </DashboardCard>
            )}

            <div id="convert-form-panel">
              <DashboardCard className="overflow-hidden border-[#E4DDD4] bg-[#FFFEFC]">
                <DashboardCardHeader title="转商品入口" description="这里继续保留完整表单，但退到决策区下方，不打断首屏审核节奏。" />
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
                    <details className="rounded-[22px] border border-[#ECE8E1] bg-[#FBFAF7]" open>
                      <summary className="cursor-pointer list-none px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">商品确认表单</p>
                            <p className="mt-1 text-sm text-slate-500">保留 AI 预填，但仍需人工确认后提交。</p>
                          </div>
                          <span className="text-xs font-medium text-[#365B8C]">可展开 / 收起</span>
                        </div>
                      </summary>
                      <div className="space-y-3 border-t border-[#E8ECF3] px-4 py-4">
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
                      </div>
                    </details>
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
            </div>

            <DashboardCard className="overflow-hidden border-[#E4DDD4] bg-[#FFFEFC]">
              <DashboardCardHeader
                title="高级记录 / 调试信息"
                description="把文件信息、AI 任务和扫描历史收进右侧尾部，不干扰主舞台和决策卡。"
              />
              <div className="space-y-4 px-5 py-5">
                <CollapsibleSection
                  title="高级记录：文件信息与相似度"
                  description="文件信息、相似度和调试提示都保留，但默认折叠，不压住主流程。"
                >
                  <div className="space-y-4">
                    <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                      <DetailRow label="文件名" value={selectedInspiration?.fileName ?? "--"} />
                      <DetailRow label="来源" value={selectedInspiration?.sourceTypeLabel ?? "--"} />
                      <DetailRow label="权限" value={selectedInspiration?.usagePermissionLabel ?? "--"} badgeTone={selectedInspiration?.usagePermissionTone} />
                      <DetailRow label="状态" value={selectedInspiration?.statusLabel ?? "--"} badgeTone={selectedInspiration?.statusTone} />
                      <DetailRow label="hash" value={selectedInspiration?.fileHashShort ?? "--"} />
                      <DetailRow label="导入" value={selectedInspiration?.formattedImportedAt ?? "--"} />
                      <DetailRow label="更新" value={selectedInspiration?.formattedUpdatedAt ?? "--"} />
                      <DetailRow label="查看" value={selectedInspiration?.formattedReviewedAt ?? "--"} />
                      <DetailRow label="归档" value={selectedInspiration?.formattedArchivedAt ?? "--"} />
                      <DetailRow label="放弃" value={selectedInspiration?.rejectedReason ?? "--"} />
                      <DetailRow label="AIJob" value={selectedInspiration?.aiJobSummary ? `#${selectedInspiration.aiJobSummary.id} · ${selectedInspiration.aiJobSummary.status}` : "--"} />
                      <DetailRow label="转商品" value={selectedInspiration?.convertedProduct ? `${selectedInspiration.convertedProduct.name} (#${selectedInspiration.convertedProduct.id})` : "--"} />
                      <DetailRow
                        label="去重"
                        value={selectedInspiration?.imageDedup?.warningLabel ?? selectedInspiration?.imageDedup?.status ?? "未检测"}
                        badgeTone={selectedInspiration?.imageDedup?.warningLabel ? "amber" : "slate"}
                      />
                    </div>
                    {selectedInspiration ? (
                      <>
                        <form action={dedupAction} className="flex flex-wrap gap-2">
                          <input type="hidden" name="inspirationId" value={selectedInspiration.id} />
                          <button type="submit" className={secondaryButtonClassName} disabled={dedupPending || !data.runtime.isWritable}>
                            {dedupPending ? "检测中..." : "检测此灵感图片"}
                          </button>
                          <Link href="/maintenance/files" className={secondaryButtonClassName}>
                            去文件清理与回收站
                          </Link>
                        </form>
                        {dedupState.error ? <p className="text-sm text-rose-600">{dedupState.error}</p> : null}
                        {dedupIgnoreState.error ? <p className="text-sm text-rose-600">{dedupIgnoreState.error}</p> : null}
                        {dedupArchiveState.error ? <p className="text-sm text-rose-600">{dedupArchiveState.error}</p> : null}
                        <ImageDedupPanel
                          summary={selectedInspiration.imageDedup}
                          ignoreAction={dedupIgnoreAction}
                          archiveSuggestAction={dedupArchiveAction}
                          actionPending={dedupIgnorePending || dedupArchivePending || !data.runtime.isWritable}
                        />
                      </>
                    ) : (
                      <PageNote>先选择一条灵感记录，再查看文件信息和相似度提示。</PageNote>
                    )}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="高级记录：AI 任务与处理记录"
                  description="保留最近的 AI 草稿任务和人工处理记录，方便排查，但不干扰主流程。"
                >
                  {selectedInspiration ? (
                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-[#EEF2F8] bg-white px-4 py-4">
                        <h3 className="text-sm font-semibold text-slate-900">AI 草稿记录</h3>
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
                                <p className="mt-1 text-slate-500">
                                  {getAiTaskSummary(job.failureReasonSummary, job.rawResponseSummary, "无摘要")}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400">暂无 AI 草稿记录。</p>
                          )}
                        </div>
                      </div>
                      <OperationLogList logs={selectedInspiration.operationLogs} />
                    </div>
                  ) : (
                    <PageNote>先选择一条灵感记录，再查看 AI 任务和处理记录。</PageNote>
                  )}
                </CollapsibleSection>

                <CollapsibleSection
                  title="高级记录：扫描与任务历史"
                  description="ScanLog、任务历史和批量删除能力都保留，但默认折叠，不干扰日常审核草稿。"
                >
                  <div className="space-y-4">
                    <section className="grid gap-4 xl:grid-cols-2">
                      <TaskTable
                        title="最近扫描任务"
                        empty="暂无扫描任务。"
                        tasks={data.recentTasks.scanJobs}
                        retryAction={retryScanAction}
                        retryPending={retryScanPending}
                        retryFieldName="scanJobId"
                        deleteAction={deleteScanJobsAction}
                        deletePending={deleteScanJobsPending}
                        deleteFieldName="scanJobIds"
                        actionMessage={deleteScanJobsState.message}
                        actionError={deleteScanJobsState.error}
                        disabled={!data.runtime.isWritable}
                      />
                      <TaskTable
                        title="最近 AI 草稿任务"
                        empty="暂无 AI 草稿任务。"
                        tasks={data.recentTasks.aiDraftJobs}
                        retryAction={retryAiAction}
                        retryPending={retryAiPending}
                        retryFieldName="aiDraftJobId"
                        deleteAction={deleteAiDraftJobsAction}
                        deletePending={deleteAiDraftJobsPending}
                        deleteFieldName="aiDraftJobIds"
                        actionMessage={deleteAiDraftJobsState.message}
                        actionError={deleteAiDraftJobsState.error}
                        redactAiFailureDetails
                        disabled={!data.runtime.isWritable}
                      />
                    </section>

                    <DashboardCard>
                      <DashboardCardHeader
                        title="最近 ScanLog 记录"
                        description="只显示脱敏摘要，不展示完整本地路径。默认先展示最近 4 条，避免扫描历史占满页面。"
                        action={
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {data.recentScanLogs.length > 0 ? (
                              <form action={deleteScanLogsAction}>
                                {recentScanLogIds.map((id) => (
                                  <input key={id} type="hidden" name="scanLogIds" value={id} />
                                ))}
                                <button
                                  type="submit"
                                  disabled={deleteScanLogsPending || !data.runtime.isWritable}
                                  className="inline-flex h-10 items-center rounded-xl border border-rose-200 bg-white px-3 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                                >
                                  全部删除
                                </button>
                              </form>
                            ) : null}
                            {data.recentScanLogs.length > 4 ? (
                              <button
                                type="button"
                                onClick={() => setScanLogExpanded((current) => !current)}
                                className="inline-flex h-10 items-center rounded-xl border border-[#DCE5F2] px-3 text-sm font-medium text-[#2563EB] hover:bg-blue-50"
                              >
                                {scanLogExpanded ? "收起" : `展开全部 ${data.recentScanLogs.length} 条`}
                              </button>
                            ) : null}
                          </div>
                        }
                      />
                      {deleteScanLogsState.message ? <p className="px-5 pt-4 text-sm text-emerald-600">{deleteScanLogsState.message}</p> : null}
                      {deleteScanLogsState.error ? <p className="px-5 pt-4 text-sm text-rose-600">{deleteScanLogsState.error}</p> : null}
                      <div className="space-y-3 px-5 py-4">
                        {visibleScanLogs.length > 0 ? (
                          visibleScanLogs.map((log) => (
                            <article key={log.id} className="rounded-2xl border border-[#EEF2F8] bg-white px-4 py-4 text-sm text-slate-600">
                              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-[150px_110px_120px_1fr]">
                                  <div>
                                    <p className="text-xs text-slate-400">时间</p>
                                    <p className="mt-1 font-medium text-slate-700">{log.formattedStartedAt}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-400">类型</p>
                                    <p className="mt-1 font-medium text-slate-700">{log.scanType}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-400">状态</p>
                                    <div className="mt-1"><StatusBadge label={log.status} tone={log.statusTone} /></div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#F8FBFF] px-3 py-2 text-center">
                                    <div><p className="text-xs text-slate-400">新增</p><p className="font-semibold text-slate-700">{log.newFiles}</p></div>
                                    <div><p className="text-xs text-slate-400">重复</p><p className="font-semibold text-slate-700">{log.skippedDuplicates}</p></div>
                                    <div><p className="text-xs text-slate-400">失败</p><p className="font-semibold text-slate-700">{log.failedFiles}</p></div>
                                  </div>
                                </div>
                                <form action={deleteScanLogsAction} className="shrink-0">
                                  <input type="hidden" name="scanLogIds" value={log.id} />
                                  <button
                                    type="submit"
                                    disabled={deleteScanLogsPending || !data.runtime.isWritable}
                                    className="inline-flex h-9 items-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                                  >
                                    删除
                                  </button>
                                </form>
                              </div>
                              <div className="mt-3 grid gap-3 border-t border-[#F0F3F8] pt-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                                <div>
                                  <p className="text-xs text-slate-400">文件夹摘要</p>
                                  <p className="mt-1 line-clamp-2 break-all text-slate-600">{log.folderSummary}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-400">错误摘要</p>
                                  <p className="mt-1 line-clamp-3 break-words text-rose-600">{log.errorSummary ?? "--"}</p>
                                </div>
                              </div>
                            </article>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-[#D8E3F2] px-4 py-8 text-center text-sm text-slate-400">
                            暂无扫描记录。
                          </div>
                        )}
                      </div>
                    </DashboardCard>
                  </div>
                </CollapsibleSection>
              </div>
            </DashboardCard>
          </div>
        </div>
      </section>

      <CollapsibleSection
        title="扫描与灵感箱设置"
        description="扫描目录、立即扫描、定时配置和相似度巡检都继续保留，但默认折叠为次级维护区。"
      >
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <form action={folderAction} className="space-y-3 rounded-[24px] border border-[#ECE8E1] bg-[#FBFAF7] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">灵感箱目录与扫描</h3>
                  <p className="mt-1 text-sm text-slate-500">需要补充新图片时，再打开这块操作即可。</p>
                </div>
                <StatusBadge label={data.settingView.configured ? "已设置" : "未设置"} tone={data.settingView.configured ? "green" : "amber"} />
              </div>
              <Field label="灵感箱文件夹">
                <input
                  name="folderPath"
                  className={inputClassName}
                  placeholder="输入 Windows 本地灵感文件夹完整路径"
                  defaultValue=""
                  disabled={folderPending || !data.runtime.isWritable}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <button formAction={scanAction} type="submit" className={primaryButtonClassName} disabled={scanPending || !data.runtime.isWritable}>
                  <MiniIcon name="spark" className="h-4 w-4" />
                  {scanPending ? "扫描中..." : "立即扫描"}
                </button>
                <ActionButton type="submit" variant="secondary">
                  {folderPending ? "保存中..." : "保存目录"}
                </ActionButton>
                <button
                  formAction={dedupLibraryAction}
                  type="submit"
                  title="为已有灵感图片生成特征，用于发现重复或相似图片。不会删除文件。"
                  className={secondaryButtonClassName}
                  disabled={dedupLibraryPending || !data.runtime.isWritable}
                >
                  {dedupLibraryPending ? "检查中..." : "检查灵感相似度"}
                </button>
                <Link href="/maintenance/files" className={secondaryButtonClassName}>
                  文件清理与回收站
                </Link>
              </div>
            </form>

            <form action={scanConfigAction} className="grid gap-3 rounded-[24px] border border-[#ECE8E1] bg-white p-4 md:grid-cols-[1fr_180px_auto] md:items-end">
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
                  <option value="5">5 分钟</option>
                  <option value="10">10 分钟</option>
                  <option value="15">15 分钟</option>
                  <option value="30">30 分钟</option>
                  <option value="60">1 小时</option>
                  <option value="120">2 小时</option>
                  <option value="240">4 小时</option>
                  <option value="1440">每天</option>
                </select>
              </Field>
              <button type="submit" className={secondaryButtonClassName} disabled={!data.runtime.isWritable || scanConfigPending}>
                {scanConfigPending ? "保存中..." : "保存定时配置"}
              </button>
            </form>
          </div>

          <div className="rounded-[24px] border border-[#ECE8E1] bg-white px-4 py-4 text-sm text-slate-600">
            <h3 className="text-sm font-semibold text-slate-900">当前扫描概况</h3>
            <div className="mt-3 space-y-2 leading-6">
              <p>当前目录：{data.settingView.displayPath ?? "未设置"}</p>
              <p>
                定时扫描：
                {data.settingView.scanEnabled ? `启用，每 ${data.settingView.scanIntervalMinutes} 分钟` : "停用"}；最后扫描：
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
              {dedupLibraryState.error ? <p className="text-rose-600">{dedupLibraryState.error}</p> : null}
              {scanState.success ? (
                <p className="text-emerald-600">
                  扫描完成：新增 {scanState.data?.newFiles ?? 0}，重复 {scanState.data?.skippedDuplicates ?? 0}，文件失败 {scanState.data?.failedFiles ?? 0}，AI 草稿失败 {scanState.data?.aiDraftFailed ?? 0}
                </p>
              ) : null}
              {dedupLibraryState.success ? (
                <p className="text-emerald-600">
                  {(dedupLibraryState.data?.total ?? 0) === 0
                    ? "当前没有灵感图片可检查。"
                    : `已检查 ${dedupLibraryState.data?.total ?? 0} 张灵感图片，疑似重复 ${dedupLibraryState.data?.exactCount ?? 0}，高度相似 ${dedupLibraryState.data?.similarCount ?? 0}，失败 ${dedupLibraryState.data?.failedCount ?? 0}。`}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function ImageDedupPanel({
  summary,
  ignoreAction,
  archiveSuggestAction,
  actionPending,
}: {
  summary: ImageDedupSummary | null;
  ignoreAction: (payload: FormData) => void;
  archiveSuggestAction: (payload: FormData) => void;
  actionPending: boolean;
}) {
  if (!summary || summary.status === "missing") {
    return <PageNote>尚未生成图片指纹。请手动点击检测；本线程只检测和提示，不删除图片。</PageNote>;
  }

  return (
    <div className="rounded-[24px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">相似图片与原创性风险提示</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            最近检测：{summary.latestCheckedAtLabel ?? "--"}。提示只用于人工整理，不作“侵权”或“可商用”结论。
          </p>
        </div>
        <StatusBadge label={summary.warningLabel ?? "未发现重大风险"} tone={summary.warningLabel ? "amber" : "green"} />
      </div>
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        {summary.matches.length > 0 ? (
          summary.matches.map((match) => (
            <div key={match.reviewLogId} className="rounded-2xl border border-[#EEF2F8] bg-white px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={match.matchTypeLabel} tone={match.riskLevel === "warning" ? "amber" : "blue"} />
                <span>{match.relationScopeLabel}</span>
                <span>相似度 {match.similarityLabel}</span>
                {match.archiveSuggested ? <StatusBadge label="已建议归档" tone="slate" /> : null}
              </div>
              <p className="mt-2 leading-6">{match.message}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {match.href ? (
                  <Link href={match.href} className="text-sm font-medium text-[#2563EB]">
                    {match.title}
                  </Link>
                ) : (
                  <span>{match.title}</span>
                )}
                <form action={ignoreAction}>
                  <input type="hidden" name="reviewLogId" value={match.reviewLogId} />
                  <button type="submit" className="text-sm font-medium text-slate-500 disabled:opacity-50" disabled={actionPending}>
                    忽略
                  </button>
                </form>
                <form action={archiveSuggestAction}>
                  <input type="hidden" name="reviewLogId" value={match.reviewLogId} />
                  <button type="submit" className="text-sm font-medium text-[#2563EB] disabled:opacity-50" disabled={actionPending}>
                    标记建议归档
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <PageNote>未发现完全重复或高度相似图片。来源不明时仍建议人工确认使用权限。</PageNote>
        )}
      </div>
    </div>
  );
}

function AiDraftPanel({
  source,
  fields,
  aiStatus,
}: {
  source: InspirationInboxSource;
  fields: InboxField[];
  aiStatus: { label: string; description: string; tone: Tone } | null;
}) {
  const groups = buildInsightGroups(fields);

  return (
    <DashboardCard className="overflow-hidden border-[#E4DDD4] bg-[#FFFEFC]">
      <div className="border-b border-[#EEF2F8] px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">AI Draft</p>
            <h3 className="mt-2 text-[1.16rem] font-semibold tracking-[-0.02em] text-slate-900">AI 初筛草稿</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              右侧集中看候选结论、卖点、风险和下一步建议；缺失字段只显示占位，不伪造成确定事实。
            </p>
          </div>
          {aiStatus ? <StatusBadge label={aiStatus.label} tone={aiStatus.tone} /> : null}
        </div>
      </div>
      <div className="space-y-4 px-5 py-5">
        {source.aiSuggestion?.shortDescription ? (
          <div className="rounded-[22px] border border-[#ECE4D8] bg-[#FBF7F1] px-4 py-4 text-sm leading-7 text-slate-600">
            {source.aiSuggestion.shortDescription}
          </div>
        ) : (
          <PageNote>{aiStatus?.description ?? "尚未生成 AI 草稿。"}</PageNote>
        )}

        {groups.map((group) => (
          <section key={group.title} className="rounded-[22px] border border-[#ECE8E1] bg-white px-4 py-4">
            <div className="mb-3 border-b border-[#F1F4F8] pb-3">
              <h4 className="text-sm font-semibold text-slate-900">{group.title}</h4>
              <p className="mt-1 text-xs leading-5 text-slate-500">{group.description}</p>
            </div>
            <div className="space-y-2">
              {group.fields.map((field) => (
                <InsightRow key={field.label} label={field.label} value={field.value} isPlaceholder={field.isPlaceholder} />
              ))}
            </div>
          </section>
        ))}

        <p className="text-xs leading-5 text-slate-400">“待补充 / 信息不足 / 尚未生成” 仅表示当前线程不新增事实提取或评分逻辑，不代表确定结论。</p>
      </div>
    </DashboardCard>
  );
}

function TaskTable({
  title,
  empty,
  tasks,
  retryAction,
  retryPending,
  retryFieldName,
  deleteAction,
  deletePending,
  deleteFieldName,
  actionMessage,
  actionError,
  redactAiFailureDetails = false,
  disabled = false,
}: {
  title: string;
  empty: string;
  tasks: TaskSummary[];
  retryAction: (payload: FormData) => void;
  retryPending: boolean;
  retryFieldName: string;
  deleteAction: (payload: FormData) => void;
  deletePending: boolean;
  deleteFieldName: string;
  actionMessage?: string;
  actionError?: string;
  redactAiFailureDetails?: boolean;
  disabled?: boolean;
}) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const effectiveSelectedTaskIds = selectedTaskIds.filter((id) => tasks.some((task) => task.id === id));

  function toggleTask(id: number, checked: boolean) {
    setSelectedTaskIds((current) => (checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id)));
  }

  return (
    <DashboardCard>
      <DashboardCardHeader title={title} description="失败任务支持手动重试；任务历史可手动删除。" />
      <form action={deleteAction} className="flex flex-wrap items-center gap-2 border-b border-[#EEF2F8] px-5 py-3">
        {effectiveSelectedTaskIds.map((id) => (
          <input key={id} type="hidden" name={deleteFieldName} value={id} />
        ))}
        <span className="text-sm text-slate-500">已选择 {effectiveSelectedTaskIds.length} 条</span>
        <button
          type="button"
          onClick={() => setSelectedTaskIds(tasks.map((task) => task.id))}
          className="inline-flex h-9 items-center rounded-xl border border-[#DCE5F2] px-3 text-xs font-medium text-[#2563EB] hover:bg-blue-50 disabled:opacity-50"
          disabled={disabled || deletePending || tasks.length === 0}
        >
          全选
        </button>
        <button
          type="button"
          onClick={() => setSelectedTaskIds([])}
          className="inline-flex h-9 items-center rounded-xl border border-[#DCE5F2] px-3 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          disabled={disabled || deletePending || effectiveSelectedTaskIds.length === 0}
        >
          清空
        </button>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-medium text-rose-600 disabled:opacity-50"
          disabled={disabled || deletePending || effectiveSelectedTaskIds.length === 0}
        >
          批量删除
        </button>
        {actionMessage ? <span className="text-sm text-emerald-600">{actionMessage}</span> : null}
        {actionError ? <span className="text-sm text-rose-600">{actionError}</span> : null}
      </form>
      <div className="space-y-3 px-5 py-4">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const summary = redactAiFailureDetails
              ? getAiTaskSummary(task.failureReasonSummary, task.rawResponseSummary)
              : task.failureReasonSummary;

            return (
              <div key={task.id} className="rounded-2xl border border-[#EEF2F8] bg-white px-4 py-4 text-sm text-slate-600">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={effectiveSelectedTaskIds.includes(task.id)}
                      onChange={(event) => toggleTask(task.id, event.target.checked)}
                      aria-label={`select task ${task.id}`}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                      disabled={disabled}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={task.status} tone={getTaskTone(task.status)} />
                        <span>#{task.id}</span>
                        <span className="line-clamp-1 break-all">{task.sourceRelativePath}</span>
                      </div>
                      <p className="mt-2 text-slate-400">{task.formattedCreatedAt} / {task.formattedUpdatedAt} / retry {task.retryCount}</p>
                      {summary ? <p className="mt-2 line-clamp-2 text-rose-600">{summary}</p> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={retryAction}>
                      <input type="hidden" name={retryFieldName} value={task.id} />
                      <button type="submit" className={secondaryButtonClassName} disabled={disabled || retryPending || task.status !== "failed"}>
                        重试
                      </button>
                    </form>
                    <form action={deleteAction}>
                      <input type="hidden" name={deleteFieldName} value={task.id} />
                      <button type="submit" className="inline-flex h-12 items-center justify-center rounded-[18px] border border-rose-200 bg-white px-4 text-sm font-medium text-rose-600 disabled:opacity-50" disabled={disabled || deletePending}>
                        删除
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })
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

function CollapsibleSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <details className="rounded-[24px] border border-[#ECE8E1] bg-[#FFFEFC]" open={false}>
      <summary className="cursor-pointer list-none px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <span className="text-xs font-medium text-[#365B8C]">默认折叠</span>
        </div>
      </summary>
      <div className="border-t border-[#EEF2F8] px-4 py-4">{children}</div>
    </details>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-slate-400">{label}</span>
      <span className="line-clamp-3 text-slate-700">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "blue" | "amber" | "green" | "violet" | "slate" | "teal" | "sky";
}) {
  const textClassName =
    tone === "green"
      ? "text-emerald-600"
      : tone === "amber"
        ? "text-amber-600"
        : tone === "blue"
          ? "text-blue-600"
          : tone === "violet"
            ? "text-violet-600"
            : tone === "teal"
              ? "text-teal-600"
              : tone === "sky"
                ? "text-sky-600"
                : "text-slate-600";

  return (
    <DashboardCard className="border-white/70 bg-white/72 px-4 py-3 shadow-none">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className={`text-[1.9rem] font-semibold tracking-[-0.05em] ${textClassName}`}>{value}</p>
        <p className="text-xs text-slate-500">{delta}</p>
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
      <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</div>
      {children}
    </label>
  );
}

function InsightRow({
  label,
  value,
  isPlaceholder = false,
}: {
  label: string;
  value: string;
  isPlaceholder?: boolean;
}) {
  return (
    <div className="grid gap-2 rounded-[16px] border border-[#EEF2F8] bg-[#FBFDFF] px-3 py-3 md:grid-cols-[88px_1fr] md:items-start">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={isPlaceholder ? "text-sm leading-6 text-slate-400" : "text-sm leading-6 text-slate-700"}>{value}</span>
    </div>
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
