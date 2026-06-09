"use client";

import { useActionState } from "react";
import { ActionButton, DashboardCard, DashboardCardHeader, DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeaderCell, DataTableRow, PageNote, StatusBadge, TableScrollArea } from "@/components/dashboard/primitives";
import type { ScoreEvaluation } from "@/lib/modules/scoring";
import type { SourceInspirationReference } from "@/lib/services/product-service";
import type { ScoreFormValues, ScoreSnapshotView } from "@/lib/services/scoring-service";

type SubmitState = {
  error?: string | null;
};

const noteCardClassName = "rounded-[22px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4";
const inputClassName =
  "w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 py-3 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

const recommendationToneMap = {
  建议测试: "green",
  淘汰: "red",
  临时评估: "blue",
  暂缓: "violet",
  待补充成本数据: "amber",
} as const;

function getRecommendationTone(recommendation: string) {
  return recommendationToneMap[recommendation as keyof typeof recommendationToneMap] ?? "violet";
}

function ScoreCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={noteCardClassName}>
      <p className="text-xs font-medium tracking-[0.03em] text-slate-400">{label}</p>
      <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.03em] text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-6 text-slate-400">{hint}</p> : null}
    </div>
  );
}

function ListCard({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <DashboardCard>
      <DashboardCardHeader title={title} />
      <div className="px-5 py-5">
        {items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item} className="flex gap-3 rounded-[22px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4 text-sm leading-7 text-slate-700">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <PageNote>{emptyText}</PageNote>
        )}
      </div>
    </DashboardCard>
  );
}

function HistorySection({ history }: { history: ScoreSnapshotView[] }) {
  return (
    <DashboardCard>
      <DashboardCardHeader title="历史评分记录" description="仅在点击“重新计算评分”后写入新的 ScoreSnapshot。" />
      <TableScrollArea>
        <DataTable className="min-w-[980px]">
          <DataTableHead>
            <tr>
              <DataTableHeaderCell className="w-[14%]">评分时间</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[10%]">总分</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[10%]">卖得出去</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[10%]">利润空间</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[10%]">售后风险</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[10%]">竞争强度</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[10%]">供应商</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[10%]">内容表现</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[10%]">结论</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[16%]">说明</DataTableHeaderCell>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {history.length > 0 ? (
              history.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell className="text-slate-500">{item.formattedCreatedAt}</DataTableCell>
                  <DataTableCell>{item.formattedTotalScore}</DataTableCell>
                  <DataTableCell>{typeof item.demandScore === "number" ? item.demandScore.toFixed(1) : "--"}</DataTableCell>
                  <DataTableCell>{typeof item.profitScore === "number" ? item.profitScore.toFixed(1) : "--"}</DataTableCell>
                  <DataTableCell>{typeof item.afterSalesScore === "number" ? item.afterSalesScore.toFixed(1) : "--"}</DataTableCell>
                  <DataTableCell>{typeof item.competitionScore === "number" ? item.competitionScore.toFixed(1) : "--"}</DataTableCell>
                  <DataTableCell>{typeof item.supplierScore === "number" ? item.supplierScore.toFixed(1) : "--"}</DataTableCell>
                  <DataTableCell>{typeof item.contentScore === "number" ? item.contentScore.toFixed(1) : "--"}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge
                      label={item.recommendation ?? "--"}
                      tone={item.recommendation === "建议测试" ? "green" : item.recommendation === "淘汰" ? "red" : "violet"}
                    />
                  </DataTableCell>
                  <DataTableCell className="text-slate-500">{item.recommendationNote ?? "--"}</DataTableCell>
                </DataTableRow>
              ))
            ) : (
              <DataTableRow>
                <DataTableCell colSpan={10} className="py-10 text-center text-sm text-slate-400">
                  暂无历史评分记录，点击“重新计算评分”后会生成第一条快照。
                </DataTableCell>
              </DataTableRow>
            )}
          </DataTableBody>
        </DataTable>
      </TableScrollArea>
    </DashboardCard>
  );
}

function buildFormalMissingItems(evaluation: ScoreEvaluation) {
  const items: string[] = [];

  if (!evaluation.flags.hasCompleteCostData) {
    items.push("预计售价、预计进货价、预计运费");
  }

  if (!evaluation.flags.hasEnoughCompetitors) {
    items.push(`至少 3 个有效竞品，当前仅有 ${evaluation.flags.validCompetitorCount} 个`);
  }

  return items;
}

function buildFormalNextStep(evaluation: ScoreEvaluation) {
  const missingCost = !evaluation.flags.hasCompleteCostData;
  const missingCompetitors = !evaluation.flags.hasEnoughCompetitors;

  if (missingCost && missingCompetitors) {
    return "先补成本，再补至少 3 个有效竞品，之后重新计算正式评分。";
  }

  if (missingCost) {
    return "先补售价、进货价和运费，之后重新计算正式评分。";
  }

  if (missingCompetitors) {
    return "先补至少 3 个有效竞品，之后重新计算正式评分。";
  }

  return evaluation.nextSuggestions[0] ?? "可以重新计算正式评分并据此判断是否进入小批量测试。";
}

export function ScoreTab({
  productId,
  evaluation,
  initialValues,
  latestSnapshot,
  scoreHistory,
  needsRescore,
  runtimeNotice,
  sourceInspirationReference,
  onSubmit,
}: {
  productId: number;
  evaluation: ScoreEvaluation;
  initialValues: ScoreFormValues;
  latestSnapshot: ScoreSnapshotView | null;
  scoreHistory: ScoreSnapshotView[];
  needsRescore: boolean;
  runtimeNotice?: string | null;
  sourceInspirationReference?: SourceInspirationReference | null;
  onSubmit: (prevState: SubmitState, formData: FormData) => Promise<SubmitState>;
}) {
  const [serverState, formAction, isPending] = useActionState(onSubmit, {});
  const latestConclusion = latestSnapshot?.recommendation ?? evaluation.recommendation;
  const latestScore = latestSnapshot?.formattedTotalScore ?? (evaluation.dimensions.totalScore === null ? "--" : evaluation.dimensions.totalScore.toFixed(1));
  const formalMissingItems = buildFormalMissingItems(evaluation);
  const primaryNextStep = buildFormalNextStep(evaluation);

  return (
    <div className="space-y-5 px-5 py-5">
      {runtimeNotice ? <PageNote>{runtimeNotice}</PageNote> : null}
      <PageNote>
        测试结论是规则化正式评估，不是 AI 自动判断。当前页面的评分预览基于已保存数据实时计算，不会自动写入数据库；只有点击“重新计算评分”后，才会保存手动风险字段、商品状态和历史评分快照。
      </PageNote>
      {needsRescore ? <PageNote>当前商品或竞品数据晚于最新评分时间，建议重新计算评分。</PageNote> : null}

      <div className="grid gap-5 xl:grid-cols-[1.04fr_0.96fr]">
        <DashboardCard>
          <DashboardCardHeader
            title="当前测试结论"
            description="这里回答的是：这个商品现在值不值得小批量测试。"
            action={<StatusBadge label={latestConclusion} tone={getRecommendationTone(latestConclusion)} />}
          />
          <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
            <div className={noteCardClassName}>
              <p className="text-xs font-medium tracking-[0.03em] text-slate-400">当前正式评分</p>
              <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.03em] text-slate-900">{latestScore}</p>
            </div>
            <div className={noteCardClassName}>
              <p className="text-xs font-medium tracking-[0.03em] text-slate-400">有效竞品数</p>
              <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.03em] text-slate-900">{evaluation.flags.validCompetitorCount}</p>
            </div>
            <div className="md:col-span-2">
              <div className={noteCardClassName}>
                <p className="text-xs font-medium tracking-[0.03em] text-slate-400">当前缺少</p>
                {formalMissingItems.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                    {formalMissingItems.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm leading-7 text-slate-700">正式评分的基础条件已经齐备，可以据此形成更稳定的测试结论。</p>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className={noteCardClassName}>
                <p className="text-xs font-medium tracking-[0.03em] text-slate-400">下一步建议</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{primaryNextStep}</p>
              </div>
            </div>
          </div>
        </DashboardCard>

        {sourceInspirationReference ? (
          <DashboardCard>
            <DashboardCardHeader
              title="来源灵感参考"
              description="草稿初筛分只作为线索参考带过来，不会直接继承为正式商品评分。"
            />
            <div className="space-y-4 px-5 py-5">
              <div className={noteCardClassName}>
                <p className="text-xs font-medium tracking-[0.03em] text-slate-400">来源灵感</p>
                <p className="mt-2 text-sm font-semibold leading-7 text-slate-900">
                  {sourceInspirationReference.title ?? `灵感 #${sourceInspirationReference.id}`}
                </p>
                <p className="mt-1 text-xs leading-6 text-slate-400">导入时间：{sourceInspirationReference.formattedImportedAt}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <ScoreCard label="来源初筛分" value={sourceInspirationReference.triage.scoreLabel} />
                <ScoreCard label="来源初筛结论" value={sourceInspirationReference.triage.conclusion} hint={sourceInspirationReference.triage.nextStep} />
              </div>
              <div className={noteCardClassName}>
                <p className="text-xs font-medium tracking-[0.03em] text-slate-400">参考说明</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{sourceInspirationReference.triage.rationale}</p>
                <p className="mt-2 text-xs leading-6 text-slate-400">{sourceInspirationReference.triage.disclaimer}</p>
              </div>
            </div>
          </DashboardCard>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.06fr_0.94fr]">
        <DashboardCard>
          <DashboardCardHeader
            title="正式评分预览"
            description="六维分数和总分会按当前规则实时生成，用来支撑最终测试结论。"
            action={
              <StatusBadge
                label={evaluation.recommendation}
                tone={getRecommendationTone(evaluation.recommendation)}
              />
            }
          />
          <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-3">
            <ScoreCard label="卖得出去概率分" value={evaluation.dimensions.demandScore.toFixed(1)} />
            <ScoreCard label="利润空间分" value={evaluation.dimensions.profitScore === null ? "--" : evaluation.dimensions.profitScore.toFixed(1)} />
            <ScoreCard label="售后风险分" value={evaluation.dimensions.afterSalesScore.toFixed(1)} />
            <ScoreCard label="竞争强度分" value={evaluation.dimensions.competitionScore.toFixed(1)} />
            <ScoreCard label="供应商稳定性分" value={evaluation.dimensions.supplierScore.toFixed(1)} hint="Thread 03 仍按默认 60 分处理。" />
            <ScoreCard label="内容表现力分" value={evaluation.dimensions.contentScore.toFixed(1)} />
            <ScoreCard label="商品总分" value={evaluation.dimensions.totalScore === null ? "--" : evaluation.dimensions.totalScore.toFixed(1)} />
            <ScoreCard label="推荐结论" value={evaluation.recommendation} />
            <ScoreCard label="有效竞品数" value={String(evaluation.flags.validCompetitorCount)} />
          </div>
          <div className="border-t border-[#EEF2F8] px-5 py-5">
            <div className={noteCardClassName}>
              <p className="text-xs font-medium tracking-[0.03em] text-slate-400">推荐结论说明</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{evaluation.recommendationNote}</p>
            </div>
          </div>
        </DashboardCard>

        <form action={formAction}>
          <DashboardCard>
            <DashboardCardHeader title="手动风险档位" description="只在点击“重新计算评分”后保存到 Product 和 ScoreSnapshot，用来影响正式测试结论。" />
            <div className="space-y-4 px-5 py-5">
              <label className="flex items-start gap-3 rounded-[22px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="manualRegulatedRisk"
                  defaultChecked={initialValues.manualRegulatedRisk}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                />
                <div>
                  <p className="font-medium text-slate-900">受监管高风险类目</p>
                  <p className="mt-1 leading-6 text-slate-500">用于标记食品 / 药品 / 保健品 / 活体 / 医疗功效等受监管场景。</p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-[22px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="manualInfringementRisk"
                  defaultChecked={initialValues.manualInfringementRisk}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                />
                <div>
                  <p className="font-medium text-slate-900">仿牌 / 侵权风险</p>
                  <p className="mt-1 leading-6 text-slate-500">命中后将触发一票否决，不再继续建议测试。</p>
                </div>
              </label>

              <label className="block">
                <div className="mb-2 text-sm font-medium text-slate-700">风险备注</div>
                <textarea
                  name="manualRiskNotes"
                  defaultValue={initialValues.manualRiskNotes}
                  className={`${inputClassName} min-h-[120px]`}
                  placeholder="补充手动风险判断依据，方便后续复盘。"
                />
              </label>

              {latestSnapshot ? (
                <div className={noteCardClassName}>
                  <p className="text-xs font-medium tracking-[0.03em] text-slate-400">最新已保存评分</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {latestSnapshot.formattedCreatedAt} · 总分 {latestSnapshot.formattedTotalScore} · {latestSnapshot.recommendation ?? "--"}
                  </p>
                </div>
              ) : (
                <PageNote>当前还没有已保存的评分记录，首次点击后会生成第一条 ScoreSnapshot。</PageNote>
              )}
            </div>

            {serverState.error ? (
              <div className="border-t border-[#EEF2F8] bg-rose-50 px-5 py-3 text-sm text-rose-600">{serverState.error}</div>
            ) : null}

            <div className="flex justify-end gap-3 border-t border-[#EEF2F8] px-5 py-4">
              <ActionButton href={`/products/${productId}?tab=${encodeURIComponent("测试结论")}`} variant="ghost">
                重置
              </ActionButton>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#4A86FF,#275FE8)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "计算中..." : "重新计算正式评分"}
              </button>
            </div>
          </DashboardCard>
        </form>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ListCard title="扣分原因" items={evaluation.deductionReasons} emptyText="当前没有额外扣分原因。" />
        <ListCard title="下一步建议" items={evaluation.nextSuggestions} emptyText="当前没有额外建议。" />
      </div>

      <HistorySection history={scoreHistory} />
    </div>
  );
}
