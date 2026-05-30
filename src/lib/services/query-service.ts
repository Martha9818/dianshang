export type BooleanQueryValue = "true" | "false" | null;

export type ProductPoolSort = "updatedAt_desc" | "updatedAt_asc" | "createdAt_desc" | "createdAt_asc";
export type CreatedAtSort = "createdAt_desc" | "createdAt_asc";

export type ProductPoolQuery = {
  keyword: string | null;
  status: string | null;
  recommendation: string | null;
  platform: string | null;
  minScore: number | null;
  maxScore: number | null;
  missingCompetitor: BooleanQueryValue;
  missingCost: BooleanQueryValue;
  hasMaterial: BooleanQueryValue;
  hasCopywriting: BooleanQueryValue;
  needsRescore: BooleanQueryValue;
  sort: ProductPoolSort;
};

export type MaterialLibraryQuery = {
  keyword: string | null;
  productId: number | null;
  platform: string | null;
  materialType: string | null;
  status: string | null;
  sort: CreatedAtSort;
  materialId: number | null;
};

export type CopywritingListQuery = {
  productId: number | null;
  keyword: string | null;
  platform: string | null;
  version: string | null;
  hasViolation: BooleanQueryValue;
  sort: CreatedAtSort;
  providerId: number | null;
};

export type PromptTaskQuery = {
  productId: number | null;
  keyword: string | null;
  platform: string | null;
  imageType: string | null;
  recommendedSize: string | null;
  status: string | null;
  sort: CreatedAtSort;
};

export type InspirationListQuery = {
  keyword: string | null;
  sourceType: string | null;
  status: string | null;
  converted: BooleanQueryValue;
  hasImage: BooleanQueryValue;
  sort: CreatedAtSort;
};

export const PRODUCT_POOL_QUERY_DEFAULTS: ProductPoolQuery = {
  keyword: null,
  status: null,
  recommendation: null,
  platform: null,
  minScore: null,
  maxScore: null,
  missingCompetitor: null,
  missingCost: null,
  hasMaterial: null,
  hasCopywriting: null,
  needsRescore: null,
  sort: "updatedAt_desc",
};

export const MATERIAL_LIBRARY_QUERY_DEFAULTS: MaterialLibraryQuery = {
  keyword: null,
  productId: null,
  platform: null,
  materialType: null,
  status: null,
  sort: "createdAt_desc",
  materialId: null,
};

export const COPYWRITING_LIST_QUERY_DEFAULTS: CopywritingListQuery = {
  productId: null,
  keyword: null,
  platform: null,
  version: null,
  hasViolation: null,
  sort: "createdAt_desc",
  providerId: null,
};

export const PROMPT_TASK_QUERY_DEFAULTS: PromptTaskQuery = {
  productId: null,
  keyword: null,
  platform: null,
  imageType: null,
  recommendedSize: null,
  status: null,
  sort: "createdAt_desc",
};

export const INSPIRATION_LIST_QUERY_DEFAULTS: InspirationListQuery = {
  keyword: null,
  sourceType: null,
  status: null,
  converted: null,
  hasImage: null,
  sort: "createdAt_desc",
};

type QueryInput = Record<string, unknown>;

function getSingleValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeTextQuery(value: unknown, maxLength = 120) {
  const singleValue = getSingleValue(value);
  const trimmed = typeof singleValue === "string" ? singleValue.trim() : "";
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export function normalizeIntegerQuery(value: unknown) {
  const text = normalizeTextQuery(value, 24);
  if (!text) return null;

  const parsed = Number(text);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function normalizeNumberQuery(value: unknown) {
  const text = normalizeTextQuery(value, 24);
  if (!text) return null;

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeBooleanQuery(value: unknown): BooleanQueryValue {
  const text = normalizeTextQuery(value, 12);
  if (text === "true" || text === "1" || text === "yes") return "true";
  if (text === "false" || text === "0" || text === "no") return "false";
  return null;
}

function normalizeCreatedAtSort(value: unknown): CreatedAtSort {
  const text = normalizeTextQuery(value, 32);
  if (text === "createdAt_asc") return "createdAt_asc";
  return "createdAt_desc";
}

function normalizeProductPoolSort(value: unknown): ProductPoolSort {
  const text = normalizeTextQuery(value, 32);
  if (text === "createdAt" || text === "createdAt_desc") return "createdAt_desc";
  if (text === "createdAt_asc") return "createdAt_asc";
  if (text === "updatedAt_asc") return "updatedAt_asc";
  return "updatedAt_desc";
}

export function getSortDirection(sort: ProductPoolSort | CreatedAtSort) {
  return sort.endsWith("_asc") ? "asc" : "desc";
}

export function normalizeProductPoolQuery(input: QueryInput = {}): ProductPoolQuery {
  return {
    ...PRODUCT_POOL_QUERY_DEFAULTS,
    keyword: normalizeTextQuery(input.q ?? input.keyword),
    status: normalizeTextQuery(input.status),
    recommendation: normalizeTextQuery(input.recommendation),
    platform: normalizeTextQuery(input.platform),
    minScore: normalizeNumberQuery(input.minScore),
    maxScore: normalizeNumberQuery(input.maxScore),
    missingCompetitor: normalizeBooleanQuery(input.missingCompetitor),
    missingCost: normalizeBooleanQuery(input.missingCost),
    hasMaterial: normalizeBooleanQuery(input.hasMaterial),
    hasCopywriting: normalizeBooleanQuery(input.hasCopywriting),
    needsRescore: normalizeBooleanQuery(input.needsRescore),
    sort: normalizeProductPoolSort(input.sort),
  };
}

export function normalizeMaterialLibraryQuery(input: QueryInput = {}): MaterialLibraryQuery {
  return {
    ...MATERIAL_LIBRARY_QUERY_DEFAULTS,
    keyword: normalizeTextQuery(input.query ?? input.keyword),
    productId: normalizeIntegerQuery(input.productId),
    platform: normalizeTextQuery(input.platform),
    materialType: normalizeTextQuery(input.materialType),
    status: normalizeTextQuery(input.status),
    sort: normalizeCreatedAtSort(input.sort),
    materialId: normalizeIntegerQuery(input.materialId),
  };
}

export function normalizeCopywritingListQuery(input: QueryInput = {}): CopywritingListQuery {
  return {
    ...COPYWRITING_LIST_QUERY_DEFAULTS,
    productId: normalizeIntegerQuery(input.productId),
    keyword: normalizeTextQuery(input.q ?? input.keyword),
    platform: normalizeTextQuery(input.platform),
    version: normalizeTextQuery(input.version),
    hasViolation: normalizeBooleanQuery(input.hasViolation),
    sort: normalizeCreatedAtSort(input.sort),
    providerId: normalizeIntegerQuery(input.providerId),
  };
}

export function normalizePromptTaskQuery(input: QueryInput = {}): PromptTaskQuery {
  return {
    ...PROMPT_TASK_QUERY_DEFAULTS,
    productId: normalizeIntegerQuery(input.productId),
    keyword: normalizeTextQuery(input.q ?? input.keyword),
    platform: normalizeTextQuery(input.platform),
    imageType: normalizeTextQuery(input.imageType),
    recommendedSize: normalizeTextQuery(input.recommendedSize),
    status: normalizeTextQuery(input.status),
    sort: normalizeCreatedAtSort(input.sort),
  };
}

export function normalizeInspirationListQuery(input: QueryInput = {}): InspirationListQuery {
  return {
    ...INSPIRATION_LIST_QUERY_DEFAULTS,
    keyword: normalizeTextQuery(input.q ?? input.keyword),
    sourceType: normalizeTextQuery(input.sourceType),
    status: normalizeTextQuery(input.status),
    converted: normalizeBooleanQuery(input.converted),
    hasImage: normalizeBooleanQuery(input.hasImage),
    sort: normalizeCreatedAtSort(input.sort),
  };
}
