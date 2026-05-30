import {
  CATEGORY_RISK_VALUES,
  COMPARISON_DEMO_VALUES,
  EXPLANATION_COST_VALUES,
  LEVEL_THREE_VALUES,
  RETURN_RISK_VALUES,
  TARGET_PLATFORM_VALUES,
  VIDEO_FIT_VALUES,
} from "@/lib/modules/products/constants";
import { formatTagsForInput, parseJsonStringArray, parseTagInput } from "@/lib/modules/products/array-fields";

export type ProductFormValues = {
  name: string;
  categoryLevel1: string;
  categoryLevel2: string;
  tagsText: string;
  targetUser: string;
  targetPlatforms: string[];
  estimatedPrice: string;
  estimatedCost: string;
  estimatedShipping: string;
  packagingCost: string;
  sellingPoints: string;
  painPoints: string;
  usageScenes: string;
  categoryRisk: string;
  returnRisk: string;
  explanationCost: string;
  contentVisualLevel: string;
  sceneClarityLevel: string;
  videoFitLevel: string;
  comparisonDemoLevel: string;
  notes: string;
};

export type ProductMutationInput = {
  name: string;
  categoryLevel1: string | null;
  categoryLevel2: string | null;
  tags: string[];
  targetUser: string | null;
  targetPlatforms: string[];
  estimatedPrice: number | null;
  estimatedCost: number | null;
  estimatedShipping: number | null;
  packagingCost: number | null;
  sellingPoints: string | null;
  painPoints: string | null;
  usageScenes: string | null;
  categoryRisk: string | null;
  returnRisk: string | null;
  explanationCost: string | null;
  contentVisualLevel: string | null;
  sceneClarityLevel: string | null;
  videoFitLevel: string | null;
  comparisonDemoLevel: string | null;
  notes: string | null;
};

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function parseOptionalNumber(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getEmptyProductFormValues(): ProductFormValues {
  return {
    name: "",
    categoryLevel1: "",
    categoryLevel2: "",
    tagsText: "",
    targetUser: "",
    targetPlatforms: [],
    estimatedPrice: "",
    estimatedCost: "",
    estimatedShipping: "",
    packagingCost: "",
    sellingPoints: "",
    painPoints: "",
    usageScenes: "",
    categoryRisk: "",
    returnRisk: "",
    explanationCost: "",
    contentVisualLevel: "",
    sceneClarityLevel: "",
    videoFitLevel: "",
    comparisonDemoLevel: "",
    notes: "",
  };
}

export function buildProductFormValues(product: {
  name: string;
  categoryLevel1: string | null;
  categoryLevel2: string | null;
  tags: string | null;
  targetUser: string | null;
  targetPlatforms: string | null;
  estimatedPrice: number | null;
  estimatedCost: number | null;
  estimatedShipping: number | null;
  packagingCost: number | null;
  sellingPoints: string | null;
  painPoints: string | null;
  usageScenes: string | null;
  categoryRisk: string | null;
  returnRisk: string | null;
  explanationCost: string | null;
  contentVisualLevel: string | null;
  sceneClarityLevel: string | null;
  videoFitLevel: string | null;
  comparisonDemoLevel: string | null;
  notes: string | null;
}): ProductFormValues {
  return {
    name: product.name,
    categoryLevel1: product.categoryLevel1 ?? "",
    categoryLevel2: product.categoryLevel2 ?? "",
    tagsText: formatTagsForInput(parseJsonStringArray(product.tags)),
    targetUser: product.targetUser ?? "",
    targetPlatforms: parseJsonStringArray(product.targetPlatforms),
    estimatedPrice: product.estimatedPrice?.toString() ?? "",
    estimatedCost: product.estimatedCost?.toString() ?? "",
    estimatedShipping: product.estimatedShipping?.toString() ?? "",
    packagingCost: product.packagingCost?.toString() ?? "",
    sellingPoints: product.sellingPoints ?? "",
    painPoints: product.painPoints ?? "",
    usageScenes: product.usageScenes ?? "",
    categoryRisk: product.categoryRisk ?? "",
    returnRisk: product.returnRisk ?? "",
    explanationCost: product.explanationCost ?? "",
    contentVisualLevel: product.contentVisualLevel ?? "",
    sceneClarityLevel: product.sceneClarityLevel ?? "",
    videoFitLevel: product.videoFitLevel ?? "",
    comparisonDemoLevel: product.comparisonDemoLevel ?? "",
    notes: product.notes ?? "",
  };
}

export function normalizeProductMutationInput(input: ProductFormValues): ProductMutationInput {
  return {
    name: input.name.trim(),
    categoryLevel1: normalizeOptionalText(input.categoryLevel1),
    categoryLevel2: normalizeOptionalText(input.categoryLevel2),
    tags: parseTagInput(input.tagsText),
    targetUser: normalizeOptionalText(input.targetUser),
    targetPlatforms: input.targetPlatforms.filter((platform) => TARGET_PLATFORM_VALUES.includes(platform as never)),
    estimatedPrice: parseOptionalNumber(input.estimatedPrice),
    estimatedCost: parseOptionalNumber(input.estimatedCost),
    estimatedShipping: parseOptionalNumber(input.estimatedShipping),
    packagingCost: parseOptionalNumber(input.packagingCost),
    sellingPoints: normalizeOptionalText(input.sellingPoints),
    painPoints: normalizeOptionalText(input.painPoints),
    usageScenes: normalizeOptionalText(input.usageScenes),
    categoryRisk: CATEGORY_RISK_VALUES.includes(input.categoryRisk as never) ? input.categoryRisk : null,
    returnRisk: RETURN_RISK_VALUES.includes(input.returnRisk as never) ? input.returnRisk : null,
    explanationCost: EXPLANATION_COST_VALUES.includes(input.explanationCost as never)
      ? input.explanationCost
      : null,
    contentVisualLevel: LEVEL_THREE_VALUES.includes(input.contentVisualLevel as never)
      ? input.contentVisualLevel
      : null,
    sceneClarityLevel: LEVEL_THREE_VALUES.includes(input.sceneClarityLevel as never)
      ? input.sceneClarityLevel
      : null,
    videoFitLevel: VIDEO_FIT_VALUES.includes(input.videoFitLevel as never) ? input.videoFitLevel : null,
    comparisonDemoLevel: COMPARISON_DEMO_VALUES.includes(input.comparisonDemoLevel as never)
      ? input.comparisonDemoLevel
      : null,
    notes: normalizeOptionalText(input.notes),
  };
}

export function extractProductFormValues(formData: FormData): ProductFormValues {
  const value = (key: string) => String(formData.get(key) ?? "");

  return {
    name: value("name"),
    categoryLevel1: value("categoryLevel1"),
    categoryLevel2: value("categoryLevel2"),
    tagsText: value("tagsText"),
    targetUser: value("targetUser"),
    targetPlatforms: formData.getAll("targetPlatforms").map(String),
    estimatedPrice: value("estimatedPrice"),
    estimatedCost: value("estimatedCost"),
    estimatedShipping: value("estimatedShipping"),
    packagingCost: value("packagingCost"),
    sellingPoints: value("sellingPoints"),
    painPoints: value("painPoints"),
    usageScenes: value("usageScenes"),
    categoryRisk: value("categoryRisk"),
    returnRisk: value("returnRisk"),
    explanationCost: value("explanationCost"),
    contentVisualLevel: value("contentVisualLevel"),
    sceneClarityLevel: value("sceneClarityLevel"),
    videoFitLevel: value("videoFitLevel"),
    comparisonDemoLevel: value("comparisonDemoLevel"),
    notes: value("notes"),
  };
}
