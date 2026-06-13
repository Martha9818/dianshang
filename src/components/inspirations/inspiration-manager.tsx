"use client";

import type { ReactNode } from "react";
import { useActionState, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
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
  pickInspirationFolderAction,
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
  getInspirationInboxTriage,
  type InspirationInboxSource,
} from "@/components/inspirations/inspiration-inbox-view";
import {
  buildInspirationConversionDefaults,
  INSPIRATION_CONVERSION_CONFIRM_FIELD,
  INSPIRATION_CONVERSION_CONFIRM_NOTE,
  INSPIRATION_CONVERSION_CONFIRM_VALUE,
} from "@/lib/modules/inspirations/conversion";
import {
  buildInspirationsHrefFromSearchParams,
} from "@/lib/modules/inspirations/routes";
import type { InspirationTriageResult } from "@/lib/modules/inspirations/triage";
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
    folderPath: string | null;
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
const modalInputClassName =
  "h-11 w-full rounded-[16px] border border-[#D8E0EB] bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#6B8ECF] focus:ring-4 focus:ring-[#E6EEF9] disabled:bg-[#F6F7F8] disabled:text-slate-400";
const modalPrimaryButtonClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#365B8C,#213B61)] px-5 text-sm font-medium text-white shadow-[0_12px_24px_rgba(33,59,97,0.16)] disabled:opacity-60";
const modalSecondaryButtonClassName =
  "inline-flex h-11 items-center justify-center rounded-[16px] border border-[#D5DEE8] bg-white px-4 text-sm font-medium text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.04)] disabled:opacity-60";

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
  return buildInspirationConversionDefaults(input);
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

function getTaskTone(status: string): Tone {
  if (status === "success") return "green";
  if (status === "failed") return "red";
  if (status === "processing") return "blue";
  if (status === "skipped") return "slate";
  return "amber";
}

function getTriageTone(band: InspirationTriageResult["conclusionBand"]): Tone {
  if (band === "keep") return "green";
  if (band === "review") return "blue";
  if (band === "reject") return "red";
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

function buildUploadsApiSrc(relativePath: string | null | undefined) {
  if (!relativePath) {
    return null;
  }

  return `/api/uploads/${relativePath.replace(/^uploads[\\/]/, "")}`;
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
  const [imageZoom, setImageZoom] = useState(100);
  const [isStageImageOpen, setIsStageImageOpen] = useState(false);

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
  const [convertConfirmInspirationId, setConvertConfirmInspirationId] = useState<number | null>(null);
  const [draftFolderPath, setDraftFolderPath] = useState(data.settingView.folderPath ?? "");
  const [draftScanEnabled, setDraftScanEnabled] = useState(data.settingView.scanEnabled);
  const [draftScanIntervalMinutes, setDraftScanIntervalMinutes] = useState(String(data.settingView.scanIntervalMinutes));
  const [modalPickFeedback, setModalPickFeedback] = useState<{ type: "idle" | "error"; message: string }>({
    type: "idle",
    message: "",
  });
  const [modalSaveFeedback, setModalSaveFeedback] = useState<{ success: boolean; message: string; error: string }>({
    success: false,
    message: "",
    error: "",
  });
  const [isPickingFolder, startPickFolderTransition] = useTransition();
  const [isSavingSettings, startSaveSettingsTransition] = useTransition();

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
  const showConvertConfirm = selectedInspiration ? convertConfirmInspirationId === selectedInspiration.id : false;
  const selectedIsConverted = selectedInspiration?.status === "converted" || Boolean(selectedInspiration?.convertedProduct);
  const selectedIsClosed = selectedInspiration?.status === "archived" || selectedInspiration?.status === "rejected";
  const latestFailedAiDraft = selectedInspiration?.aiDraftJobs.find((job) => job.status === "failed") ?? null;
  const selectedInboxSummary = selectedInspiration ? buildInspirationInboxCardSummary(selectedInspiration) : null;
  const selectedInboxFields = selectedInspiration ? buildInspirationInboxPrimaryFields(selectedInspiration) : [];
  const selectedAiStatus = selectedInspiration ? getInspirationInboxAiStatus(selectedInspiration) : null;
  const selectedTriage = selectedInspiration ? getInspirationInboxTriage(selectedInspiration) : null;
  const selectedOriginalImageSrc = selectedInspiration ? buildUploadsApiSrc(selectedInspiration.imagePath) : null;
  const selectedCandidatePrice = getInboxFieldValue(selectedInboxFields, "候选价格");
  const selectedProductType = getInboxFieldValue(selectedInboxFields, "商品类型", "信息不足");
  const selectedPlatform = getInboxFieldValue(selectedInboxFields, "建议平台", "信息不足");
  const selectedCategory = getInboxFieldValue(selectedInboxFields, "类目建议");
  const selectedNextStep = getInboxFieldValue(selectedInboxFields, "下一步建议", "先生成 AI 草稿，再决定保留、放弃或转商品。");
  const visibleScanLogs = scanLogExpanded ? data.recentScanLogs : data.recentScanLogs.slice(0, 4);
  const recentScanLogIds = useMemo(() => data.recentScanLogs.map((log) => log.id), [data.recentScanLogs]);
  const savedFolderPath = data.settingView.folderPath ?? "";
  const savedScanEnabled = data.settingView.scanEnabled;
  const savedScanIntervalMinutes = String(data.settingView.scanIntervalMinutes);
  const effectiveScanEnabled = draftScanEnabled;
  const currentFolderPath = draftFolderPath;
  const statusCardClassName = effectiveScanEnabled
    ? "rounded-2xl border border-emerald-200 bg-[linear-gradient(180deg,#F4FFF8,#ECFDF3)] px-4 py-4"
    : "rounded-2xl border border-[#E7ECF4] bg-white px-4 py-4";
  const statusCardLabelClassName = effectiveScanEnabled
    ? "text-xs font-medium uppercase tracking-[0.14em] text-emerald-500"
    : "text-xs font-medium uppercase tracking-[0.14em] text-slate-400";
  const statusCardTitleClassName = effectiveScanEnabled ? "mt-2 text-sm font-semibold text-emerald-700" : "mt-2 text-sm font-semibold text-slate-900";
  const statusCardBodyClassName = effectiveScanEnabled ? "mt-2 text-xs leading-5 text-emerald-700/80" : "mt-2 text-xs leading-5 text-slate-500";

  useEffect(() => {
    if (convertState.success && convertState.data?.id) {
      router.push(`/products/${convertState.data.id}`);
    }
  }, [convertState.data, convertState.success, router]);

  const resetModalDrafts = useCallback(() => {
    setDraftFolderPath(savedFolderPath);
    setDraftScanEnabled(savedScanEnabled);
    setDraftScanIntervalMinutes(savedScanIntervalMinutes);
    setModalPickFeedback({ type: "idle", message: "" });
    setModalSaveFeedback({ success: false, message: "", error: "" });
  }, [savedFolderPath, savedScanEnabled, savedScanIntervalMinutes]);

  function handlePickFolder() {
    if (!data.runtime.isWritable || isPickingFolder) {
      return;
    }

    setModalPickFeedback({ type: "idle", message: "" });
    setModalSaveFeedback({ success: false, message: "", error: "" });

    startPickFolderTransition(async () => {
      const result = await pickInspirationFolderAction(undefined, new FormData());

      if (!result.success) {
        setModalPickFeedback({ type: "error", message: result.error ?? "打开目录选择器失败，请稍后重试。" });
        return;
      }

      if (result.cancelled || !result.data?.folderPath) {
        setModalPickFeedback({ type: "idle", message: "" });
        return;
      }

      setDraftFolderPath(result.data.folderPath);
      setModalPickFeedback({ type: "idle", message: "" });
    });
  }

  function handleSaveModalSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!data.runtime.isWritable || isSavingSettings) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("folderPath", draftFolderPath);

    startSaveSettingsTransition(async () => {
      const result = await saveInspirationScanConfigAction(undefined, formData);

      if (!result.success) {
        setModalSaveFeedback({ success: false, message: "", error: result.error ?? "保存灵感定时扫描配置失败，请稍后重试。" });
        return;
      }

      const nextFolderPath =
        result.data && "folderPath" in result.data && typeof result.data.folderPath === "string"
          ? result.data.folderPath
          : draftFolderPath;
      const nextEnabled = result.data && "enabled" in result.data && typeof result.data.enabled === "boolean" ? result.data.enabled : draftScanEnabled;
      const nextInterval =
        result.data && "intervalMinutes" in result.data && result.data.intervalMinutes != null
          ? String(result.data.intervalMinutes)
          : draftScanIntervalMinutes;

      setDraftFolderPath(nextFolderPath);
      setDraftScanEnabled(nextEnabled);
      setDraftScanIntervalMinutes(nextInterval);
      setModalPickFeedback({ type: "idle", message: "" });
      setModalSaveFeedback({
        success: true,
        message: `设置已保存：${nextEnabled ? `已启用，每 ${nextInterval} 分钟执行一次。` : "当前已停用。"}`,
        error: "",
      });
    });
  }

  function openConvertConfirm() {
    if (!selectedInspiration || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable) {
      return;
    }

    setConvertConfirmInspirationId(selectedInspiration.id);
    if (typeof document !== "undefined") {
      window.requestAnimationFrame(() => {
        document.getElementById("convert-form-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

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

    router.push(buildInspirationsHrefFromSearchParams(params));
  }

  const settingsOpen = searchParams.get("panel") === "settings";

  const closeSettingsPanel = useCallback(() => {
    resetModalDrafts();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("panel");
    if (effectiveSelectedId) {
      params.set("selectedId", String(effectiveSelectedId));
    }
    router.push(buildInspirationsHrefFromSearchParams(params));
  }, [effectiveSelectedId, resetModalDrafts, router, searchParams]);

  const settingsPanelHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("panel", "settings");
    if (effectiveSelectedId) {
      params.set("selectedId", String(effectiveSelectedId));
    }
    return buildInspirationsHrefFromSearchParams(params);
  }, [effectiveSelectedId, searchParams]);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSettingsPanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen, closeSettingsPanel]);

  const formKey = selectedInspiration ? `${selectedInspiration.id}-${selectedInspiration.formattedUpdatedAt}` : "empty";
  const renderBuyerDeskLayout = Boolean(data.runtime);

  if (renderBuyerDeskLayout) {
    return (
      <div className="flex w-full min-h-0 flex-col gap-3 text-slate-900 xl:h-[calc(100dvh-7.5rem)] xl:overflow-hidden">
        {readonlyNotice ? <PageNote>{readonlyNotice}</PageNote> : null}

        <header className="flex flex-col gap-2 border-b border-[#E8EDF5] pb-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[2.1rem] font-semibold leading-tight tracking-[-0.06em] text-slate-950">AI 收件箱</h1>
              <span className="text-sm text-slate-400">AI 帮你看图、写草稿、给建议，快速决策是否值得转商品。</span>
            </div>
          </div>
          <Link
            href={settingsPanelHref}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DDE6F2] bg-white px-4 text-sm font-medium text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition hover:border-[#B9C9DD] hover:bg-[#F8FAFC]"
          >
            <MiniIcon name="gear" className="h-4 w-4" />
            收件箱设置
          </Link>
        </header>

        <section className="grid overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#FFFEFC] shadow-[0_10px_28px_rgba(15,23,42,0.035)] xl:grid-cols-4">
          <DeskMetric icon="image" tone="red" label="待处理" value={String(data.stats.pending)} delta="需要初筛" />
          <DeskMetric icon="thumb" tone="blue" label="已查看" value={String(data.stats.reviewed)} delta="可继续跟进" />
          <DeskMetric icon="bag" tone="green" label="已转商品" value={String(data.stats.converted)} delta="进入商品池" />
          <DeskMetric
            icon="shield"
            tone="green"
            label="初筛状态"
            value={selectedTriage?.isReady ? selectedTriage.scoreLabel : "待补线索"}
            delta={selectedTriage?.isReady ? selectedTriage.conclusion : "字段不足不补造"}
          />
        </section>

        <section className="flex flex-col gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-3 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.025)] xl:flex-row xl:items-center xl:justify-between">
          <AutoFilterForm action="/inspirations" className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
            <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DDE6F2] bg-white px-3 text-sm font-medium text-slate-700">
              <MiniIcon name="list" className="h-4 w-4" />
              筛选
            </button>
            <select name="sourceType" defaultValue={data.filters.sourceType ?? ""} className="h-10 rounded-lg border border-[#DDE6F2] bg-white px-3 text-sm text-slate-700">
              <option value="">全部来源</option>
              {data.sourceTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={data.filters.status ?? ""} className="h-10 rounded-lg border border-[#DDE6F2] bg-white px-3 text-sm text-slate-700">
              <option value="">全部状态</option>
              {data.statuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select name="converted" defaultValue={data.filters.converted ?? ""} className="h-10 rounded-lg border border-[#DDE6F2] bg-white px-3 text-sm text-slate-700">
              <option value="">全部转化</option>
              <option value="true">已转商品</option>
              <option value="false">未转商品</option>
            </select>
            <select name="hasImage" defaultValue={data.filters.hasImage ?? ""} className="h-10 rounded-lg border border-[#DDE6F2] bg-white px-3 text-sm text-slate-700">
              <option value="">全部图片</option>
              <option value="true">图片可用</option>
              <option value="false">图片缺失</option>
            </select>
          </AutoFilterForm>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-500">快速分组:</span>
            {[
              ["all", `全部 ${data.stats.total}`],
              ["pending", `待处理 ${data.stats.pending}`],
              ["reviewed", `已查看 ${data.stats.reviewed}`],
              ["rejected", `已放弃 ${data.stats.rejected}`],
              ["archived", `已归档 ${data.stats.archived}`],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={[
                  "h-9 rounded-lg border px-3 text-sm transition",
                  statusFilter === value ? "border-[#BFD6F8] bg-[#EFF6FF] text-[#1D4ED8]" : "border-[#E2E8F0] bg-[#F8FAFC] text-slate-600",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
            <button type="button" onClick={() => updateListQuery("sort", data.filters.sort)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDE6F2] bg-white text-slate-500">
              <MiniIcon name="backup" className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[26fr_42fr_32fr] xl:overflow-hidden">
          <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.035)]">
            <div className="flex items-center justify-between border-b border-[#E8EDF5] px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">AI 收件箱队列 ({visibleInspirations.length})</h2>
              </div>
              <select
                value={data.filters.sort}
                onChange={(event) => updateListQuery("sort", event.target.value)}
                className="h-9 rounded-lg border border-[#DDE6F2] bg-white px-3 text-sm text-slate-700"
              >
                <option value="createdAt_desc">最新优先</option>
                <option value="createdAt_asc">最早优先</option>
              </select>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {visibleInspirations.length > 0 ? (
                visibleInspirations.map((item) => {
                  const summary = buildInspirationInboxCardSummary(item);
                  const fields = buildInspirationInboxPrimaryFields(item);
                  const triage = getInspirationInboxTriage(item);
                  const price = getInboxFieldValue(fields, "候选价格");
                  const tags = getInboxFieldValue(fields, "标签", "待补充");
                  const quality = getInboxFieldValue(fields, "识别质量", "尚未生成");

                  return (
                    <article
                      key={item.id}
                      className={[
                        "relative border-b border-[#EEF2F7] px-3 py-3 transition",
                        selectedInspiration?.id === item.id ? "bg-[#FFF8F3]" : "bg-white hover:bg-[#FBFCFE]",
                      ].join(" ")}
                    >
                      {selectedInspiration?.id === item.id ? <span className="absolute left-0 top-3 h-[calc(100%-24px)] w-1 rounded-r-full bg-[#F05A3E]" /> : null}
                      <button type="button" onClick={() => setSelectedId(item.id)} className="grid w-full grid-cols-[96px_minmax(0,1fr)] gap-3 text-left">
                        <div className="h-[112px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F8FAFC]">
                          <ProductImage src={item.displayPath} alt={item.imagePath} label="IMG" square missing={!item.fileExists} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">{summary.title}</h3>
                            <span className={selectedInspiration?.id === item.id ? "mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#F05A3E]" : "mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300"} />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={price === "待补充" ? "text-sm font-semibold text-slate-400" : "text-sm font-semibold text-rose-500"}>{price}</span>
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{summary.productType}</span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-500">来源: {item.sourceTypeLabel}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {tags.split("、").slice(0, 3).map((tag) => (
                              <span key={tag} className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[11px] text-slate-500">{tag}</span>
                            ))}
                          </div>
                          <div className="mt-2 grid gap-1 text-xs">
                            <span className="text-slate-500">草稿质量: <span className="text-emerald-600">{quality}</span></span>
                            <span className="text-slate-500">
                              初筛分 <span className={triage.isReady ? "text-slate-700" : "text-slate-400"}>{triage.scoreLabel}</span>
                            </span>
                            <span className={triage.conclusionBand === "keep" ? "text-emerald-600" : triage.conclusionBand === "review" ? "text-blue-600" : triage.conclusionBand === "reject" ? "text-rose-600" : "text-amber-600"}>
                              {triage.conclusion}
                            </span>
                            <span className="text-amber-600">{summary.nextStep}</span>
                          </div>
                        </div>
                      </button>
                    </article>
                  );
                })
              ) : (
                <div className="p-4">
                  <PageNote>当前筛选条件下还没有可处理的灵感。</PageNote>
                </div>
              )}
            </div>

            <div className="border-t border-[#E8EDF5] p-3">
              <button type="button" className="h-10 w-full rounded-lg border border-[#DDE6F2] bg-white text-sm font-medium text-slate-600">
                已显示全部
              </button>
              <details className="mt-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                <summary className="cursor-pointer list-none px-3 py-3 text-sm font-medium text-slate-700">批量操作</summary>
                <form
                  id={INSPIRATION_BATCH_FORM_ID}
                  action={batchAction}
                  className="space-y-3 border-t border-[#E2E8F0] p-3"
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
                  <div className="flex gap-2">
                    <button type="button" onClick={selectAllVisible} className="h-10 flex-1 rounded-lg border border-[#DDE6F2] bg-white text-sm text-slate-700" disabled={visibleInspirationIds.length === 0 || allVisibleSelected}>
                      全选
                    </button>
                    <button type="button" onClick={clearSelection} className="h-10 flex-1 rounded-lg border border-[#DDE6F2] bg-white text-sm text-slate-700" disabled={selectedCount === 0}>
                      清空
                    </button>
                  </div>
                  <select value={selectedBatchAction} onChange={(event) => setSelectedBatchAction(event.target.value)} className="h-10 w-full rounded-lg border border-[#DDE6F2] bg-white px-3 text-sm text-slate-700" disabled={batchPending || !data.runtime.isWritable}>
                    {inspirationBatchOperations.map((operation) => (
                      <option key={operation.value} value={operation.value}>{operation.label}</option>
                    ))}
                  </select>
                  {selectedOperation?.dangerous ? (
                    <input value={batchConfirmText} onChange={(event) => setBatchConfirmText(event.target.value)} placeholder={DANGEROUS_CONFIRM_TEXT} className="h-10 w-full rounded-lg border border-[#DDE6F2] bg-white px-3 text-sm text-slate-700" disabled={batchPending || !data.runtime.isWritable} />
                  ) : null}
                  <button type="submit" className="h-11 w-full rounded-lg bg-[#8EA0BA] text-sm font-semibold text-white disabled:opacity-60" disabled={batchPending || selectedCount === 0 || !data.runtime.isWritable}>
                    {batchPending ? "执行中..." : "执行批量操作"}
                  </button>
                  {batchState.message ? <p className={batchState.ok ? "text-sm text-emerald-600" : "text-sm text-rose-600"}>{batchState.message}</p> : null}
                </form>
              </details>
            </div>
          </aside>

          <main className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.035)]">
            {selectedInspiration ? (
              <>
                <div className="flex items-center justify-between border-b border-[#E8EDF5] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Original Image Stage</p>
                    <h2 className="truncate text-sm font-semibold text-slate-900">当前灵感主舞台: {selectedInboxSummary?.title ?? selectedInspiration.fileName}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setImageZoom(100)} className="h-8 rounded-lg border border-[#DDE6F2] px-3 text-sm text-slate-600">原图</button>
                    <button type="button" onClick={() => setImageZoom((value) => Math.max(60, value - 10))} className="h-8 w-8 rounded-lg border border-[#DDE6F2] text-slate-600">-</button>
                    <span className="w-12 text-center text-sm text-slate-600">{imageZoom}%</span>
                    <button type="button" onClick={() => setImageZoom((value) => Math.min(160, value + 10))} className="h-8 w-8 rounded-lg border border-[#DDE6F2] text-slate-600">+</button>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                  <div className="flex min-h-[min(46dvh,480px)] items-center justify-center overflow-hidden rounded-2xl border border-[#EFE8DE] bg-[radial-gradient(circle_at_50%_15%,#FFFDF8_0,#F7F0E6_48%,#EFE7DA_100%)] p-5">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (selectedOriginalImageSrc && selectedInspiration.fileExists) {
                          setIsStageImageOpen(true);
                        }
                      }}
                      onKeyDown={(event) => {
                        if ((event.key === "Enter" || event.key === " ") && selectedOriginalImageSrc && selectedInspiration.fileExists) {
                          event.preventDefault();
                          setIsStageImageOpen(true);
                        }
                      }}
                      style={{ transform: `scale(${imageZoom / 100})` }}
                      className="w-full max-w-[560px] origin-center cursor-zoom-in transition-transform"
                    >
                      <ProductImage
                        src={selectedInspiration.imagePath}
                        alt={selectedInspiration.imagePath}
                        label="IMG"
                        large
                        fit="contain"
                        missing={!selectedInspiration.fileExists}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                    <button type="button" className="h-8 w-8 text-xl text-slate-400">‹</button>
                    <div className="h-16 w-16 overflow-hidden rounded-lg border-2 border-rose-400 bg-white p-1">
                      <ProductImage src={selectedInspiration.displayPath} alt={selectedInspiration.imagePath} label="1" square missing={!selectedInspiration.fileExists} />
                    </div>
                    <button type="button" className="h-8 w-8 text-xl text-slate-400">›</button>
                    </div>
                    <p className="text-xs text-slate-400">中间展示原始灵感图，不生成新商品图。</p>
                  </div>
                  <section className="mt-3 rounded-2xl border border-[#E7EBF0] bg-[#FBFCF8] p-3">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={selectedAiStatus?.label ?? "AI 草稿状态未知"} tone={selectedAiStatus?.tone ?? "slate"} />
                      <StatusBadge label={selectedProductType} tone="blue" />
                      <StatusBadge label={selectedCategory} tone="slate" />
                      <StatusBadge label={selectedPlatform} tone="green" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{selectedNextStep}</p>
                  </section>
                  <section className="rounded-2xl border border-[#E2E8F0] bg-[#FFFEFC] p-3 shadow-[0_12px_30px_rgba(15,23,42,0.035)]">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold tracking-[-0.02em] text-slate-950">初筛决策</h3>
                        <p className="mt-1 text-xs text-slate-500">看完原图和 AI 草稿后，直接决定下一步。</p>
                      </div>
                      <span className="rounded-full bg-[#F4F7FA] px-3 py-1 text-xs font-medium text-slate-500">人工确认</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      <form action={reviewAction}>
                        <input type="hidden" name="inspirationId" value={selectedInspiration.id} />
                        <button type="submit" className="flex h-[66px] w-full flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:-translate-y-[1px] hover:bg-emerald-100 disabled:opacity-50" disabled={reviewPending || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}>
                          <span className="text-base font-semibold">保留</span>
                          <span className="text-xs">继续跟进</span>
                        </button>
                      </form>
                      <form action={rejectAction}>
                        <input type="hidden" name="inspirationId" value={selectedInspiration.id} />
                        <input type="hidden" name="rejectedReason" value="快速初筛放弃" />
                        <button type="submit" className="flex h-[66px] w-full flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:-translate-y-[1px] hover:bg-amber-100 disabled:opacity-50" disabled={rejectPending || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}>
                          <span className="text-base font-semibold">放弃</span>
                          <span className="text-xs">不再处理</span>
                        </button>
                      </form>
                      <div>
                        <button
                          type="button"
                          onClick={openConvertConfirm}
                          className="flex h-[66px] w-full flex-col items-center justify-center rounded-xl bg-[#203149] text-white shadow-[0_14px_26px_rgba(32,49,73,0.22)] transition hover:-translate-y-[1px] hover:bg-[#152236] disabled:opacity-50"
                          disabled={convertPending || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}
                        >
                          <span className="text-base font-semibold">转商品</span>
                          <span className="text-xs">先进入人工确认</span>
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-center text-xs text-slate-400">快捷键: 1 保留　2 放弃　3 转商品</p>
                    <ActionMessages messages={[reviewState.error, archiveState.error, rejectState.error, convertState.error]} />
                  </section>
                  <details className="mt-3 rounded-2xl border border-[#E7EBF0] bg-white">
                    <summary className="cursor-pointer list-none px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">备注与辅助动作</h3>
                          <p className="mt-1 text-xs text-slate-500">保存备注、重新生成 AI 草稿、补充截图识别都在这里。</p>
                        </div>
                        <span className="text-slate-400">⌄</span>
                      </div>
                    </summary>
                    <form action={draftAction} key={formKey} className="space-y-3 border-t border-[#E7EBF0] p-4">
                      <input type="hidden" name="inspirationId" value={selectedInspiration.id} />
                      <div className="flex flex-wrap gap-2">
                        <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DDE6F2] bg-white px-3 text-sm font-medium text-slate-700" disabled={!data.runtime.isWritable || draftPending}>
                          <MiniIcon name="doc" className="h-4 w-4" />
                          {draftPending ? "保存中..." : "保存备注"}
                        </button>
                        <button formAction={aiAction} type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DDE6F2] bg-white px-3 text-sm font-medium text-slate-700" disabled={aiPending || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}>
                          <MiniIcon name="spark" className="h-4 w-4" />
                          {aiPending ? "识图中..." : "AI 识图草稿"}
                        </button>
                        <Link href={`/screenshots?sourceType=inspiration&sourceId=${selectedInspiration.id}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#DDE6F2] bg-white px-3 text-sm font-medium text-slate-700">
                          <MiniIcon name="image" className="h-4 w-4" />
                          补充截图识别
                        </Link>
                        <details className="relative">
                          <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-[#DDE6F2] bg-white px-3 text-sm font-medium text-slate-700">更多</summary>
                          <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-[#E2E8F0] bg-white p-2 shadow-lg">
                            <Link href="/link-imports?purpose=inspiration" className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">补录来源链接</Link>
                            <button formAction={applyAction} type="submit" className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" disabled={applyPending || !selectedInspiration.aiSuggestion || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}>应用到灵感备注</button>
                            <button formAction={ignoreDraftAction} type="submit" className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" disabled={ignoreDraftPending || !selectedInspiration.aiSuggestion || selectedIsConverted || selectedIsClosed || !data.runtime.isWritable}>忽略 AI 草稿</button>
                          </div>
                        </details>
                      </div>
                      <textarea name="note" className="min-h-[76px] w-full resize-y rounded-xl border border-[#DDE6F2] bg-white px-3 py-3 text-sm leading-6 text-slate-700" defaultValue={selectedInspiration.note ?? ""} placeholder="在此记录你的观察、想法或下一步计划..." disabled={!data.runtime.isWritable} />
                      <input name="title" type="hidden" defaultValue={selectedInspiration.title ?? ""} />
                      <div className="text-right text-xs text-slate-400">0 / 500</div>
                      <ActionMessages messages={[draftState.error, aiState.error, applyState.error, ignoreDraftState.error, retryAiState.error]} />
                    </form>
                  </details>
                </div>
              </>
            ) : (
              <div className="p-4">
                <PageNote>先从左侧选择一条灵感。</PageNote>
              </div>
            )}
          </main>

          <aside className="flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto">
            {selectedInspiration ? (
              <>
                <AiDraftPanel source={selectedInspiration} fields={selectedInboxFields} aiStatus={selectedAiStatus} triage={selectedTriage} />

                <details id="convert-form-panel" className="rounded-xl border border-[#E2E8F0] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <summary className="cursor-pointer list-none px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">转商品完整表单</h3>
                        <p className="mt-1 text-xs text-slate-500">需要人工补字段时展开。</p>
                      </div>
                      <span className="text-slate-400">⌄</span>
                    </div>
                  </summary>
                  <form action={convertAction} key={`${formKey}-convert`} className="space-y-4 border-t border-[#E8EDF5] p-4">
                    <input type="hidden" name="inspirationId" value={selectedInspiration.id} />
                    {selectedIsConverted ? <PageNote>这条灵感已转为商品，不能重复转商品。</PageNote> : null}
                    {selectedIsClosed ? <PageNote>已归档或已放弃的灵感不再进入转商品流程。</PageNote> : null}
                    {!selectedIsConverted && !selectedIsClosed ? (
                      showConvertConfirm ? (
                        <>
                          <input type="hidden" name={INSPIRATION_CONVERSION_CONFIRM_FIELD} value={INSPIRATION_CONVERSION_CONFIRM_VALUE} />
                          <p className="rounded-xl border border-[#D9E4F2] bg-[#F8FBFF] px-4 py-3 text-sm text-slate-600">
                            {INSPIRATION_CONVERSION_CONFIRM_NOTE}
                          </p>
                          <Field label="商品名称"><input name="name" className={inputClassName} defaultValue={conversionDefaults.name} disabled={!data.runtime.isWritable} /></Field>
                          <Field label="一级类目"><input name="categoryLevel1" className={inputClassName} defaultValue={conversionDefaults.categoryLevel1} disabled={!data.runtime.isWritable} /></Field>
                          <Field label="目标用户"><input name="targetUser" className={inputClassName} defaultValue={conversionDefaults.targetUser} disabled={!data.runtime.isWritable} /></Field>
                          <Field label="卖点草稿"><textarea name="sellingPointsText" className={textareaClassName} defaultValue={conversionDefaults.sellingPointsText} disabled={!data.runtime.isWritable} /></Field>
                          <Field label="使用场景"><textarea name="usageScenesText" className={textareaClassName} defaultValue={conversionDefaults.usageScenesText} disabled={!data.runtime.isWritable} /></Field>
                          <Field label="标签"><textarea name="tagsText" className={textareaClassName} defaultValue={conversionDefaults.tagsText} disabled={!data.runtime.isWritable} /></Field>
                          <Field label="备注"><textarea name="notes" className={textareaClassName} defaultValue={conversionDefaults.notes} disabled={!data.runtime.isWritable} /></Field>
                          <div className="flex flex-wrap gap-3">
                            <button type="button" className={secondaryButtonClassName} onClick={() => setConvertConfirmInspirationId(null)} disabled={convertPending}>
                              取消，不创建商品
                            </button>
                            <button type="submit" className={primaryButtonClassName} disabled={convertPending || !data.runtime.isWritable}>
                              {convertPending ? "创建中..." : "确认并创建商品"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3 rounded-xl border border-dashed border-[#D5DEE8] bg-[#FBFCFE] px-4 py-4">
                          <p className="text-sm leading-6 text-slate-600">AI 会先预填商品信息，创建前仍需人工确认；取消不会创建任何商品。</p>
                          <button
                            type="button"
                            className={secondaryButtonClassName}
                            onClick={openConvertConfirm}
                            disabled={convertPending || !data.runtime.isWritable}
                          >
                            打开人工确认表单
                          </button>
                        </div>
                      )
                    ) : null}
                    {convertState.error ? <p className="text-sm text-rose-600">{convertState.error}</p> : null}
                  </form>
                </details>

                <details className="rounded-xl border border-[#E2E8F0] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <summary className="cursor-pointer list-none px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">高级记录</h3>
                        <p className="mt-1 text-xs text-slate-500">文件信息与相似度、AI 任务与处理记录、扫描与任务历史</p>
                      </div>
                      <span className="text-slate-400">⌄</span>
                    </div>
                  </summary>
                  <div className="space-y-4 border-t border-[#E8EDF5] p-4">
                    <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                      <DetailRow label="文件名" value={selectedInspiration.fileName} />
                      <DetailRow label="来源" value={selectedInspiration.sourceTypeLabel} />
                      <DetailRow label="权限" value={selectedInspiration.usagePermissionLabel} badgeTone={selectedInspiration.usagePermissionTone} />
                      <DetailRow label="状态" value={selectedInspiration.statusLabel} badgeTone={selectedInspiration.statusTone} />
                      <DetailRow label="hash" value={selectedInspiration.fileHashShort} />
                      <DetailRow label="导入" value={selectedInspiration.formattedImportedAt} />
                    </div>
                    <form action={dedupAction} className="flex flex-wrap gap-2">
                      <input type="hidden" name="inspirationId" value={selectedInspiration.id} />
                      <button type="submit" className={secondaryButtonClassName} disabled={dedupPending || !data.runtime.isWritable}>
                        {dedupPending ? "检测中..." : "检测此灵感图片"}
                      </button>
                      <Link href="/maintenance/files" className={secondaryButtonClassName}>文件清理与回收站</Link>
                    </form>
                    <ImageDedupPanel summary={selectedInspiration.imageDedup} ignoreAction={dedupIgnoreAction} archiveSuggestAction={dedupArchiveAction} actionPending={dedupIgnorePending || dedupArchivePending || !data.runtime.isWritable} />
                    <OperationLogList logs={selectedInspiration.operationLogs} />
                  </div>
                </details>
              </>
            ) : (
              <PageNote>先从左侧候选队列选择一条灵感。</PageNote>
            )}
          </aside>
        </section>

        {settingsOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.26)] p-4 backdrop-blur-[3px] md:p-8"
            onClick={closeSettingsPanel}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="收件箱设置"
              className="w-full max-w-[840px] rounded-[26px] border border-[#DDE6F2] bg-[#FCFDFE] shadow-[0_24px_72px_rgba(15,23,42,0.14)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#E8EDF5] px-6 py-5">
                <div>
                  <h3 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-slate-950">收件箱设置</h3>
                </div>
                <button
                  type="button"
                  onClick={closeSettingsPanel}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-[#DDE6F2] bg-white text-[1.4rem] leading-none text-slate-500 transition hover:border-[#B9C9DD] hover:text-slate-700"
                  aria-label="关闭收件箱设置"
                >
                  ×
                </button>
              </div>

              <div className="px-6 py-5">
                <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
                  <div className="flex h-full flex-col rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    <div className="border-b border-[#EEF2F7] px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900">灵感箱文件夹</p>
                    </div>
                    <div className="flex flex-1 flex-col gap-4 px-5 py-4">
                      <Field label="当前目录">
                        <input
                          className={modalInputClassName}
                          value={currentFolderPath}
                          placeholder="未设置"
                          readOnly
                          disabled={!data.runtime.isWritable}
                        />
                      </Field>
                      <div className="flex justify-end">
                        <button type="button" onClick={handlePickFolder} className={modalSecondaryButtonClassName} disabled={isPickingFolder || !data.runtime.isWritable}>
                          {isPickingFolder ? "打开中..." : "更改目录"}
                        </button>
                      </div>
                      {modalPickFeedback.type === "error" ? <p className="text-sm text-rose-600">{modalPickFeedback.message}</p> : null}
                    </div>
                  </div>

                  <form
                    id="inspiration-settings-config-form"
                    onSubmit={handleSaveModalSettings}
                    className="flex h-full flex-col rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                  >
                    <input type="hidden" name="folderPath" value={draftFolderPath} />
                    <div className="border-b border-[#EEF2F7] px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900">定时扫描</p>
                    </div>
                    <div className="flex flex-1 flex-col gap-4 px-5 py-4">
                      <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-slate-700">
                        <input
                          name="scanEnabled"
                          type="checkbox"
                          checked={draftScanEnabled}
                          onChange={(event) => setDraftScanEnabled(event.target.checked)}
                          disabled={!data.runtime.isWritable || isSavingSettings}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        启用应用内定时扫描
                      </label>
                      <Field label="扫描间隔">
                        <select
                          name="scanIntervalMinutes"
                          value={draftScanIntervalMinutes}
                          onChange={(event) => setDraftScanIntervalMinutes(event.target.value)}
                          className={modalInputClassName}
                          disabled={!data.runtime.isWritable || isSavingSettings}
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
                    </div>
                  </form>
                </div>

                <section className="mt-4 rounded-[20px] border border-[#E2E8F0] bg-[linear-gradient(180deg,#FCFEFF,#F8FBFE)] px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className={statusCardClassName}>
                      <p className={statusCardLabelClassName}>当前状态</p>
                      <p className={statusCardTitleClassName}>{effectiveScanEnabled ? "监听中，运行正常" : "定时扫描未启用"}</p>
                      <p className={statusCardBodyClassName}>
                        {scanState.success
                          ? `本次扫描：新增 ${scanState.data?.newFiles ?? 0}，重复 ${scanState.data?.skippedDuplicates ?? 0}，失败 ${scanState.data?.failedFiles ?? 0}`
                          : data.latestScan
                            ? `最近一次扫描：新增 ${data.latestScan.newFiles}，重复 ${data.latestScan.skippedDuplicates}，失败 ${data.latestScan.failedFiles}`
                            : "暂无扫描记录"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#E7ECF4] bg-white px-4 py-4">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">上次扫描</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{data.latestScan ? data.latestScan.formattedStartedAt : "暂无"}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{data.latestScan ? data.latestScan.status : "未执行"}</p>
                    </div>
                  </div>

                  {modalSaveFeedback.success ? <p className="mt-4 text-sm text-emerald-600">{modalSaveFeedback.message}</p> : null}
                  {modalSaveFeedback.error ? <p className="mt-4 text-sm text-rose-600">{modalSaveFeedback.error}</p> : null}
                  {scanState.error ? <p className="mt-4 text-sm text-rose-600">{scanState.error}</p> : null}
                  {dedupLibraryState.error ? <p className="mt-4 text-sm text-rose-600">{dedupLibraryState.error}</p> : null}
                  {dedupLibraryState.success ? (
                    <p className="mt-4 text-sm text-emerald-600">
                      {(dedupLibraryState.data?.total ?? 0) === 0
                        ? "当前没有灵感图片可检查。"
                        : `已检查 ${dedupLibraryState.data?.total ?? 0} 张灵感图片，疑似重复 ${dedupLibraryState.data?.exactCount ?? 0}，高相似 ${dedupLibraryState.data?.similarCount ?? 0}，失败 ${dedupLibraryState.data?.failedCount ?? 0}。`}
                    </p>
                  ) : null}
                </section>

                <div className="mt-4 flex flex-col gap-3 border-t border-[#E8EDF5] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-3">
                    <form action={scanAction}>
                      <button type="submit" className={modalSecondaryButtonClassName} disabled={scanPending || !data.runtime.isWritable}>
                        {scanPending ? "扫描中..." : "立即扫描"}
                      </button>
                    </form>
                    <form action={dedupLibraryAction}>
                      <button type="submit" className={modalSecondaryButtonClassName} disabled={dedupLibraryPending || !data.runtime.isWritable}>
                        {dedupLibraryPending ? "检查中..." : "检查灵感相似度"}
                      </button>
                    </form>
                  </div>
                  <button
                    type="submit"
                    form="inspiration-settings-config-form"
                    className={modalPrimaryButtonClassName}
                    disabled={!data.runtime.isWritable || isSavingSettings || !draftFolderPath.trim()}
                  >
                    {isSavingSettings ? "保存中..." : "保存设置"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isStageImageOpen && selectedInspiration && selectedOriginalImageSrc ? (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(15,23,42,0.78)] p-4 backdrop-blur-[2px] md:p-8"
            onClick={() => setIsStageImageOpen(false)}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="原图预览"
              className="relative flex h-[min(88vh,980px)] w-full max-w-[1400px] items-center justify-center overflow-hidden rounded-[28px] border border-white/15 bg-[#0F172A]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsStageImageOpen(false)}
                className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl leading-none text-white transition hover:bg-white/20"
                aria-label="关闭原图预览"
              >
                ×
              </button>
              <div className="relative h-full w-full">
                <Image
                  src={selectedOriginalImageSrc}
                  alt={selectedInspiration.imagePath}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4 xl:grid xl:h-[calc(100dvh-7.75rem)] xl:grid-rows-[auto_auto_minmax(0,1fr)] xl:gap-4 xl:space-y-0 xl:overflow-hidden">
      {readonlyNotice ? <PageNote>{readonlyNotice}</PageNote> : null}

      <section className="rounded-[28px] border border-[#E6DDD1] bg-[linear-gradient(180deg,#FDFBF7_0%,#FAF7F1_100%)] px-5 py-4 shadow-[0_18px_44px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-[720px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A8CA7]">Desk Snapshot</p>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
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

        <div className="mt-3 grid gap-2 xl:grid-cols-5">
          <StatCard label="灵感总数" value={String(data.stats.total)} delta="队列规模" tone="blue" />
          <StatCard label="待处理" value={String(data.stats.pending)} delta="优先初筛" tone="amber" />
          <StatCard label="已查看" value={String(data.stats.reviewed)} delta="待继续判断" tone="violet" />
          <StatCard label="已转商品" value={String(data.stats.converted)} delta="人工确认后创建" tone="green" />
          <StatCard label="已放弃 / 归档" value={`${data.stats.rejected} / ${data.stats.archived}`} delta="默认下沉" tone="sky" />
        </div>
      </section>

      <DashboardCard className="border-[#E6DED4] bg-[#F8F5EF] px-4 py-3 shadow-none">
        <AutoFilterForm action="/inspirations" className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(280px,1.2fr)_160px_160px_160px_150px] xl:items-end">
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

      <section className="grid min-h-0 gap-4 xl:grid-cols-[340px_minmax(0,1fr)_400px] xl:items-stretch xl:overflow-hidden">
        <DashboardCard className="overflow-hidden border-[#E4DDD4] bg-[#FFFEFC] shadow-[0_18px_40px_rgba(15,23,42,0.04)] xl:flex xl:min-h-0 xl:h-full xl:flex-col">
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

        <DashboardCard className="overflow-hidden border-[#E4DDD4] bg-[#FFFEFC] shadow-[0_18px_40px_rgba(15,23,42,0.05)] xl:flex xl:min-h-0 xl:h-full xl:flex-col">
          {selectedInspiration ? (
            <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 xl:overflow-y-auto">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EEF2F8] py-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Stage</p>
                  <h2 className="mt-1.5 line-clamp-2 text-[1.22rem] font-semibold tracking-[-0.03em] text-slate-900">
                    {selectedInboxSummary?.title ?? selectedInspiration.title ?? "待补充标题"}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-500">
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

              <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
                <div className="flex-1 rounded-[30px] border border-[#E6DDD1] bg-[radial-gradient(circle_at_top,#F7F0E4_0%,#F5F7FB_44%,#FBFAF7_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <div className="flex h-full min-h-[280px] items-center justify-center overflow-hidden rounded-[24px] border border-white/70 bg-white/70 xl:min-h-[260px]">
                    <ProductImage src={selectedInspiration.displayPath} alt={selectedInspiration.imagePath} label="IMG" large missing={!selectedInspiration.fileExists} />
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-3 rounded-[16px] border border-[#E6EAF0] bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
                      <div className="h-9 w-9 overflow-hidden rounded-[12px] border border-[#E8E2D8] bg-[#F4F6F8]">
                        <ProductImage src={selectedInspiration.displayPath} alt={selectedInspiration.imagePath} label="1" square missing={!selectedInspiration.fileExists} />
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-medium text-slate-700">当前主图</p>
                        <p className="text-[11px] text-slate-400">{selectedInspiration.fileName}</p>
                      </div>
                    </div>
                    <div className="inline-flex items-center rounded-[16px] border border-[#E6EAF0] bg-white px-3 py-2 text-[11px] text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
                      {selectedInspiration.sourceTypeLabel} · {selectedInspiration.formattedImportedAt}
                    </div>
                    {selectedInspiration.imageDedup?.warningLabel ? (
                      <div className="inline-flex items-center rounded-[16px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                        {selectedInspiration.imageDedup.warningLabel}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(240px,0.85fr)]">
                    <div className="rounded-[24px] border border-[#ECE4D8] bg-[#FBF7F1] px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">AI 草稿速览</p>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{selectedInboxSummary?.subtitle ?? "尚未生成 AI 草稿。"}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{selectedAiStatus?.description ?? "先生成 AI 草稿，再决定保留、放弃或转商品。"}</p>
                    </div>

                    <div className="rounded-[24px] border border-[#E8ECEF] bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">买手速看</p>
                      <div className="mt-2 grid gap-2 text-[13px] sm:grid-cols-2">
                        <MiniFact label="候选价格" value={selectedCandidatePrice} />
                        <MiniFact label="商品类型" value={selectedInboxSummary?.productType ?? "信息不足"} />
                        <MiniFact label="建议平台" value={selectedPlatform} />
                        <MiniFact label="类目建议" value={selectedCategory} />
                        <MiniFact label="目标人群" value={selectedInboxSummary?.targetAudience ?? "信息不足"} />
                        <MiniFact label="下一步" value={selectedNextStep} />
                      </div>
                    </div>
                  </div>

                  <CollapsibleSection title="人工备注与草稿标题" description="保留原入口，但默认折叠，不再占住首屏。">
                    <form action={draftAction} key={formKey} className="space-y-3">
                      <input type="hidden" name="inspirationId" value={selectedInspiration.id} />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-slate-500">需要补人工判断时再展开编辑。</p>
                        <ActionButton type="submit" variant="secondary" disabled={!data.runtime.isWritable}>
                          {draftPending ? "保存中..." : "保存备注"}
                        </ActionButton>
                      </div>
                      <Field label="草稿标题">
                        <input name="title" className={inputClassName} defaultValue={selectedInspiration.title ?? ""} disabled={!data.runtime.isWritable} />
                      </Field>
                      <Field label="人工备注">
                        <textarea name="note" className="min-h-[138px] w-full rounded-[22px] border border-[#D8DEE8] bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-[#89A7C9] focus:ring-2 focus:ring-[#D7E4F4]" defaultValue={selectedInspiration.note ?? ""} disabled={!data.runtime.isWritable} />
                      </Field>
                      <ActionMessages messages={[draftState.error]} />
                    </form>
                  </CollapsibleSection>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-5 py-5">
              <PageNote>还没有灵感草稿。先把图片放进灵感箱，或用补充截图识别导入后再回这里查看。</PageNote>
            </div>
          )}
        </DashboardCard>

        <div id="inspiration-convert-panel" className="xl:min-h-0 xl:h-full">
          <div className="space-y-3 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:overflow-y-auto xl:pr-1">
            {selectedInspiration ? (
              <>
                <AiDraftPanel source={selectedInspiration} fields={selectedInboxFields} aiStatus={selectedAiStatus} triage={selectedTriage} />

                <form className="space-y-4 rounded-[28px] border border-[#E4DDD4] bg-[#FFFDFC] px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Decision Desk</p>
                      <h3 className="mt-1.5 text-[1.02rem] font-semibold tracking-[-0.02em] text-slate-900">保留 / 放弃 / 转商品</h3>
                      <p className="mt-1.5 text-sm leading-6 text-slate-500">首屏只保留关键动作，长表单和调试信息默认收起。</p>
                    </div>
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
              <CollapsibleSection title="转商品入口" description="完整确认表单继续保留，但默认收起，不需要再往下找。">
                {selectedInspiration ? (
                  <form
                    action={convertAction}
                    key={`${formKey}-convert`}
                    className="space-y-4"
                  >
                    <input type="hidden" name="inspirationId" value={selectedInspiration.id} />
                    {selectedIsConverted ? <PageNote>这条灵感已转为商品，不能重复转商品。</PageNote> : null}
                    {selectedIsClosed ? <PageNote>已归档或已放弃的灵感不再进入转商品流程。</PageNote> : null}
                    {!selectedIsConverted && !selectedIsClosed ? (
                      showConvertConfirm ? (
                        <div className="space-y-4 rounded-[22px] border border-[#ECE8E1] bg-[#FBFAF7] px-4 py-4">
                          <input type="hidden" name={INSPIRATION_CONVERSION_CONFIRM_FIELD} value={INSPIRATION_CONVERSION_CONFIRM_VALUE} />
                          <p className="rounded-[18px] border border-[#D9E4F2] bg-[#F8FBFF] px-4 py-3 text-sm text-slate-600">
                            {INSPIRATION_CONVERSION_CONFIRM_NOTE}
                          </p>
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
                          <div className="flex flex-wrap gap-3">
                            <button type="button" className={secondaryButtonClassName} onClick={() => setConvertConfirmInspirationId(null)} disabled={convertPending}>
                              取消，不创建商品
                            </button>
                            <button type="submit" className={primaryButtonClassName} disabled={convertPending || !data.runtime.isWritable}>
                              {convertPending ? "创建中..." : "确认并创建商品"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 rounded-[22px] border border-dashed border-[#D5DEE8] bg-[#FBFCFE] px-4 py-4">
                          <p className="text-sm leading-6 text-slate-600">AI 会先预填商品信息，创建前仍需人工确认；取消不会创建任何商品。</p>
                          <button
                            type="button"
                            className={secondaryButtonClassName}
                            onClick={openConvertConfirm}
                            disabled={convertPending || !data.runtime.isWritable}
                          >
                            打开人工确认表单
                          </button>
                        </div>
                      )
                    ) : null}
                    {convertState.error ? <p className="text-sm text-rose-600">{convertState.error}</p> : null}
                  </form>
                ) : (
                  <PageNote>先选择一条灵感记录，再填写确认表单。</PageNote>
                )}
              </CollapsibleSection>
            </div>

            <CollapsibleSection title="高级记录 / 调试信息" description="文件信息、AI 任务和扫描历史都保留，但首屏默认收起。">
              <div className="space-y-4">
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
            </CollapsibleSection>
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

function DeskMetric({
  icon,
  tone,
  label,
  value,
  delta,
}: {
  icon: "image" | "thumb" | "bag" | "shield";
  tone: "red" | "blue" | "green";
  label: string;
  value: string;
  delta: string;
}) {
  const toneClassName =
    tone === "red"
      ? "bg-rose-50 text-rose-500"
      : tone === "blue"
        ? "bg-blue-50 text-blue-500"
        : "bg-teal-50 text-teal-500";

  return (
    <div className="flex min-h-[70px] items-center gap-3 border-b border-[#E8EDF5] px-5 py-3 last:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClassName}`}>
        <MiniIcon name={icon} className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="mt-0.5 flex items-end gap-2">
          <span className={tone === "red" ? "text-[1.45rem] font-semibold leading-none text-rose-500" : tone === "blue" ? "text-[1.45rem] font-semibold leading-none text-slate-900" : "text-[1.45rem] font-semibold leading-none text-slate-900"}>
            {value}
          </span>
          <span className="pb-0.5 text-xs text-slate-500">{delta}</span>
        </div>
      </div>
    </div>
  );
}

function AiDraftPanel({
  source,
  fields,
  aiStatus,
  triage,
}: {
  source: InspirationInboxSource;
  fields: InboxField[];
  aiStatus: { label: string; description: string; tone: Tone } | null;
  triage: InspirationTriageResult | null;
}) {
  const primaryRows = [
    { label: "候选商品名", value: getInboxFieldValue(fields, "候选商品名"), status: "AI 优化", icon: "thumb" as const },
    { label: "候选价格", value: getInboxFieldValue(fields, "候选价格"), status: "待确认", icon: "clock" as const },
    { label: "商品类型", value: getInboxFieldValue(fields, "商品类型", "信息不足"), status: "待确认", icon: "bag" as const },
    { label: "目标人群", value: getInboxFieldValue(fields, "目标人群", "信息不足"), status: "待补充", icon: "list" as const },
    { label: "用户痛点", value: getInboxFieldValue(fields, "用户痛点", "信息不足"), status: "待补充", icon: "shield" as const },
    { label: "使用场景", value: getInboxFieldValue(fields, "使用场景", "信息不足"), status: "待补充", icon: "image" as const },
    { label: "核心卖点", value: getInboxFieldValue(fields, "核心卖点", "信息不足"), status: "", icon: "spark" as const },
    { label: "建议平台", value: getInboxFieldValue(fields, "建议平台", "信息不足"), status: "", icon: "grid" as const },
    { label: "标签", value: getInboxFieldValue(fields, "标签", "待补充"), status: "", icon: "prompt" as const },
    { label: "类目建议", value: getInboxFieldValue(fields, "类目建议", "待补充"), status: "", icon: "database" as const },
    { label: "规格线索", value: getInboxFieldValue(fields, "规格线索", "信息不足"), status: "", icon: "doc" as const },
    { label: "风险提示", value: getInboxFieldValue(fields, "风险提示", "信息不足"), status: "", icon: "shield" as const },
    { label: "识别质量", value: getInboxFieldValue(fields, "识别质量", "尚未生成"), status: "", icon: "clock" as const },
    { label: "草稿初筛分", value: getInboxFieldValue(fields, "草稿初筛分", "尚未生成"), status: triage?.isReady ? "已生成" : "待补充", icon: "thumb" as const },
    { label: "初筛结论", value: getInboxFieldValue(fields, "初筛结论", "尚未生成"), status: "", icon: "spark" as const },
  ];

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#E8EDF5] px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-rose-500">✧</span>
            <h3 className="text-[15px] font-semibold text-slate-950">AI 初筛草稿</h3>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
          识别质量: {getInboxFieldValue(fields, "识别质量", "尚未生成")}
        </span>
      </div>
      <div className="space-y-2.5 p-3">
        {aiStatus ? <StatusBadge label={aiStatus.label} tone={aiStatus.tone} /> : null}

        {source.aiSuggestion?.shortDescription ? (
          <div className="line-clamp-3 rounded-[18px] border border-[#EFE5D8] bg-[#FCF8F2] px-3 py-2.5 text-[13px] leading-6 text-slate-600">
            {source.aiSuggestion.shortDescription}
          </div>
        ) : (
          <PageNote>{aiStatus?.description ?? "尚未生成 AI 草稿。"}</PageNote>
        )}

        <div className="rounded-[18px] border border-[#E8EDF5] bg-[#F8FAFC] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Draft Triage</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{triage?.scoreLabel ?? "信息不足"}</p>
            </div>
            <StatusBadge label={triage?.conclusion ?? "信息不足"} tone={getTriageTone(triage?.conclusionBand ?? "watch")} />
          </div>
          <p className="mt-2 text-[13px] leading-6 text-slate-600">{triage?.rationale ?? "当前字段不足，不能给出完整初筛分。"}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{triage?.nextStep ?? "先补充更多线索，再决定是否继续处理。"}</p>
        </div>

        <div className="overflow-hidden rounded-[18px] border border-[#E8EDF5]">
          {primaryRows.map((row) => (
            <div key={row.label} className="grid min-h-8 grid-cols-[20px_76px_minmax(0,1fr)_auto] items-center gap-2 border-b border-[#EEF2F7] px-3 py-1.5 text-[13px] last:border-b-0">
              <span className="text-slate-400">
                <MiniIcon name={row.icon} className="h-[14px] w-[14px]" />
              </span>
              <span className="text-slate-500">{row.label}</span>
              <span className={["待补充", "信息不足", "尚未生成"].includes(row.value) ? "truncate text-slate-400" : "truncate text-slate-700"}>
                {row.value}
              </span>
              {row.status ? (
                <span
                  className={
                    row.status === "已生成"
                      ? "rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600"
                      : row.status === "待补充"
                        ? "rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-600"
                        : "rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-500"
                  }
                >
                  {row.status}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <details className="rounded-[18px] border border-[#E8EDF5] bg-white">
          <summary className="cursor-pointer list-none px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">初筛维度</p>
                <p className="mt-1 text-xs text-slate-500">默认收起，不占首屏高度。</p>
              </div>
              <span className="text-xs font-medium text-[#365B8C]">展开查看</span>
            </div>
          </summary>
          <div className="divide-y divide-[#EEF2F7] border-t border-[#EEF2F7]">
            {(triage?.dimensions ?? []).map((dimension) => (
              <div key={dimension.label} className="grid gap-1 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-700">{dimension.label}</span>
                  <span className="text-sm font-medium text-slate-900">
                    {typeof dimension.score === "number" ? `${dimension.score} / ${dimension.maxScore}` : "信息不足"}
                  </span>
                </div>
                <p className="text-xs leading-5 text-slate-500">{dimension.summary}</p>
              </div>
            ))}
            <p className="px-3 py-2 text-[11px] leading-5 text-slate-400">
              {triage?.disclaimer ?? "仅用于线索初筛，不代表正式商品评估。"}
            </p>
          </div>
        </details>
      </div>
    </section>
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
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="rounded-[24px] border border-[#ECE8E1] bg-[#FFFEFC]" {...(defaultOpen ? { open: true } : {})}>
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
