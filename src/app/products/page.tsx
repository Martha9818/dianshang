import {
  ActionButton,
  DashboardCard,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  EntityCell,
  FilterBar,
  MiniIcon,
  PageNote,
  StatCard,
  StatusBadge,
  TableActionLink,
  TableScrollArea,
} from "@/components/dashboard/primitives";
import { DeleteProductButton } from "@/components/products/delete-product-button";
import { ProductImage } from "@/components/products/product-image";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { deleteProductAction } from "@/app/products/actions";
import { formatCurrency } from "@/lib/modules/products";
import { PRODUCT_STATUS_TONE, PRODUCT_STATUS_VALUES, TARGET_PLATFORM_VALUES } from "@/lib/modules/products/constants";
import { SCORE_RECOMMENDATION_FILTER_VALUES } from "@/lib/modules/scoring";
import { getProductPoolPageData } from "@/lib/services/product-service";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  platform?: string;
  category?: string;
  recommendation?: string;
  needsRescore?: string;
  sort?: string;
  view?: string;
};

type ProductViewMode = "cards" | "table";

function getEstimatedProfitText(value: number | null) {
  return value === null ? "--" : formatCurrency(value);
}

const textInputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 px-1 text-sm text-slate-500">{children}</p>;
}

function getProductViewMode(view?: string): ProductViewMode {
  return view === "cards" ? "cards" : "table";
}

function getViewToggleClassName(active: boolean) {
  return active
    ? "group inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-medium text-[#2563EB] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-blue-300 hover:bg-blue-100 hover:text-[#1D4ED8] hover:shadow-[0_14px_28px_rgba(59,130,246,0.10)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 motion-reduce:transition-none motion-reduce:transform-none"
    : "group inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E4EAF3] bg-white px-3 text-sm text-slate-500 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:shadow-[0_12px_24px_rgba(148,163,184,0.10)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 motion-reduce:transition-none motion-reduce:transform-none";
}

function ViewStateFields({ params, view }: { params: SearchParams; view: ProductViewMode }) {
  return (
    <>
      {Object.entries(params).map(([key, value]) => {
        if (key === "view" || typeof value !== "string" || value.trim() === "") {
          return null;
        }

        return <input key={key} type="hidden" name={key} value={value} />;
      })}
      {view !== "table" ? <input type="hidden" name="view" value={view} /> : null}
    </>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sort = params.sort === "createdAt" ? "createdAt" : "updatedAt";
  const viewMode = getProductViewMode(params.view);
  const pageData = await getProductPoolPageData({
    query: params.q,
    status: params.status,
    targetPlatform: params.platform,
    category: params.category,
    recommendation: params.recommendation,
    needsRescore: params.needsRescore,
    sort,
  });

  return (
    <WorkspacePage
      eyebrow="Products"
      title="商品池"
      description="集中管理商品基础档案、当前状态与后续线程的扩展入口。"
    >
      <FilterBar>
        <form action="/products" method="get" className="flex w-full flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
          {viewMode !== "table" ? <input type="hidden" name="view" value={viewMode} /> : null}
          <div className="xl:min-w-[340px] xl:flex-1">
            <FilterLabel>搜索</FilterLabel>
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="搜索商品名称 / SPU / 类目"
              className={textInputClassName}
            />
          </div>

          <div className="xl:min-w-[150px]">
            <FilterLabel>状态</FilterLabel>
            <select name="status" defaultValue={params.status ?? ""} className={textInputClassName}>
              <option value="">全部</option>
              {PRODUCT_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="xl:min-w-[150px]">
            <FilterLabel>目标平台</FilterLabel>
            <select name="platform" defaultValue={params.platform ?? ""} className={textInputClassName}>
              <option value="">全部</option>
              {TARGET_PLATFORM_VALUES.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>

          <div className="xl:min-w-[170px]">
            <FilterLabel>类目</FilterLabel>
            <select name="category" defaultValue={params.category ?? ""} className={textInputClassName}>
              <option value="">全部</option>
              {pageData.kind === "ready"
                ? pageData.data.filters.categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))
                : null}
            </select>
          </div>

          <div className="xl:min-w-[190px]">
            <FilterLabel>排序</FilterLabel>
            <select name="sort" defaultValue={sort} className={textInputClassName}>
              <option value="updatedAt">按更新时间排序</option>
              <option value="createdAt">按创建时间排序</option>
            </select>
          </div>

          <div className="xl:min-w-[170px]">
            <FilterLabel>评分结论</FilterLabel>
            <select name="recommendation" defaultValue={params.recommendation ?? ""} className={textInputClassName}>
              <option value="">全部</option>
              <option value={SCORE_RECOMMENDATION_FILTER_VALUES[0]}>建议测试</option>
              <option value={SCORE_RECOMMENDATION_FILTER_VALUES[1]}>临时评估</option>
              <option value={SCORE_RECOMMENDATION_FILTER_VALUES[2]}>待补成本</option>
              <option value={SCORE_RECOMMENDATION_FILTER_VALUES[3]}>淘汰</option>
              <option value={SCORE_RECOMMENDATION_FILTER_VALUES[4]}>未评分</option>
            </select>
          </div>

          <div className="xl:min-w-[170px]">
            <FilterLabel>重评分</FilterLabel>
            <select name="needsRescore" defaultValue={params.needsRescore ?? ""} className={textInputClassName}>
              <option value="">全部</option>
              <option value="true">仅看需要重新评分</option>
            </select>
          </div>

          <div className="flex gap-3 xl:ml-auto">
            <button
              type="submit"
              className="group inline-flex h-12 cursor-pointer items-center justify-center rounded-2xl border border-[#DCE5F2] bg-white px-5 text-sm font-medium text-[#2563EB] shadow-[0_10px_22px_rgba(59,130,246,0.08)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50 hover:text-[#1D4ED8] hover:shadow-[0_16px_30px_rgba(59,130,246,0.12)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 motion-reduce:transition-none motion-reduce:transform-none"
            >
              筛选
            </button>
            <ActionButton href="/products/new">
              <MiniIcon name="spark" className="h-4 w-4" />
              新增商品
            </ActionButton>
          </div>
        </form>
      </FilterBar>

      {pageData.kind === "unavailable" ? (
        <DashboardCard className="px-5 py-5">
          <PageNote>{pageData.message}</PageNote>
          <p className="mt-4 text-sm text-slate-500">
            当前模式下仍可打开商品新建页查看表单结构，但创建、编辑、删除和上传会保持只读。
          </p>
        </DashboardCard>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-4">
            <StatCard
              label="全部商品"
              value={String(pageData.data.stats.totalCount)}
              delta="实时"
              tone="blue"
              icon={<MiniIcon name="bag" className="h-7 w-7" />}
            />
            <StatCard
              label="待分析"
              value={String(pageData.data.stats.pendingCount)}
              delta="Thread 01"
              tone="amber"
              icon={<MiniIcon name="clock" className="h-7 w-7" />}
            />
            <StatCard
              label="分析中"
              value={String(pageData.data.stats.analyzingCount)}
              delta="Thread 01"
              tone="blue"
              icon={<MiniIcon name="spark" className="h-7 w-7" />}
            />
            <StatCard
              label="建议测试"
              value={String(pageData.data.stats.suggestedCount)}
              delta="只展示"
              tone="green"
              icon={<MiniIcon name="thumb" className="h-7 w-7" />}
            />
          </section>

          <DashboardCard>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF2F8] px-5 py-4">
              <div className="flex items-center gap-3">
                <form action="/products" method="get">
                  <ViewStateFields params={params} view="cards" />
                  <button type="submit" aria-pressed={viewMode === "cards"} className={getViewToggleClassName(viewMode === "cards")}>
                    <MiniIcon name="grid" className="h-4 w-4" />
                    卡片
                  </button>
                </form>
                <form action="/products" method="get">
                  <ViewStateFields params={params} view="table" />
                  <button type="submit" aria-pressed={viewMode === "table"} className={getViewToggleClassName(viewMode === "table")}>
                    <MiniIcon name="list" className="h-4 w-4" />
                    表格
                  </button>
                </form>
              </div>
            </div>

            {viewMode === "cards" ? (
              <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-3">
                {pageData.data.products.length > 0 ? (
                  pageData.data.products.map((product) => (
                    <article key={product.id} className="rounded-2xl border border-[#E7ECF3] bg-white p-4">
                      <div className="flex items-start gap-3">
                        <ProductImage src={product.mainImagePath} alt={product.name} label={product.name.slice(0, 3)} square />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h2 className="truncate text-base font-semibold text-slate-900">{product.name}</h2>
                              <p className="mt-1 truncate text-xs text-slate-400">{product.spu}</p>
                            </div>
                            <StatusBadge label={product.status} tone={PRODUCT_STATUS_TONE[product.status] ?? "slate"} />
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-slate-400">类目</p>
                              <p className="mt-1 truncate text-slate-700">{product.categoryLevel1 ?? "--"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">平台</p>
                              <p className="mt-1 truncate text-slate-700">
                                {product.targetPlatforms.length > 0 ? product.targetPlatforms.join(" / ") : "--"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">预估售价</p>
                              <p className="mt-1 font-medium text-slate-900">{formatCurrency(product.estimatedPrice)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">预估净利润</p>
                              <p className="mt-1 font-medium text-slate-900">{getEstimatedProfitText(product.estimatedNetProfit)}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="inline-flex min-w-12 justify-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500">
                              {product.formattedLatestScore}
                            </span>
                            <StatusBadge
                              label={product.latestRecommendationDisplay}
                              tone={
                                product.latestRecommendation === "建议测试"
                                  ? "green"
                                  : product.latestRecommendation === "淘汰"
                                    ? "red"
                                    : product.latestRecommendation
                                      ? "violet"
                                      : "slate"
                              }
                            />
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                product.needsRescore ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {product.needsRescore ? "需要评分" : "已最新"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#EEF2F8] pt-4">
                        <TableActionLink href={`/products/${product.id}`}>查看详情</TableActionLink>
                        <TableActionLink href={`/products/${product.id}/edit`}>编辑</TableActionLink>
                        <DeleteProductButton productId={product.id} deleteAction={deleteProductAction} />
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <p className="text-base font-medium text-slate-700">商品池还没有数据</p>
                    <p className="mt-2 text-sm text-slate-400">先创建第一个商品，后续线程会在此基础上继续扩展。</p>
                    <div className="mt-5 flex justify-center">
                      <ActionButton href="/products/new">新增商品</ActionButton>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <TableScrollArea className="py-3">
                <DataTable className="min-w-[1120px]">
                  <DataTableHead>
                    <tr>
                      <DataTableHeaderCell className="w-[28%]">商品信息</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[14%]">类目</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[10%]">目标平台</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[10%]">预估售价</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[12%]">预估净利润</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[10%]">当前状态</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[8%]">综合评分</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[10%]">评分结论</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[8%]">重评分</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[12%]">更新时间</DataTableHeaderCell>
                      <DataTableHeaderCell className="w-[16%]">操作</DataTableHeaderCell>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {pageData.data.products.length > 0 ? (
                      pageData.data.products.map((product) => (
                        <DataTableRow key={product.id}>
                          <DataTableCell>
                            <EntityCell
                              thumb={<ProductImage src={product.mainImagePath} alt={product.name} label={product.name.slice(0, 3)} />}
                              title={product.name}
                              subtitle={product.spu}
                            />
                          </DataTableCell>
                          <DataTableCell>
                            <div className="leading-6">
                              <p>{product.categoryLevel1 ?? "--"}</p>
                              <p className="text-xs text-slate-400">{product.categoryLevel2 ?? "--"}</p>
                            </div>
                          </DataTableCell>
                          <DataTableCell>
                            {product.targetPlatforms.length > 0 ? product.targetPlatforms.join(" / ") : "--"}
                          </DataTableCell>
                          <DataTableCell>{formatCurrency(product.estimatedPrice)}</DataTableCell>
                          <DataTableCell>{getEstimatedProfitText(product.estimatedNetProfit)}</DataTableCell>
                          <DataTableCell>
                            <StatusBadge label={product.status} tone={PRODUCT_STATUS_TONE[product.status] ?? "slate"} />
                          </DataTableCell>
                          <DataTableCell>
                            <span className="inline-flex min-w-12 justify-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500">
                              {product.formattedLatestScore}
                            </span>
                          </DataTableCell>
                          <DataTableCell>
                            <StatusBadge
                              label={product.latestRecommendationDisplay}
                              tone={
                                product.latestRecommendation === "建议测试"
                                  ? "green"
                                  : product.latestRecommendation === "淘汰"
                                    ? "red"
                                    : product.latestRecommendation
                                      ? "violet"
                                      : "slate"
                              }
                            />
                          </DataTableCell>
                          <DataTableCell>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                product.needsRescore ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {product.needsRescore ? "需要评分" : "已最新"}
                            </span>
                          </DataTableCell>
                          <DataTableCell className="text-slate-500">{product.formattedUpdatedAt}</DataTableCell>
                          <DataTableCell>
                            <div className="flex flex-wrap gap-2">
                              <TableActionLink href={`/products/${product.id}`}>查看详情</TableActionLink>
                              <TableActionLink href={`/products/${product.id}/edit`}>编辑</TableActionLink>
                              <DeleteProductButton productId={product.id} deleteAction={deleteProductAction} />
                            </div>
                          </DataTableCell>
                        </DataTableRow>
                      ))
                    ) : (
                      <DataTableRow>
                        <DataTableCell colSpan={11} className="py-12">
                          <div className="text-center">
                            <p className="text-base font-medium text-slate-700">商品池还没有数据</p>
                            <p className="mt-2 text-sm text-slate-400">先创建第一个商品，后续线程会在此基础上继续扩展。</p>
                            <div className="mt-5 flex justify-center">
                              <ActionButton href="/products/new">新增商品</ActionButton>
                            </div>
                          </div>
                        </DataTableCell>
                      </DataTableRow>
                    )}
                  </DataTableBody>
                </DataTable>
              </TableScrollArea>
            )}

            <div className="flex flex-col gap-4 border-t border-[#EEF2F8] px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>共 {pageData.data.products.length} 条当前筛选结果</p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <span>可用状态：{PRODUCT_STATUS_VALUES.join(" / ")}</span>
                {pageData.data.filters.platforms.length > 0 ? (
                  <span>平台：{pageData.data.filters.platforms.join(" / ")}</span>
                ) : null}
              </div>
            </div>
          </DashboardCard>
        </>
      )}
    </WorkspacePage>
  );
}
