import type { InspirationListQuery } from "@/lib/services/query-service";

type BuildInspirationsHrefInput = Partial<InspirationListQuery> & {
  selectedId?: number | null;
};

function appendQueryValue(params: URLSearchParams, key: string, value: string | null | undefined) {
  if (!value) {
    return;
  }

  params.set(key, value);
}

export function buildInspirationsHref(input: BuildInspirationsHrefInput = {}) {
  const params = new URLSearchParams();

  if (typeof input.selectedId === "number" && Number.isInteger(input.selectedId) && input.selectedId > 0) {
    params.set("selectedId", String(input.selectedId));
  }

  appendQueryValue(params, "q", input.keyword ?? null);
  appendQueryValue(params, "sourceType", input.sourceType ?? null);
  appendQueryValue(params, "status", input.status ?? null);
  appendQueryValue(params, "converted", input.converted ?? null);
  appendQueryValue(params, "hasImage", input.hasImage ?? null);
  appendQueryValue(params, "sort", input.sort ?? null);

  const query = params.toString();
  return query ? `/inspirations?${query}` : "/inspirations";
}

export function buildInspirationsHrefFromSearchParams(params: URLSearchParams) {
  const query = params.toString();
  return query ? `/inspirations?${query}` : "/inspirations";
}

export function parseLegacyInspirationSlug(slug: string | string[] | undefined) {
  const segments = Array.isArray(slug) ? slug : slug ? [slug] : [];
  if (segments.length !== 1) {
    return null;
  }

  const selectedId = Number(segments[0] ?? "");
  return Number.isInteger(selectedId) && selectedId > 0 ? selectedId : null;
}
