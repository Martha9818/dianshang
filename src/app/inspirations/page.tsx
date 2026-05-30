import { PageNote } from "@/components/dashboard/primitives";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { InspirationManager } from "@/components/inspirations/inspiration-manager";
import { getProductErrorMessage } from "@/lib/modules/products";
import { buildReadonlyRuntimeMessage, getRuntimeModeSummary } from "@/lib/services/product-runtime-service";
import { getInspirationPageData } from "@/lib/services/inspirations";

export const dynamic = "force-dynamic";

export default async function InspirationsPage() {
  const runtime = getRuntimeModeSummary();
  const readonlyNotice = runtime.isWritable ? null : buildReadonlyRuntimeMessage(runtime.mode);
  const pageResult = runtime.isWritable
    ? await getInspirationPageData().catch((error) => ({
        runtime: { isWritable: false },
        settingView: { configured: false, displayPath: null },
        inspirations: [],
        recentScanLogs: [],
        stats: { total: 0, pendingReview: 0, ignored: 0, converted: 0 },
        readError: getProductErrorMessage(error, "当前灵感页面无法读取本地数据，请在 Windows 本地重试。"),
      }))
    : null;
  const pageData = pageResult && "readError" in pageResult ? null : pageResult;
  const readError = pageResult && "readError" in pageResult ? pageResult.readError : null;

  return (
    <WorkspacePage
      eyebrow="Inbox / Inspirations"
      title="灵感箱"
      description="把商品图片放进本地文件夹后手动扫描，生成待审核灵感草稿，再按需应用 AI 建议或转为商品。"
    >
      {readError ? <PageNote>{readError}</PageNote> : null}
      {pageData ? <InspirationManager data={pageData} readonlyNotice={readonlyNotice} /> : <PageNote>{readonlyNotice ?? "当前灵感页面为只读预览。"}</PageNote>}
    </WorkspacePage>
  );
}
