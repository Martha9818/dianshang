import { CopywritingManager } from "@/components/copywriting/copywriting-manager";
import { DashboardCard, FilterBar } from "@/components/dashboard/primitives";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { COPYWRITING_PLATFORMS, COPYWRITING_VERSIONS } from "@/lib/modules/copywriting/prompts";
import { getProductErrorMessage } from "@/lib/modules/products";
import { getCopywritingPageData } from "@/lib/services/copywriting-service";
import { getRuntimeModeSummary } from "@/lib/services/product-runtime-service";
import { normalizeCopywritingListQuery } from "@/lib/services/query-service";

export const dynamic = "force-dynamic";

type SearchParams = {
  productId?: string;
  platform?: string;
  providerId?: string;
  q?: string;
  version?: string;
  hasViolation?: string;
  sort?: string;
};

type CopywritingPageData = Awaited<ReturnType<typeof getCopywritingPageData>>;

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";

export default async function CopywritingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const runtime = getRuntimeModeSummary();
  const query = normalizeCopywritingListQuery(params);
  const pageData: CopywritingPageData = await getCopywritingPageData(query).catch((error) => {
    if (!runtime.isWritable) {
      return {
        products: [],
        providers: [],
        defaultProviderId: null,
        selectedProductId: null,
        selectedPlatform: query.platform,
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
      description="管理商品文案历史，按商品、平台、版本、违规词结果和创建时间快速筛选。"
    >
      <DashboardCard className="px-4 py-4">
        <FilterBar>
          <form action="/copywriting" method="get" className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_180px_140px_140px_150px_160px_auto] xl:items-end">
            <FilterField label="商品关键词">
              <input name="q" defaultValue={query.keyword ?? ""} placeholder="搜索商品 / 标题 / 正文" className={inputClassName} />
            </FilterField>
            <FilterField label="商品">
              <select name="productId" defaultValue={query.productId ?? ""} className={inputClassName}>
                <option value="">全部商品</option>
                {pageData.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="平台">
              <select name="platform" defaultValue={query.platform ?? ""} className={inputClassName}>
                <option value="">全部平台</option>
                {COPYWRITING_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="版本">
              <select name="version" defaultValue={query.version ?? ""} className={inputClassName}>
                <option value="">全部版本</option>
                {COPYWRITING_VERSIONS.map((version) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="违规词">
              <select name="hasViolation" defaultValue={query.hasViolation ?? ""} className={inputClassName}>
                <option value="">全部</option>
                <option value="true">命中违规词</option>
                <option value="false">未命中</option>
              </select>
            </FilterField>
            <FilterField label="创建时间">
              <select name="sort" defaultValue={query.sort} className={inputClassName}>
                <option value="createdAt_desc">从新到旧</option>
                <option value="createdAt_asc">从旧到新</option>
              </select>
            </FilterField>
            <button type="submit" className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2B73FF,#1B56E3)] px-5 text-sm font-medium text-white">
              筛选
            </button>
          </form>
        </FilterBar>
      </DashboardCard>

      <CopywritingManager
        key={`${pageData.selectedProductId ?? "none"}:${pageData.selectedPlatform ?? "none"}:${pageData.defaultProviderId ?? "none"}:${query.keyword ?? ""}:${query.version ?? ""}:${query.hasViolation ?? ""}`}
        products={pageData.products}
        providers={pageData.providers}
        defaultProviderId={pageData.defaultProviderId}
        initialProductId={pageData.selectedProductId}
        initialPlatform={pageData.selectedPlatform}
        initialCopywritings={pageData.copywritings}
        initialGroupedCopywritings={pageData.groupedCopywritings}
        runtimeNotice={runtime.isWritable ? null : "预览环境只读，请在 Windows 本地验收。"}
        dataNotice={pageData.readNotice}
      />
    </WorkspacePage>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block px-1 text-sm text-slate-500">{label}</span>
      {children}
    </label>
  );
}
