import type { AISchema } from "@/lib/services/ai";

export const INSPIRATION_STATUSES = {
  PENDING: "pending",
  REVIEWED: "reviewed",
  CONVERTED: "converted",
  ARCHIVED: "archived",
  REJECTED: "rejected",
} as const;

export const LEGACY_INSPIRATION_STATUSES = {
  PENDING_REVIEW: "pending_review",
  IGNORED: "ignored",
} as const;

export const INSPIRATION_SCAN_TYPES = {
  MANUAL: "manual",
  SCHEDULED: "scheduled",
} as const;

export const INSPIRATION_SCAN_STATUSES = {
  SUCCESS: "success",
  PARTIAL_FAILED: "partial_failed",
  FAILED: "failed",
} as const;

export const INSPIRATION_SOURCE_TYPES = {
  FOLDER_MANUAL_SCAN: "folder_manual_scan",
  FOLDER_SCHEDULED_SCAN: "folder_scheduled_scan",
} as const;

export const INSPIRATION_USAGE_PERMISSIONS = {
  REFERENCE_ONLY: "reference_only",
  NEEDS_REVIEW: "needs_review",
} as const;

export const INSPIRATION_AI_JOB_TYPES = {
  VISION_SUGGESTION: "inspiration_vision",
  AUTO_VISION_DRAFT: "inspiration_auto_vision_draft",
} as const;

export const INSPIRATION_TASK_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",
  SKIPPED: "skipped",
} as const;

export type InspirationAISuggestion = {
  titleSuggestion: string;
  shortDescription: string;
  possibleCategory: string;
  possibleProductType: string;
  colors: string[];
  materials: string[];
  styleKeywords: string[];
  suitablePlatforms: string[];
  visibleElements: string[];
  useScenarios: string[];
  targetAudience: string[];
  sellingPoints: string[];
  riskNotes: string[];
  copywritingDirections: string[];
  uncertaintyNotes: string[];
  draftLabel: string;
};

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
    return typeof candidate.shortDescription === "string";
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
        "possibleProductType",
        "colors",
        "materials",
        "styleKeywords",
        "suitablePlatforms",
        "visibleElements",
        "useScenarios",
        "targetAudience",
        "sellingPoints",
        "riskNotes",
        "copywritingDirections",
        "uncertaintyNotes",
        "draftLabel",
      ],
      properties: {
        titleSuggestion: { type: "string" },
        shortDescription: { type: "string" },
        possibleCategory: { type: "string" },
        possibleProductType: { type: "string" },
        colors: {
          type: "array",
          items: { type: "string" },
        },
        materials: {
          type: "array",
          items: { type: "string" },
        },
        styleKeywords: {
          type: "array",
          items: { type: "string" },
        },
        suitablePlatforms: {
          type: "array",
          items: { type: "string" },
        },
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
        riskNotes: {
          type: "array",
          items: { type: "string" },
        },
        copywritingDirections: {
          type: "array",
          items: { type: "string" },
        },
        uncertaintyNotes: {
          type: "array",
          items: { type: "string" },
        },
        draftLabel: { type: "string" },
      },
    },
  };
}

export function normalizeInspirationSuggestion(value: Partial<InspirationAISuggestion>): InspirationAISuggestion {
  return {
    titleSuggestion: normalizeString(value.titleSuggestion),
    shortDescription: normalizeString(value.shortDescription),
    possibleCategory: normalizeString(value.possibleCategory),
    possibleProductType: normalizeString(value.possibleProductType || value.possibleCategory),
    colors: normalizeStringArray(value.colors),
    materials: normalizeStringArray(value.materials),
    styleKeywords: normalizeStringArray(value.styleKeywords),
    suitablePlatforms: normalizeStringArray(value.suitablePlatforms),
    visibleElements: normalizeStringArray(value.visibleElements),
    useScenarios: normalizeStringArray(value.useScenarios),
    targetAudience: normalizeStringArray(value.targetAudience),
    sellingPoints: normalizeStringArray(value.sellingPoints),
    riskNotes: normalizeStringArray(value.riskNotes),
    copywritingDirections: normalizeStringArray(value.copywritingDirections),
    uncertaintyNotes: normalizeStringArray(value.uncertaintyNotes),
    draftLabel: normalizeString(value.draftLabel) || "AI 草稿 / 待用户确认",
  };
}
