import { CopywritingManager } from "@/components/copywriting/copywriting-manager";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { getProductErrorMessage } from "@/lib/modules/products";
import { getCopywritingPageData } from "@/lib/services/copywriting-service";
import { getRuntimeModeSummary } from "@/lib/services/product-runtime-service";

export const dynamic = "force-dynamic";

type CopywritingPageData = Awaited<ReturnType<typeof getCopywritingPageData>>;

export default async function CopywritingPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; platform?: string; providerId?: string }>;
}) {
  const params = await searchParams;
  const runtime = getRuntimeModeSummary();
  const pageData: CopywritingPageData = await getCopywritingPageData({
    productId: params.productId ? Number(params.productId) : null,
    platform: params.platform ?? null,
    providerId: params.providerId ? Number(params.providerId) : null,
  }).catch((error) => {
    if (!runtime.isWritable) {
      return {
        products: [],
        providers: [],
        defaultProviderId: null,
        selectedProductId: null,
        selectedPlatform: params.platform ?? null,
        copywritings: [],
        groupedCopywritings: [],
        readNotice: getProductErrorMessage(error, "当前预览环境无法读取本地文案数据，请在 Windows 本地验收。"),
      };
    }

    throw error;
  });

  return (
    <WorkspacePage
      eyebrow="Copywriting"
      title="多平台文案包"
      description="为单个商品生成闲鱼、淘宝、小红书、抖音文案草稿，支持历史保留、编辑保存、违规词扫描、AIJob 追踪和实际使用版本标记。"
    >
      <CopywritingManager
        key={`${pageData.selectedProductId ?? "none"}:${pageData.selectedPlatform ?? "none"}:${pageData.defaultProviderId ?? "none"}`}
        products={pageData.products}
        providers={pageData.providers}
        defaultProviderId={pageData.defaultProviderId}
        initialProductId={pageData.selectedProductId}
        initialPlatform={pageData.selectedPlatform}
        initialCopywritings={pageData.copywritings}
        initialGroupedCopywritings={pageData.groupedCopywritings}
        runtimeNotice={runtime.isWritable ? null : "预览环境只读，请在 Windows 本地验收 AI 调用。"}
        dataNotice={pageData.readNotice}
      />
    </WorkspacePage>
  );
}
