function normalizeArrayValue(value: string) {
  return value.trim();
}

export function parseJsonStringArray(value: string | null | undefined): string[] {
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
      .map(normalizeArrayValue)
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function stringifyJsonStringArray(values: string[]): string | null {
  const normalized = Array.from(new Set(values.map(normalizeArrayValue).filter(Boolean)));
  return normalized.length > 0 ? JSON.stringify(normalized) : null;
}

export function parseTagInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,，、]+/)
        .map(normalizeArrayValue)
        .filter(Boolean),
    ),
  );
}

export function formatTagsForInput(values: string[]): string {
  return values.join(", ");
}
