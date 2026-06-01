import {
  DashboardCard,
  DashboardCardHeader,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  MiniIcon,
  StatusBadge,
  TableActionLink,
  TableScrollArea,
} from "@/components/dashboard/primitives";
import { ExportSubmitForm } from "@/components/export/export-submit-form";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { formatDateTime } from "@/lib/modules/products";
import { getRecentExportLogs } from "@/lib/services/export-service";

export const dynamic = "force-dynamic";

const modules = [
  {
    title: "Products",
    fields: ["商品ID", "商品名称", "一级类目", "利润率", "商品总分", "推荐结论"],
    count: "19 列",
    icon: "bag" as const,
  },
  {
    title: "Competitors",
    fields: ["竞品ID", "商品ID", "平台", "竞品标题", "热度指标", "截图路径"],
    count: "14 列",
    icon: "thumb" as const,
  },
  {
    title: "Copywriting",
    fields: ["文案ID", "商品ID", "平台", "版本", "标题", "正文"],
    count: "12 列",
    icon: "doc" as const,
  },
  {
    title: "PromptTasks",
    fields: ["Task ID", "商品ID", "平台", "图片类型", "Prompt 内容", "任务状态"],
    count: "10 列",
    icon: "prompt" as const,
  },
  {
    title: "Materials",
    fields: ["素材ID", "商品ID", "关联 Task ID", "文件路径", "尺寸", "来源"],
    count: "12 列",
    icon: "image" as const,
  },
  {
    title: "Scores",
    fields: ["评分ID", "商品ID", "商品总分", "六项分数", "扣分原因", "评分时间"],
    count: "14 列",
    icon: "spark" as const,
  },
];

function getStatusTone(status: string) {
  if (status === "成功") return "green" as const;
  if (status === "失败") return "red" as const;
  return "amber" as const;
}

export default async function ExportPage() {
  let history: Awaited<ReturnType<typeof getRecentExportLogs>> = [];
  let readError: string | null = null;

  try {
    history = await getRecentExportLogs();
  } catch (error) {
    readError = error instanceof Error ? error.message : "无法读取导出记录。";
  }

  return (
    <WorkspacePage
      eyebrow="Export"
      title="Excel 导出"
      description="一键导出商品、竞品、文案、Prompt、素材和评分数据。即使当前没有数据，也会生成带表头的 Excel。"
    >
      {readError ? (
        <DashboardCard className="px-5 py-4 text-sm text-rose-600">{readError}</DashboardCard>
      ) : null}

      <DashboardCard className="px-5 py-5">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#EEF4FF,#DDEBFF)] text-[#2563EB]">
              <MiniIcon name="download" className="h-14 w-14" />
            </div>
            <div className="max-w-2xl">
              <h2 className="text-[1.55rem] font-semibold tracking-[-0.03em] text-slate-900">
                一键导出全部数据
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                导出文件会写入本地 exports 目录，并记录在最近导出历史中。下载按钮会从本地文件读取最新生成的 Excel。
              </p>
              <div className="mt-4 inline-flex rounded-xl border border-[#E4EAF3] bg-[#F9FBFF] px-4 py-2 text-sm text-slate-500">
                EcomPilot_Export_YYYYMMDD_HHMM.xlsx
              </div>
            </div>
          </div>
          <div className="xl:min-w-[260px] xl:text-right">
            <ExportSubmitForm />
          </div>
        </div>
      </DashboardCard>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.68fr]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => (
            <DashboardCard key={item.title} className="px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2563EB]">
                  <MiniIcon name={item.icon} className="h-6 w-6" />
                </div>
                <h2 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-900">
                  {item.title}
                </h2>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-500">
                {item.fields.map((field) => (
                  <li key={field}>• {field}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-slate-400">{item.count}</p>
            </DashboardCard>
          ))}
        </div>

        <DashboardCard className="px-5 py-5">
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900">
            导出设置
          </h2>
          <div className="mt-5 space-y-4">
            {[
              { title: "包含文案正文", detail: "导出 Copywriting Sheet 的完整正文内容", checked: true },
              { title: "包含图片路径", detail: "导出竞品截图和素材文件的应用相对路径", checked: true },
              { title: "按当前筛选导出", detail: "后续版本提供，当前已禁用", checked: false, disabled: true },
              { title: "包含已软删除数据", detail: "后续版本提供，当前已禁用", checked: false, disabled: true },
            ].map((item) => (
              <div
                key={item.title}
                className={[
                  "flex items-start gap-3 rounded-2xl border border-[#EEF2F8] px-4 py-3",
                  item.disabled ? "bg-slate-50/70 opacity-75" : "",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "mt-1 flex h-5 w-5 items-center justify-center rounded-md border text-[10px]",
                    item.disabled
                      ? "border-slate-200 bg-slate-100 text-slate-400"
                      : item.checked
                        ? "border-blue-200 bg-blue-50 text-[#2563EB]"
                        : "border-[#D8E3F2] bg-white text-transparent",
                  ].join(" ")}
                >
                  {item.disabled ? "禁" : "✓"}
                </span>
                <div>
                  <p className="font-medium text-slate-900">
                    {item.title}
                    {item.disabled ? <span className="ml-2 text-xs font-normal text-slate-400">后续版本</span> : null}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <p className="text-sm text-slate-500">文件命名规则</p>
            <div className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-[#E4EAF3] px-4 py-3 text-sm text-slate-600">
              <span className="break-all font-mono">EcomPilot_Export_YYYYMMDD_HHMM.xlsx</span>
            </div>
          </div>
        </DashboardCard>
      </section>

      <DashboardCard>
        <DashboardCardHeader title="最近导出记录" />
        <TableScrollArea>
          <DataTable className="min-w-[1040px]">
            <DataTableHead>
              <tr>
                <DataTableHeaderCell className="w-[16%]">导出时间</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[28%]">文件名</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[28%]">包含 Sheet</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[10%]">状态</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[18%]">操作 / 错误</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {history.length > 0 ? (
                history.map((row) => (
                  <DataTableRow key={row.id}>
                    <DataTableCell className="text-slate-500">{formatDateTime(row.createdAt)}</DataTableCell>
                    <DataTableCell className="font-medium text-slate-900">
                      <span className="block truncate" title={row.fileName}>{row.fileName}</span>
                    </DataTableCell>
                    <DataTableCell>
                      <span className="block line-clamp-2 break-words" title={row.includedSheets}>{row.includedSheets}</span>
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge label={row.status} tone={getStatusTone(row.status)} />
                    </DataTableCell>
                    <DataTableCell>
                      {row.status === "成功" ? (
                        <div className="flex flex-wrap gap-2">
                          <TableActionLink href={`/api/exports/${row.id}`}>下载</TableActionLink>
                        </div>
                      ) : (
                        <span className="block line-clamp-2 break-words text-sm text-rose-500" title={row.errorMessage ?? "--"}>{row.errorMessage ?? "--"}</span>
                      )}
                    </DataTableCell>
                  </DataTableRow>
                ))
              ) : (
                <DataTableRow>
                  <DataTableCell colSpan={5} className="py-10 text-center text-sm text-slate-400">
                    暂无导出记录。
                  </DataTableCell>
                </DataTableRow>
              )}
            </DataTableBody>
          </DataTable>
        </TableScrollArea>
      </DashboardCard>
    </WorkspacePage>
  );
}
