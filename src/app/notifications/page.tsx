import Link from "next/link";
import {
  DashboardCard,
  FilterBar,
  MiniIcon,
  PageNote,
  StatCard,
} from "@/components/dashboard/primitives";
import { NotificationListCard } from "@/components/notifications/notification-list-card";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { AutoFilterForm } from "@/components/ui/auto-filter-form";
import {
  getNotificationCenterPageData,
} from "@/lib/services/notificationService";

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string;
  status?: string;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 px-1 text-sm text-slate-500">{children}</p>;
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
        <AutoFilterForm action="/notifications" className="flex w-full flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
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
          <Link
            href="/notifications"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#DCE5F2] bg-white px-5 text-sm font-medium text-slate-600 transition hover:-translate-y-[1px] hover:bg-slate-50"
          >
            重置
          </Link>
        </AutoFilterForm>
      </FilterBar>

      {pageData ? (
        <NotificationListCard
          notifications={pageData.notifications}
          typeOptions={pageData.typeOptions}
          isWritable={isWritable}
        />
      ) : null}
    </WorkspacePage>
  );
}
