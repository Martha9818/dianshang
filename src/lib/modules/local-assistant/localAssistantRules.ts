import {
  LOCAL_ASSISTANT_AI_FALLBACK_MESSAGE,
  LOCAL_ASSISTANT_ALLOWED_ACTIONS,
  type LocalAssistantActionType,
  type LocalAssistantScope,
  type LocalAssistantSearchResult,
  type LocalAssistantSuggestion,
  type LocalAssistantSuggestionSource,
  type LocalAssistantTone,
} from "@/lib/modules/local-assistant/localAssistantTypes";

const SAFE_ROUTE_PREFIXES = [
  "/assistant",
  "/products",
  "/materials",
  "/copywriting",
  "/prompt-tasks",
  "/inspirations",
  "/notifications",
  "/maintenance/files",
  "/backup",
  "/export",
  "/system/diagnostics",
] as const;

type SuggestionInput = {
  id: string;
  title: string;
  description: string;
  href: string;
  actionType: LocalAssistantActionType;
  scope: LocalAssistantScope;
  source: LocalAssistantSuggestionSource;
  reason: string;
  tone?: LocalAssistantTone;
};

type ProhibitedIntent = {
  message: string;
  suggestions: LocalAssistantSuggestion[];
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeAssistantQuestion(question: string | null | undefined) {
  const normalized = normalizeWhitespace(String(question ?? ""));
  return normalized ? normalized.slice(0, 240) : null;
}

function hasAnyKeyword(question: string, keywords: string[]) {
  return keywords.some((keyword) => question.includes(keyword));
}

function buildAssistantHref(pathname: string, params?: Record<string, string | null | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    const normalized = normalizeWhitespace(String(value ?? ""));
    if (normalized) {
      search.set(key, normalized);
    }
  }

  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function isAllowedActionType(actionType: string): actionType is LocalAssistantActionType {
  return (LOCAL_ASSISTANT_ALLOWED_ACTIONS as readonly string[]).includes(actionType);
}

function isSafeAssistantHref(href: string) {
  return SAFE_ROUTE_PREFIXES.some((prefix) => href === prefix || href.startsWith(`${prefix}?`) || href.startsWith(`${prefix}/`));
}

function createSuggestion(input: SuggestionInput): LocalAssistantSuggestion {
  if (!isAllowedActionType(input.actionType)) {
    throw new Error(`Unsupported assistant action type: ${input.actionType}`);
  }

  if (!isSafeAssistantHref(input.href)) {
    throw new Error(`Unsafe assistant href: ${input.href}`);
  }

  return {
    id: input.id,
    title: input.title,
    description: input.description,
    href: input.href,
    actionType: input.actionType,
    scope: input.scope,
    source: input.source,
    reason: input.reason,
    badgeLabel: "辅助建议",
    tone: input.tone ?? "blue",
  };
}

function pushUniqueSuggestion(list: LocalAssistantSuggestion[], suggestion: LocalAssistantSuggestion | null) {
  if (!suggestion) {
    return;
  }

  if (list.some((item) => item.href === suggestion.href && item.actionType === suggestion.actionType && item.scope === suggestion.scope)) {
    return;
  }

  list.push(suggestion);
}

function buildProductSuggestion(question: string, source: LocalAssistantSuggestionSource) {
  const productSignal =
    hasAnyKeyword(question, ["商品", "产品", "缺成本", "没成本", "无成本", "评分高", "高评分", "高分", "低分", "缺竞品", "缺素材", "缺文案", "复核", "重评"]) ||
    hasAnyKeyword(question, ["成本不全", "评分低", "没竞品", "没素材", "没文案"]);

  if (!productSignal) {
    return null;
  }

  const params: Record<string, string> = {
    sort: "updatedAt_desc",
  };
  const reasons: string[] = [];

  if (hasAnyKeyword(question, ["缺成本", "没成本", "无成本", "成本不全"])) {
    params.missingCost = "true";
    reasons.push("缺少价格或成本字段");
  }

  if (hasAnyKeyword(question, ["缺竞品", "没竞品", "无竞品"])) {
    params.missingCompetitor = "true";
    reasons.push("缺少竞品记录");
  }

  if (hasAnyKeyword(question, ["缺素材", "没素材", "无素材"])) {
    params.hasMaterial = "false";
    reasons.push("缺少素材记录");
  }

  if (hasAnyKeyword(question, ["缺文案", "没文案", "无文案"])) {
    params.hasCopywriting = "false";
    reasons.push("缺少文案记录");
  }

  if (hasAnyKeyword(question, ["评分高", "高评分", "高分"])) {
    params.minScore = "80";
    reasons.push("评分不低于 80");
  }

  if (hasAnyKeyword(question, ["低分", "评分低"])) {
    params.maxScore = "59";
    reasons.push("评分低于 60");
  }

  if (hasAnyKeyword(question, ["复核", "重评", "重新评分"])) {
    params.needsRescore = "true";
    reasons.push("需要人工复核评分");
  }

  return createSuggestion({
    id: "product-filter",
    title: "查看商品筛选结果",
    description: reasons.length > 0 ? `按本地商品数据生成筛选条件：${reasons.join("、")}。` : "按本地商品数据提供筛选入口。",
    href: buildAssistantHref("/products", params),
    actionType: Object.keys(params).length > 1 ? "filter" : "search",
    scope: "product",
    source,
    reason: reasons.join("；") || "本地商品检索建议",
    tone: hasAnyKeyword(question, ["低分", "评分低", "缺成本", "缺竞品"]) ? "amber" : "blue",
  });
}

function buildCompetitorSuggestion(question: string, source: LocalAssistantSuggestionSource) {
  if (!hasAnyKeyword(question, ["竞品", "对手"])) {
    return null;
  }

  return createSuggestion({
    id: "competitor-navigate",
    title: "从商品列表进入竞品详情",
    description: "当前没有独立竞品总表，建议先打开含竞品商品，再进入商品详情页的竞品或竞品分析标签。",
    href: buildAssistantHref("/products", { missingCompetitor: "false", sort: "updatedAt_desc" }),
    actionType: "navigate",
    scope: "competitor",
    source,
    reason: "竞品数据挂在商品详情下，需人工进入查看",
    tone: "violet",
  });
}

function buildMaterialSuggestion(question: string, source: LocalAssistantSuggestionSource) {
  if (!hasAnyKeyword(question, ["素材", "图片素材", "主图", "详情图", "封面图"])) {
    return null;
  }

  const params: Record<string, string> = {
    sort: "createdAt_desc",
  };
  const reasons: string[] = [];

  if (hasAnyKeyword(question, ["待审", "待审核", "审核"])) {
    params.status = "待审核";
    reasons.push("待审核素材");
  }

  if (hasAnyKeyword(question, ["可用", "可使用"])) {
    params.status = "可使用";
    reasons.push("可使用素材");
  }

  if (hasAnyKeyword(question, ["待修改", "需修改"])) {
    params.status = "待修改";
    reasons.push("待修改素材");
  }

  return createSuggestion({
    id: "material-search",
    title: "查看素材库建议筛选",
    description: reasons.length > 0 ? `已根据问题聚焦素材条件：${reasons.join("、")}。` : "打开素材库并保留本地只读筛选建议。",
    href: buildAssistantHref("/materials", params),
    actionType: Object.keys(params).length > 1 ? "filter" : "search",
    scope: "material",
    source,
    reason: reasons.join("；") || "本地素材检索建议",
    tone: "blue",
  });
}

function buildCopywritingSuggestion(question: string, source: LocalAssistantSuggestionSource) {
  if (!hasAnyKeyword(question, ["文案", "标题", "违禁词", "风险文案"])) {
    return null;
  }

  const params: Record<string, string> = {
    sort: "createdAt_desc",
  };
  const reasons: string[] = [];

  if (hasAnyKeyword(question, ["违禁", "风险", "敏感"])) {
    params.hasViolation = "true";
    reasons.push("有违禁或风险提示的文案");
  }

  return createSuggestion({
    id: "copywriting-search",
    title: "查看文案列表建议筛选",
    description: reasons.length > 0 ? `按本地文案记录筛选：${reasons.join("、")}。` : "打开本地文案列表，进一步手动查看或筛选。",
    href: buildAssistantHref("/copywriting", params),
    actionType: Object.keys(params).length > 1 ? "filter" : "search",
    scope: "copywriting",
    source,
    reason: reasons.join("；") || "本地文案检索建议",
    tone: hasAnyKeyword(question, ["违禁", "风险", "敏感"]) ? "amber" : "blue",
  });
}

function buildPromptTaskSuggestion(question: string, source: LocalAssistantSuggestionSource) {
  if (!hasAnyKeyword(question, ["prompt", "Prompt", "任务", "生图任务", "回传"])) {
    return null;
  }

  return createSuggestion({
    id: "prompt-task-search",
    title: "查看 Prompt 任务列表",
    description: "打开本地 Prompt 任务页后可继续按状态、平台或图类型手动筛选。",
    href: buildAssistantHref("/prompt-tasks", { sort: "createdAt_desc" }),
    actionType: "navigate",
    scope: "prompt_task",
    source,
    reason: "Prompt 任务需人工查看和处理",
    tone: "violet",
  });
}

function buildInspirationSuggestion(question: string, source: LocalAssistantSuggestionSource) {
  if (!hasAnyKeyword(question, ["灵感", "灵感箱", "待处理灵感", "已转商品"])) {
    return null;
  }

  const params: Record<string, string> = {
    sort: "createdAt_desc",
  };
  const reasons: string[] = [];

  if (hasAnyKeyword(question, ["待处理", "待确认", "待审核"])) {
    params.status = "pending";
    reasons.push("待处理灵感");
  }

  if (hasAnyKeyword(question, ["已转商品", "转商品", "已转换"])) {
    params.converted = "true";
    reasons.push("已转商品灵感");
  }

  if (hasAnyKeyword(question, ["有图", "含图", "图片"])) {
    params.hasImage = "true";
    reasons.push("有图片灵感");
  }

  return createSuggestion({
    id: "inspiration-search",
    title: "查看灵感箱建议筛选",
    description: reasons.length > 0 ? `按本地灵感记录筛选：${reasons.join("、")}。` : "打开灵感箱查看当前记录。",
    href: buildAssistantHref("/inspirations", params),
    actionType: Object.keys(params).length > 1 ? "filter" : "search",
    scope: "inspiration",
    source,
    reason: reasons.join("；") || "本地灵感检索建议",
    tone: "amber",
  });
}

function buildNotificationSuggestion(question: string, source: LocalAssistantSuggestionSource) {
  if (!hasAnyKeyword(question, ["通知", "提醒", "消息", "AI 失败", "备份通知"])) {
    return null;
  }

  const params: Record<string, string> = {};
  const reasons: string[] = [];

  if (hasAnyKeyword(question, ["未读"])) {
    params.status = "unread";
    reasons.push("未读通知");
  }

  if (hasAnyKeyword(question, ["AI", "ai"])) {
    params.type = "AI";
    reasons.push("AI 相关通知");
  }

  if (hasAnyKeyword(question, ["备份"])) {
    params.type = "BACKUP";
    reasons.push("备份通知");
  }

  if (hasAnyKeyword(question, ["清理"])) {
    params.type = "CLEANUP";
    reasons.push("文件清理提醒");
  }

  return createSuggestion({
    id: "notification-search",
    title: "查看通知中心建议筛选",
    description: reasons.length > 0 ? `按本地通知筛选：${reasons.join("、")}。` : "打开通知中心查看最近提醒。",
    href: buildAssistantHref("/notifications", params),
    actionType: Object.keys(params).length > 0 ? "filter" : "navigate",
    scope: "notification",
    source,
    reason: reasons.join("；") || "本地通知检索建议",
    tone: hasAnyKeyword(question, ["AI 失败", "失败", "错误"]) ? "red" : "blue",
  });
}

function buildCleanupSuggestion(question: string, source: LocalAssistantSuggestionSource) {
  if (!hasAnyKeyword(question, ["清理", "回收站", "旧导出", "旧备份", "孤儿文件", "文件维护"])) {
    return null;
  }

  return createSuggestion({
    id: "cleanup-navigate",
    title: "前往文件维护页面手动处理",
    description: "仅提供提醒和跳转；如需扫描、移入回收站或永久删除，请在现有文件维护页面中手动确认。",
    href: "/maintenance/files",
    actionType: "navigate",
    scope: "cleanup",
    source,
    reason: "文件清理属于 V1-Plus Thread 06，助手不得直接执行",
    tone: "amber",
  });
}

function buildBackupSuggestion(question: string, source: LocalAssistantSuggestionSource) {
  if (!hasAnyKeyword(question, ["备份", "备份记录"])) {
    return null;
  }

  return createSuggestion({
    id: "backup-view",
    title: "查看备份记录",
    description: "打开备份页查看本地备份状态与历史记录。",
    href: "/backup",
    actionType: "view",
    scope: "backup",
    source,
    reason: "备份状态只读查看",
    tone: "blue",
  });
}

function buildExportSuggestion(question: string, source: LocalAssistantSuggestionSource) {
  if (!hasAnyKeyword(question, ["导出", "导出记录", "excel"])) {
    return null;
  }

  return createSuggestion({
    id: "export-view",
    title: "查看导出记录",
    description: "打开导出页查看本地导出记录与文件。",
    href: "/export",
    actionType: "view",
    scope: "export",
    source,
    reason: "导出记录只读查看",
    tone: "blue",
  });
}

function buildAiLogSuggestion(question: string, source: LocalAssistantSuggestionSource) {
  if (!hasAnyKeyword(question, ["AI 日志", "AI失败", "AI 失败", "AI 请求", "诊断"])) {
    return null;
  }

  return createSuggestion({
    id: "ai-log-view",
    title: "查看 AI 日志摘要与诊断",
    description: "打开系统诊断页查看 AI 请求失败、作业失败和脱敏后的日志摘要。",
    href: "/system/diagnostics",
    actionType: "view",
    scope: "ai_log",
    source,
    reason: "AI 日志只读查看",
    tone: "red",
  });
}

function buildAssistantHomeSuggestion() {
  return createSuggestion({
    id: "assistant-home",
    title: "回到站内助手首页",
    description: "继续输入更明确的问题，或从下方通知摘要中选择一个入口。",
    href: "/assistant",
    actionType: "navigate",
    scope: "assistant",
    source: "safe_redirect",
    reason: "回到只读助手首页",
    tone: "slate",
  });
}

export function detectProhibitedAssistantIntent(question: string): ProhibitedIntent | null {
  const normalized = normalizeAssistantQuestion(question);
  if (!normalized) {
    return null;
  }

  const suggestions: LocalAssistantSuggestion[] = [];

  if (hasAnyKeyword(normalized, ["删除通知", "标记已读", "已读通知", "清理通知"])) {
    pushUniqueSuggestion(
      suggestions,
      createSuggestion({
        id: "notification-safe-redirect",
        title: "前往通知中心手动处理",
        description: "通知可查看，但标记已读、删除或清理必须由你在通知中心手动确认。",
        href: "/notifications",
        actionType: "navigate",
        scope: "notification",
        source: "safe_redirect",
        reason: "通知摘要助手不会自动执行通知写操作",
        tone: "amber",
      }),
    );
  }

  if (hasAnyKeyword(normalized, ["清理", "回收站", "永久删除", "移入回收站", "移动文件", "删除文件"])) {
    pushUniqueSuggestion(
      suggestions,
      createSuggestion({
        id: "cleanup-safe-redirect",
        title: "前往文件维护页手动确认",
        description: "文件清理、移入回收站和永久删除都必须在现有文件维护页面中手动确认。",
        href: "/maintenance/files",
        actionType: "navigate",
        scope: "cleanup",
        source: "safe_redirect",
        reason: "助手不能调用文件清理写操作",
        tone: "amber",
      }),
    );
  }

  if (hasAnyKeyword(normalized, ["批量", "批处理", "批量操作"])) {
    pushUniqueSuggestion(
      suggestions,
      createSuggestion({
        id: "product-safe-redirect",
        title: "前往商品或目标页面后手动批量处理",
        description: "助手不能代你执行批量操作，只能提供跳转和筛选建议。",
        href: "/products",
        actionType: "navigate",
        scope: "product",
        source: "safe_redirect",
        reason: "助手禁止直接执行批量更新",
        tone: "amber",
      }),
    );
  }

  if (hasAnyKeyword(normalized, ["生图", "生成图片", "自动生成图片"])) {
    pushUniqueSuggestion(
      suggestions,
      createSuggestion({
        id: "image-safe-redirect",
        title: "前往 Prompt 任务页手动触发",
        description: "如需 API 生图，请在已有 Prompt 任务页面中手动确认；助手不会直接生成图片。",
        href: "/prompt-tasks",
        actionType: "navigate",
        scope: "prompt_task",
        source: "safe_redirect",
        reason: "助手禁止直接执行生图",
        tone: "amber",
      }),
    );
  }

  if (hasAnyKeyword(normalized, ["归档", "修改状态", "改状态", "上架", "私信", "评论"])) {
    pushUniqueSuggestion(
      suggestions,
      createSuggestion({
        id: "product-status-safe-redirect",
        title: "前往商品页手动确认操作",
        description: "归档、改状态、上架、私信和评论都不在助手权限内，请进入对应页面手动处理。",
        href: "/products",
        actionType: "navigate",
        scope: "product",
        source: "safe_redirect",
        reason: "助手只能建议查看和跳转",
        tone: "amber",
      }),
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  pushUniqueSuggestion(suggestions, buildAssistantHomeSuggestion());

  return {
    message: "当前请求涉及删除、归档、批量处理、文件清理或其他写操作。站内助手只能提供安全提示、筛选建议和人工跳转入口，不会直接执行。",
    suggestions,
  };
}

export function buildRuleBasedAssistantSuggestions(question: string, source: LocalAssistantSuggestionSource = "rule") {
  const normalized = normalizeAssistantQuestion(question);
  if (!normalized) {
    return [];
  }

  const suggestions: LocalAssistantSuggestion[] = [];

  pushUniqueSuggestion(suggestions, buildProductSuggestion(normalized, source));
  pushUniqueSuggestion(suggestions, buildCompetitorSuggestion(normalized, source));
  pushUniqueSuggestion(suggestions, buildMaterialSuggestion(normalized, source));
  pushUniqueSuggestion(suggestions, buildCopywritingSuggestion(normalized, source));
  pushUniqueSuggestion(suggestions, buildPromptTaskSuggestion(normalized, source));
  pushUniqueSuggestion(suggestions, buildInspirationSuggestion(normalized, source));
  pushUniqueSuggestion(suggestions, buildNotificationSuggestion(normalized, source));
  pushUniqueSuggestion(suggestions, buildCleanupSuggestion(normalized, source));
  pushUniqueSuggestion(suggestions, buildBackupSuggestion(normalized, source));
  pushUniqueSuggestion(suggestions, buildExportSuggestion(normalized, source));
  pushUniqueSuggestion(suggestions, buildAiLogSuggestion(normalized, source));

  return suggestions;
}

export function buildDefaultAssistantSuggestions() {
  return [
    createSuggestion({
      id: "default-products",
      title: "先查看商品列表",
      description: "如果你的问题和商品筛选有关，可以先进入商品列表继续手动筛选。",
      href: "/products",
      actionType: "navigate",
      scope: "product",
      source: "safe_redirect",
      reason: "默认安全跳转入口",
      tone: "blue",
    }),
    createSuggestion({
      id: "default-notifications",
      title: "查看通知中心",
      description: "如果你的问题和提醒、失败或待办有关，可以先打开通知中心。",
      href: "/notifications",
      actionType: "navigate",
      scope: "notification",
      source: "safe_redirect",
      reason: "默认安全跳转入口",
      tone: "blue",
    }),
    createSuggestion({
      id: "default-diagnostics",
      title: "查看系统诊断",
      description: "如果你的问题和 AI 失败、日志摘要或运行状态有关，可以先查看诊断页。",
      href: "/system/diagnostics",
      actionType: "view",
      scope: "ai_log",
      source: "safe_redirect",
      reason: "默认安全跳转入口",
      tone: "slate",
    }),
  ];
}

export function mergeAssistantSuggestions(
  primary: LocalAssistantSuggestion[],
  secondary: LocalAssistantSuggestion[],
) {
  const merged: LocalAssistantSuggestion[] = [];

  for (const suggestion of primary) {
    pushUniqueSuggestion(merged, suggestion);
  }

  for (const suggestion of secondary) {
    pushUniqueSuggestion(merged, suggestion);
  }

  return merged;
}

export function buildRuleOnlyAssistantSearchResult(question: string, fallbackMessage?: string | null): LocalAssistantSearchResult {
  const blocked = detectProhibitedAssistantIntent(question);
  if (blocked) {
    return {
      question,
      suggestions: blocked.suggestions,
      strategyLabel: "规则安全提示",
      helperText: "检测到写操作或越权意图，已改为安全跳转建议。",
      fallbackMessage: null,
      blockedMessage: blocked.message,
      aiStatus: "not_attempted",
    };
  }

  const suggestions = buildRuleBasedAssistantSuggestions(question, "rule");
  const finalSuggestions = suggestions.length > 0 ? suggestions : buildDefaultAssistantSuggestions();

  return {
    question,
    suggestions: finalSuggestions,
    strategyLabel: "规则建议",
    helperText: "已基于本地规则生成只读筛选或跳转建议。",
    fallbackMessage: fallbackMessage ?? null,
    blockedMessage: null,
    aiStatus: fallbackMessage ? "failed" : "not_attempted",
  };
}

export function buildAssistantFallbackMessage() {
  return LOCAL_ASSISTANT_AI_FALLBACK_MESSAGE;
}
