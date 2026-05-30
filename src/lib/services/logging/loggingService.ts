import { appendFile } from "node:fs/promises";
import { isVercel } from "@/lib/services/runtime";
import { ensureLocalDirectory, getLogsFilePath } from "@/lib/services/local-paths";

const SECRET_PATTERNS = [
  { pattern: /sk-[A-Za-z0-9_-]{8,}/g, replacement: "[redacted]" },
  { pattern: /(api[_-]?key\s*[:=]\s*)[^\s,;]+/gi, replacement: "$1[redacted]" },
  { pattern: /(authorization\s*[:=]\s*bearer\s+)[^\s,;]+/gi, replacement: "$1[redacted]" },
];

const WINDOWS_ABSOLUTE_PATH_PATTERN = /[A-Za-z]:\\[^\r\n\t*?"<>|]+/g;
const SQLITE_FILE_PATTERN = /file:[^\s)]+/g;
const STACK_LINE_PATTERN = /\bat\s+.+:\d+:\d+/g;
const LONG_PROMPT_PATTERN = /(prompt(Text)?\s*[:=]\s*)(["'`])?(.{80,})/gi;

function getErrorSummary(error: unknown) {
  if (!(error instanceof Error)) {
    return typeof error === "string" ? error : "unknown error";
  }

  return error.message || error.name || "unknown error";
}

export function sanitizeLogMessage(value: unknown) {
  const raw = value instanceof Error ? getErrorSummary(value) : String(value ?? "");
  const firstLine = raw.split(/\r?\n/)[0] ?? "";

  return SECRET_PATTERNS.reduce((text, item) => text.replace(item.pattern, item.replacement), firstLine)
    .replace(WINDOWS_ABSOLUTE_PATH_PATTERN, "[local-path-redacted]")
    .replace(SQLITE_FILE_PATTERN, "file:[database-path-redacted]")
    .replace(STACK_LINE_PATTERN, "at [stack-redacted]")
    .replace(LONG_PROMPT_PATTERN, "$1[prompt-redacted]")
    .slice(0, 500);
}

async function writeLog(level: "INFO" | "WARN" | "ERROR", message: unknown) {
  const sanitized = sanitizeLogMessage(message);
  const line = `${new Date().toISOString()} ${level} ${sanitized}\n`;

  if (isVercel()) {
    if (level === "ERROR") {
      console.error(line.trim());
    } else if (level === "WARN") {
      console.warn(line.trim());
    } else {
      console.info(line.trim());
    }

    return;
  }

  try {
    await ensureLocalDirectory("logs");
    await appendFile(getLogsFilePath("app.log"), line, "utf8");

    if (level === "ERROR") {
      await appendFile(getLogsFilePath("error.log"), line, "utf8");
    }
  } catch (error) {
    console.warn("Local logging failed", sanitizeLogMessage(error));
  }
}

export function logInfo(message: unknown) {
  return writeLog("INFO", message);
}

export function logWarn(message: unknown) {
  return writeLog("WARN", message);
}

export function logError(message: unknown) {
  return writeLog("ERROR", message);
}

