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
  convertInspirationToProductAction,
  generateInspirationAiSuggestionAction,
  ignoreInspirationAction,
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
  aiSuggestion: InspirationAISuggestion | null;
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
    pendingReview: number;
    ignored: number;
    converted: number;
  };
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
  const [statusFilter, setStatusFilter] = useState<"all" | "pending_review" | "ignored" | "converted">("all");

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
  const [ignoreState, ignoreAction, ignorePending] = useActionState(ignoreInspirationAction, {
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

  useEffect(() => {
    if (convertState.success && convertState.data?.id) {
      router.push(`/products/${convertState.data.id}`);
    }
  }, [convertState.data, convertState.success, router]);

  const formKey = selectedInspiration ? `${selectedInspiration.id}-${selectedInspiration.formattedUpdatedAt}` : "empty";

  return (
    <div className="space-y-5">
      {readonlyNotice ? <PageNote>{readonlyNotice}</PageNote> : null}

      <section className="grid gap-4 xl:grid-cols-4">
        <StatCard label="灵感总数" value={String(data.stats.total)} delta="待审核优先" tone="blue" />
        <StatCard label="待审核" value={String(data.stats.pendingReview)} delta="手动扫描结果" tone="amber" />
        <StatCard label="已忽略" value={String(data.stats.ignored)} delta="可随时保留" tone="slate" />
        <StatCard label="已转商品" value={String(data.stats.converted)} delta="需确认后创建" tone="green" />
      </section>

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
            description="缩略图、状态、去重摘要和 AI 建议都只作为待审核参考。"
            action={
              <div className="flex flex-wrap gap-2">
                {[
                  ["all", "全部"],
                  ["pending_review", "待审核"],
                  ["ignored", "已忽略"],
                  ["converted", "已转商品"],
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
            description={selectedInspiration ? "这里可以保存草稿、发起 AI 识图、应用建议、忽略或转为商品。" : "请选择左侧一条灵感记录。"}
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
                    disabled={aiPending || !data.runtime.isWritable}
                  >
                    <MiniIcon name="spark" className="h-4 w-4" />
                    {aiPending ? "识图中..." : "AI 识图建议"}
                  </button>
                  <button
                    formAction={applyAction}
                    type="submit"
                    className="inline-flex h-12 items-center rounded-2xl border border-[#DCE5F2] px-5 text-sm font-medium text-[#2563EB] disabled:opacity-70"
                    disabled={applyPending || !data.runtime.isWritable || !selectedInspiration.aiSuggestion}
                  >
                    应用到草稿
                  </button>
                  <button
                    formAction={ignoreAction}
                    type="submit"
                    className="inline-flex h-12 items-center rounded-2xl border border-[#DCE5F2] px-5 text-sm font-medium text-slate-600 disabled:opacity-70"
                    disabled={ignorePending || !data.runtime.isWritable}
                  >
                    忽略
                  </button>
                </div>
                {draftState.error ? <p className="text-sm text-rose-600">{draftState.error}</p> : null}
                {aiState.error ? <p className="text-sm text-rose-600">{aiState.error}</p> : null}
                {applyState.error ? <p className="text-sm text-rose-600">{applyState.error}</p> : null}
                {ignoreState.error ? <p className="text-sm text-rose-600">{ignoreState.error}</p> : null}
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
            <form action={convertAction} key={`${formKey}-convert`} className="space-y-3 px-5 py-5">
              <input type="hidden" name="inspirationId" value={selectedInspiration.id} />
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
                disabled={convertPending || !data.runtime.isWritable}
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
