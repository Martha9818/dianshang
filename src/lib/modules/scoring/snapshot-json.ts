import type { ScoreSnapshotLists } from "@/lib/modules/scoring/types";

function normalizeItem(value: string) {
  return value.trim();
}

function parseJsonList(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is string => typeof item === "string")
      .map(normalizeItem)
      .filter(Boolean);
  } catch {
    return [];
  }
}

function stringifyJsonList(value: string[]) {
  const normalized = Array.from(new Set(value.map(normalizeItem).filter(Boolean)));
  return normalized.length > 0 ? JSON.stringify(normalized) : null;
}

export function parseScoreSnapshotLists(input: {
  deductionReasons: string | null | undefined;
  nextSuggestions: string | null | undefined;
}): ScoreSnapshotLists {
  return {
    deductionReasons: parseJsonList(input.deductionReasons),
    nextSuggestions: parseJsonList(input.nextSuggestions),
  };
}

export function stringifyScoreSnapshotLists(input: ScoreSnapshotLists) {
  return {
    deductionReasons: stringifyJsonList(input.deductionReasons),
    nextSuggestions: stringifyJsonList(input.nextSuggestions),
  };
}
