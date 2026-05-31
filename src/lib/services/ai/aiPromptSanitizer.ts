const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{8,}/g,
  /(api[_-]?key\s*[:=]\s*)[^\s,;]+/gi,
  /(authorization\s*[:=]\s*bearer\s+)[^\s,;]+/gi,
];

const WINDOWS_ABSOLUTE_PATH_PATTERN = /[A-Za-z]:\\[^\r\n\t*?"<>|]+/g;
const POSIX_ABSOLUTE_PATH_PATTERN = /(^|[\s("'=])\/(?!\/)[^\s,;)"']+/g;
const FILE_URL_PATTERN = /file:[^\s)]+/g;
const LONG_COST_FORMULA_PATTERN = /(cost|成本|利润|profit)[^\r\n]{120,}/gi;

export function sanitizePromptForAI(prompt: string) {
  return SECRET_PATTERNS.reduce((text, pattern) => text.replace(pattern, "[redacted]"), prompt)
    .replace(WINDOWS_ABSOLUTE_PATH_PATTERN, "[local-path-redacted]")
    .replace(POSIX_ABSOLUTE_PATH_PATTERN, "$1[local-path-redacted]")
    .replace(FILE_URL_PATTERN, "file:[path-redacted]")
    .replace(LONG_COST_FORMULA_PATTERN, "[business-summary-redacted]");
}

export function summarizePrompt(prompt: string, maxLength = 220) {
  const sanitized = sanitizePromptForAI(prompt)
    .replace(/\s+/g, " ")
    .replace(/完整 Prompt[:：].*/gi, "完整 Prompt: [prompt-redacted]")
    .trim();

  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  return `${sanitized.slice(0, maxLength)}...`;
}

export function sanitizeAIErrorSummary(error: unknown, maxLength = 220) {
  const raw = error instanceof Error ? error.message : String(error ?? "AI request failed");
  const firstLine = raw.split(/\r?\n/)[0] ?? "AI request failed";
  return summarizePrompt(firstLine, maxLength);
}
