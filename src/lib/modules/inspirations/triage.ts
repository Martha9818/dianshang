import type { InspirationAISuggestion } from "@/lib/services/inspirations/inspirationTypes";

export const INSPIRATION_TRIAGE_DISCLAIMER = "仅用于线索初筛，不代表正式商品评估。";
export const INSPIRATION_TRIAGE_INSUFFICIENT = "信息不足";

type TriageBand = "keep" | "review" | "watch" | "reject";

export type InspirationTriageDimension = {
  label: string;
  score: number | null;
  maxScore: number;
  summary: string;
};

export type InspirationTriageResult = {
  isReady: boolean;
  totalScore: number | null;
  scoreLabel: string;
  conclusion: string;
  conclusionBand: TriageBand;
  nextStep: string;
  rationale: string;
  dimensions: InspirationTriageDimension[];
  disclaimer: string;
};

type TriageInput = {
  title: string | null;
  note: string | null;
  aiSuggestion: InspirationAISuggestion | null;
};

function cleanText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => cleanText(value))
        .filter(Boolean),
    ),
  );
}

function capScore(value: number, maxScore: number) {
  return Math.max(0, Math.min(maxScore, value));
}

function formatScore(value: number | null) {
  return typeof value === "number" ? `${value} / 100` : INSPIRATION_TRIAGE_INSUFFICIENT;
}

function scoreContentPotential(input: TriageInput) {
  const suggestion = input.aiSuggestion;
  const visibleElements = uniqueValues(suggestion?.visibleElements ?? []);
  const styleSignals = uniqueValues([
    ...(suggestion?.styleKeywords ?? []),
    ...(suggestion?.colors ?? []),
    ...(suggestion?.materials ?? []),
  ]);
  const sellingPoints = uniqueValues(suggestion?.sellingPoints ?? []);
  const score =
    (cleanText(suggestion?.shortDescription) ? 6 : 0) +
    Math.min(6, visibleElements.length * 2) +
    Math.min(4, styleSignals.length) +
    Math.min(4, sellingPoints.length * 2);

  return {
    label: "内容表现潜力",
    score: capScore(score, 20),
    maxScore: 20,
    summary:
      score > 0
        ? "根据画面元素、风格信号和卖点线索做保守估计。"
        : "缺少可支撑内容表现判断的描述线索。",
  } satisfies InspirationTriageDimension;
}

function scoreSellingPointClarity(input: TriageInput) {
  const suggestion = input.aiSuggestion;
  const sellingPoints = uniqueValues(suggestion?.sellingPoints ?? []);
  const titleSignal = cleanText(input.title) || cleanText(suggestion?.titleSuggestion);
  const description = cleanText(suggestion?.shortDescription);
  const score = Math.min(12, sellingPoints.length * 4) + (titleSignal ? 4 : 0) + (description ? 4 : 0);

  return {
    label: "卖点清晰度",
    score: capScore(score, 20),
    maxScore: 20,
    summary:
      score > 0
        ? "优先看标题、核心卖点和草稿摘要是否能形成清晰表达。"
        : "标题和卖点都不够清楚，暂时无法判断吸引力。",
  } satisfies InspirationTriageDimension;
}

function scoreTargetAudience(input: TriageInput) {
  const suggestion = input.aiSuggestion;
  const audiences = uniqueValues(suggestion?.targetAudience ?? []);
  const platforms = uniqueValues(suggestion?.suitablePlatforms ?? []);
  const score = Math.min(12, audiences.length * 6) + Math.min(3, platforms.length);

  return {
    label: "目标人群清晰度",
    score: capScore(score, 15),
    maxScore: 15,
    summary:
      audiences.length > 0
        ? "根据目标人群和建议平台判断这条线索是否有明确受众。"
        : "目标人群信号不够，先别把它当成明确需求。",
  } satisfies InspirationTriageDimension;
}

function scoreUsageScenarios(input: TriageInput) {
  const suggestion = input.aiSuggestion;
  const scenarios = uniqueValues(suggestion?.useScenarios ?? []);
  const visibleElements = uniqueValues(suggestion?.visibleElements ?? []);
  const score = Math.min(12, scenarios.length * 6) + (visibleElements.length > 0 ? 3 : 0);

  return {
    label: "使用场景清晰度",
    score: capScore(score, 15),
    maxScore: 15,
    summary:
      scenarios.length > 0
        ? "看这张图是否已经透露出明确的使用场景和触发时刻。"
        : "使用场景还不够具体，后续容易卡在转商品判断。",
  } satisfies InspirationTriageDimension;
}

function scoreRiskScreening(input: TriageInput) {
  const suggestion = input.aiSuggestion;
  const riskNotes = uniqueValues(suggestion?.riskNotes ?? []);
  const uncertaintyNotes = uniqueValues(suggestion?.uncertaintyNotes ?? []);
  const score = 6 + Math.min(5, riskNotes.length * 2) + (uncertaintyNotes.length > 0 ? 4 : 0);

  return {
    label: "风险初筛",
    score: capScore(score, 15),
    maxScore: 15,
    summary:
      riskNotes.length > 0 || uncertaintyNotes.length > 0
        ? "已有风险和不确定性说明，适合继续人工核对。"
        : "草稿还没给出明显风险提醒，只能保守对待。",
  } satisfies InspirationTriageDimension;
}

function scoreCompleteness(input: TriageInput) {
  const suggestion = input.aiSuggestion;
  const signalCount = [
    cleanText(input.title) || cleanText(suggestion?.titleSuggestion),
    cleanText(suggestion?.shortDescription),
    cleanText(suggestion?.possibleProductType) || cleanText(suggestion?.possibleCategory),
    uniqueValues(suggestion?.targetAudience ?? []).join("|"),
    uniqueValues(suggestion?.useScenarios ?? []).join("|"),
    uniqueValues(suggestion?.sellingPoints ?? []).join("|"),
    uniqueValues(suggestion?.riskNotes ?? []).join("|"),
    cleanText(input.note),
  ].filter(Boolean).length;

  return {
    label: "信息完整度",
    score: capScore(signalCount * 2, 15),
    maxScore: 15,
    summary:
      signalCount >= 5
        ? "已有足够多的草稿字段支撑初筛。"
        : "当前线索仍然偏少，容易把猜测当成事实。",
  } satisfies InspirationTriageDimension;
}

function hasMinimumSignals(input: TriageInput) {
  const suggestion = input.aiSuggestion;
  if (!suggestion) {
    return false;
  }

  const signals = [
    cleanText(input.title) || cleanText(suggestion.titleSuggestion),
    cleanText(suggestion.shortDescription),
    cleanText(suggestion.possibleProductType) || cleanText(suggestion.possibleCategory),
    uniqueValues(suggestion.sellingPoints).join("|"),
    uniqueValues(suggestion.targetAudience).join("|"),
    uniqueValues(suggestion.useScenarios).join("|"),
  ].filter(Boolean).length;

  return signals >= 4;
}

function buildConclusion(totalScore: number): Pick<InspirationTriageResult, "conclusion" | "conclusionBand" | "nextStep" | "rationale"> {
  if (totalScore >= 80) {
    return {
      conclusion: "优先保留",
      conclusionBand: "keep",
      nextStep: "建议转商品继续评估。",
      rationale: "关键信息比较完整，适合继续进入正式商品评估。",
    };
  }

  if (totalScore >= 60) {
    return {
      conclusion: "可以保留",
      conclusionBand: "review",
      nextStep: "建议补竞品或成本再判断。",
      rationale: "已经有可用线索，但还不足以直接进入更重的投入。",
    };
  }

  if (totalScore >= 40) {
    return {
      conclusion: "暂存观察",
      conclusionBand: "watch",
      nextStep: "信息不足或卖点不清，先补线索。",
      rationale: "这条线索还没形成明确价值判断，先别急着转商品。",
    };
  }

  return {
    conclusion: "建议放弃",
    conclusionBand: "reject",
    nextStep: "除非用户有额外理由，否则不建议继续投入。",
    rationale: "当前信号太弱，继续处理的性价比偏低。",
  };
}

export function evaluateInspirationTriage(input: TriageInput): InspirationTriageResult {
  const dimensions = [
    scoreContentPotential(input),
    scoreSellingPointClarity(input),
    scoreTargetAudience(input),
    scoreUsageScenarios(input),
    scoreRiskScreening(input),
    scoreCompleteness(input),
  ];

  if (!hasMinimumSignals(input)) {
    return {
      isReady: false,
      totalScore: null,
      scoreLabel: INSPIRATION_TRIAGE_INSUFFICIENT,
      conclusion: INSPIRATION_TRIAGE_INSUFFICIENT,
      conclusionBand: "watch",
      nextStep: "先补充更多图片线索、标题、卖点或场景信息。",
      rationale: "当前字段不足，不能给出完整初筛分。",
      dimensions,
      disclaimer: INSPIRATION_TRIAGE_DISCLAIMER,
    };
  }

  const totalScore = dimensions.reduce((sum, item) => sum + (item.score ?? 0), 0);
  const conclusion = buildConclusion(totalScore);

  return {
    isReady: true,
    totalScore,
    scoreLabel: formatScore(totalScore),
    conclusion: conclusion.conclusion,
    conclusionBand: conclusion.conclusionBand,
    nextStep: conclusion.nextStep,
    rationale: conclusion.rationale,
    dimensions,
    disclaimer: INSPIRATION_TRIAGE_DISCLAIMER,
  };
}
