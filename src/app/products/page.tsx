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
import { normalizeProductPoolQuery, type BooleanQueryValue } from "@/lib/services/query-service";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  platform?: string;
  recommendation?: string;
  needsRescore?: string;
  minScore?: string;
  maxScore?: string;
  missingCompetitor?: string;
  missingCost?: string;
  hasMaterial?: string;
  hasCopywriting?: string;
  sort?: string;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E4EAF3] bg-white px-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all duration-200 ease-out hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(59,130,246,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-blue-300 focus:ring-4 focus:ring-blue-50 motion-reduce:transition-none";

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 px-1 text-sm text-slate-500">{children}</p>;
}

function BooleanFilterSelect({
  label,
  name,
  value,
  trueLabel,
  falseLabel,
}: {
  label: string;
  name: string;
  value: BooleanQueryValue;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <div className="xl:min-w-[150px]">
      <FilterLabel>{label}</FilterLabel>
      <select name={name} defaultValue={value ?? ""} className={inputClassName}>
        <option value="">全部</option>
        <option value="true">{trueLabel}</option>
        <option value="false">{falseLabel}</option>
      </select>
    </div>
  );
}

function getEstimatedProfitText(value: number | null) {
  return value === null ? "--" : formatCurrency(value);
}

function hasActiveFilters(query: ReturnType<typeof normalizeProductPoolQuery>) {
  return Boolean(
    query.keyword ||
      query.status ||
      query.platform ||
      query.recommendation ||
      query.minScore !== null ||
      query.maxScore !== null ||
      query.missingCompetitor ||
      query.missingCost ||
      query.hasMaterial ||
      query.hasCopywriting ||
      query.needsRescore,
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = normalizeProductPoolQuery(params);
  const pageData = await getProductPoolPageData(query);
  const activeFilters = hasActiveFilters(query);

  return (
    <WorkspacePage
      eyebrow="Products"
      title="商品池"
      description="集中管理商品基础档案、状态、评分结论、素材与文案覆盖情况。"
    >
      <FilterBar>
        <form action="/products" method="get" className="flex w-full flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
          <div className="xl:min-w-[300px] xl:flex-1">
            <FilterLabel>关键词</FilterLabel>
            <input name="q" defaultValue={query.keyword ?? ""} placeholder="搜索商品标题 / SPU" className={inputClassName} />
          </div>

          <div className="xl:min-w-[150px]">
            <FilterLabel>商品状态</FilterLabel>
            <select name="status" defaultValue={query.status ?? ""} className={inputClassName}>
              <option value="">全部</option>
              {PRODUCT_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="xl:min-w-[150px]">
            <FilterLabel>平台</FilterLabel>
            <select name="platform" defaultValue={query.platform ?? ""} className={inputClassName}>
              <option value="">全部</option>
              {TARGET_PLATFORM_VALUES.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>

          <div className="xl:min-w-[170px]">
            <FilterLabel>推荐结论</FilterLabel>
            <select name="recommendation" defaultValue={query.recommendation ?? ""} className={inputClassName}>
              <option value="">全部</option>
              <option value={SCORE_RECOMMENDATION_FILTER_VALUES[0]}>建议测试</option>
              <option value={SCORE_RECOMMENDATION_FILTER_VALUES[1]}>临时评估</option>
              <option value={SCORE_RECOMMENDATION_FILTER_VALUES[2]}>待补成本</option>
              <option value={SCORE_RECOMMENDATION_FILTER_VALUES[3]}>淘汰</option>
              <option value={SCORE_RECOMMENDATION_FILTER_VALUES[4]}>未评分</option>
            </select>
          </div>

          <div className="xl:min-w-[130px]">
            <FilterLabel>最低评分</FilterLabel>
            <input type="number" min="0" max="100" step="1" name="minScore" defaultValue={query.minScore ?? ""} className={inputClassName} />
          </div>

          <div className="xl:min-w-[130px]">
            <FilterLabel>最高评分</FilterLabel>
            <input type="number" min="0" max="100" step="1" name="maxScore" defaultValue={query.maxScore ?? ""} className={inputClassName} />
          </div>

          <div className="xl:min-w-[190px]">
            <FilterLabel>排序</FilterLabel>
            <select name="sort" defaultValue={query.sort} className={inputClassName}>
              <option value="updatedAt_desc">更新时间从新到旧</option>
              <option value="updatedAt_asc">更新时间从旧到新</option>
              <option value="createdAt_desc">创建时间从新到旧</option>
              <option value="createdAt_asc">创建时间从旧到新</option>
            </select>
          </div>

          <BooleanFilterSelect label="缺竞品" name="missingCompetitor" value={query.missingCompetitor} trueLabel="仅缺竞品" falseLabel="已有竞品" />
          <BooleanFilterSelect label="缺成本" name="missingCost" value={query.missingCost} trueLabel="仅缺成本" falseLabel="成本完整" />
          <BooleanFilterSelect label="素材" name="hasMaterial" value={query.hasMaterial} trueLabel="已有素材" falseLabel="无素材" />
          <BooleanFilterSelect label="文案" name="hasCopywriting" value={query.hasCopywriting} trueLabel="已有文案" falseLabel="无文案" />
          <BooleanFilterSelect label="重评分" name="needsRescore" value={query.needsRescore} trueLabel="需要重评分" falseLabel="无需重评分" />

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
        </DashboardCard>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-4">
            <StatCard label="全部商品" value={String(pageData.data.stats.totalCount)} delta="实时" tone="blue" icon={<MiniIcon name="bag" className="h-7 w-7" />} />
            <StatCard label="待分析" value={String(pageData.data.stats.pendingCount)} delta="Thread 01" tone="amber" icon={<MiniIcon name="clock" className="h-7 w-7" />} />
            <StatCard label="分析中" value={String(pageData.data.stats.analyzingCount)} delta="Thread 01" tone="blue" icon={<MiniIcon name="spark" className="h-7 w-7" />} />
            <StatCard label="建议测试" value={String(pageData.data.stats.suggestedCount)} delta="只展示" tone="green" icon={<MiniIcon name="thumb" className="h-7 w-7" />} />
          </section>

          <DashboardCard>
            <TableScrollArea className="py-3">
              <DataTable className="min-w-[1180px]">
                <DataTableHead>
                  <tr>
                    <DataTableHeaderCell className="w-[28%]">商品信息</DataTableHeaderCell>
                    <DataTableHeaderCell className="w-[14%]">类目</DataTableHeaderCell>
                    <DataTableHeaderCell className="w-[12%]">平台</DataTableHeaderCell>
                    <DataTableHeaderCell className="w-[10%]">售价</DataTableHeaderCell>
                    <DataTableHeaderCell className="w-[10%]">净利润</DataTableHeaderCell>
                    <DataTableHeaderCell className="w-[10%]">状态</DataTableHeaderCell>
                    <DataTableHeaderCell className="w-[8%]">评分</DataTableHeaderCell>
                    <DataTableHeaderCell className="w-[10%]">结论</DataTableHeaderCell>
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
                        <DataTableCell>{product.targetPlatforms.length > 0 ? product.targetPlatforms.join(" / ") : "--"}</DataTableCell>
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
                        <DataTableCell className="text-slate-500">{product.formattedUpdatedAt}</DataTableCell>
                        <DataTableCell>
                          <div className="flex flex-wrap gap-2">
                            <TableActionLink href={`/products/${product.id}`}>详情</TableActionLink>
                            <TableActionLink href={`/products/${product.id}/edit`}>编辑</TableActionLink>
                            <DeleteProductButton productId={product.id} deleteAction={deleteProductAction} />
                          </div>
                        </DataTableCell>
                      </DataTableRow>
                    ))
                  ) : (
                    <DataTableRow>
                      <DataTableCell colSpan={10} className="py-12">
                        <div className="text-center">
                          <p className="text-base font-medium text-slate-700">
                            {activeFilters ? "当前筛选条件下没有商品记录" : "商品池还没有数据"}
                          </p>
                          <p className="mt-2 text-sm text-slate-400">
                            {activeFilters ? "可以放宽关键词、评分区间或缺项条件后再试。" : "先创建第一个商品，后续评分、文案和素材会在这里汇总。"}
                          </p>
                          {!activeFilters ? (
                            <div className="mt-5 flex justify-center">
                              <ActionButton href="/products/new">新增商品</ActionButton>
                            </div>
                          ) : null}
                        </div>
                      </DataTableCell>
                    </DataTableRow>
                  )}
                </DataTableBody>
              </DataTable>
            </TableScrollArea>
            <div className="flex flex-col gap-4 border-t border-[#EEF2F8] px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>共 {pageData.data.products.length} 条当前筛选结果</p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <span>状态：{PRODUCT_STATUS_VALUES.join(" / ")}</span>
                {pageData.data.filters.platforms.length > 0 ? <span>平台：{pageData.data.filters.platforms.join(" / ")}</span> : null}
              </div>
            </div>
          </DashboardCard>
        </>
      )}
    </WorkspacePage>
  );
}
