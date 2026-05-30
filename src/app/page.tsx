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
import { getHomeProductStatsPageData } from "@/lib/services/product-service";
import { getPromptTaskStatusTone } from "@/lib/services/prompt-task-service";

export const dynamic = "force-dynamic";

function countToneClass(tone: "amber" | "green") {
  return tone === "green" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600";
}

function badgeToneClass(action: string) {
  if (action === "GENERATE_COPYWRITING") return "bg-emerald-50 text-emerald-600";
  if (action === "UPDATE_COPYWRITING") return "bg-blue-50 text-blue-600";
  if (action.includes("PROMPT_TASK")) return "bg-violet-50 text-violet-600";
  if (action.includes("PROMPT_RESULT") || action.includes("MATERIAL")) return "bg-blue-50 text-blue-600";
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
  if (action.includes("EXPORT")) return "导出";
  if (action.includes("BACKUP")) return "备份";
  if (action.includes("AI_PROVIDER")) return "AI";
  if (action.includes("BANNED_WORD")) return "词库";
  return "活动";
}

export default async function Home() {
  const pageData = await getHomeProductStatsPageData();
  const data = pageData.kind === "ready" ? pageData.data : null;

  const totalCount = data?.totalCount ?? 0;
  const pendingCount = data?.pendingCount ?? 0;
  const suggestedCount = data?.suggestedCount ?? 0;
  const generatedCopywritingCount = data?.generatedCopywritingCount ?? 0;
  const promptTaskCount = data?.promptTaskCount ?? 0;
  const pendingPromptReturnCount = data?.pendingPromptReturnCount ?? 0;
  const materialCount = data?.materialCount ?? 0;
  const pendingMaterialReviewCount = data?.pendingMaterialReviewCount ?? 0;
  const recentProducts = data?.recentProducts ?? [];
  const recentPromptTasks = data?.recentPromptTasks ?? [];
  const recentActivities = data?.recentActivities ?? [];

  const todoItems = [
    { title: "缺少竞品数据", count: data?.missingCompetitorCount ?? 0, tone: "amber" as const, href: "/products" },
    { title: "缺少成本数据", count: data?.missingCostCount ?? 0, tone: "amber" as const, href: "/products" },
    { title: "需要重新评分", count: data?.needsRescoreCount ?? 0, tone: "green" as const, href: "/products?needsRescore=true" },
    { title: "待回传图片", count: pendingPromptReturnCount, tone: "amber" as const, href: "/prompt-tasks" },
    { title: "待审核素材", count: pendingMaterialReviewCount, tone: "amber" as const, href: "/materials?status=%E5%BE%85%E5%AE%A1%E6%A0%B8" },
  ];

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
          <DashboardCardHeader title="待处理事项" />
          <div className="px-5 pb-5">
            <div className="overflow-hidden rounded-[24px] border border-[#EEF2F8] bg-white">
              {todoItems.map((item, index) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={[
                    "flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-blue-50/50",
                    index !== todoItems.length - 1 && "border-b border-[#EEF2F8]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <p className="truncate text-[15px] font-medium text-slate-800">{item.title}</p>
                  <span className={`inline-flex min-w-11 justify-center rounded-full px-3 py-1 text-sm font-semibold ${countToneClass(item.tone)}`}>
                    {item.count}
                  </span>
                </Link>
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
