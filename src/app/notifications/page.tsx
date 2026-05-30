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
  FilterBar,
  MiniIcon,
  PageNote,
  StatCard,
  StatusBadge,
  TableActionLink,
  TableScrollArea,
} from "@/components/dashboard/primitives";
import {
  CleanupOldNotificationsForm,
  DeleteNotificationForm,
  MarkAllNotificationsReadForm,
  MarkNotificationReadForm,
} from "@/components/notifications/notification-actions";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { formatDateTime } from "@/lib/modules/products";
import {
  getNotificationCenterPageData,
  NOTIFICATION_TYPE_LABELS,
  type NotificationLevel,
  type NotificationStatus,
  type NotificationType,
} from "@/lib/services/notificationService";

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string;
  status?: string;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";

function levelTone(level: NotificationLevel) {
  if (level === "success") return "green" as const;
  if (level === "warning") return "amber" as const;
  if (level === "error") return "red" as const;
  return "blue" as const;
}

function statusTone(status: NotificationStatus) {
  return status === "unread" ? ("blue" as const) : ("slate" as const);
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 px-1 text-sm text-slate-500">{children}</p>;
}

function getTypeHref(type: NotificationType | "ALL") {
  if (type === "ALL") {
    return "/notifications";
  }

  return `/notifications?type=${type}`;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  let pageData: Awaited<ReturnType<typeof getNotificationCenterPageData>> | null = null;
  let readError: string | null = null;

  try {
    pageData = await getNotificationCenterPageData(params);
  } catch (error) {
    readError = error instanceof Error ? error.message : "无法读取通知。";
  }

  const activeType = pageData?.filters.type ?? "ALL";
  const activeStatus = pageData?.filters.status ?? "ALL";
  const notifications = pageData?.notifications ?? [];
  const isWritable = pageData?.runtime.isWritable ?? false;

  return (
    <WorkspacePage
      eyebrow="Notifications"
      title="通知中心"
      description="记录 AI、导出、备份、清理、灵感和商品等模块的重要操作结果，方便后续回看。"
    >
      {readError ? (
        <DashboardCard className="px-5 py-4 text-sm text-rose-600">{readError}</DashboardCard>
      ) : null}

      {pageData && !isWritable ? (
        <PageNote>预览环境可以查看通知；标记已读、删除和清理会返回“预览环境只读，请在 Windows 本地验收。”</PageNote>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          compact
          label="未读通知"
          value={String(pageData?.unreadCount ?? 0)}
          delta="需要回看"
          tone="blue"
          icon={<MiniIcon name="bell" className="h-6 w-6" />}
        />
        <StatCard
          compact
          label="通知总数"
          value={String(pageData?.totalCount ?? 0)}
          delta="本地记录"
          tone="slate"
          icon={<MiniIcon name="list" className="h-6 w-6" />}
        />
        <StatCard
          compact
          label="已读通知"
          value={String(pageData?.statusCounts.read ?? 0)}
          delta="已处理"
          tone="green"
          icon={<MiniIcon name="shield" className="h-6 w-6" />}
        />
      </section>

      <FilterBar>
        <div className="flex w-full flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
          <form className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
            <div className="xl:min-w-[180px]">
              <FilterLabel>类型</FilterLabel>
              <select name="type" defaultValue={activeType} className={inputClassName}>
                <option value="ALL">全部类型</option>
                {pageData?.typeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label} ({item.count})
                  </option>
                ))}
              </select>
            </div>
            <div className="xl:min-w-[180px]">
              <FilterLabel>状态</FilterLabel>
              <select name="status" defaultValue={activeStatus} className={inputClassName}>
                <option value="ALL">全部状态</option>
                <option value="unread">未读 ({pageData?.statusCounts.unread ?? 0})</option>
                <option value="read">已读 ({pageData?.statusCounts.read ?? 0})</option>
              </select>
            </div>
            <button
              type="submit"
              className="h-12 cursor-pointer rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(43,115,255,0.22)] transition hover:-translate-y-[1px]"
            >
              筛选
            </button>
            <Link
              href="/notifications"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#DCE5F2] bg-white px-5 text-sm font-medium text-slate-600 transition hover:-translate-y-[1px] hover:bg-slate-50"
            >
              重置
            </Link>
          </form>
          <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-start xl:justify-end">
            <MarkAllNotificationsReadForm type={activeType} disabled={!isWritable} />
            <CleanupOldNotificationsForm />
          </div>
        </div>
      </FilterBar>

      <DashboardCard>
        <DashboardCardHeader
          title="通知列表"
          description="通知只保存脱敏摘要、业务 ID 和安全站内跳转，不保存完整本地路径、API Key 或完整错误堆栈。"
        />
        <div className="flex flex-wrap gap-2 border-b border-[#EEF2F8] px-5 py-3">
          <TableActionLink href={getTypeHref("ALL")}>全部</TableActionLink>
          {pageData?.typeOptions.map((item) => (
            <TableActionLink key={item.value} href={getTypeHref(item.value)}>
              {NOTIFICATION_TYPE_LABELS[item.value]} {item.count}
            </TableActionLink>
          ))}
        </div>
        <TableScrollArea>
          <DataTable className="min-w-[1060px]">
            <DataTableHead>
              <tr>
                <DataTableHeaderCell className="w-[13%]">时间</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[10%]">类型</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[10%]">级别</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[12%]">状态</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[31%]">内容</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[10%]">关联</DataTableHeaderCell>
                <DataTableHeaderCell className="w-[14%]">操作</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <DataTableRow key={item.id} className={item.isUnread ? "bg-blue-50/30" : undefined}>
                    <DataTableCell className="text-slate-500">{formatDateTime(item.createdAt)}</DataTableCell>
                    <DataTableCell>
                      <StatusBadge label={item.typeLabel} tone="slate" />
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge label={item.levelLabel} tone={levelTone(item.level)} />
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge label={item.status === "unread" ? "未读" : "已读"} tone={statusTone(item.status)} />
                    </DataTableCell>
                    <DataTableCell>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      {item.message ? <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.message}</p> : null}
                    </DataTableCell>
                    <DataTableCell className="text-slate-500">
                      {item.relatedType ? (
                        <span>
                          {item.relatedType}
                          {item.relatedId ? ` #${item.relatedId}` : ""}
                        </span>
                      ) : (
                        "--"
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      <div className="flex flex-wrap gap-2">
                        {item.actionUrl ? <TableActionLink href={item.actionUrl}>打开</TableActionLink> : null}
                        {item.status === "unread" ? (
                          <MarkNotificationReadForm notificationId={item.id} disabled={!isWritable} />
                        ) : null}
                        <DeleteNotificationForm notificationId={item.id} />
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))
              ) : (
                <DataTableRow>
                  <DataTableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    暂无通知。
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
