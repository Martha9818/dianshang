import { access, constants, mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertLocalWritable, isLocalWritable } from "@/lib/services/runtime";
import { assertPathLength } from "./pathSafetyService";

export const LOCAL_DIRECTORY_KEYS = ["uploads", "exports", "backups", "logs", "trash"] as const;

export type LocalDirectoryKey = (typeof LOCAL_DIRECTORY_KEYS)[number];

export type LocalDirectoryStatus = {
  key: LocalDirectoryKey;
  label: string;
  displayPath: string;
  absolutePath: string | null;
  exists: boolean | null;
  writable: boolean | null;
  status: "ok" | "warning" | "error" | "unknown";
  message: string;
};

const DIRECTORY_LABELS: Record<LocalDirectoryKey, string> = {
  uploads: "uploads",
  exports: "exports",
  backups: "backups",
  logs: "logs",
  trash: "trash",
};

export function getLocalDirectoryDisplayPath(key: LocalDirectoryKey) {
  return `${DIRECTORY_LABELS[key]}/`;
}

export function getLocalDirectoryPath(key: LocalDirectoryKey) {
  switch (key) {
    case "uploads":
      return path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
    case "exports":
      return path.join(/*turbopackIgnore: true*/ process.cwd(), "exports");
    case "backups":
      return path.join(/*turbopackIgnore: true*/ process.cwd(), "backups");
    case "logs":
      return path.join(/*turbopackIgnore: true*/ process.cwd(), "logs");
    case "trash":
      return path.join(/*turbopackIgnore: true*/ process.cwd(), "trash");
    default:
      return path.join(/*turbopackIgnore: true*/ process.cwd(), "logs");
  }
}

export function getLogsFilePath(fileName: "app.log" | "error.log") {
  return path.join(getLocalDirectoryPath("logs"), fileName);
}

export async function ensureLocalDirectory(key: LocalDirectoryKey) {
  assertLocalWritable();
  const directoryPath = getLocalDirectoryPath(key);
  assertPathLength(directoryPath);
  await mkdir(directoryPath, { recursive: true });
  return directoryPath;
}

export async function ensureLocalRuntimeDirectories() {
  if (!isLocalWritable()) {
    return [];
  }

  return Promise.all(LOCAL_DIRECTORY_KEYS.map((key) => ensureLocalDirectory(key)));
}

async function canWriteDirectory(directoryPath: string, key: LocalDirectoryKey) {
  const probePath = path.join(directoryPath, `.ecompilot-diagnostics-${key}-${Date.now()}.tmp`);

  try {
    assertPathLength(probePath);
    await writeFile(probePath, "ok", { flag: "wx" });
    await unlink(probePath);
    return true;
  } catch {
    try {
      await unlink(probePath);
    } catch {
      // Ignore cleanup failure for a missing or inaccessible probe.
    }

    return false;
  }
}

export async function inspectLocalDirectory(key: LocalDirectoryKey, options: { autoCreate?: boolean } = {}): Promise<LocalDirectoryStatus> {
  const displayPath = getLocalDirectoryDisplayPath(key);

  if (!isLocalWritable()) {
    return {
      key,
      label: DIRECTORY_LABELS[key],
      displayPath,
      absolutePath: null,
      exists: null,
      writable: false,
      status: "unknown",
      message: "预览环境只显示目录状态，不创建或读取真实本地目录。",
    };
  }

  const directoryPath = getLocalDirectoryPath(key);

  try {
    const stats = await stat(directoryPath).catch(async (error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT" || !options.autoCreate) {
        throw error;
      }

      await mkdir(directoryPath, { recursive: true });
      return stat(directoryPath);
    });

    if (!stats.isDirectory()) {
      return {
        key,
        label: DIRECTORY_LABELS[key],
        displayPath,
        absolutePath: directoryPath,
        exists: true,
        writable: false,
        status: "error",
        message: "路径存在但不是目录。",
      };
    }

    await access(directoryPath, constants.R_OK);
    const writable = await canWriteDirectory(directoryPath, key);

    return {
      key,
      label: DIRECTORY_LABELS[key],
      displayPath,
      absolutePath: directoryPath,
      exists: true,
      writable,
      status: writable ? "ok" : "warning",
      message: writable ? "目录存在且可写。" : "目录存在但不可写，请检查 Windows 权限。",
    };
  } catch {
    return {
      key,
      label: DIRECTORY_LABELS[key],
      displayPath,
      absolutePath: directoryPath,
      exists: false,
      writable: false,
      status: "warning",
      message: options.autoCreate ? "目录不存在，且自动创建失败。" : "目录不存在或不可访问。",
    };
  }
}

export async function inspectLocalRuntimeDirectories(options: { autoCreate?: boolean } = {}) {
  return Promise.all(LOCAL_DIRECTORY_KEYS.map((key) => inspectLocalDirectory(key, options)));
}
