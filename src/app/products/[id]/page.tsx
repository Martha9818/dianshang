import { ActionButton, DashboardCard, PageNote, SectionTabs, StatusBadge } from "@/components/dashboard/primitives";
import { CompetitorAnalysisTab } from "@/components/products/competitor-analysis-tab";
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
import {
  archiveCompetitorAnalysisAction,
  deleteCompetitorAction,
  generateCompetitorAnalysisAction,
  markCompetitorAnalysisReferenceAction,
  saveCompetitorAction,
  saveProfitAction,
  saveScoreAction,
} from "@/app/products/actions";
import { COMPETITOR_HEAT_METRIC_VALUES, COMPETITOR_PLATFORM_VALUES, formatCurrency } from "@/lib/modules/products";
import { PRODUCT_STATUS_TONE } from "@/lib/modules/products/constants";
import { buildCompetitorFormValues, getEmptyCompetitorFormValues } from "@/lib/services/competitor-service";
import { COMPETITOR_ANALYSIS_READONLY_MESSAGE, getCompetitorAnalysisSnapshots } from "@/lib/services/competitor-analysis";
import { buildProfitFormValues } from "@/lib/services/profit-service";
import { getProductDetailPageData } from "@/lib/services/product-service";
import { buildReadonlyRuntimeMessage, getRuntimeModeSummary } from "@/lib/services/product-runtime-service";
import { buildScoreFormValues } from "@/lib/services/scoring-service";

export const dynamic = "force-dynamic";

const tabs = [
  { key: "basic", label: "基础信息" },
  { key: "competitors", label: "竞品参考" },
  { key: "competitor-analysis", label: "AI 机会分析" },
  { key: "profit", label: "成本利润" },
  { key: "scoring", label: "测试结论" },
  { key: "copywriting", label: "平台文案" },
  { key: "prompt-tasks", label: "Prompt 任务" },
  { key: "materials", label: "素材" },
  { key: "logs", label: "操作记录" },
];

const legacyTabMap: Record<string, string> = {
  竞品智能分析: "competitor-analysis",
  基础信息: "basic",
  竞品参考: "competitors",
  竞品数据: "competitors",
  "AI 机会分析": "competitor-analysis",
  利润测算: "profit",
  成本利润: "profit",
  商品评分: "scoring",
  测试结论: "scoring",
  平台文案: "copywriting",
  "Prompt 任务": "prompt-tasks",
  素材: "materials",
  操作记录: "logs",
};

const processToneMap = {
  未开始: "slate",
  资料不足: "amber",
  可分析: "blue",
  已完成: "green",
} as const;

function formatScoreNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toFixed(1) : "--";
}

function getFormalMissingItems(input: {
  validCompetitorCount: number;
  hasCompleteCostData: boolean;
}) {
  const items: string[] = [];

  if (!input.hasCompleteCostData) {
    items.push("预计售价、预计进货价、预计运费");
  }

  if (input.validCompetitorCount < 3) {
    items.push("至少 3 个有效竞品");
  }

  return items;
}

function buildFormalNextStep(input: {
  validCompetitorCount: number;
  hasCompleteCostData: boolean;
  fallback?: string | null;
}) {
  const missingCost = !input.hasCompleteCostData;
  const missingCompetitors = input.validCompetitorCount < 3;

  if (missingCost && missingCompetitors) {
    return "先补成本，再录入竞品，之后重新进入测试结论。";
  }

  if (missingCost) {
    return "先补售价、进货价和运费，再重新进入测试结论。";
  }

  if (missingCompetitors) {
    return "先补至少 3 个有效竞品，再重新进入测试结论。";
  }

  return input.fallback?.trim() || "可进入测试结论页重新计算正式评分。";
}

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

function QuickActionLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="rounded-[22px] border border-[#E4EAF3] bg-white px-4 py-4 transition hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-[0_12px_24px_rgba(59,130,246,0.10)]"
    >
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </a>
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
    analysisError?: string;
  }>;
}) {
  const { id } = await params;
  const { tab, editCompetitorId, copyPlatform, copyVersion, platform, materialType, status, analysisError } = await searchParams;
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
  const validCompetitorCount = pageData.data.competitorStats.validCount;
  const hasCompleteCostData = Boolean(pageData.data.profitView?.hasCompleteCostData);
  const latestScoreSnapshot = pageData.data.latestScoreSnapshot;
  const currentScoreEvaluation = pageData.data.currentScoreEvaluation;
  const formalMissingItems = getFormalMissingItems({
    validCompetitorCount,
    hasCompleteCostData,
  });
  const topConclusionLabel = latestScoreSnapshot?.recommendation ?? currentScoreEvaluation?.recommendation ?? "待补资料";
  const topConclusionTone =
    topConclusionLabel === "建议测试"
      ? "green"
      : topConclusionLabel === "淘汰"
        ? "red"
        : topConclusionLabel === "临时评估"
          ? "blue"
          : "violet";
  const topFormalScore =
    latestScoreSnapshot?.formattedTotalScore ?? formatScoreNumber(currentScoreEvaluation?.dimensions.totalScore ?? null);
  const topNextSuggestion = buildFormalNextStep({
    validCompetitorCount,
    hasCompleteCostData,
    fallback: currentScoreEvaluation?.nextSuggestions[0] ?? null,
  });
  const flowSteps = [
    {
      key: "competitors",
      index: "①",
      title: "补竞品",
      tabLabel: "竞品参考",
      helper: "录入同类商品，用来判断价格带、竞争强度和卖点差异。",
      status:
        validCompetitorCount >= 3 ? "已完成" : validCompetitorCount > 0 ? "资料不足" : "未开始",
      output:
        validCompetitorCount >= 3
          ? `已有 ${validCompetitorCount} 个有效竞品`
          : validCompetitorCount > 0
            ? `当前仅有 ${validCompetitorCount} 个有效竞品`
            : "还没有可用竞品数据",
    },
    {
      key: "competitor-analysis",
      index: "②",
      title: "看机会",
      tabLabel: "AI 机会分析",
      helper: "用 AI 总结竞品共性、机会和风险，但不会自动改正式评分。",
      status:
        pageData.data.competitorAnalysisSnapshotCount > 0
          ? "已完成"
          : validCompetitorCount >= 3
            ? "可分析"
            : validCompetitorCount > 0
              ? "资料不足"
              : "未开始",
      output:
        pageData.data.competitorAnalysisSnapshotCount > 0
          ? `已有 ${pageData.data.competitorAnalysisSnapshotCount} 份 AI 参考分析`
          : validCompetitorCount >= 3
            ? "已具备生成 AI 机会分析的条件"
            : "先补竞品，再做机会分析",
    },
    {
      key: "profit",
      index: "③",
      title: "算利润",
      tabLabel: "成本利润",
      helper: "填写售价和成本，系统会计算净利润和利润率，结果会影响测试结论。",
      status:
        pageData.data.profitView?.hasCompleteCostData
          ? "已完成"
          : pageData.data.profitView?.estimatedPrice !== null ||
              pageData.data.profitView?.estimatedCost !== null ||
              pageData.data.profitView?.estimatedShipping !== null
            ? "资料不足"
            : "未开始",
      output:
        pageData.data.profitView?.hasCompleteCostData
          ? `净利润 ${pageData.data.profitView.formattedEstimatedNetProfit} / 利润率 ${pageData.data.profitView.formattedProfitRate}`
          : "缺少售价、进货价或运费，暂时无法形成正式利润结果",
    },
    {
      key: "scoring",
      index: "④",
      title: "得结论",
      tabLabel: "测试结论",
      helper: "规则评分会综合竞品、利润、风险和内容条件，判断是否值得小批量测试。",
      status:
        latestScoreSnapshot && !pageData.data.needsRescore
          ? "已完成"
          : hasCompleteCostData && validCompetitorCount >= 3
            ? "可分析"
            : "资料不足",
      output:
        latestScoreSnapshot && !pageData.data.needsRescore
          ? `最新正式结论：${latestScoreSnapshot.recommendation ?? "--"}`
          : hasCompleteCostData && validCompetitorCount >= 3
            ? "已具备重新计算正式评分的条件"
            : "还缺正式评分所需的关键信息",
    },
  ] as const;
  const competitorAnalysisData =
    activeTab === "competitor-analysis"
      ? await getCompetitorAnalysisSnapshots(product.id).catch((error) => ({
          runtime,
          snapshots: [],
          minCompetitorCount: 3,
          readonlyNotice: runtime.isWritable ? null : COMPETITOR_ANALYSIS_READONLY_MESSAGE,
          readError: error instanceof Error ? error.message : "当前无法读取竞品智能分析历史，请稍后重试。",
        }))
      : null;
  const competitorAnalysisReadError =
    competitorAnalysisData && "readError" in competitorAnalysisData && competitorAnalysisData.readError
      ? String(competitorAnalysisData.readError)
      : null;

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
              <div className="mt-2 space-y-1 text-sm">
                <p className="font-medium text-[#2563EB]">Product ID {product.id}</p>
                <p className="text-slate-400">{product.spu}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{product.categoryLevel1 ?? "未填写一级类目"}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{product.categoryLevel2 ?? "未填写二级类目"}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{joinedPlatforms}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionButton href={`/products/${product.id}?tab=competitors`} variant="primary">
              补竞品
            </ActionButton>
            <ActionButton href={`/products/${product.id}?tab=profit`} variant="secondary">
              算利润
            </ActionButton>
            <ActionButton href={`/products/${product.id}?tab=scoring`} variant="secondary">
              重新评分
            </ActionButton>
            <ActionButton href={`/screenshots?sourceType=product&sourceId=${product.id}&productId=${product.id}`} variant="secondary">
              截图识别
            </ActionButton>
            <ActionButton href={`/products/${product.id}/edit`} variant="ghost">
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
          <InfoItem label="当前正式评分" value={topFormalScore} />
        </div>
        <div className="border-t border-[#EEF2F8] px-5 py-5">
          <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[24px] border border-[#EEF2F8] bg-[#FBFDFF] px-5 py-5">
              <p className="text-xs font-medium tracking-[0.08em] text-slate-400">顶部快捷动作</p>
              <h3 className="mt-2 text-[1.15rem] font-semibold tracking-[-0.03em] text-slate-900">先补竞品，再算利润，最后回到测试结论</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                商品详情顶部只强调正式评估动作，帮助你尽快补齐值得不值得测所需的数据，而不是重新回到旧来源入口里打转。
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <QuickActionLink
                  href={`/products/${product.id}?tab=competitors`}
                  title="补竞品"
                  description="进入正式竞品参考区，先补市场证据。"
                />
                <QuickActionLink
                  href={`/products/${product.id}?tab=competitor-analysis`}
                  title="看机会"
                  description="基于已确认竞品，查看 AI 机会和风险解释。"
                />
                <QuickActionLink
                  href={`/products/${product.id}?tab=profit`}
                  title="算利润"
                  description="补售价和成本，形成正式利润信号。"
                />
                <QuickActionLink
                  href={`/products/${product.id}?tab=scoring`}
                  title="得结论"
                  description="回到测试结论页，重新判断值不值得小批量测试。"
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-[#EEF2F8] bg-[#FBFDFF] px-5 py-5">
              <p className="text-xs font-medium tracking-[0.08em] text-slate-400">辅助来源记录</p>
              <h3 className="mt-2 text-[1.05rem] font-semibold tracking-[-0.03em] text-slate-900">链接导入继续保留，但不再作为主入口</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                如果你只是想补充旧链接、历史草稿或手动来源备注，可以继续用链接导入；正式评估还是要回到竞品、利润和测试结论流程。
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <ActionButton href={`/link-imports?purpose=product_candidate`} variant="ghost">
                  辅助记录来源链接
                </ActionButton>
                <ActionButton href={`/products/${product.id}?tab=basic`} variant="ghost">
                  查看基础信息
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard>
        <div className="grid gap-5 px-5 py-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[24px] border border-[#EEF2F8] bg-[#FBFDFF] px-5 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-xs font-medium tracking-[0.08em] text-slate-400">当前正式结论</p>
                <h3 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-900">{topConclusionLabel}</h3>
              </div>
              <StatusBadge label={topConclusionLabel} tone={topConclusionTone} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-white/80 bg-white px-4 py-4">
                <p className="text-xs font-medium text-slate-400">正式评分</p>
                <p className="mt-2 text-[1.35rem] font-semibold text-slate-900">{topFormalScore}</p>
              </div>
              <div className="rounded-[22px] border border-white/80 bg-white px-4 py-4">
                <p className="text-xs font-medium text-slate-400">有效竞品数</p>
                <p className="mt-2 text-[1.35rem] font-semibold text-slate-900">{validCompetitorCount}</p>
              </div>
            </div>
            <div className="mt-4 rounded-[22px] border border-white/80 bg-white px-4 py-4">
              <p className="text-xs font-medium text-slate-400">现在为什么不能完全判断</p>
              {formalMissingItems.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                  {formalMissingItems.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-7 text-slate-700">当前正式评分所需的基础条件已经齐备，可以进入测试结论页重新计算。</p>
              )}
            </div>
            <div className="mt-4 rounded-[22px] border border-white/80 bg-white px-4 py-4">
              <p className="text-xs font-medium text-slate-400">下一步建议</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{topNextSuggestion}</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#EEF2F8] bg-[#FBFDFF] px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-[0.08em] text-slate-400">商品评估流程</p>
                <h3 className="mt-2 text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-900">补竞品 → 看机会 → 算利润 → 得结论</h3>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {flowSteps.map((step) => (
                <a
                  key={step.key}
                  href={`/products/${product.id}?tab=${encodeURIComponent(step.key)}`}
                  className="block rounded-[22px] border border-white/80 bg-white px-4 py-4 transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium tracking-[0.08em] text-slate-400">{step.index} {step.title}</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{step.tabLabel}</p>
                    </div>
                    <StatusBadge label={step.status} tone={processToneMap[step.status]} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{step.helper}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{step.output}</p>
                </a>
              ))}
            </div>
          </div>
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
            <InfoItem label="Product ID" value={String(product.id)} />
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

        {activeTab === "competitor-analysis" && competitorAnalysisData ? (
          <>
            {competitorAnalysisReadError ? (
              <div className="px-5 py-5">
                <PageNote>{competitorAnalysisReadError}</PageNote>
              </div>
            ) : null}
            <CompetitorAnalysisTab
              productId={product.id}
              competitors={pageData.data.competitors}
              stats={pageData.data.competitorStats}
              snapshots={competitorAnalysisData.snapshots}
              minCompetitorCount={competitorAnalysisData.minCompetitorCount}
              runtimeNotice={competitorAnalysisData.readonlyNotice}
              analysisError={analysisError ?? null}
              onGenerate={generateCompetitorAnalysisAction.bind(null, product.id)}
              onMarkReference={markCompetitorAnalysisReferenceAction.bind(null, product.id)}
              onArchive={archiveCompetitorAnalysisAction.bind(null, product.id)}
            />
          </>
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
            sourceInspirationReference={pageData.data.sourceInspirationReference}
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
