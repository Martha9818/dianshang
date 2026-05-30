import Link from "next/link";
import {
  DashboardCard,
  DashboardCardHeader,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  EntityCell,
  MiniIcon,
  PageNote,
  StatCard,
  StatusBadge,
  TableActionLink,
  TableScrollArea,
} from "@/components/dashboard/primitives";
import { ProductImage } from "@/components/products/product-image";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { PRODUCT_STATUS_TONE } from "@/lib/modules/products/constants";
import { getDashboardTodoPageData, type DashboardTodoItem } from "@/lib/services/dashboardTodoService";
import { getHomeProductStatsPageData } from "@/lib/services/product-service";
import { getPromptTaskStatusTone } from "@/lib/services/prompt-task-service";

export const dynamic = "force-dynamic";

function countToneClass(tone: DashboardTodoItem["tone"]) {
  if (tone === "green") return "bg-emerald-50 text-emerald-600";
  if (tone === "blue") return "bg-blue-50 text-blue-600";
  if (tone === "red") return "bg-rose-50 text-rose-600";
  if (tone === "violet") return "bg-violet-50 text-violet-600";
  if (tone === "slate") return "bg-slate-100 text-slate-500";
  return "bg-amber-50 text-amber-600";
}

function todoBorderClass(tone: DashboardTodoItem["tone"]) {
  if (tone === "red") return "border-l-rose-300";
  if (tone === "blue") return "border-l-blue-300";
  if (tone === "violet") return "border-l-violet-300";
  if (tone === "green") return "border-l-emerald-300";
  if (tone === "slate") return "border-l-slate-300";
  return "border-l-amber-300";
}

function TodoItemRow({ item, isLast }: { item: DashboardTodoItem; isLast: boolean }) {
  return (
    <Link
      href={item.href}
      className={[
        "grid gap-3 border-l-4 px-4 py-4 transition hover:bg-blue-50/50 sm:grid-cols-[1fr_auto] sm:items-center",
        todoBorderClass(item.tone),
        !isLast && "border-b border-b-[#EEF2F8]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-semibold text-slate-800">{item.title}</p>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">{item.sourceLabel}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{item.description}</p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className={`inline-flex min-w-11 justify-center rounded-full px-3 py-1 text-sm font-semibold ${countToneClass(item.tone)}`}>
          {item.count}
        </span>
        <span className="inline-flex h-9 items-center rounded-xl border border-[#DCE5F2] bg-white px-3 text-sm font-medium text-[#2563EB]">
          {item.actionLabel}
        </span>
      </div>
    </Link>
  );
}

function badgeToneClass(action: string) {
  if (action === "GENERATE_COPYWRITING") return "bg-emerald-50 text-emerald-600";
  if (action === "UPDATE_COPYWRITING") return "bg-blue-50 text-blue-600";
  if (action.includes("PROMPT_TASK")) return "bg-violet-50 text-violet-600";
  if (action.includes("PROMPT_RESULT") || action.includes("MATERIAL")) return "bg-blue-50 text-blue-600";
  if (action.includes("INSPIRATION")) return "bg-amber-50 text-amber-600";
  if (action.includes("EXPORT")) return action.includes("FAILED") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600";
  if (action.includes("BACKUP")) return action.includes("FAILED") ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600";
  if (action.includes("BANNED_WORD")) return "bg-rose-50 text-rose-600";
  return "bg-amber-50 text-amber-600";
}

function activityLabel(action: string) {
  if (action === "GENERATE_COPYWRITING") return "生成";
  if (action === "UPDATE_COPYWRITING") return "编辑";
  if (action.includes("PROMPT_TASK")) return "Prompt";
  if (action.includes("PROMPT_RESULT") || action.includes("MATERIAL")) return "素材";
  if (action.includes("INSPIRATION")) return "灵感";
  if (action.includes("EXPORT")) return "导出";
  if (action.includes("BACKUP")) return "备份";
  if (action.includes("AI_PROVIDER")) return "AI";
  if (action.includes("BANNED_WORD")) return "词库";
  return "活动";
}

export default async function Home() {
  const [pageData, todoPageData] = await Promise.all([getHomeProductStatsPageData(), getDashboardTodoPageData()]);
  const data = pageData.kind === "ready" ? pageData.data : null;
  const todoSummary = todoPageData.kind === "ready" ? todoPageData.data : null;

  const totalCount = data?.totalCount ?? 0;
  const pendingCount = data?.pendingCount ?? 0;
  const suggestedCount = data?.suggestedCount ?? 0;
  const generatedCopywritingCount = data?.generatedCopywritingCount ?? 0;
  const promptTaskCount = data?.promptTaskCount ?? 0;
  const materialCount = data?.materialCount ?? 0;
  const recentProducts = data?.recentProducts ?? [];
  const recentPromptTasks = data?.recentPromptTasks ?? [];
  const recentActivities = data?.recentActivities ?? [];

  const statCards = [
    { label: "商品总数", value: String(totalCount), delta: "实时", tone: "blue" as const, icon: "bag" as const },
    { label: "待分析商品数", value: String(pendingCount), delta: "实时", tone: "amber" as const, icon: "clock" as const },
    { label: "建议测试商品数", value: String(suggestedCount), delta: "真实统计", tone: "green" as const, icon: "thumb" as const },
    { label: "已生成文案数量", value: String(generatedCopywritingCount), delta: "真实统计", tone: "blue" as const, icon: "doc" as const },
    { label: "Prompt 任务数量", value: String(promptTaskCount), delta: "真实统计", tone: "violet" as const, icon: "prompt" as const },
    { label: "已上传素材数量", value: String(materialCount), delta: "真实统计", tone: "green" as const, icon: "image" as const },
  ];

  return (
    <WorkspacePage
      eyebrow="Dashboard"
      title="首页仪表盘"
      description="本地运行的电商选品评估、文案协作、Prompt 生图任务与素材回传工作台。"
    >
      {pageData.kind === "unavailable" ? <PageNote>{pageData.message}</PageNote> : null}
      {todoPageData.kind === "unavailable" ? <PageNote>{todoPageData.message}</PageNote> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {statCards.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            delta={item.delta}
            tone={item.tone}
            icon={<MiniIcon name={item.icon} className="h-7 w-7" />}
            compact
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <DashboardCard>
          <DashboardCardHeader title="最近商品" action={<TableActionLink href="/products">查看全部</TableActionLink>} />
          <TableScrollArea>
            <DataTable className="min-w-[720px]">
              <DataTableHead>
                <tr>
                  <DataTableHeaderCell className="w-[42%]">商品信息</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[17%]">类目</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[15%]">状态</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[11%]">综合评分</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[15%]">更新时间</DataTableHeaderCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {recentProducts.length > 0 ? (
                  recentProducts.map((item) => (
                    <DataTableRow key={item.id}>
                      <DataTableCell>
                        <EntityCell
                          thumb={<ProductImage src={item.mainImagePath} alt={item.name} label={item.name.slice(0, 3)} />}
                          title={item.name}
                          subtitle={item.spu}
                        />
                      </DataTableCell>
                      <DataTableCell>{item.categoryLevel1 ?? "--"}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge label={item.status} tone={PRODUCT_STATUS_TONE[item.status] ?? "slate"} />
                      </DataTableCell>
                      <DataTableCell>{item.formattedLatestScore}</DataTableCell>
                      <DataTableCell className="text-slate-500">{item.formattedUpdatedAt}</DataTableCell>
                    </DataTableRow>
                  ))
                ) : (
                  <DataTableRow>
                    <DataTableCell colSpan={5} className="py-10 text-center text-sm text-slate-400">
                      暂无最近商品。
                    </DataTableCell>
                  </DataTableRow>
                )}
              </DataTableBody>
            </DataTable>
          </TableScrollArea>
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader title="最近 Prompt 任务" action={<TableActionLink href="/prompt-tasks">查看全部</TableActionLink>} />
          <TableScrollArea>
            <DataTable className="min-w-[620px]">
              <DataTableHead>
                <tr>
                  <DataTableHeaderCell className="w-[36%]">任务</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[18%]">平台</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[18%]">类型</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[14%]">状态</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[14%]">更新</DataTableHeaderCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {recentPromptTasks.length > 0 ? (
                  recentPromptTasks.map((task) => (
                    <DataTableRow key={task.id}>
                      <DataTableCell>
                        <EntityCell thumb={<MiniIcon name="prompt" className="h-5 w-5" />} title={task.taskCode} subtitle={task.product.name} />
                      </DataTableCell>
                      <DataTableCell>{task.platformLabel}</DataTableCell>
                      <DataTableCell>{task.imageTypeLabel}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge label={task.status} tone={getPromptTaskStatusTone(task.status)} />
                      </DataTableCell>
                      <DataTableCell>{task.formattedUpdatedAt}</DataTableCell>
                    </DataTableRow>
                  ))
                ) : (
                  <DataTableRow>
                    <DataTableCell colSpan={5} className="py-10 text-center text-sm text-slate-400">
                      暂无 Prompt 任务。
                    </DataTableCell>
                  </DataTableRow>
                )}
              </DataTableBody>
            </DataTable>
          </TableScrollArea>
        </DashboardCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <DashboardCard>
          <DashboardCardHeader
            title="待处理事项"
            description="从商品、灵感、素材、文案、AI 日志和备份记录计算，只提醒，不自动处理。"
          />
          <div className="px-5 pb-5">
            <div className="overflow-hidden rounded-[24px] border border-[#EEF2F8] bg-white">
              {todoSummary?.hasActionableItems ? (
                todoSummary.primaryItems.map((item, index) => (
                  <TodoItemRow key={item.type} item={item} isLast={index === todoSummary.primaryItems.length - 1 && todoSummary.utilityItems.length === 0} />
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-slate-500">当前没有明显待处理事项。</div>
              )}
              {todoSummary?.utilityItems.map((item, index) => (
                <TodoItemRow key={item.type} item={item} isLast={index === todoSummary.utilityItems.length - 1} />
              ))}
            </div>
          </div>
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader title="最近活动" action={<TableActionLink href="/copywriting">去文案生成</TableActionLink>} />
          <div className="px-5 pb-5">
            <div className="overflow-hidden rounded-[24px] border border-[#EEF2F8] bg-white">
              {recentActivities.length > 0 ? (
                recentActivities.map((item, index) => (
                  <div
                    key={item.id}
                    className={[
                      "flex items-center justify-between gap-4 px-4 py-4",
                      index !== recentActivities.length - 1 && "border-b border-[#EEF2F8]",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-slate-800">{item.detail ?? item.action}</p>
                      <p className="mt-1 truncate text-xs text-slate-400">{item.productName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeToneClass(item.action)}`}>{activityLabel(item.action)}</span>
                      <span className="text-sm font-medium text-slate-400">{item.formattedCreatedAt}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-slate-500">当前还没有活动记录。</div>
              )}
            </div>
          </div>
        </DashboardCard>
      </section>
    </WorkspacePage>
  );
}
