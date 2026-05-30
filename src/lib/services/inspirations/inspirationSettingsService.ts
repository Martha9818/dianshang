import crypto from "node:crypto";
import { access, constants, stat } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products";
import { sanitizeDiagnosticText } from "@/lib/services/diagnostics/diagnosticsSanitizer";
import { sanitizeFileName } from "@/lib/services/local-paths/pathSafetyService";
import { tryCreateSettingsOperationLog } from "@/lib/services/operation-log-service";
import {
  ensureProductWritesAllowed,
  normalizeProductReadError,
  normalizeProductWriteError,
} from "@/lib/services/product-runtime-service";

const INSPIRATION_FOLDER_SETTING_KEY = "inspirationFolderPath";

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

export function maskInspirationFolderPath(folderPath: string | null | undefined) {
  const rawPath = folderPath?.trim();
  if (!rawPath) {
    return null;
  }

  const normalized = rawPath.replace(/[\\/]+$/g, "");
  const lastSegment = normalized.split(/[\\/]+/).filter(Boolean).at(-1) ?? "folder";
  const safeSegment = sanitizeFileName(lastSegment, "folder").replace(/\.[^.]+$/g, "") || "folder";
  const fingerprint = crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 8);
  return sanitizeDiagnosticText(`.../${safeSegment} (#${fingerprint})`);
}

export async function validateInspirationFolderPath(folderPath: string) {
  const normalized = folderPath.trim();

  if (!normalized) {
    throw createValidationError("请先填写灵感文件夹路径。");
  }

  const folderStat = await stat(normalized).catch(() => null);
  if (!folderStat || !folderStat.isDirectory()) {
    throw createValidationError("灵感文件夹不存在，或当前路径不是目录。");
  }

  await access(normalized, constants.R_OK).catch(() => {
    throw createValidationError("灵感文件夹当前不可读，请检查 Windows 权限。");
  });

  return normalized;
}

export async function getInspirationFolderPath() {
  try {
    const record = await prisma.appSetting.findUnique({
      where: { key: INSPIRATION_FOLDER_SETTING_KEY },
      select: { value: true },
    });

    return record?.value ?? null;
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getInspirationFolderSettingView() {
  const folderPath = await getInspirationFolderPath();
  return {
    configured: Boolean(folderPath),
    displayPath: maskInspirationFolderPath(folderPath),
  };
}

export async function saveInspirationFolderPath(folderPath: string) {
  ensureProductWritesAllowed();

  try {
    const normalized = await validateInspirationFolderPath(folderPath);
    const saved = await prisma.appSetting.upsert({
      where: { key: INSPIRATION_FOLDER_SETTING_KEY },
      update: { value: normalized },
      create: {
        key: INSPIRATION_FOLDER_SETTING_KEY,
        value: normalized,
      },
    });

    await tryCreateSettingsOperationLog({
      action: "UPDATE_INSPIRATION_FOLDER_SETTING",
      detail: `更新灵感文件夹：${maskInspirationFolderPath(saved.value) ?? "未设置"}`,
    });

    return {
      configured: true,
      displayPath: maskInspirationFolderPath(saved.value),
    };
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}
