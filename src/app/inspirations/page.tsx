import { PageNote } from "@/components/dashboard/primitives";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { InspirationManager } from "@/components/inspirations/inspiration-manager";
import { getProductErrorMessage } from "@/lib/modules/products";
import { getRuntimeModeSummary } from "@/lib/services/product-runtime-service";
import { getInspirationPageData } from "@/lib/services/inspirations";
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

export default async function InspirationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const runtime = getRuntimeModeSummary();
  const query = normalizeInspirationListQuery(params);
  const readonlyNotice = runtime.isWritable ? null : "预览环境只读，请在 Windows 本地验收。";
  const pageResult = await getInspirationPageData(query).catch((error) => ({
    runtime: { isWritable: false },
    settingView: { configured: false, displayPath: null },
    inspirations: [],
    recentScanLogs: [],
    filters: query,
    sourceTypes: [],
    statuses: [],
    stats: { total: 0, pendingReview: 0, ignored: 0, converted: 0 },
    readError: getProductErrorMessage(error, "当前灵感页面无法读取本地数据，请在 Windows 本地重试。"),
  }));
  const pageData = "readError" in pageResult ? null : pageResult;
  const readError = "readError" in pageResult ? pageResult.readError : null;

  return (
    <WorkspacePage
      eyebrow="Inbox / Inspirations"
      title="灵感箱"
      description="查看手动扫描导入的灵感草稿，并按标题、来源、状态、转商品状态和图片可用性筛选。"
    >
      {readError ? <PageNote>{readError}</PageNote> : null}
      {pageData ? (
        <InspirationManager data={pageData} readonlyNotice={readonlyNotice} />
      ) : (
        <PageNote>{readonlyNotice ?? "当前灵感页面暂无可读预览数据。"}</PageNote>
      )}
    </WorkspacePage>
  );
}
