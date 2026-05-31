import { MiniIcon, PageNote, StatCard } from "@/components/dashboard/primitives";
import { BannedWordsManager } from "@/components/settings/banned-words-manager";
import { WorkspacePage } from "@/components/ui/workspace-page";
import { getProductErrorMessage } from "@/lib/modules/products";
import { getBannedWordSettingsPageData } from "@/lib/services/banned-word-service";
import { buildReadonlyRuntimeMessage, getRuntimeModeSummary } from "@/lib/services/product-runtime-service";

export const dynamic = "force-dynamic";

export default async function BannedWordsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; riskLevel?: string }>;
}) {
  const params = await searchParams;
  const runtime = getRuntimeModeSummary();
  const pageData = await getBannedWordSettingsPageData({
    query: params.q,
    category: params.category,
    riskLevel: params.riskLevel,
  }).catch((error) => ({
    stats: {
      totalCount: 0,
      categoryCount: 0,
      highRiskCount: 0,
      deltas: {
        totalCount: "0",
        categoryCount: "0",
        highRiskCount: "0",
      },
    },
    filters: {
      categories: [],
      riskLevels: [],
    },
    words: [],
    readError: getProductErrorMessage(error, "当前预览环境无法读取本地违规词库，请在 Windows 本地验收。"),
  }));

  return (
    <WorkspacePage
      eyebrow="Settings / Banned Words"
      title="违规词设置"
      description="维护违规词、风险等级和分类，生成后的文案会自动执行扫描与审核状态标记。"
    >
      {"readError" in pageData ? <PageNote>{pageData.readError}</PageNote> : null}
      <section className="grid gap-4 xl:grid-cols-3">
        <StatCard
          label="违规词总数"
          value={String(pageData.stats.totalCount)}
          delta={pageData.stats.deltas.totalCount}
          tone="red"
          icon={<MiniIcon name="ban" className="h-7 w-7" />}
        />
        <StatCard
          label="分类数量"
          value={String(pageData.stats.categoryCount)}
          delta={pageData.stats.deltas.categoryCount}
          tone="blue"
          icon={<MiniIcon name="doc" className="h-7 w-7" />}
        />
        <StatCard
          label="高风险数量"
          value={String(pageData.stats.highRiskCount)}
          delta={pageData.stats.deltas.highRiskCount}
          tone="amber"
          icon={<MiniIcon name="shield" className="h-7 w-7" />}
        />
      </section>

      <BannedWordsManager
        words={pageData.words}
        categories={pageData.filters.categories}
        riskLevels={pageData.filters.riskLevels}
        runtimeNotice={runtime.isWritable ? null : buildReadonlyRuntimeMessage(runtime.mode)}
      />
    </WorkspacePage>
  );
}
