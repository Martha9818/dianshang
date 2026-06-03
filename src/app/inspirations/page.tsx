import { PageNote } from "@/components/dashboard/primitives";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { InspirationManager } from "@/components/inspirations/inspiration-manager";
import { getProductErrorMessage } from "@/lib/modules/products";
import { getRuntimeModeSummary } from "@/lib/services/product-runtime-service";
import { getInspirationPageData, INSPIRATION_SOURCE_TYPES, INSPIRATION_STATUSES } from "@/lib/services/inspirations";
import { normalizeInspirationListQuery } from "@/lib/services/query-service";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  sourceType?: string;
  status?: string;
  converted?: string;
  hasImage?: string;
  sort?: string;
};

const PREVIEW_SOURCE_TYPE_OPTIONS = [
  { value: INSPIRATION_SOURCE_TYPES.FOLDER_MANUAL_SCAN, label: "手动文件夹扫描" },
  { value: INSPIRATION_SOURCE_TYPES.FOLDER_SCHEDULED_SCAN, label: "定时文件夹扫描" },
];

const PREVIEW_STATUS_OPTIONS = [
  { value: INSPIRATION_STATUSES.PENDING, label: "待处理" },
  { value: INSPIRATION_STATUSES.REVIEWED, label: "已查看" },
  { value: INSPIRATION_STATUSES.CONVERTED, label: "已转商品" },
  { value: INSPIRATION_STATUSES.ARCHIVED, label: "已归档" },
  { value: INSPIRATION_STATUSES.REJECTED, label: "已放弃" },
];

export default async function InspirationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const runtime = getRuntimeModeSummary();
  const query = normalizeInspirationListQuery(params);
  const readonlyNotice = runtime.isWritable ? null : "预览环境只读，请在 Windows 本地验收灵感文件夹扫描和 AI 识图。";
  const pageResult = await getInspirationPageData(query).catch((error) => ({
    runtime: { isWritable: false },
    settingView: { configured: false, displayPath: null, scanEnabled: false, scanIntervalMinutes: 30 },
    inspirations: [],
    recentScanLogs: [],
    latestScan: null,
    recentTasks: { scanJobs: [], aiDraftJobs: [] },
    filters: query,
    sourceTypes: PREVIEW_SOURCE_TYPE_OPTIONS,
    statuses: PREVIEW_STATUS_OPTIONS,
    stats: { total: 0, pending: 0, reviewed: 0, converted: 0, archived: 0, rejected: 0 },
    readError: getProductErrorMessage(error, "当前灵感页面无法读取本地数据，请在 Windows 本地重试。"),
  }));
  const pageData = pageResult;
  const readError = "readError" in pageResult ? pageResult.readError : null;

  return (
    <WorkspacePage
      eyebrow="Main Entry / AI Inbox"
      title="AI 收件箱"
      description="日常处理工作台。围绕看图、看 AI 草稿、做初筛，再决定保留、放弃或转商品。"
    >
      {readError ? <PageNote>{readError}</PageNote> : null}
      <InspirationManager data={pageData} readonlyNotice={readonlyNotice} />
    </WorkspacePage>
  );
}
