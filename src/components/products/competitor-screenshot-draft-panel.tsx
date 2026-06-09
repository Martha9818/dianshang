"use client";

import {
  DashboardCard,
  DashboardCardHeader,
  PageNote,
  StatusBadge,
  TableActionLink,
} from "@/components/dashboard/primitives";
import { ProductImage } from "@/components/products/product-image";

export type CompetitorScreenshotDraftCandidateView = {
  id: number;
  imagePath: string;
  displayPath: string;
  sourceLabel: string;
  status: string;
  statusLabel: string;
  statusTone: "blue" | "amber" | "green" | "violet" | "red" | "slate";
  qualityLevel: string | null;
  qualityLabel: string;
  qualityTone: "blue" | "amber" | "green" | "violet" | "red" | "slate";
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  possibleTitle: string | null;
  possiblePrice: string | null;
  possiblePlatformSource: string | null;
  possibleSalesOrHeat: string | null;
  sellingPoints: string[];
  uncertaintyNotes: string[];
  privacyNotes: string[];
  hasStructuredDraft: boolean;
  hasConfirmedDraft: boolean;
  linkedCompetitorId: number | null;
  canConfirmDirectly: boolean;
  confirmStateLabel: string;
  confirmStateTone: "blue" | "amber" | "green" | "violet" | "red" | "slate";
  confirmBlockedReason: string | null;
};

export function CompetitorScreenshotDraftPanel({
  productId,
  candidates,
  runtimeNotice,
}: {
  productId: number;
  candidates: CompetitorScreenshotDraftCandidateView[];
  runtimeNotice?: string | null;
}) {
  return (
    <DashboardCard>
      <DashboardCardHeader
        title="竞品截图草稿候选"
        description="V1.7 Design Gate 只读预备层：当前复用 ScreenshotRecognitionJob 展示竞品截图草稿候选，AI 识别结果仍需人工确认后再录入正式竞品。"
        action={<TableActionLink href={`/screenshots?sourceType=competitor&productId=${productId}`}>打开截图识别页</TableActionLink>}
      />

      <div className="space-y-4 px-5 py-5">
        <PageNote>
          正式竞品截图路径仍沿用{" "}
          <code className="rounded bg-white px-1 py-0.5 font-mono text-xs text-slate-600">
            uploads/products/{productId}/competitors/...
          </code>
          。这个面板只做只读候选展示，不创建目录，不迁移路径，不触发 AI，也不写入正式{" "}
          <code className="rounded bg-white px-1 py-0.5 font-mono text-xs text-slate-600">Competitor</code>
          记录。
        </PageNote>
        {runtimeNotice ? <PageNote>{runtimeNotice}</PageNote> : null}

        {candidates.length > 0 ? (
          <div className="space-y-4">
            {candidates.map((candidate) => {
              const showLowQualityWarning = candidate.qualityLevel === "low" || candidate.qualityLevel === "failed";

              return (
                <div key={candidate.id} className="rounded-[24px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4">
                  <div className="grid gap-4 lg:grid-cols-[104px_1fr]">
                    <div className="w-[104px]">
                      <ProductImage src={candidate.displayPath} alt={candidate.imagePath} label="竞品图" square />
                    </div>

                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">草稿任务 #{candidate.id}</p>
                        <StatusBadge label={candidate.statusLabel} tone={candidate.statusTone} />
                        <StatusBadge label={candidate.qualityLabel} tone={candidate.qualityTone} />
                        <StatusBadge label={candidate.confirmStateLabel} tone={candidate.confirmStateTone} />
                      </div>

                      <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                        <DetailRow label="来源" value={candidate.sourceLabel} />
                        <DetailRow label="创建时间" value={candidate.formattedCreatedAt} />
                        <DetailRow label="最近更新" value={candidate.formattedUpdatedAt} />
                        <DetailRow label="当前图片" value={candidate.imagePath} mono />
                      </div>

                      {candidate.confirmBlockedReason ? <PageNote>{candidate.confirmBlockedReason}</PageNote> : null}
                      {showLowQualityWarning ? (
                        <PageNote>当前截图识别质量偏低，请逐项人工核对后再决定是否继续保留或重做草稿。</PageNote>
                      ) : null}
                      {candidate.privacyNotes.length > 0 ? (
                        <PageNote>当前包含隐私提醒，请先人工检查敏感内容是否适合进入正式竞品记录。</PageNote>
                      ) : null}
                      {candidate.uncertaintyNotes.length > 0 ? (
                        <PageNote>当前存在不确定项，请把这些线索当作参考，不要直接当成正式竞品事实。</PageNote>
                      ) : null}

                      {candidate.hasStructuredDraft ? (
                        <>
                          <div className="grid gap-3 md:grid-cols-2">
                            <ValueCard label="候选标题" value={candidate.possibleTitle ?? "--"} />
                            <ValueCard label="候选价格" value={candidate.possiblePrice ?? "--"} />
                            <ValueCard label="候选平台" value={candidate.possiblePlatformSource ?? "--"} />
                            <ValueCard label="候选销量/热度" value={candidate.possibleSalesOrHeat ?? "--"} />
                          </div>

                          <div className="grid gap-3 lg:grid-cols-3">
                            <ListCard label="候选卖点" values={candidate.sellingPoints} />
                            <ListCard label="不确定项" values={candidate.uncertaintyNotes} />
                            <ListCard label="隐私提醒" values={candidate.privacyNotes} />
                          </div>
                        </>
                      ) : (
                        <PageNote>当前还没有可读的 AI 草稿字段，这里先保留截图任务记录，后续仍需在截图识别页查看或补录。</PageNote>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <TableActionLink href={`/screenshots?jobId=${candidate.id}`}>查看草稿详情</TableActionLink>
                        <TableActionLink href={`/screenshots?sourceType=competitor&productId=${productId}`}>继续补录截图</TableActionLink>
                        {candidate.linkedCompetitorId ? (
                          <TableActionLink href={`/products/${productId}?tab=competitors&editCompetitorId=${candidate.linkedCompetitorId}`}>
                            查看已确认竞品
                          </TableActionLink>
                        ) : candidate.canConfirmDirectly ? (
                          <TableActionLink href={`/products/${productId}?tab=competitors&confirmDraftJobId=${candidate.id}`}>
                            确认转正式竞品
                          </TableActionLink>
                        ) : (
                          <TableActionLink href={`/screenshots?jobId=${candidate.id}`}>先回截图识别页处理</TableActionLink>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <PageNote>
            当前还没有“竞品截图草稿候选”。如需补录竞品截图，请先在截图识别页以{" "}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs text-slate-600">sourceType=competitor</code>{" "}
            创建草稿任务。Design Gate 完成前，这里仍不会直接提供“转正式竞品写入”操作。
          </PageNote>
        )}
      </div>
    </DashboardCard>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className={mono ? "break-all font-mono text-xs text-slate-600" : "text-sm text-slate-700"}>{value}</span>
    </div>
  );
}

function ValueCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/80 bg-white px-4 py-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function ListCard({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-[20px] border border-white/80 bg-white px-4 py-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      {values.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
          {values.map((value) => (
            <li key={value} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              <span>{value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-500">--</p>
      )}
    </div>
  );
}
