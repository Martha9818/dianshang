import Link from "next/link";
import {
  DashboardCard,
  DashboardCardHeader,
  MiniIcon,
  PageNote,
  StatusBadge,
  TableActionLink,
} from "@/components/dashboard/primitives";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { getLocalAssistantPageData, type LocalAssistantSuggestion, type LocalAssistantSummaryItem } from "@/lib/modules/local-assistant";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";

function toneToBadgeTone(tone: LocalAssistantSuggestion["tone"] | LocalAssistantSummaryItem["tone"]) {
  return tone;
}

function actionTypeLabel(actionType: LocalAssistantSuggestion["actionType"]) {
  if (actionType === "filter") return "筛选";
  if (actionType === "search") return "搜索";
  if (actionType === "view") return "查看";
  return "跳转";
}

function SuggestionCard({ suggestion }: { suggestion: LocalAssistantSuggestion }) {
  return (
    <div className="rounded-[22px] border border-[#EEF2F8] bg-white px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={suggestion.badgeLabel} tone="blue" />
        <StatusBadge label={actionTypeLabel(suggestion.actionType)} tone={toneToBadgeTone(suggestion.tone)} />
        <span className="text-xs text-slate-400">{suggestion.source === "ai_plus_rule" ? "AI 意图识别 + 规则校验" : "规则生成"}</span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-900">{suggestion.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{suggestion.description}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">原因：{suggestion.reason}</p>
      <div className="mt-4">
        <TableActionLink href={suggestion.href}>打开建议入口</TableActionLink>
      </div>
    </div>
  );
}

function SummaryItemRow({ item }: { item: LocalAssistantSummaryItem }) {
  return (
    <Link
      href={item.href}
      className="grid gap-3 rounded-[22px] border border-[#EEF2F8] bg-white px-4 py-4 transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-900">{item.title}</span>
        <StatusBadge label={item.sourceLabel} tone="slate" />
        <StatusBadge label={item.actionType === "view" ? "查看" : "跳转"} tone={toneToBadgeTone(item.tone)} />
      </div>
      <p className="text-sm leading-6 text-slate-500">{item.description}</p>
    </Link>
  );
}

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const pageData = await getLocalAssistantPageData(params.q ?? null);

  return (
    <WorkspacePage
      eyebrow="Assistant"
      title="站内助手"
      description="基于本地已有商品、竞品、素材、文案、Prompt、灵感、通知、清理记录、备份导出记录和 AI 日志摘要，提供只读搜索建议与通知摘要。"
    >
      <PageNote>{pageData.topNotice}</PageNote>
      {pageData.readonlyNotice ? <PageNote>{pageData.readonlyNotice}</PageNote> : null}
      {pageData.searchError ? <PageNote>{pageData.searchError}</PageNote> : null}
      {pageData.summaryError ? <PageNote>{pageData.summaryError}</PageNote> : null}

      <section className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <DashboardCard>
          <DashboardCardHeader
            title="站内搜索助手"
            description="输入自然语言问题后，系统只返回本地只读筛选建议、查看建议或跳转建议，不会直接执行任何写操作。"
          />
          <div className="px-5 py-5">
            <form className="flex flex-col gap-3 lg:flex-row">
              <input
                type="text"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="例如：找出缺成本且评分高的商品"
                className={inputClassName}
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.22)] transition hover:-translate-y-[1px]"
              >
                <MiniIcon name="spark" className="h-4 w-4" />
                生成建议
              </button>
              <TableActionLink href="/assistant">重置</TableActionLink>
            </form>

            <div className="mt-4 rounded-[22px] border border-dashed border-[#D8E3F2] bg-[#F8FBFF] px-4 py-4 text-sm leading-6 text-slate-500">
              助手只会返回 `view`、`search`、`filter`、`navigate` 四类动作。任何删除、归档、批量处理、清理、通知写操作、生图或改状态，都需要你进入对应页面后手动确认。
            </div>

            {pageData.searchResult ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[22px] border border-[#EEF2F8] bg-white px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={pageData.searchResult.strategyLabel} tone="blue" />
                    <StatusBadge
                      label={
                        pageData.searchResult.aiStatus === "success"
                          ? "AI 已参与"
                          : pageData.searchResult.aiStatus === "failed"
                            ? "AI 已降级"
                            : pageData.searchResult.aiStatus === "skipped_preview"
                              ? "预览只读"
                              : "规则模式"
                      }
                      tone={pageData.searchResult.aiStatus === "failed" ? "amber" : "slate"}
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">问题：{pageData.searchResult.question}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{pageData.searchResult.helperText}</p>
                  {pageData.searchResult.blockedMessage ? (
                    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-700">
                      {pageData.searchResult.blockedMessage}
                    </p>
                  ) : null}
                  {pageData.searchResult.fallbackMessage ? (
                    <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-sm leading-6 text-blue-700">
                      {pageData.searchResult.fallbackMessage}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4">
                  {pageData.searchResult.suggestions.map((suggestion) => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                <p className="text-sm font-medium text-slate-700">可直接尝试这些问题：</p>
                {pageData.examples.map((example) => (
                  <Link
                    key={example}
                    href={`/assistant?q=${encodeURIComponent(example)}`}
                    className="rounded-[20px] border border-[#EEF2F8] bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-blue-200 hover:bg-blue-50/40"
                  >
                    {example}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader
            title="通知摘要助手"
            description="基于应用内通知、首页待办、AI 失败、备份状态和已有文件清理记录生成“今天建议关注什么”的只读摘要。"
          />
          <div className="space-y-5 px-5 py-5">
            {pageData.summary.sections.map((section) => (
              <section key={section.key} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">{section.title}</h3>
                  <StatusBadge label="辅助建议" tone="blue" />
                </div>
                {section.items.length > 0 ? (
                  <div className="grid gap-3">
                    {section.items.map((item) => (
                      <SummaryItemRow key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <PageNote>{section.emptyText}</PageNote>
                )}
              </section>
            ))}
          </div>
        </DashboardCard>
      </section>
    </WorkspacePage>
  );
}
