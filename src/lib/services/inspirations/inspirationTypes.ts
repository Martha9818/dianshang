import type { AISchema } from "@/lib/services/ai";

export const INSPIRATION_STATUSES = {
  PENDING_REVIEW: "pending_review",
  IGNORED: "ignored",
  CONVERTED: "converted",
} as const;

export const INSPIRATION_SCAN_TYPES = {
  MANUAL: "manual",
} as const;

export const INSPIRATION_SCAN_STATUSES = {
  SUCCESS: "success",
  PARTIAL_FAILED: "partial_failed",
  FAILED: "failed",
} as const;

export const INSPIRATION_SOURCE_TYPES = {
  FOLDER_MANUAL_SCAN: "folder_manual_scan",
} as const;

export const INSPIRATION_USAGE_PERMISSIONS = {
  REFERENCE_ONLY: "reference_only",
  NEEDS_REVIEW: "needs_review",
} as const;

export const INSPIRATION_AI_JOB_TYPES = {
  VISION_SUGGESTION: "inspiration_vision",
} as const;

export type InspirationAISuggestion = {
  titleSuggestion: string;
  shortDescription: string;
  possibleCategory: string;
  visibleElements: string[];
  useScenarios: string[];
  targetAudience: string[];
  sellingPoints: string[];
  styleKeywords: string[];
  uncertaintyNotes: string[];
};

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function normalizeString(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeStringArray(values: string[] | null | undefined) {
  return Array.from(
    new Set(
      (values ?? [])
        .map((item) => normalizeString(item))
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

export const inspirationSuggestionSchema: AISchema<InspirationAISuggestion> = {
  name: "inspiration_suggestion",
  validate(value: unknown): value is InspirationAISuggestion {
    if (!value || typeof value !== "object") {
      return false;
    }

    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate.titleSuggestion === "string" &&
      typeof candidate.shortDescription === "string" &&
      typeof candidate.possibleCategory === "string" &&
      isStringArray(candidate.visibleElements) &&
      isStringArray(candidate.useScenarios) &&
      isStringArray(candidate.targetAudience) &&
      isStringArray(candidate.sellingPoints) &&
      isStringArray(candidate.styleKeywords) &&
      isStringArray(candidate.uncertaintyNotes)
    );
  },
};

export function buildInspirationSuggestionJsonSchema() {
  return {
    name: "inspiration_suggestion",
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "titleSuggestion",
        "shortDescription",
        "possibleCategory",
        "visibleElements",
        "useScenarios",
        "targetAudience",
        "sellingPoints",
        "styleKeywords",
        "uncertaintyNotes",
      ],
      properties: {
        titleSuggestion: { type: "string" },
        shortDescription: { type: "string" },
        possibleCategory: { type: "string" },
        visibleElements: {
          type: "array",
          items: { type: "string" },
        },
        useScenarios: {
          type: "array",
          items: { type: "string" },
        },
        targetAudience: {
          type: "array",
          items: { type: "string" },
        },
        sellingPoints: {
          type: "array",
          items: { type: "string" },
        },
        styleKeywords: {
          type: "array",
          items: { type: "string" },
        },
        uncertaintyNotes: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
  };
}

export function normalizeInspirationSuggestion(value: InspirationAISuggestion): InspirationAISuggestion {
  return {
    titleSuggestion: normalizeString(value.titleSuggestion),
    shortDescription: normalizeString(value.shortDescription),
    possibleCategory: normalizeString(value.possibleCategory),
    visibleElements: normalizeStringArray(value.visibleElements),
    useScenarios: normalizeStringArray(value.useScenarios),
    targetAudience: normalizeStringArray(value.targetAudience),
    sellingPoints: normalizeStringArray(value.sellingPoints),
    styleKeywords: normalizeStringArray(value.styleKeywords),
    uncertaintyNotes: normalizeStringArray(value.uncertaintyNotes),
  };
}
