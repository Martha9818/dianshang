import crypto from "node:crypto";
import path from "node:path";

const MAX_FILE_NAME_LENGTH = 120;
const DEFAULT_MAX_PATH_LENGTH = 240;

export type PathSafetyResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

function normalizeSeparators(value: string) {
  return value.replaceAll("\\", "/");
}

export function sanitizeFileName(fileName: string, fallback = "file") {
  const extension = path.extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, "");
  const baseName = path.basename(fileName, path.extname(fileName));
  const safeBase = baseName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, Math.max(1, MAX_FILE_NAME_LENGTH - extension.length - 1));

  return `${safeBase || fallback}${extension}`;
}

export function createShortFileName(input: { prefix?: string; originalName?: string; extension?: string; date?: Date }) {
  const date = input.date ?? new Date();
  const prefix = sanitizeFileName(input.prefix ?? "file", "file").replace(/\.[^.]+$/, "");
  const sourceExtension = input.extension ?? (input.originalName ? path.extname(input.originalName) : "");
  const extension = sourceExtension ? sourceExtension.toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    "_",
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join("");
  const suffix = crypto.randomBytes(4).toString("hex");

  return sanitizeFileName(`${prefix}_${stamp}_${suffix}${extension}`, "file");
}

export function toSafeRelativePath(...segments: string[]) {
  return normalizeSeparators(path.join(...segments));
}

export function assertSafeRelativePath(relativePath: string) {
  const normalized = normalizeSeparators(relativePath);

  if (!normalized || normalized.startsWith("/") || normalized.includes("../") || normalized === "..") {
    throw new Error("文件路径无效，请重新选择文件。");
  }

  return normalized;
}

export function checkPathLength(targetPath: string, maxLength = DEFAULT_MAX_PATH_LENGTH): PathSafetyResult {
  if (targetPath.length <= maxLength) {
    return { ok: true, value: targetPath };
  }

  return {
    ok: false,
    message: "文件路径过长，请缩短文件名或移动项目目录后重试。",
  };
}

export function assertPathLength(targetPath: string, maxLength = DEFAULT_MAX_PATH_LENGTH) {
  const result = checkPathLength(targetPath, maxLength);

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.value;
}

