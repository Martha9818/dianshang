import {
  buildAssistantFallbackMessage,
  buildDefaultAssistantSuggestions,
  buildRuleBasedAssistantSuggestions,
  buildRuleOnlyAssistantSearchResult,
  detectProhibitedAssistantIntent,
  mergeAssistantSuggestions,
  normalizeAssistantQuestion,
} from "@/lib/modules/local-assistant/localAssistantRules";
import {
  LOCAL_ASSISTANT_PREVIEW_MESSAGE,
  LOCAL_ASSISTANT_TOP_NOTICE,
  type LocalAssistantPageData,
  type LocalAssistantSearchResult,
  type LocalAssistantSummaryItem,
  type LocalAssistantSummaryResult,
} from "@/lib/modules/local-assistant/localAssistantTypes";
import { generateTextJson } from "@/lib/services/ai-client";
import { createAIJob, markAIJobFailed, markAIJobRunning, markAIJobSuccess, type AISchema, validateJsonAIOutput } from "@/lib/services/ai";
import { getDefaultEnabledAIProvider } from "@/lib/services/ai-provider-service";
import { getBackupSummary } from "@/lib/services/backup-log-service";
import { getDashboardTodoSummary, type DashboardTodoItem } from "@/lib/services/dashboardTodoService";
import { getRecentCleanupLogs } from "@/lib/services/fileMaintenanceService";
import { getNotificationCenterPageData } from "@/lib/services/notificationService";
import { getRuntimeModeSummary, normalizeProductReadError } from "@/lib/services/product-runtime-service";

const LOCAL_ASSISTANT_AI_JOB_TYPES = {
  SEARCH: "local_assistant_search",
} as const;

const LOCAL_ASSISTANT_EXAMPLES = [
  "找出缺成本且评分高的商品",
  "看看最近的 AI 失败通知",
  "有哪些待处理灵感",
  "提醒我关注旧备份和旧导出",
  "找出缺素材的商品",
] as const;

type AssistantIntentDraft = {
  scope: string;
  hints: string[];
  blocked: boolean;
  blockedReason: string | null;
  explanation: string;
};

type AssistantSummarySources = {
  dashboardItems: DashboardTodoItem[];
  notifications: Array<{
    id: number;
    title: string;
    message: string | null;
    level: string;
    status: string;
    typeLabel: string;
    actionUrl: string | null;
  }>;
  cleanupLogs: Array<{
    id: number;
    action: string;
    status: string;
    reason: string | null;
  }>;
};

const assistantIntentSchema: AISchema<AssistantIntentDraft> = {
  name: "LocalAssistantIntentDraft",
  validate(value: unknown): value is AssistantIntentDraft {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }

    const record = value as Record<string, unknown>;
    return (
      typeof record.scope === "string" &&
      Array.isArray(record.hints) &&
      record.hints.every((item) => typeof item === "string") &&
      typeof record.blocked === "boolean" &&
      (record.blockedReason === null || typeof record.blockedReason === "string") &&
      typeof record.explanation === "string"
    );
  },
};

function buildAssistantIntentJsonSchema() {
  return {
    name: "local_assistant_intent",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        scope: {
          type: "string",
          description:
            "One of: product, competitor, material, copywriting, prompt_task, inspiration, notification, cleanup, backup, export, ai_log, assistant.",
        },
        hints: {
          type: "array",
          items: {
            type: "string",
          },
          description:
            "Return only short safe intent hints such as 缺成本, 高评分, 未读通知, AI 失败, 旧备份, 旧导出. Never return URLs or commands.",
        },
        blocked: {
          type: "boolean",
          description: "true if the user is requesting delete, archive, batch update, file cleanup execution, mark read, generate image, or another write action.",
        },
        blockedReason: {
          type: ["string", "null"],
          description: "Short Chinese explanation when blocked is true.",
        },
        explanation: {
          type: "string",
          description: "Short Chinese explanation of the inferred intent. Keep it advisory only.",
        },
      },
      required: ["scope", "hints", "blocked", "blockedReason", "explanation"],
    },
  };
}

function buildAssistantIntentPrompt(question: string) {
  return [
    "你是 EcomPilot 的本地站内搜索助手。",
    "只做意图识别，不生成 URL，不生成 Prisma，不建议任何写操作。",
    "如果问题涉及删除、归档、批量处理、标记已读、文件清理执行、生成图片、改状态、自动上架、私信、评论，请 blocked=true。",
    "输出严格 JSON。",
    "question:",
    question,
  ].join("\n");
}

function createSummaryItem(input: LocalAssistantSummaryItem) {
  return input;
}

function truncateText(value: string | null | undefined, maxLength = 140) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : "";
}

function mapDashboardItemToSummary(item: DashboardTodoItem): LocalAssistantSummaryItem {
  return createSummaryItem({
    id: `todo-${item.type}`,
    title: item.title,
    description: item.description,
    href: item.href,
    actionType: "navigate",
    tone: item.tone,
    sourceLabel: item.sourceLabel,
  });
}

function mapNotificationTone(level: string, status: string) {
  if (level === "error") return "red" as const;
  if (level === "warning") return "amber" as const;
  if (status === "read") return "slate" as const;
  if (level === "success") return "green" as const;
  return "blue" as const;
}

function buildNotificationSummary(input: AssistantSummarySources): LocalAssistantSummaryResult {
  const focusItems = input.dashboardItems.slice(0, 3).map(mapDashboardItemToSummary);
  const unreadActionableNotifications = input.notifications
    .filter((notification) => notification.status === "unread" && (notification.level === "error" || notification.level === "warning"))
    .slice(0, 3)
    .map((notification) =>
      createSummaryItem({
        id: `notification-unread-${notification.id}`,
        title: notification.title,
        description: truncateText(notification.message, 160) || "存在尚未处理的本地通知。",
        href: notification.actionUrl ?? "/notifications",
        actionType: "navigate",
        tone: mapNotificationTone(notification.level, notification.status),
        sourceLabel: notification.typeLabel,
      }),
    );
  const cleanupFailures = input.cleanupLogs
    .filter((log) => log.status === "failed")
    .slice(0, 2)
    .map((log) =>
      createSummaryItem({
        id: `cleanup-failed-${log.id}`,
        title: "文件维护记录需要复核",
        description: truncateText(log.reason, 160) || "最近有文件维护失败记录，请进入文件维护页手动复核。",
        href: "/maintenance/files",
        actionType: "navigate",
        tone: "amber",
        sourceLabel: "CleanupLog",
      }),
    );

  const attentionItems = [...focusItems.filter((item) => item.tone === "red" || item.tone === "amber"), ...unreadActionableNotifications, ...cleanupFailures]
    .filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 6);

  const ignorableItems = input.notifications
    .filter((notification) => notification.status === "read" || notification.level === "success")
    .slice(0, 5)
    .map((notification) =>
      createSummaryItem({
        id: `notification-handled-${notification.id}`,
        title: notification.title,
        description: truncateText(notification.message, 160) || "这条通知更适合作为历史记录保留。",
        href: notification.actionUrl ?? "/notifications",
        actionType: "view",
        tone: mapNotificationTone(notification.level, notification.status),
        sourceLabel: notification.typeLabel,
      }),
    );

  return {
    generatedAt: new Date().toISOString(),
    sections: [
      {
        key: "focus",
        title: "今天建议关注什么",
        emptyText: "今天没有明显的新提醒，可以按需查看商品、通知或诊断页。",
        items: focusItems.length > 0 ? focusItems : unreadActionableNotifications.slice(0, 3),
      },
      {
        key: "attention",
        title: "哪些问题可能需要处理",
        emptyText: "当前没有发现明显需要马上处理的本地问题。",
        items: attentionItems,
      },
      {
        key: "ignorable",
        title: "哪些通知可以忽略或已处理",
        emptyText: "当前没有明显的已处理通知摘要。",
        items: ignorableItems,
      },
    ],
  };
}

function buildAiBlockedSearchResult(question: string, blockedReason: string | null): LocalAssistantSearchResult {
  const blocked = detectProhibitedAssistantIntent([question, blockedReason].filter(Boolean).join(" "));

  if (blocked) {
    return {
      question,
      suggestions: blocked.suggestions,
      strategyLabel: "AI 意图识别 + 规则校验",
      helperText: "AI 识别到请求涉及写操作，已改为安全提示和人工跳转建议。",
      fallbackMessage: null,
      blockedMessage: blockedReason || blocked.message,
      aiStatus: "success",
    };
  }

  return {
    question,
    suggestions: buildDefaultAssistantSuggestions(),
    strategyLabel: "AI 意图识别 + 规则校验",
    helperText: "AI 识别到请求不适合直接执行，已改为安全跳转建议。",
    fallbackMessage: null,
    blockedMessage: blockedReason || "该请求超出站内助手权限范围。",
    aiStatus: "success",
  };
}

async function resolveAssistantIntentWithAi(question: string) {
  const provider = await getDefaultEnabledAIProvider();
  if (!provider) {
    return {
      status: "skipped_no_provider" as const,
      draft: null,
    };
  }

  let aiJobId: number | null = null;

  try {
    const aiJob = await createAIJob({
      jobType: LOCAL_ASSISTANT_AI_JOB_TYPES.SEARCH,
      idempotencyKey: `local-assistant:${Date.now()}`,
      inputSummary: `local assistant search ${question}`,
    });
    aiJobId = aiJob.id;
    await markAIJobRunning(aiJobId);

    const result = await generateTextJson({
      baseUrl: provider.baseUrl ?? "",
      apiKey: provider.apiKey ?? "",
      modelName: provider.modelName ?? "",
      providerType: provider.providerType,
      prompt: buildAssistantIntentPrompt(question),
      requestType: "general",
      inputSummary: `assistant question ${question}`,
      relatedTaskId: aiJobId,
      preferStructuredOutput: true,
      responseSchema: buildAssistantIntentJsonSchema(),
      jobId: aiJobId,
    });

    const draft = validateJsonAIOutput(result.content, assistantIntentSchema);
    if (!draft.success) {
      throw new Error(draft.errorSummary);
    }

    await markAIJobSuccess(aiJobId, `assistant intent parsed scope=${draft.data.scope}`);

    return {
      status: "success" as const,
      draft: draft.data,
    };
  } catch (error) {
    if (aiJobId !== null) {
      await markAIJobFailed(aiJobId, error).catch(() => null);
    }

    return {
      status: "failed" as const,
      draft: null,
    };
  }
}

async function buildAssistantSearchResult(question: string): Promise<LocalAssistantSearchResult> {
  const blocked = detectProhibitedAssistantIntent(question);
  if (blocked) {
    return {
      question,
      suggestions: blocked.suggestions,
      strategyLabel: "规则安全提示",
      helperText: "已识别到写操作或越权请求，因此仅返回人工跳转建议。",
      fallbackMessage: null,
      blockedMessage: blocked.message,
      aiStatus: "not_attempted",
    };
  }

  const runtime = getRuntimeModeSummary();
  if (!runtime.isWritable) {
    return {
      ...buildRuleOnlyAssistantSearchResult(question),
      aiStatus: "skipped_preview",
    };
  }

  const aiResult = await resolveAssistantIntentWithAi(question);
  if (aiResult.status === "skipped_no_provider") {
    return {
      ...buildRuleOnlyAssistantSearchResult(question),
      aiStatus: "skipped_no_provider",
      helperText: "未检测到可用的默认文本 Provider，已直接返回规则建议。",
    };
  }

  if (aiResult.status === "failed" || !aiResult.draft) {
    return {
      ...buildRuleOnlyAssistantSearchResult(question, buildAssistantFallbackMessage()),
      aiStatus: "failed",
    };
  }

  if (aiResult.draft.blocked) {
    return buildAiBlockedSearchResult(question, aiResult.draft.blockedReason);
  }

  const aiHintsQuestion = [question, aiResult.draft.scope, ...aiResult.draft.hints].join(" ");
  const aiSuggestions = buildRuleBasedAssistantSuggestions(aiHintsQuestion, "ai_plus_rule");
  const ruleSuggestions = buildRuleBasedAssistantSuggestions(question, "rule");
  const finalSuggestions = mergeAssistantSuggestions(aiSuggestions, ruleSuggestions);

  return {
    question,
    suggestions: finalSuggestions.length > 0 ? finalSuggestions : buildDefaultAssistantSuggestions(),
    strategyLabel: "AI 意图识别 + 规则校验",
    helperText: aiResult.draft.explanation || "AI 只参与意图识别，最终筛选链接仍由本地规则生成。",
    fallbackMessage: null,
    blockedMessage: null,
    aiStatus: "success",
  };
}

async function loadSummarySources(): Promise<AssistantSummarySources> {
  const [todoSummary, notificationPageData, cleanupLogs, backupSummary] = await Promise.all([
    getDashboardTodoSummary(),
    getNotificationCenterPageData(),
    getRecentCleanupLogs(8),
    getBackupSummary().catch(() => null),
  ]);

  const backupReminder = backupSummary?.latest
    ? null
    : createSummaryItem({
        id: "backup-missing",
        title: "建议补一次本地备份",
        description: "当前没有成功备份记录，建议在 Windows 本地手动执行一次备份。",
        href: "/backup",
        actionType: "navigate",
        tone: "amber",
        sourceLabel: "BackupLog",
      });

  const dashboardItems = backupReminder
    ? [...todoSummary.primaryItems, { ...backupReminder, type: "backup-missing", count: 1, actionLabel: "查看备份", sourceLabel: "BackupLog" } as unknown as DashboardTodoItem]
    : todoSummary.primaryItems;

  return {
    dashboardItems,
    notifications: notificationPageData.notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      level: notification.level,
      status: notification.status,
      typeLabel: notification.typeLabel,
      actionUrl: notification.actionUrl,
    })),
    cleanupLogs: cleanupLogs.map((log) => ({
      id: log.id,
      action: log.action,
      status: log.status,
      reason: log.reason,
    })),
  };
}

export function buildLocalAssistantSummary(input: AssistantSummarySources) {
  return buildNotificationSummary(input);
}

export async function getLocalAssistantPageData(question?: string | null): Promise<LocalAssistantPageData> {
  const runtime = getRuntimeModeSummary();
  const normalizedQuestion = normalizeAssistantQuestion(question);
  let searchResult: LocalAssistantSearchResult | null = null;
  let searchError: string | null = null;
  let summaryError: string | null = null;
  let summary: LocalAssistantSummaryResult = {
    generatedAt: new Date().toISOString(),
    sections: [
      {
        key: "focus",
        title: "今天建议关注什么",
        emptyText: "暂无摘要。",
        items: [],
      },
      {
        key: "attention",
        title: "哪些问题可能需要处理",
        emptyText: "暂无摘要。",
        items: [],
      },
      {
        key: "ignorable",
        title: "哪些通知可以忽略或已处理",
        emptyText: "暂无摘要。",
        items: [],
      },
    ],
  };

  if (normalizedQuestion) {
    try {
      searchResult = await buildAssistantSearchResult(normalizedQuestion);
    } catch (error) {
      const businessError = normalizeProductReadError(error);
      searchError = businessError.message;
      searchResult = {
        ...buildRuleOnlyAssistantSearchResult(normalizedQuestion, buildAssistantFallbackMessage()),
        aiStatus: "failed",
      };
    }
  }

  try {
    const sources = await loadSummarySources();
    summary = buildNotificationSummary(sources);
  } catch (error) {
    summaryError = normalizeProductReadError(error).message;
  }

  return {
    runtime: {
      mode: runtime.mode,
      label: runtime.label,
      isWritable: runtime.isWritable,
      readonlyMessage: runtime.readonlyMessage,
    },
    topNotice: LOCAL_ASSISTANT_TOP_NOTICE,
    readonlyNotice: runtime.isWritable ? null : LOCAL_ASSISTANT_PREVIEW_MESSAGE,
    searchResult,
    summary,
    examples: [...LOCAL_ASSISTANT_EXAMPLES],
    searchError,
    summaryError,
  };
}
