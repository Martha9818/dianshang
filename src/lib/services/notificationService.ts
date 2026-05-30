import type { AppNotification, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products";
import { sanitizeAIErrorSummary, summarizePrompt } from "@/lib/services/ai/aiPromptSanitizer";
import { sanitizeDiagnosticText } from "@/lib/services/diagnostics";
import { logError, logWarn, sanitizeLogMessage } from "@/lib/services/logging";
import { getRuntimeModeSummary } from "@/lib/services/runtime";
import { normalizeProductReadError, normalizeProductWriteError } from "@/lib/services/product-runtime-service";

export const NOTIFICATION_TYPES = ["AI", "EXPORT", "BACKUP", "CLEANUP", "INSPIRATION", "PRODUCT", "SYSTEM"] as const;
export const NOTIFICATION_LEVELS = ["info", "success", "warning", "error"] as const;
export const NOTIFICATION_STATUSES = ["unread", "read"] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationLevel = (typeof NOTIFICATION_LEVELS)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export type NotificationListQuery = {
  type: NotificationType | "ALL";
  status: NotificationStatus | "ALL";
};

export type CreateNotificationInput = {
  type: NotificationType;
  level?: NotificationLevel;
  title: string;
  message?: string | null;
  relatedType?: string | null;
  relatedId?: string | number | null;
  actionUrl?: string | null;
  dedupeKey?: string | null;
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  AI: "AI",
  EXPORT: "导出",
  BACKUP: "备份",
  CLEANUP: "清理",
  INSPIRATION: "灵感",
  PRODUCT: "商品",
  SYSTEM: "系统",
};

export const NOTIFICATION_LEVEL_LABELS: Record<NotificationLevel, string> = {
  info: "提示",
  success: "成功",
  warning: "警告",
  error: "错误",
};

const PREVIEW_READONLY_MESSAGE = "预览环境只读，请在 Windows 本地验收。";
const SAFE_ACTION_PREFIXES = [
  "/",
  "/products",
  "/copywriting",
  "/prompt-tasks",
  "/materials",
  "/inspirations",
  "/settings/ai",
  "/settings/banned-words",
  "/export",
  "/backup",
  "/maintenance/files",
  "/system/diagnostics",
  "/notifications",
] as const;

function isNotificationType(value: string): value is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

function isNotificationLevel(value: string): value is NotificationLevel {
  return (NOTIFICATION_LEVELS as readonly string[]).includes(value);
}

function isNotificationStatus(value: string): value is NotificationStatus {
  return (NOTIFICATION_STATUSES as readonly string[]).includes(value);
}

function sanitizeNotificationText(value: unknown, maxLength: number) {
  const sanitized = sanitizeDiagnosticText(sanitizeLogMessage(value)).replace(/\s+/g, " ").trim();
  return sanitized.slice(0, maxLength);
}

function sanitizeOptionalText(value: unknown, maxLength: number) {
  const sanitized = sanitizeNotificationText(value, maxLength);
  return sanitized || null;
}

function sanitizeRelatedId(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return sanitizeOptionalText(String(value), 120);
}

function sanitizeDedupeKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const sanitized = sanitizeNotificationText(value, 180)
    .replace(/[^A-Za-z0-9:_./-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[./-]+|[./-]+$/g, "");

  return sanitized || null;
}

function sanitizeActionUrl(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.startsWith("/api/")) {
    return null;
  }

  try {
    const parsed = new URL(raw, "http://ecompilot.local");
    if (parsed.origin !== "http://ecompilot.local") {
      return null;
    }

    const pathname = parsed.pathname;
    const safe = SAFE_ACTION_PREFIXES.some((prefix) => {
      if (prefix === "/") {
        return pathname === "/";
      }

      return pathname === prefix || pathname.startsWith(`${prefix}/`);
    });

    if (!safe) {
      return null;
    }

    return `${pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

function ensureNotificationWritesAllowed() {
  if (!getRuntimeModeSummary().isWritable) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.PREVIEW_READONLY, PREVIEW_READONLY_MESSAGE);
  }
}

function normalizeListQuery(input: Record<string, unknown> = {}): NotificationListQuery {
  const typeText = typeof input.type === "string" ? input.type.trim().toUpperCase() : "";
  const statusText = typeof input.status === "string" ? input.status.trim().toLowerCase() : "";

  return {
    type: isNotificationType(typeText) ? typeText : "ALL",
    status: isNotificationStatus(statusText) ? statusText : "ALL",
  };
}

function buildWhere(query: NotificationListQuery): Prisma.AppNotificationWhereInput {
  return {
    ...(query.type === "ALL" ? {} : { type: query.type }),
    ...(query.status === "ALL" ? {} : { status: query.status }),
  };
}

function mapNotification(row: AppNotification) {
  const type = isNotificationType(row.type) ? row.type : "SYSTEM";
  const level = isNotificationLevel(row.level) ? row.level : "info";
  const status = isNotificationStatus(row.status) ? row.status : "unread";

  return {
    ...row,
    type,
    level,
    status,
    typeLabel: NOTIFICATION_TYPE_LABELS[type],
    levelLabel: NOTIFICATION_LEVEL_LABELS[level],
    isUnread: status === "unread",
  };
}

export async function createAppNotification(input: CreateNotificationInput) {
  try {
    if (!getRuntimeModeSummary().isWritable) {
      await logWarn(`Notification skipped in read-only runtime: ${input.type}`);
      return null;
    }

    const type = isNotificationType(input.type) ? input.type : "SYSTEM";
    const level = input.level && isNotificationLevel(input.level) ? input.level : "info";
    const data = {
      type,
      level,
      title: sanitizeNotificationText(input.title, 120) || NOTIFICATION_TYPE_LABELS[type],
      message: sanitizeOptionalText(input.message, 500),
      relatedType: sanitizeOptionalText(input.relatedType, 80),
      relatedId: sanitizeRelatedId(input.relatedId),
      actionUrl: sanitizeActionUrl(input.actionUrl),
      dedupeKey: sanitizeDedupeKey(input.dedupeKey),
    };

    if (data.dedupeKey) {
      const existing = await prisma.appNotification.findUnique({
        where: { dedupeKey: data.dedupeKey },
      });

      if (existing) {
        return existing;
      }
    }

    return await prisma.appNotification.create({
      data,
    });
  } catch (error) {
    await logError(`Notification create failed: ${sanitizeLogMessage(error)}`);
    return null;
  }
}

export async function getUnreadNotificationCount() {
  try {
    return await prisma.appNotification.count({ where: { status: "unread" } });
  } catch (error) {
    await logWarn(`Notification unread count failed: ${sanitizeLogMessage(error)}`);
    return 0;
  }
}

export async function getNotificationCenterPageData(input: Record<string, unknown> = {}) {
  try {
    const query = normalizeListQuery(input);
    const where = buildWhere(query);
    const [notifications, unreadCount, totalCount, groupedTypes, groupedStatuses] = await Promise.all([
      prisma.appNotification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 200,
      }),
      prisma.appNotification.count({ where: { status: "unread" } }),
      prisma.appNotification.count(),
      prisma.appNotification.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),
      prisma.appNotification.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    return {
      runtime: getRuntimeModeSummary(),
      filters: query,
      notifications: notifications.map(mapNotification),
      unreadCount,
      totalCount,
      typeOptions: NOTIFICATION_TYPES.map((type) => ({
        value: type,
        label: NOTIFICATION_TYPE_LABELS[type],
        count: groupedTypes.find((item) => item.type === type)?._count._all ?? 0,
      })),
      statusCounts: {
        unread: groupedStatuses.find((item) => item.status === "unread")?._count._all ?? 0,
        read: groupedStatuses.find((item) => item.status === "read")?._count._all ?? 0,
      },
    };
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function markNotificationRead(notificationId: number) {
  ensureNotificationWritesAllowed();

  try {
    return await prisma.appNotification.update({
      where: { id: notificationId },
      data: {
        status: "read",
        readAt: new Date(),
      },
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function markAllNotificationsRead(type?: NotificationType | "ALL") {
  ensureNotificationWritesAllowed();

  try {
    const where: Prisma.AppNotificationWhereInput = {
      status: "unread",
      ...(type && type !== "ALL" ? { type } : {}),
    };

    return await prisma.appNotification.updateMany({
      where,
      data: {
        status: "read",
        readAt: new Date(),
      },
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function deleteNotification(notificationId: number) {
  ensureNotificationWritesAllowed();

  try {
    return await prisma.appNotification.delete({
      where: { id: notificationId },
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function cleanupOldNotifications(daysToKeep = 30) {
  ensureNotificationWritesAllowed();

  try {
    const normalizedDays = Number.isFinite(daysToKeep) ? Math.max(1, Math.min(365, Math.floor(daysToKeep))) : 30;
    const cutoff = new Date(Date.now() - normalizedDays * 24 * 60 * 60 * 1000);

    return await prisma.appNotification.deleteMany({
      where: {
        status: "read",
        createdAt: { lt: cutoff },
      },
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function notifyAIJobFailed(input: {
  jobId: number;
  jobType: string;
  error: unknown;
  relatedProductId?: number | null;
  relatedInspirationId?: number | null;
}) {
  return createAppNotification({
    type: "AI",
    level: "error",
    title: "AI 任务失败",
    message: `${sanitizeNotificationText(input.jobType, 80)}：${sanitizeAIErrorSummary(input.error)}`,
    relatedType: input.relatedInspirationId ? "Inspiration" : input.relatedProductId ? "Product" : "AIJob",
    relatedId: input.relatedInspirationId ?? input.relatedProductId ?? input.jobId,
    actionUrl: "/system/diagnostics",
    dedupeKey: `ai-job-failed:${input.jobId}`,
  });
}

export async function notifyExportCompleted(input: { exportLogId: number; fileName: string }) {
  return createAppNotification({
    type: "EXPORT",
    level: "success",
    title: "导出完成",
    message: `Excel 文件已生成：${input.fileName}`,
    relatedType: "ExportLog",
    relatedId: input.exportLogId,
    actionUrl: "/export",
    dedupeKey: `export-success:${input.exportLogId}`,
  });
}

export async function notifyExportFailed(input: { fileName: string; error: unknown }) {
  return createAppNotification({
    type: "EXPORT",
    level: "error",
    title: "导出失败",
    message: sanitizeNotificationText(input.error, 240) || `Excel 导出失败：${input.fileName}`,
    relatedType: "ExportLog",
    actionUrl: "/export",
  });
}

export async function notifyBackupCompleted(input: { backupLogId: number; displayPath: string }) {
  return createAppNotification({
    type: "BACKUP",
    level: "success",
    title: "备份完成",
    message: `本地备份已完成：${input.displayPath}`,
    relatedType: "BackupLog",
    relatedId: input.backupLogId,
    actionUrl: "/backup",
    dedupeKey: `backup-success:${input.backupLogId}`,
  });
}

export async function notifyBackupFailed(input: { error: unknown }) {
  return createAppNotification({
    type: "BACKUP",
    level: "error",
    title: "备份失败",
    message: sanitizeNotificationText(input.error, 240) || "手动备份失败，请查看备份历史。",
    relatedType: "BackupLog",
    actionUrl: "/backup",
  });
}

export async function notifyInspirationConverted(input: { inspirationId: number; productId: number; productName: string }) {
  return createAppNotification({
    type: "INSPIRATION",
    level: "success",
    title: "灵感已转为商品",
    message: summarizePrompt(input.productName, 120),
    relatedType: "Product",
    relatedId: input.productId,
    actionUrl: `/products/${input.productId}`,
    dedupeKey: `inspiration-converted:${input.inspirationId}:${input.productId}`,
  });
}

export async function notifyProductCreated(input: { productId: number; productName: string }) {
  return createAppNotification({
    type: "PRODUCT",
    level: "success",
    title: "商品已创建",
    message: summarizePrompt(input.productName, 120),
    relatedType: "Product",
    relatedId: input.productId,
    actionUrl: `/products/${input.productId}`,
    dedupeKey: `product-created:${input.productId}`,
  });
}

export async function notifyProductDeleted(input: { productId: number; productName: string }) {
  return createAppNotification({
    type: "PRODUCT",
    level: "warning",
    title: "商品已删除",
    message: summarizePrompt(input.productName, 120),
    relatedType: "Product",
    relatedId: input.productId,
    actionUrl: "/products",
    dedupeKey: `product-deleted:${input.productId}`,
  });
}

export async function notifyCleanupCompleted(input: { summary: string; actionUrl?: string | null }) {
  return createAppNotification({
    type: "CLEANUP",
    level: "success",
    title: "清理完成",
    message: summarizePrompt(input.summary, 180),
    relatedType: "Cleanup",
    actionUrl: input.actionUrl ?? "/system/diagnostics",
  });
}
