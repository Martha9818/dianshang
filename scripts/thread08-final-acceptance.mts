import {
  buildAssistantFallbackMessage,
  buildRuleBasedAssistantSuggestions,
  buildRuleOnlyAssistantSearchResult,
  detectProhibitedAssistantIntent,
} from "../src/lib/modules/local-assistant/localAssistantRules";
import { buildLocalAssistantSummary } from "../src/lib/modules/local-assistant/localAssistantService";
import { LOCAL_ASSISTANT_PREVIEW_MESSAGE } from "../src/lib/modules/local-assistant/localAssistantTypes";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function pass(label: string) {
  console.log(`PASS ${label}`);
}

function verifyProductRuleSuggestion() {
  const suggestions = buildRuleBasedAssistantSuggestions("找出缺成本且评分高的商品");
  const productSuggestion = suggestions.find((item) => item.scope === "product");

  assert(productSuggestion, "missing product suggestion");
  assert(productSuggestion.href.startsWith("/products?"), "product suggestion should navigate to /products");
  assert(productSuggestion.href.includes("missingCost=true"), "product suggestion should include missingCost=true");
  assert(productSuggestion.href.includes("minScore=80"), "product suggestion should include minScore=80");
  assert(productSuggestion.actionType === "filter", "product suggestion should be a filter action");

  pass("product rule suggestion");
}

function verifyBlockedIntentBoundary() {
  const blocked = detectProhibitedAssistantIntent("帮我批量清理旧备份并删除通知");

  assert(blocked, "blocked intent should be detected");
  assert(blocked.message.includes("不会直接执行"), "blocked message should explain boundary");
  assert(blocked.suggestions.some((item) => item.href === "/maintenance/files"), "blocked cleanup should redirect to /maintenance/files");
  assert(blocked.suggestions.some((item) => item.href === "/notifications"), "blocked notification operation should redirect to /notifications");
  assert(blocked.suggestions.every((item) => ["view", "search", "filter", "navigate"].includes(item.actionType)), "blocked suggestions should keep allowed action types only");

  pass("blocked intent boundary");
}

function verifyFallbackMessage() {
  const fallback = buildRuleOnlyAssistantSearchResult("看看最近 AI 失败通知", buildAssistantFallbackMessage());

  assert(fallback.fallbackMessage === "未能完成智能解析，已提供基于本地规则的筛选建议。请手动确认后查看。", "fallback message should match expected copy");
  assert(fallback.suggestions.some((item) => item.href.startsWith("/notifications")), "fallback result should still include notification suggestions");

  pass("ai fallback message");
}

function verifySummaryBuilder() {
  const summary = buildLocalAssistantSummary({
    dashboardItems: [
      {
        type: "missing_cost",
        title: "缺少成本的商品",
        count: 3,
        description: "有 3 个商品缺少成本字段。",
        href: "/products?missingCost=true",
        actionLabel: "查看商品",
        tone: "amber",
        sourceLabel: "Product",
      },
      {
        type: "recent_ai_job_failures",
        title: "最近 AI 任务失败",
        count: 1,
        description: "最近 7 天有 AI 任务失败。",
        href: "/system/diagnostics",
        actionLabel: "查看诊断",
        tone: "red",
        sourceLabel: "AIJob",
      },
    ],
    notifications: [
      {
        id: 1,
        title: "AI 任务失败",
        message: "需要复核最近一次 AI 调用失败。",
        level: "error",
        status: "unread",
        typeLabel: "AI",
        actionUrl: "/system/diagnostics",
      },
      {
        id: 2,
        title: "备份完成",
        message: "最近一次备份已完成。",
        level: "success",
        status: "read",
        typeLabel: "备份",
        actionUrl: "/backup",
      },
    ],
    cleanupLogs: [
      {
        id: 3,
        action: "scan",
        status: "failed",
        reason: "最近一次文件维护扫描失败，需要人工复核。",
      },
    ],
  });

  assert(summary.sections.length === 3, "summary should expose three sections");
  assert(summary.sections[0].items.length > 0, "focus section should not be empty");
  assert(summary.sections[1].items.some((item) => item.href === "/maintenance/files"), "attention section should include cleanup redirect");
  assert(summary.sections[2].items.some((item) => item.href === "/backup"), "ignorable section should include handled backup notification");

  pass("summary builder");
}

function verifyPreviewMessage() {
  assert(LOCAL_ASSISTANT_PREVIEW_MESSAGE === "预览环境只读，请在 Windows 本地验收站内助手。", "preview message should match expected copy");
  pass("preview readonly message");
}

async function main() {
  verifyProductRuleSuggestion();
  verifyBlockedIntentBoundary();
  verifyFallbackMessage();
  verifySummaryBuilder();
  verifyPreviewMessage();
  console.log("Thread 08 lightweight verification passed.");
}

main().catch((error) => {
  console.error("Thread 08 lightweight verification failed:");
  console.error(error);
  process.exitCode = 1;
});
