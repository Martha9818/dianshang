import { prisma } from "@/lib/prisma";
import { PRODUCT_STATUS_VALUES } from "@/lib/modules/products/constants";
import { sanitizeAIErrorSummary } from "@/lib/services/ai";
import { getBackupSummary } from "@/lib/services/backup-log-service";
import { sanitizeDiagnosticText } from "@/lib/services/diagnostics";
import { normalizeProductReadError } from "@/lib/services/product-runtime-service";
import { getRuntimeModeSummary } from "@/lib/services/runtime";

const RECENT_AI_FAILURE_DAYS = 7;
const BACKUP_STALE_DAYS = 7;
const LOW_SCORE_THRESHOLD = 60;

export type DashboardTodoType =
  | "pending_inspirations"
  | "missing_competitors"
  | "missing_cost"
  | "low_score_unhandled"
  | "needs_copywriting"
  | "needs_material"
  | "recent_ai_failures"
  | "stale_backup"
  | "file_cleanup_entry";

export type DashboardTodoTone = "amber" | "blue" | "green" | "red" | "violet" | "slate";

export type DashboardTodoItem = {
  type: DashboardTodoType;
  title: string;
  count: number;
  description: string;
  href: string;
  actionLabel: string;
  tone: DashboardTodoTone;
  sourceLabel: string;
};

export type DashboardTodoSummary = {
  primaryItems: DashboardTodoItem[];
  utilityItems: DashboardTodoItem[];
  hasActionableItems: boolean;
  generatedAt: string;
};

export type DashboardTodoPageData =
  | {
      kind: "ready";
      data: DashboardTodoSummary;
    }
  | {
      kind: "unavailable";
      message: string;
    };

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function buildProductHref(params: Record<string, string>) {
  return `/products?${new URLSearchParams(params).toString()}`;
}

function buildTodoItem(input: DashboardTodoItem): DashboardTodoItem {
  return input;
}

async function getLowScoreUnhandledProductCount() {
  const eliminatedStatus = PRODUCT_STATUS_VALUES[4];
  const snapshots = await prisma.scoreSnapshot.findMany({
    where: {
      product: {
        deletedAt: null,
        status: { not: eliminatedStatus },
      },
      totalScore: {
        not: null,
      },
    },
    orderBy: [{ productId: "asc" }, { createdAt: "desc" }, { id: "desc" }],
    select: {
      productId: true,
      totalScore: true,
    },
  });

  const latestByProduct = new Map<number, number>();
  for (const snapshot of snapshots) {
    if (!latestByProduct.has(snapshot.productId) && typeof snapshot.totalScore === "number") {
      latestByProduct.set(snapshot.productId, snapshot.totalScore);
    }
  }

  return Array.from(latestByProduct.values()).filter((score) => score < LOW_SCORE_THRESHOLD).length;
}

async function getRecentAiFailureTodoItem(): Promise<DashboardTodoItem | null> {
  const since = daysAgo(RECENT_AI_FAILURE_DAYS);
  const [failedJobCount, failedRequestCount, latestFailedJob, latestFailedRequest] = await Promise.all([
    prisma.aIJob.count({
      where: {
        status: "failed",
        createdAt: { gte: since },
      },
    }),
    prisma.aIRequestLog.count({
      where: {
        success: false,
        createdAt: { gte: since },
      },
    }),
    prisma.aIJob.findFirst({
      where: {
        status: "failed",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      select: {
        errorSummary: true,
      },
    }),
    prisma.aIRequestLog.findFirst({
      where: {
        success: false,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      select: {
        errorSummary: true,
      },
    }),
  ]);

  const count = failedJobCount + failedRequestCount;
  if (count <= 0) {
    return null;
  }

  const latestError = latestFailedJob?.errorSummary ?? latestFailedRequest?.errorSummary ?? "最近有 AI 调用失败。";
  const safeError = sanitizeDiagnosticText(sanitizeAIErrorSummary(latestError));

  return buildTodoItem({
    type: "recent_ai_failures",
    title: "最近 AI 失败",
    count,
    description: `最近 ${RECENT_AI_FAILURE_DAYS} 天有失败记录：${safeError}`,
    href: "/system/diagnostics",
    actionLabel: "查看诊断",
    tone: "red",
    sourceLabel: "AIJob / AIRequestLog",
  });
}

async function getStaleBackupTodoItem(): Promise<DashboardTodoItem | null> {
  const summary = await getBackupSummary();
  const latestBackup = summary.latest;

  if (!latestBackup) {
    return buildTodoItem({
      type: "stale_backup",
      title: "需要手动备份",
      count: 1,
      description: "当前没有成功备份记录，建议在 Windows 本地完成一次手动备份。",
      href: "/backup",
      actionLabel: "去备份",
      tone: "amber",
      sourceLabel: "BackupLog",
    });
  }

  const ageDays = Math.floor((Date.now() - latestBackup.createdAt.getTime()) / (24 * 60 * 60 * 1000));
  if (ageDays < BACKUP_STALE_DAYS) {
    return null;
  }

  return buildTodoItem({
    type: "stale_backup",
    title: "长期未备份",
    count: Math.max(1, ageDays),
    description: `最近一次成功备份距今约 ${ageDays} 天，建议在 Windows 本地刷新备份。`,
    href: "/backup",
    actionLabel: "查看备份",
    tone: "amber",
    sourceLabel: "BackupLog",
  });
}

function getFileCleanupEntry(): DashboardTodoItem {
  const runtime = getRuntimeModeSummary();
  const description = runtime.isWritable
    ? "文件清理线程尚未完成；当前只提供诊断入口，不执行真实文件扫描或删除。"
    : "预览环境只读，不执行文件扫描、备份或清理写操作。";

  return buildTodoItem({
    type: "file_cleanup_entry",
    title: "可清理文件入口",
    count: 0,
    description,
    href: "/system/diagnostics",
    actionLabel: "打开诊断",
    tone: "slate",
    sourceLabel: "Runtime / Diagnostics",
  });
}

function onlyPositive(items: Array<DashboardTodoItem | null>) {
  return items.filter((item): item is DashboardTodoItem => Boolean(item && item.count > 0));
}

export async function getDashboardTodoSummary(): Promise<DashboardTodoSummary> {
  const [
    pendingInspirationCount,
    missingCompetitorCount,
    missingCostCount,
    lowScoreUnhandledCount,
    needsCopywritingCount,
    needsMaterialCount,
    aiFailureItem,
    staleBackupItem,
  ] = await Promise.all([
    prisma.inspiration.count({ where: { status: "pending" } }),
    prisma.product.count({ where: { deletedAt: null, competitors: { none: {} } } }),
    prisma.product.count({
      where: {
        deletedAt: null,
        OR: [{ estimatedPrice: null }, { estimatedCost: null }, { estimatedShipping: null }],
      },
    }),
    getLowScoreUnhandledProductCount(),
    prisma.product.count({ where: { deletedAt: null, copywritings: { none: {} } } }),
    prisma.product.count({ where: { deletedAt: null, materials: { none: {} } } }),
    getRecentAiFailureTodoItem(),
    getStaleBackupTodoItem(),
  ]);

  const primaryItems = onlyPositive([
    buildTodoItem({
      type: "pending_inspirations",
      title: "待处理灵感",
      count: pendingInspirationCount,
      description: "仍在灵感箱待查看或处理，需要人工决定归档、放弃或转商品。",
      href: "/inspirations?status=pending",
      actionLabel: "处理灵感",
      tone: "amber",
      sourceLabel: "Inspiration",
    }),
    buildTodoItem({
      type: "missing_competitors",
      title: "缺少竞品的商品",
      count: missingCompetitorCount,
      description: "这些商品还没有竞品记录，评分和文案参考会偏弱。",
      href: buildProductHref({ missingCompetitor: "true" }),
      actionLabel: "查看商品",
      tone: "amber",
      sourceLabel: "Product / Competitor",
    }),
    buildTodoItem({
      type: "missing_cost",
      title: "缺少成本的商品",
      count: missingCostCount,
      description: "缺少售价、进货价或运费，暂时无法判断利润空间。",
      href: buildProductHref({ missingCost: "true" }),
      actionLabel: "补成本",
      tone: "amber",
      sourceLabel: "Product",
    }),
    buildTodoItem({
      type: "low_score_unhandled",
      title: "低分未处理商品",
      count: lowScoreUnhandledCount,
      description: `最近评分低于 ${LOW_SCORE_THRESHOLD} 分但尚未淘汰，需要复核是否暂停或补数据。`,
      href: buildProductHref({ maxScore: String(LOW_SCORE_THRESHOLD - 1), sort: "updatedAt_desc" }),
      actionLabel: "复核商品",
      tone: "red",
      sourceLabel: "ScoreSnapshot",
    }),
    buildTodoItem({
      type: "needs_copywriting",
      title: "需要生成文案",
      count: needsCopywritingCount,
      description: "这些商品还没有文案记录，可进入商品列表筛选后手动生成或编辑。",
      href: buildProductHref({ hasCopywriting: "false" }),
      actionLabel: "查看商品",
      tone: "blue",
      sourceLabel: "Product / Copywriting",
    }),
    buildTodoItem({
      type: "needs_material",
      title: "需要上传素材",
      count: needsMaterialCount,
      description: "这些商品还没有素材记录，可进入商品列表筛选后手动上传。",
      href: buildProductHref({ hasMaterial: "false" }),
      actionLabel: "查看商品",
      tone: "violet",
      sourceLabel: "Product / Material",
    }),
    aiFailureItem,
    staleBackupItem,
  ]);

  return {
    primaryItems,
    utilityItems: [getFileCleanupEntry()],
    hasActionableItems: primaryItems.length > 0,
    generatedAt: new Date().toISOString(),
  };
}

export async function getDashboardTodoPageData(): Promise<DashboardTodoPageData> {
  try {
    return {
      kind: "ready",
      data: await getDashboardTodoSummary(),
    };
  } catch (error) {
    const businessError = normalizeProductReadError(error);
    return {
      kind: "unavailable",
      message: businessError.message,
    };
  }
}
