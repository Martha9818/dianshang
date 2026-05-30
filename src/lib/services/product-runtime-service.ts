import { BUSINESS_ERROR_CODES, ProductBusinessError, isProductBusinessError } from "@/lib/modules/products/errors";
import {
  assertLocalWritable,
  buildReadonlyRuntimeMessage,
  getRuntimeMode,
  getRuntimeModeSummary,
} from "@/lib/services/runtime";

export { buildReadonlyRuntimeMessage, getRuntimeModeSummary };

export function ensureProductWritesAllowed() {
  assertLocalWritable();
}

export function buildProductReadUnavailableMessage(mode = getRuntimeMode()) {
  if (mode === "cloud") {
    return "Cloud 模式尚未接入正式数据库与文件存储。当前请以 Windows 本地验收结果为准。";
  }

  return "当前预览环境未加载 Windows 本地 SQLite 商品库。请在 Windows 本地验收商品数据。";
}

export function buildUploadsUnavailableMessage() {
  return "当前环境无法访问本地 uploads 目录，请检查 Windows 本地文件权限与目录状态。";
}

export function normalizeProductReadError(error: unknown) {
  if (isProductBusinessError(error)) {
    return error;
  }

  if (isSqliteBusyError(error)) {
    return new ProductBusinessError(
      BUSINESS_ERROR_CODES.LOCAL_DB_UNAVAILABLE,
      "本地 SQLite 正忙，请稍后重试；如果持续出现，请关闭其它正在占用数据库的本地窗口后再试。",
      { cause: error },
    );
  }

  return new ProductBusinessError(BUSINESS_ERROR_CODES.LOCAL_DB_UNAVAILABLE, buildProductReadUnavailableMessage(), {
    cause: error,
  });
}

function isSqliteBusyError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.includes("SQLITE_BUSY") || message.includes("database is locked");
}

export function normalizeProductWriteError(error: unknown) {
  if (isProductBusinessError(error)) {
    return error;
  }

  if (isSqliteBusyError(error)) {
    return new ProductBusinessError(
      BUSINESS_ERROR_CODES.LOCAL_DB_UNAVAILABLE,
      "本地 SQLite 正忙，写入暂时未完成。请稍后重试，或关闭其它占用数据库的本地进程。",
      { cause: error },
    );
  }

  return new ProductBusinessError(
    BUSINESS_ERROR_CODES.LOCAL_DB_UNAVAILABLE,
    "当前环境无法写入本地 SQLite 商品库，请检查 Windows 本地数据库权限与状态。",
    { cause: error },
  );
}

export function normalizeUploadsError(error: unknown) {
  if (isProductBusinessError(error)) {
    return error;
  }

  return new ProductBusinessError(BUSINESS_ERROR_CODES.LOCAL_UPLOADS_UNAVAILABLE, buildUploadsUnavailableMessage(), {
    cause: error,
  });
}
