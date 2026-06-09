import type { AISchema } from "@/lib/services/ai";

export const SCREENSHOT_READONLY_MESSAGE = "预览环境只读，请在 Windows 本地验收。";

export const SCREENSHOT_SOURCE_TYPES = {
  INSPIRATION: "inspiration",
  PRODUCT: "product",
  COMPETITOR: "competitor",
  MATERIAL: "material",
  MANUAL: "manual",
} as const;

export const SCREENSHOT_JOB_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",
  SKIPPED: "skipped",
} as const;

export const SCREENSHOT_QUALITY_LEVELS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  FAILED: "failed",
} as const;

export const SCREENSHOT_AI_JOB_TYPES = {
  RECOGNITION: "screenshot_recognition",
} as const;

export type ScreenshotSourceType = (typeof SCREENSHOT_SOURCE_TYPES)[keyof typeof SCREENSHOT_SOURCE_TYPES];
export type ScreenshotJobStatus = (typeof SCREENSHOT_JOB_STATUSES)[keyof typeof SCREENSHOT_JOB_STATUSES];
export type ScreenshotQualityLevel = (typeof SCREENSHOT_QUALITY_LEVELS)[keyof typeof SCREENSHOT_QUALITY_LEVELS];

export type ScreenshotStructuredDraft = {
  draftLabel: string;
  possibleTitle: string | null;
  possiblePrice: string | null;
  possibleSalesOrHeat: string | null;
  possiblePlatformSource: string | null;
  sellingPoints: string[];
  specInfo: string[];
  riskWords: string[];
  imageDescription: string;
  copywritingMaterialSummary: string;
  platformCopywritingDirections: string[];
  privacyNotes: string[];
  uncertaintyNotes: string[];
  qualityLevel: ScreenshotQualityLevel;
};

const sourceTypeSet = new Set<string>(Object.values(SCREENSHOT_SOURCE_TYPES));
const qualityLevelSet = new Set<string>(Object.values(SCREENSHOT_QUALITY_LEVELS));

export function isScreenshotSourceType(value: string): value is ScreenshotSourceType {
  return sourceTypeSet.has(value);
}

export function isScreenshotQualityLevel(value: string): value is ScreenshotQualityLevel {
  return qualityLevelSet.has(value);
}

export const screenshotStructuredDraftSchema: AISchema<ScreenshotStructuredDraft> = {
  name: "ScreenshotStructuredDraft",
  validate(value: unknown): value is ScreenshotStructuredDraft {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  },
};

export function buildScreenshotDraftJsonSchema() {
  return {
    name: "screenshot_structured_draft",
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "draftLabel",
        "possibleTitle",
        "possiblePrice",
        "possibleSalesOrHeat",
        "possiblePlatformSource",
        "sellingPoints",
        "specInfo",
        "riskWords",
        "imageDescription",
        "copywritingMaterialSummary",
        "platformCopywritingDirections",
        "privacyNotes",
        "uncertaintyNotes",
        "qualityLevel",
      ],
      properties: {
        draftLabel: { type: "string" },
        possibleTitle: { type: ["string", "null"] },
        possiblePrice: { type: ["string", "null"] },
        possibleSalesOrHeat: { type: ["string", "null"] },
        possiblePlatformSource: { type: ["string", "null"] },
        sellingPoints: { type: "array", items: { type: "string" } },
        specInfo: { type: "array", items: { type: "string" } },
        riskWords: { type: "array", items: { type: "string" } },
        imageDescription: { type: "string" },
        copywritingMaterialSummary: { type: "string" },
        platformCopywritingDirections: { type: "array", items: { type: "string" } },
        privacyNotes: { type: "array", items: { type: "string" } },
        uncertaintyNotes: { type: "array", items: { type: "string" } },
        qualityLevel: { type: "string", enum: Object.values(SCREENSHOT_QUALITY_LEVELS) },
      },
    },
    strict: true,
  };
}
