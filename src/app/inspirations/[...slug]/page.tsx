import { permanentRedirect } from "next/navigation";
import {
  buildInspirationsHrefFromSearchParams,
  parseLegacyInspirationSlug,
} from "@/lib/modules/inspirations/routes";

type LegacyInspirationsPageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyInspirationsPage({
  params,
  searchParams,
}: LegacyInspirationsPageProps) {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams]);
  const slugSelectedId = parseLegacyInspirationSlug(slug);
  const querySelectedId = parseLegacyInspirationSlug(rawSearchParams.selectedId);
  const selectedId = slugSelectedId ?? querySelectedId;
  const paramsToPreserve = new URLSearchParams();

  for (const key of ["q", "sourceType", "status", "converted", "hasImage", "sort"] as const) {
    const rawValue = rawSearchParams[key];
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (typeof value === "string" && value.trim()) {
      paramsToPreserve.set(key, value.trim());
    }
  }

  if (selectedId) {
    paramsToPreserve.set("selectedId", String(selectedId));
  }

  permanentRedirect(buildInspirationsHrefFromSearchParams(paramsToPreserve));
}
