import { ActionButton, DashboardCard, PageNote, SectionTabs, StatusBadge } from "@/components/dashboard/primitives";
import { CompetitorTab } from "@/components/products/competitor-tab";
import { CopywritingTab } from "@/components/products/copywriting-tab";
import { ProductMaterialsTab } from "@/components/products/materials-tab";
import { ProductImage } from "@/components/products/product-image";
import { ProfitTab } from "@/components/products/profit-tab";
import { ProductNotFoundState } from "@/components/products/not-found-state";
import { ProductPromptTasksTab } from "@/components/products/prompt-tasks-tab";
import { ProductRuntimeUnavailableState } from "@/components/products/runtime-unavailable-state";
import { ScoreTab } from "@/components/products/score-tab";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { deleteCompetitorAction, saveCompetitorAction, saveProfitAction, saveScoreAction } from "@/app/products/actions";
import { COMPETITOR_HEAT_METRIC_VALUES, COMPETITOR_PLATFORM_VALUES, formatCurrency } from "@/lib/modules/products";
import { PRODUCT_STATUS_TONE } from "@/lib/modules/products/constants";
import { buildCompetitorFormValues, getEmptyCompetitorFormValues } from "@/lib/services/competitor-service";
import { buildProfitFormValues } from "@/lib/services/profit-service";
import { getProductDetailPageData } from "@/lib/services/product-service";
import { buildReadonlyRuntimeMessage, getRuntimeModeSummary } from "@/lib/services/product-runtime-service";
import { buildScoreFormValues } from "@/lib/services/scoring-service";

export const dynamic = "force-dynamic";

const tabs = [
  { key: "basic", label: "基础信息" },
  { key: "competitors", label: "竞品数据" },
  { key: "profit", label: "利润测算" },
  { key: "scoring", label: "商品评分" },
  { key: "copywriting", label: "平台文案" },
  { key: "prompt-tasks", label: "Prompt 任务" },
  { key: "materials", label: "素材" },
  { key: "logs", label: "操作记录" },
];

const legacyTabMap: Record<string, string> = {
  基础信息: "basic",
  竞品数据: "competitors",
  利润测算: "profit",
  商品评分: "scoring",
  平台文案: "copywriting",
  "Prompt 任务": "prompt-tasks",
  素材: "materials",
  操作记录: "logs",
};

function normalizeTab(tab?: string) {
  if (!tab) return "basic";
  return tabs.some((item) => item.key === tab) ? tab : legacyTabMap[tab] ?? "basic";
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[22px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <div className="mt-2 text-sm leading-7 text-slate-700">{value}</div>
    </div>
  );
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    editCompetitorId?: string;
    copyPlatform?: string;
    copyVersion?: string;
    platform?: string;
    materialType?: string;
    status?: string;
  }>;
}) {
  const { id } = await params;
  const { tab, editCompetitorId, copyPlatform, copyVersion, platform, materialType, status } = await searchParams;
  const productId = Number(id);
  const activeTab = normalizeTab(tab);
  const runtime = getRuntimeModeSummary();

  if (!Number.isInteger(productId)) {
    return (
      <WorkspacePage eyebrow="Products" title="商品详情" description="查看商品基础档案与操作记录。">
        <ProductNotFoundState />
      </WorkspacePage>
    );
  }

  const pageData = await getProductDetailPageData(productId, {
    includeLogs: activeTab === "logs",
    copyPlatform: copyPlatform ?? null,
    copyVersion: copyVersion ?? null,
    materialPlatform: activeTab === "materials" ? platform ?? null : null,
    materialType: activeTab === "materials" ? materialType ?? null : null,
    materialStatus: activeTab === "materials" ? status ?? null : null,
  });

  if (pageData.kind === "unavailable") {
    return (
      <WorkspacePage eyebrow="Products" title="商品详情" description="查看商品基础档案与操作记录。">
        <ProductRuntimeUnavailableState description={pageData.message} />
      </WorkspacePage>
    );
  }

  const product = pageData.data.product;

  if (!product) {
    return (
      <WorkspacePage eyebrow="Products" title="商品详情" description="查看商品基础档案与操作记录。">
        <ProductNotFoundState />
      </WorkspacePage>
    );
  }

  const logs = pageData.data.logs;
  const joinedPlatforms = product.targetPlatforms.length > 0 ? product.targetPlatforms.join(" / ") : "--";
  const joinedTags = product.tags.length > 0 ? product.tags.join(" / ") : "--";
  const competitorToEdit =
    activeTab === "competitors" && editCompetitorId
      ? pageData.data.competitors.find((competitor) => String(competitor.id) === editCompetitorId)
      : null;
  const competitorInitialValues = competitorToEdit ? buildCompetitorFormValues(competitorToEdit) : getEmptyCompetitorFormValues();
  const runtimeNotice = runtime.isWritable ? null : buildReadonlyRuntimeMessage(runtime.mode);
  const activeTabLabel = tabs.find((item) => item.key === activeTab)?.label ?? tabs[0].label;

  return (
    <WorkspacePage
      eyebrow="Products"
      title={product.name}
      description="查看商品基础信息、竞品数据、利润测算、评分结果、平台文案、Prompt 任务、素材与操作记录。"
    >
      <DashboardCard>
        <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <ProductImage src={product.mainImagePath} alt={product.name} label={product.name.slice(0, 3)} square />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[1.5rem] font-semibold text-slate-900">{product.name}</h2>
                <StatusBadge label={product.status} tone={PRODUCT_STATUS_TONE[product.status] ?? "slate"} />
              </div>
              <p className="mt-2 text-sm text-slate-400">{product.spu}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{product.categoryLevel1 ?? "未填写一级类目"}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{product.categoryLevel2 ?? "未填写二级类目"}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{joinedPlatforms}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionButton href={`/products/${product.id}/edit`} variant="secondary">
              编辑商品
            </ActionButton>
            <ActionButton href="/products" variant="ghost">
              返回商品池
            </ActionButton>
          </div>
        </div>

        <div className="grid gap-4 border-t border-[#EEF2F8] px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          <InfoItem label="更新时间" value={product.formattedUpdatedAt} />
          <InfoItem label="预估售价" value={formatCurrency(product.estimatedPrice)} />
          <InfoItem label="预估净利润" value={product.estimatedNetProfit === null ? "--" : formatCurrency(product.estimatedNetProfit)} />
          <InfoItem label="最新综合评分" value={pageData.data.latestScoreSnapshot?.formattedTotalScore ?? "--"} />
        </div>
      </DashboardCard>

      <DashboardCard>
        <SectionTabs
          items={tabs.map((item) => item.label)}
          active={activeTabLabel}
          getHref={(label) => {
            const key = tabs.find((item) => item.label === label)?.key ?? "basic";
            return `/products/${product.id}?tab=${encodeURIComponent(key)}`;
          }}
        />

        {activeTab === "basic" ? (
          <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem label="商品名称" value={product.name} />
            <InfoItem label="SPU" value={product.spu} />
            <InfoItem label="当前状态" value={product.status} />
            <InfoItem label="一级类目" value={product.categoryLevel1 ?? "--"} />
            <InfoItem label="二级类目" value={product.categoryLevel2 ?? "--"} />
            <InfoItem label="商品标签" value={joinedTags} />
            <InfoItem label="目标人群" value={product.targetUser ?? "--"} />
            <InfoItem label="目标平台" value={joinedPlatforms} />
            <InfoItem label="预估售价" value={formatCurrency(product.estimatedPrice)} />
            <InfoItem label="预估进货价" value={formatCurrency(product.estimatedCost)} />
            <InfoItem label="预估运费" value={formatCurrency(product.estimatedShipping)} />
            <InfoItem label="包装成本" value={formatCurrency(product.packagingCost)} />
            <div className="md:col-span-2 xl:col-span-3">
              <InfoItem label="核心卖点" value={product.sellingPoints ?? "--"} />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <InfoItem label="用户痛点" value={product.painPoints ?? "--"} />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <InfoItem label="使用场景" value={product.usageScenes ?? "--"} />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <InfoItem label="备注" value={product.notes ?? "--"} />
            </div>
          </div>
        ) : null}

        {activeTab === "competitors" ? (
          <CompetitorTab
            productId={product.id}
            competitors={pageData.data.competitors}
            stats={pageData.data.competitorStats}
            initialValues={competitorInitialValues}
            runtimeNotice={runtimeNotice}
            formMode={competitorToEdit ? "edit" : "create"}
            onSubmit={saveCompetitorAction.bind(null, product.id)}
            onDelete={deleteCompetitorAction}
            platformOptions={COMPETITOR_PLATFORM_VALUES}
            heatMetricOptions={COMPETITOR_HEAT_METRIC_VALUES}
          />
        ) : null}

        {activeTab === "profit" && pageData.data.profitView ? (
          <ProfitTab
            productId={product.id}
            profitView={pageData.data.profitView}
            initialValues={buildProfitFormValues(product)}
            runtimeNotice={runtimeNotice}
            onSubmit={saveProfitAction.bind(null, product.id)}
          />
        ) : null}

        {activeTab === "scoring" && pageData.data.currentScoreEvaluation ? (
          <ScoreTab
            productId={product.id}
            evaluation={pageData.data.currentScoreEvaluation}
            initialValues={buildScoreFormValues(product)}
            latestSnapshot={pageData.data.latestScoreSnapshot}
            scoreHistory={pageData.data.scoreHistory}
            needsRescore={pageData.data.needsRescore}
            runtimeNotice={runtimeNotice}
            onSubmit={saveScoreAction.bind(null, product.id)}
          />
        ) : null}

        {activeTab === "copywriting" ? <CopywritingTab productId={product.id} copywritings={pageData.data.copywritings} /> : null}

        {activeTab === "prompt-tasks" ? (
          <ProductPromptTasksTab
            productId={product.id}
            productName={product.name}
            productSpu={product.spu}
            tasks={pageData.data.promptTasks}
            runtimeNotice={runtimeNotice}
          />
        ) : null}

        {activeTab === "materials" ? (
          <ProductMaterialsTab
            product={{ id: product.id, name: product.name, spu: product.spu }}
            materials={pageData.data.materials}
            runtimeNotice={runtimeNotice}
            filters={{ platform: platform ?? null, materialType: materialType ?? null, status: status ?? null }}
          />
        ) : null}

        {activeTab === "logs" ? (
          <div className="space-y-3 px-5 py-5">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-3 rounded-[24px] border border-[#EEF2F8] bg-[#FBFDFF] px-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{log.detail ?? log.action}</p>
                    <p className="mt-1 text-xs text-slate-400">{log.action}</p>
                  </div>
                  <span className="text-sm text-slate-400">{log.formattedCreatedAt}</span>
                </div>
              ))
            ) : (
              <PageNote>暂无操作记录</PageNote>
            )}
          </div>
        ) : null}
      </DashboardCard>
    </WorkspacePage>
  );
}
