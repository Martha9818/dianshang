import {
  DashboardCard,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  MiniIcon,
  StatusBadge,
  TableScrollArea,
} from "@/components/dashboard/primitives";
import { DiagnosticsSummaryActions } from "@/components/diagnostics/diagnostics-summary-actions";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { getDiagnosticsSnapshot, type DiagnosticsStatus } from "@/lib/services/diagnostics";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

function getTone(status: DiagnosticsStatus) {
  if (status === "ok") return "green" as const;
  if (status === "warning") return "amber" as const;
  if (status === "error") return "red" as const;
  return "slate" as const;
}

function formatBoolean(value: boolean | null) {
  if (value === null) {
    return "未知";
  }

  return value ? "是" : "否";
}

function formatCount(value: number | null) {
  return value === null ? "未知" : String(value);
}

function joinEntries(entries: string[]) {
  return entries.length > 0 ? entries.join("；") : "暂无";
}

function isHealthy(status: DiagnosticsStatus) {
  return status === "ok";
}

function SummaryTile({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: ReturnType<typeof getTone>;
}) {
  return (
    <div className="rounded-2xl border border-[#EEF2F8] bg-[#FAFCFF] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <StatusBadge label={value} tone={tone} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#EEF2F8] px-4 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-2xl border border-[#E7ECF3] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
        <span>
          <span className="block text-sm font-semibold text-slate-900">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-slate-500">{summary}</span>
        </span>
        <span className="text-sm font-medium text-[#2563EB] group-open:hidden">展开</span>
        <span className="hidden text-sm font-medium text-slate-500 group-open:inline">收起</span>
      </summary>
      <div className="border-t border-[#EEF2F8] px-5 py-5">{children}</div>
    </details>
  );
}

export default async function DiagnosticsPage() {
  const diagnostics = await getDiagnosticsSnapshot();
  const healthyDirectoryCount = diagnostics.directories.filter((directory) => directory.status === "ok").length;
  const failedDirectoryCount = diagnostics.directories.length - healthyDirectoryCount;
  const databaseCounts: Array<[string, number | null]> = [
    ["商品", diagnostics.database.counts.products],
    ["素材", diagnostics.database.counts.materials],
    ["灵感", diagnostics.database.counts.inspirations],
    ["文案", diagnostics.database.counts.copywritings],
    ["多平台文案组", diagnostics.database.counts.multiPlatformCopywritings],
    ["Prompt 任务", diagnostics.database.counts.promptTasks],
    ["备份记录", diagnostics.database.counts.backups],
    ["导出记录", diagnostics.database.counts.exports],
  ];

  return (
    <WorkspacePage
      eyebrow="System"
      title="诊断中心"
      description="先复制脱敏摘要，再按需展开详细诊断。Vercel 只读预览不会写入本地数据。"
    >
      {diagnostics.app.readonlyMessage ? (
        <DashboardCard className="border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-700">
          {diagnostics.app.readonlyMessage}
        </DashboardCard>
      ) : null}

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]">
        <DashboardCard className="px-5 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
                <MiniIcon name="shield" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[1.12rem] font-semibold text-slate-900">当前状态总览</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  只显示排障入口信息；完整记录在下方详细诊断里。
                </p>
              </div>
            </div>
            <StatusBadge
              label={diagnostics.app.isWritableRuntime ? "本地可写" : "只读预览"}
              tone={diagnostics.app.isWritableRuntime ? "green" : "amber"}
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SummaryTile
              label="运行环境"
              value={diagnostics.app.runtimeMode}
              tone={diagnostics.app.isWritableRuntime ? "green" : "amber"}
              detail={`${diagnostics.app.runtimeServiceLabel} · ${diagnostics.app.isVercel ? "Vercel" : "Windows 本地"}`}
            />
            <SummaryTile
              label="数据库"
              value={diagnostics.database.canConnect ? "可连接" : "未连接"}
              tone={getTone(diagnostics.database.status)}
              detail={diagnostics.database.message}
            />
            <SummaryTile
              label="本地目录"
              value={failedDirectoryCount === 0 ? "正常" : `${failedDirectoryCount} 项需检查`}
              tone={failedDirectoryCount === 0 ? "green" : "amber"}
              detail={`${healthyDirectoryCount}/${diagnostics.directories.length} 个目录可用`}
            />
            <SummaryTile
              label="AI"
              value={diagnostics.ai.status}
              tone={getTone(diagnostics.ai.status)}
              detail={diagnostics.recentAiFailures}
            />
            <SummaryTile
              label="图片"
              value={diagnostics.images.status}
              tone={getTone(diagnostics.images.status)}
              detail={diagnostics.images.message}
            />
            <SummaryTile
              label="灵感扫描"
              value={diagnostics.inspirations.status}
              tone={getTone(diagnostics.inspirations.status)}
              detail={diagnostics.inspirations.message}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-[#EEF2F8] bg-[#FAFCFF] px-4 py-3">
            <div className="flex items-start gap-3">
              <MiniIcon name="database" className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">最近错误</p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                  {joinEntries(diagnostics.recentErrors.entries)}
                </p>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="px-5 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[1.12rem] font-semibold text-slate-900">脱敏诊断摘要</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                第一时间复制给 ChatGPT / Claude。摘要不包含 API Key、完整路径、完整 Prompt 或堆栈。
              </p>
            </div>
            <StatusBadge label="已脱敏" tone="green" />
          </div>
          <div className="mt-4">
            <DiagnosticsSummaryActions markdown={diagnostics.summaryMarkdown} />
          </div>
        </DashboardCard>
      </section>

      <DashboardCard className="px-5 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[1.12rem] font-semibold text-slate-900">详细诊断</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              低频信息默认折叠，排查时再展开查看。这里保留原有诊断能力。
            </p>
          </div>
          <StatusBadge
            label={isHealthy(diagnostics.database.status) && isHealthy(diagnostics.images.status) ? "核心正常" : "有提示"}
            tone={isHealthy(diagnostics.database.status) && isHealthy(diagnostics.images.status) ? "green" : "amber"}
          />
        </div>

        <div className="mt-5 space-y-3">
          <DetailSection
            title="应用与数据库"
            summary={`runtime=${diagnostics.app.runtimeMode}，SQLite=${diagnostics.database.canConnect ? "可连接" : "未连接"}`}
          >
            <div className="grid gap-3 lg:grid-cols-4">
              <MetricTile label="appVersion" value={diagnostics.app.appVersion} />
              <MetricTile label="runtimeService" value={`${diagnostics.app.runtimeServiceMode} / ${diagnostics.app.runtimeServiceLabel}`} />
              <MetricTile label="Node.js" value={diagnostics.app.nodeVersion} />
              <MetricTile label="操作系统" value={diagnostics.app.osSummary} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {databaseCounts.map(([label, value]) => (
                <MetricTile key={label} label={label} value={formatCount(value)} />
              ))}
            </div>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600 lg:grid-cols-2">
              <p>最近备份：{diagnostics.database.latestBackup ?? "暂无"}</p>
              <p>最近导出：{diagnostics.database.latestExport ?? "暂无"}</p>
              <p>SQLite WAL：{diagnostics.database.sqlitePragmas.walEnabled ? "已尝试启用" : "未启用"}</p>
              <p>busy_timeout：{diagnostics.database.sqlitePragmas.busyTimeoutSet ? "已尝试设置" : "未设置"}</p>
              <p className="lg:col-span-2">{diagnostics.database.sqlitePragmas.message}</p>
            </div>
          </DetailSection>

          <DetailSection
            title="本地目录"
            summary={`uploads / exports / backups / logs：${healthyDirectoryCount}/${diagnostics.directories.length} 正常`}
          >
            <TableScrollArea className="px-0 py-0">
              <DataTable className="min-w-[720px]">
                <DataTableHead>
                  <tr>
                    <DataTableHeaderCell className="w-[22%]">目录</DataTableHeaderCell>
                    <DataTableHeaderCell className="w-[14%]">存在</DataTableHeaderCell>
                    <DataTableHeaderCell className="w-[14%]">可写</DataTableHeaderCell>
                    <DataTableHeaderCell className="w-[16%]">状态</DataTableHeaderCell>
                    <DataTableHeaderCell className="w-[34%]">说明</DataTableHeaderCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {diagnostics.directories.map((directory) => (
                    <DataTableRow key={directory.key}>
                      <DataTableCell className="font-mono text-slate-900">{directory.displayPath}</DataTableCell>
                      <DataTableCell>{formatBoolean(directory.exists)}</DataTableCell>
                      <DataTableCell>{formatBoolean(directory.writable)}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge label={directory.status} tone={getTone(directory.status)} />
                      </DataTableCell>
                      <DataTableCell>{directory.message}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </TableScrollArea>
          </DetailSection>

          <DetailSection
            title="图片与灵感"
            summary={`图片=${diagnostics.images.status}，灵感=${diagnostics.inspirations.status}`}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile label="素材总数" value={formatCount(diagnostics.images.materialTotal)} />
              <MetricTile label="有缩略图" value={formatCount(diagnostics.images.withThumbnail)} />
              <MetricTile label="缺失文件" value={formatCount(diagnostics.images.missingFiles)} />
              <MetricTile label="仅参考" value={formatCount(diagnostics.images.referenceOnly)} />
              <MetricTile label="灵感总数" value={formatCount(diagnostics.inspirations.total)} />
              <MetricTile label="待处理" value={formatCount(diagnostics.inspirations.pendingReview)} />
              <MetricTile label="uploads 摘要" value={diagnostics.images.uploadsSummary} />
              <MetricTile label="最近失败识图" value={joinEntries(diagnostics.inspirations.recentFailedVisionJobs)} />
            </div>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600 xl:grid-cols-3">
              <div className="rounded-2xl border border-[#EEF2F8] bg-[#FAFCFF] px-4 py-3">
                <p className="font-medium text-slate-900">最近 ScanLog</p>
                <p className="mt-1 break-all">{joinEntries(diagnostics.inspirations.recentScanLogs)}</p>
              </div>
              <div className="rounded-2xl border border-[#EEF2F8] bg-[#FAFCFF] px-4 py-3">
                <p className="font-medium text-slate-900">最近失败扫描</p>
                <p className="mt-1 break-all">{joinEntries(diagnostics.inspirations.recentFailedScans)}</p>
              </div>
              <div className="rounded-2xl border border-[#EEF2F8] bg-[#FAFCFF] px-4 py-3">
                <p className="font-medium text-slate-900">图片摘要</p>
                <p className="mt-1 break-all">{diagnostics.images.message}</p>
              </div>
            </div>
          </DetailSection>

          <DetailSection
            title="AI 与最近错误"
            summary={`AIJob=${formatCount(diagnostics.ai.recentJobCount)}，错误=${diagnostics.recentErrors.status}`}
          >
            <div className="grid gap-3 md:grid-cols-3">
              <MetricTile
                label="AI 设置"
                value={diagnostics.ai.settingsConfigured === null ? "未知" : diagnostics.ai.settingsConfigured ? "存在" : "未配置"}
              />
              <MetricTile label="最近 AIJob" value={formatCount(diagnostics.ai.recentJobCount)} />
              <MetricTile label="估算成本合计" value={diagnostics.ai.estimatedCostTotal ?? "未启用"} />
            </div>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600 xl:grid-cols-2">
              <div className="rounded-2xl border border-[#EEF2F8] bg-[#FAFCFF] px-4 py-3">
                <p className="font-medium text-slate-900">最近 AIJob</p>
                <p className="mt-1 break-all">{joinEntries(diagnostics.ai.recentJobs)}</p>
              </div>
              <div className="rounded-2xl border border-[#EEF2F8] bg-[#FAFCFF] px-4 py-3">
                <p className="font-medium text-slate-900">最近失败 AIJob</p>
                <p className="mt-1 break-all">{joinEntries(diagnostics.ai.recentFailedJobs)}</p>
              </div>
              <div className="rounded-2xl border border-[#EEF2F8] bg-[#FAFCFF] px-4 py-3">
                <p className="font-medium text-slate-900">最近文案 AI 失败</p>
                <p className="mt-1 break-all">{joinEntries(diagnostics.ai.recentCopywritingFailedJobs)}</p>
              </div>
              <div className="rounded-2xl border border-[#EEF2F8] bg-[#FAFCFF] px-4 py-3">
                <p className="font-medium text-slate-900">最近 AIRequestLog</p>
                <p className="mt-1 break-all">{joinEntries(diagnostics.ai.recentRequestLogs)}</p>
              </div>
              <div className="rounded-2xl border border-[#EEF2F8] bg-[#FAFCFF] px-4 py-3">
                <p className="font-medium text-slate-900">最近文案 AIRequestLog</p>
                <p className="mt-1 break-all">{joinEntries(diagnostics.ai.recentCopywritingRequestLogs)}</p>
              </div>
              <div className="rounded-2xl border border-[#EEF2F8] bg-[#FAFCFF] px-4 py-3">
                <p className="font-medium text-slate-900">最近错误摘要</p>
                <p className="mt-1 break-all">{joinEntries(diagnostics.recentErrors.entries)}</p>
              </div>
            </div>
          </DetailSection>
        </div>
      </DashboardCard>
    </WorkspacePage>
  );
}
