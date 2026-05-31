"use client";

import { useMemo, useState } from "react";
import {
  DashboardCard,
  DashboardCardHeader,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  PageNote,
  StatusBadge,
  TableScrollArea,
} from "@/components/dashboard/primitives";

type CompetitorAnalysisCompetitorView = {
  id: number;
  platform: string;
  title: string;
  price: number;
  heatMetricType: string;
  heatMetricValue: number;
  sellingPoint: string | null;
  painPoint: string | null;
  imageStyle: string | null;
  formattedPrice: string;
  formattedHeatMetricValue: string;
  formattedDataDate: string;
};

type CompetitorAnalysisStatsView = {
  validCount: number;
  hasEnoughCompetitors: boolean;
};

type CompetitorAnalysisSnapshotView = {
  id: number;
  competitorIdList: number[];
  summary: string | null;
  differentiationAdvice: string | null;
  priceBandSummary: string | null;
  sellingPointSummary: string | null;
  imageStyleSummary: string | null;
  copywritingStyleSummary: string | null;
  riskTips: string | null;
  nextStepAdvice: string | null;
  dataGapAdvice: string | null;
  uncertaintyNotes: string | null;
  model: string | null;
  provider: string | null;
  status: string;
  errorSummary: string | null;
  isReference: boolean;
  archivedAt: Date | null;
  formattedCreatedAt: string;
  formattedArchivedAt: string | null;
  statusTone: "blue" | "amber" | "green" | "violet" | "red" | "slate";
  riskHitCount: number;
};

type ActionState = (formData: FormData) => void | Promise<void>;

const checkboxClassName = "h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500";
const primaryButtonClassName =
  "inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.20)] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClassName =
  "inline-flex h-10 items-center justify-center rounded-xl border border-[#DCE5F2] bg-white px-3 text-sm font-medium text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60";
const dangerButtonClassName =
  "inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-sm font-medium text-rose-600 disabled:cursor-not-allowed disabled:opacity-60";

export function CompetitorAnalysisTab({
  competitors,
  stats,
  snapshots,
  minCompetitorCount,
  runtimeNotice,
  analysisError,
  onGenerate,
  onMarkReference,
  onArchive,
}: {
  productId: number;
  competitors: CompetitorAnalysisCompetitorView[];
  stats: CompetitorAnalysisStatsView;
  snapshots: CompetitorAnalysisSnapshotView[];
  minCompetitorCount: number;
  runtimeNotice?: string | null;
  analysisError?: string | null;
  onGenerate: ActionState;
  onMarkReference: ActionState;
  onArchive: ActionState;
}) {
  const [selectedIds, setSelectedIds] = useState(() => competitors.map((competitor) => competitor.id));
  const selectedCount = selectedIds.length;
  const canAnalyze = !runtimeNotice && selectedCount >= minCompetitorCount;
  const selectedCompetitorTitles = useMemo(() => {
    const selected = new Set(selectedIds);
    return competitors.filter((competitor) => selected.has(competitor.id)).map((competitor) => competitor.title);
  }, [competitors, selectedIds]);

  return (
    <div className="space-y-5 px-5 py-5">
      <PageNote>AI 辅助建议，仅供参考。分析结果不会自动修改六维评分、推荐结论、商品状态或竞品事实字段；如需评分更新，请由用户手动触发。</PageNote>
      {runtimeNotice ? <PageNote>{runtimeNotice}</PageNote> : null}
      {analysisError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{analysisError}</div> : null}
      {!stats.hasEnoughCompetitors ? <PageNote>建议先补充竞品数据：至少录入 3 个有效竞品后再生成智能分析。</PageNote> : null}

      <DashboardCard>
        <DashboardCardHeader
          title="选择参与分析的竞品"
          description="只使用当前商品下已手动录入或已确认的本地数据；不会访问外部平台链接。"
        />
        <form action={onGenerate}>
          <TableScrollArea>
            <DataTable className="min-w-[940px]">
              <DataTableHead>
                <tr>
                  <DataTableHeaderCell className="w-[7%]">选择</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[13%]">平台</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[28%]">竞品</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[10%]">价格</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[14%]">热度</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[14%]">图片风格</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[14%]">数据日期</DataTableHeaderCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {competitors.length > 0 ? (
                  competitors.map((competitor) => {
                    const checked = selectedIds.includes(competitor.id);
                    return (
                      <DataTableRow key={competitor.id}>
                        <DataTableCell>
                          <input
                            type="checkbox"
                            name="competitorIds"
                            value={competitor.id}
                            className={checkboxClassName}
                            checked={checked}
                            disabled={Boolean(runtimeNotice)}
                            onChange={(event) => {
                              setSelectedIds((current) =>
                                event.target.checked
                                  ? Array.from(new Set([...current, competitor.id]))
                                  : current.filter((id) => id !== competitor.id),
                              );
                            }}
                          />
                        </DataTableCell>
                        <DataTableCell>{competitor.platform}</DataTableCell>
                        <DataTableCell>
                          <p className="truncate font-medium text-slate-900">{competitor.title}</p>
                          <p className="truncate text-xs text-slate-400">{competitor.sellingPoint ?? competitor.painPoint ?? "--"}</p>
                        </DataTableCell>
                        <DataTableCell>{competitor.formattedPrice}</DataTableCell>
                        <DataTableCell>
                          {competitor.heatMetricType} / {competitor.formattedHeatMetricValue}
                        </DataTableCell>
                        <DataTableCell>{competitor.imageStyle ?? "--"}</DataTableCell>
                        <DataTableCell>{competitor.formattedDataDate}</DataTableCell>
                      </DataTableRow>
                    );
                  })
                ) : (
                  <DataTableRow>
                    <DataTableCell colSpan={7} className="py-10 text-center text-sm text-slate-400">
                      暂无竞品数据，建议先补充竞品数据。
                    </DataTableCell>
                  </DataTableRow>
                )}
              </DataTableBody>
            </DataTable>
          </TableScrollArea>
          <div className="flex flex-col gap-3 border-t border-[#EEF2F8] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-6 text-slate-500">
              已选择 {selectedCount} 个竞品
              {selectedCompetitorTitles.length > 0 ? `：${selectedCompetitorTitles.slice(0, 4).join(" / ")}` : ""}
              {selectedCompetitorTitles.length > 4 ? " ..." : ""}
            </p>
            <button type="submit" className={primaryButtonClassName} disabled={!canAnalyze}>
              生成 / 重新生成分析
            </button>
          </div>
        </form>
      </DashboardCard>

      <DashboardCard>
        <DashboardCardHeader
          title="历史分析"
          description="重新生成会创建新的快照；标记参考版本不会改写评分、推荐结论或商品状态。"
        />
        <div className="space-y-4 px-5 py-5">
          {snapshots.length > 0 ? (
            snapshots.map((snapshot) => {
              const archived = Boolean(snapshot.archivedAt) || snapshot.status === "archived";
              return (
                <article key={snapshot.id} className="rounded-[24px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">分析快照 #{snapshot.id}</h3>
                        <StatusBadge label={snapshot.status} tone={snapshot.statusTone} />
                        {snapshot.isReference ? <StatusBadge label="参考版本" tone="blue" /> : null}
                        {snapshot.riskHitCount > 0 ? <StatusBadge label={`风险词 ${snapshot.riskHitCount}`} tone="amber" /> : null}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {snapshot.formattedCreatedAt} / 竞品 {snapshot.competitorIdList.length} 个 / {snapshot.provider ?? "unknown"} / {snapshot.model ?? "unknown"}
                        {snapshot.formattedArchivedAt ? ` / 已归档 ${snapshot.formattedArchivedAt}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={onMarkReference}>
                        <input type="hidden" name="snapshotId" value={snapshot.id} />
                        <button
                          type="submit"
                          className={secondaryButtonClassName}
                          disabled={Boolean(runtimeNotice) || archived || snapshot.status !== "success"}
                        >
                          标记参考
                        </button>
                      </form>
                      <form action={onArchive}>
                        <input type="hidden" name="snapshotId" value={snapshot.id} />
                        <button
                          type="submit"
                          className={dangerButtonClassName}
                          disabled={Boolean(runtimeNotice) || archived}
                          onClick={(event) => {
                            const firstConfirm = window.confirm("确认归档这次竞品智能分析吗？");
                            if (!firstConfirm) {
                              event.preventDefault();
                              return;
                            }

                            const secondConfirm = window.confirm("请再次确认归档。归档不会删除商品、竞品、评分或 AI 日志。");
                            if (!secondConfirm) {
                              event.preventDefault();
                            }
                          }}
                        >
                          归档
                        </button>
                      </form>
                    </div>
                  </div>

                  {snapshot.errorSummary ? <p className="mt-4 text-sm leading-6 text-rose-600">{snapshot.errorSummary}</p> : null}
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <AnalysisSection title="竞品共性" value={snapshot.summary} />
                    <AnalysisSection title="价格带" value={snapshot.priceBandSummary} />
                    <AnalysisSection title="卖点共性" value={snapshot.sellingPointSummary} />
                    <AnalysisSection title="图片风格" value={snapshot.imageStyleSummary} />
                    <AnalysisSection title="文案风格" value={snapshot.copywritingStyleSummary} />
                    <AnalysisSection title="差异化机会" value={snapshot.differentiationAdvice} />
                    <AnalysisSection title="新手风险" value={snapshot.riskTips} />
                    <AnalysisSection title="小批量测试建议" value={snapshot.nextStepAdvice} />
                    <AnalysisSection title="建议补充的数据" value={snapshot.dataGapAdvice} />
                    <AnalysisSection title="不确定性说明" value={snapshot.uncertaintyNotes} />
                  </div>
                </article>
              );
            })
          ) : (
            <PageNote>暂无历史分析。选择至少 3 个竞品后可以生成第一份竞品智能分析。</PageNote>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}

function AnalysisSection({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="rounded-2xl border border-[#EEF2F8] bg-white px-4 py-4">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{value ?? "--"}</p>
    </div>
  );
}
