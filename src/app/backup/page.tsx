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
  TableScrollArea,
} from "@/components/dashboard/primitives";
import { BackupSubmitForm } from "@/components/backup/backup-submit-form";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { formatDateTime } from "@/lib/modules/products";
import { formatBytes, getBackupSummary, getRecentBackupLogs } from "@/lib/services/backup-log-service";

export const dynamic = "force-dynamic";

function getStatusTone(status: string) {
  if (status === "成功") return "green" as const;
  if (status === "失败") return "red" as const;
  return "amber" as const;
}

export default async function BackupPage() {
  let history: Awaited<ReturnType<typeof getRecentBackupLogs>> = [];
  let summary: Awaited<ReturnType<typeof getBackupSummary>> | null = null;
  let readError: string | null = null;

  try {
    [history, summary] = await Promise.all([getRecentBackupLogs(), getBackupSummary()]);
  } catch (error) {
    readError = error instanceof Error ? error.message : "无法读取备份记录。";
  }

  const latestBackupTime = summary?.latest ? formatDateTime(summary.latest.createdAt) : "尚未备份";
  const backupRoot = summary?.backupRootDisplayPath ?? "backups/";
  const backupCount = summary?.count ?? history.length;

  return (
    <WorkspacePage
      eyebrow="Backup"
      title="手动备份"
      description="复制本地 SQLite 数据库和 uploads 素材目录到 backups/yyyyMMdd_HHmmss/。MVP 只提供备份，不提供恢复。"
    >
      {readError ? (
        <DashboardCard className="px-5 py-4 text-sm text-rose-600">{readError}</DashboardCard>
      ) : null}

      <DashboardCard className="px-5 py-5">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#EDF5FF,#D9E8FF)] text-[#2563EB]">
              <MiniIcon name="database" className="h-14 w-14" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-900">
                  当前备份状态：{summary?.latest ? "最近已备份" : "等待首次备份"}
                </h2>
                <StatusBadge label={summary?.latest ? "本地已记录" : "未备份"} tone={summary?.latest ? "green" : "amber"} />
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                点击立即备份后，系统会复制 SQLite 数据库、uploads 文件夹，以及可选配置参考文件。文件占用、权限不足或目标目录创建失败时会写入失败记录。
              </p>
              <div className="mt-4 grid gap-4 text-sm text-slate-600 md:grid-cols-3">
                <div>
                  <p className="text-slate-400">最近备份时间</p>
                  <p className="mt-1 font-medium text-slate-900">{latestBackupTime}</p>
                </div>
                <div>
                  <p className="text-slate-400">备份路径</p>
                  <p className="mt-1 break-all font-medium text-slate-900">{backupRoot}</p>
                </div>
                <div>
                  <p className="text-slate-400">备份数量</p>
                  <p className="mt-1 font-medium text-slate-900">{backupCount} 条记录</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
                当前为手动备份，无自动备份间隔。旧备份请通过“文件清理与回收站”按人工确认流程清理，本页不会后台自动删除备份。
              </div>
            </div>
          </div>
          <BackupSubmitForm />
        </div>
      </DashboardCard>

      <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <DashboardCard className="px-5 py-5">
          <div className="flex items-center gap-2 text-[#2563EB]">
            <MiniIcon name="backup" className="h-5 w-5" />
            <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900">
              将要备份的内容
            </h2>
          </div>
          <div className="mt-5 space-y-3">
            {[
              ["SQLite 数据库文件", "prisma/dev.db / dev.db-wal / dev.db-shm", "包含商品、竞品、文案、Prompt、素材、评分、日志等结构化数据", "必备"],
              ["uploads 文件夹", "uploads/", "包含本地上传的商品主图、Prompt 回传图、手动素材和竞品截图", "必备"],
              ["配置参考文件", ".env.example", "作为恢复环境时的参考；不会复制真实 .env", "可选"],
            ].map((item) => (
              <div key={item[0]} className="rounded-[22px] border border-[#EEF2F8] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
                      ✓
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{item[0]}</p>
                      <p className="mt-1 text-sm text-slate-500">{item[1]}</p>
                    </div>
                  </div>
                  <StatusBadge label={item[3]} tone={item[3] === "可选" ? "slate" : "blue"} />
                </div>
                <p className="mt-3 text-sm text-slate-500">{item[2]}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[22px] border border-[#E5ECF5] bg-[#F8FBFF] px-4 py-4 text-sm leading-7 text-slate-500">
            备份目标目录格式：
            <div className="mt-3 inline-flex rounded-xl border border-[#DDE6F3] bg-white px-3 py-1.5 font-mono text-xs text-slate-500">
              backups/yyyyMMdd_HHmmss/
            </div>
          </div>
        </DashboardCard>

        <DashboardCard>
          <DashboardCardHeader title="最近备份历史" />
          <TableScrollArea>
            <DataTable className="min-w-[900px]">
              <DataTableHead>
                <tr>
                  <DataTableHeaderCell className="w-[18%]">备份时间</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[42%]">目录路径</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[12%]">状态</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[12%]">大小</DataTableHeaderCell>
                  <DataTableHeaderCell className="w-[16%]">错误原因</DataTableHeaderCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {history.length > 0 ? (
                  history.map((row) => (
                    <DataTableRow key={row.id}>
                      <DataTableCell className="text-slate-500">{formatDateTime(row.createdAt)}</DataTableCell>
                      <DataTableCell className="break-all text-slate-500">{row.backupDisplayPath}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge label={row.status} tone={getStatusTone(row.status)} />
                      </DataTableCell>
                      <DataTableCell>{formatBytes(row.size)}</DataTableCell>
                      <DataTableCell className="text-rose-500">{row.errorMessage ?? "--"}</DataTableCell>
                    </DataTableRow>
                  ))
                ) : (
                  <DataTableRow>
                    <DataTableCell colSpan={5} className="py-10 text-center text-sm text-slate-400">
                      暂无备份记录。
                    </DataTableCell>
                  </DataTableRow>
                )}
              </DataTableBody>
            </DataTable>
          </TableScrollArea>
        </DashboardCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.62fr]">
        <DashboardCard className="px-5 py-5">
          <div className="flex items-center gap-2 text-[#2563EB]">
            <MiniIcon name="shield" className="h-5 w-5" />
            <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900">
              备份说明
            </h2>
          </div>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <li>• 备份仅写入本地 backups 目录，不上传云端。</li>
            <li>• uploads 不存在时会自动创建空目录，再进入备份流程。</li>
            <li>• 如果存在 dev.db-wal / dev.db-shm，备份会与 dev.db 一起复制；仍建议停止本地服务后执行重要备份。</li>
            <li>• SQLite 数据库可能包含 AI Provider 配置，请按敏感数据妥善保管。</li>
            <li>• 建议保留最近 10 个或最近 30 天内的成功备份；超出的旧备份继续走文件清理页移入回收站，不做静默自动删除。</li>
            <li>• 如果备份失败，请检查磁盘空间、文件权限、数据库文件占用和目录可写状态。</li>
          </ul>
        </DashboardCard>

        <DashboardCard className="px-5 py-5">
          <div className="flex items-center gap-2 text-[#2563EB]">
            <MiniIcon name="backup" className="h-5 w-5" />
            <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900">
              恢复功能
            </h2>
          </div>
          <div className="mt-5 flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-[#D8E3F2] bg-[#FAFCFF] px-4 text-center text-sm leading-7 text-slate-400">
            恢复功能将在后续版本提供；Thread 07 只实现手动备份。
          </div>
        </DashboardCard>
      </section>
    </WorkspacePage>
  );
}
