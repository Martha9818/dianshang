import type { AISchema } from "@/lib/services/ai";

export const COMPETITOR_ANALYSIS_READONLY_MESSAGE = "预览环境只读，请在 Windows 本地验收竞品智能分析。";
export const COMPETITOR_ANALYSIS_MIN_COMPETITORS = 3;

export const COMPETITOR_ANALYSIS_STATUSES = {
  SUCCESS: "success",
  FAILED: "failed",
  ARCHIVED: "archived",
} as const;

export const COMPETITOR_ANALYSIS_AI_JOB_TYPES = {
  ANALYSIS: "competitor_analysis",
} as const;

export type CompetitorAnalysisStatus =
  (typeof COMPETITOR_ANALYSIS_STATUSES)[keyof typeof COMPETITOR_ANALYSIS_STATUSES];

export type CompetitorAnalysisStructuredOutput = {
  summary: string;
  priceBandSummary: string;
  sellingPointSummary: string;
  imageStyleSummary: string;
  copywritingStyleSummary: string;
  differentiationAdvice: string;
  riskTips: string;
  nextStepAdvice: string;
  dataGapAdvice: string;
  uncertaintyNotes: string;
};

const REQUIRED_TEXT_FIELDS: Array<keyof CompetitorAnalysisStructuredOutput> = [
  "summary",
  "priceBandSummary",
  "sellingPointSummary",
  "imageStyleSummary",
  "copywritingStyleSummary",
  "differentiationAdvice",
  "riskTips",
  "nextStepAdvice",
  "dataGapAdvice",
  "uncertaintyNotes",
];

function hasTextLikeField(value: unknown) {
  return typeof value === "string" || Array.isArray(value);
}

export const competitorAnalysisStructuredOutputSchema: AISchema<Partial<CompetitorAnalysisStructuredOutput>> = {
  name: "CompetitorAnalysisStructuredOutput",
  validate(value: unknown): value is Partial<CompetitorAnalysisStructuredOutput> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }

    const record = value as Record<string, unknown>;
    return REQUIRED_TEXT_FIELDS.every((field) => hasTextLikeField(record[field]));
  },
};

export function buildCompetitorAnalysisJsonSchema() {
  const properties = Object.fromEntries(
    REQUIRED_TEXT_FIELDS.map((field) => [
      field,
      {
        type: "string",
        description: "Use concise Chinese. Keep uncertainty explicit and do not state suggestions as facts.",
      },
    ]),
  );

  return {
    name: "competitor_analysis",
    schema: {
      type: "object",
      additionalProperties: false,
      properties,
      required: REQUIRED_TEXT_FIELDS,
    },
  };
}
