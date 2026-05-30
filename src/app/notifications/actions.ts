"use server";

import { revalidatePath } from "next/cache";
import { getProductErrorMessage } from "@/lib/modules/products";
import {
  cleanupOldNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_TYPES,
  type NotificationType,
} from "@/lib/services/notificationService";

type NotificationActionState = {
  ok?: boolean;
  message?: string;
};

function revalidateNotifications() {
  revalidatePath("/");
  revalidatePath("/notifications");
}

function parsePositiveId(value: FormDataEntryValue | null, label: string) {
  const id = Number(value ?? "");
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} 无效。`);
  }

  return id;
}

function parseNotificationType(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim().toUpperCase();
  return (NOTIFICATION_TYPES as readonly string[]).includes(text) ? (text as NotificationType) : "ALL";
}

export async function markNotificationReadAction(
  _state: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  void _state;

  try {
    await markNotificationRead(parsePositiveId(formData.get("notificationId"), "通知"));
    revalidateNotifications();
    return { ok: true, message: "已标记为已读。" };
  } catch (error) {
    return { ok: false, message: getProductErrorMessage(error, "标记通知失败，请稍后重试。") };
  }
}

export async function markAllNotificationsReadAction(
  _state: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  void _state;

  try {
    await markAllNotificationsRead(parseNotificationType(formData.get("type")));
    revalidateNotifications();
    return { ok: true, message: "已标记全部通知为已读。" };
  } catch (error) {
    return { ok: false, message: getProductErrorMessage(error, "批量标记通知失败，请稍后重试。") };
  }
}

export async function deleteNotificationAction(
  _state: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  void _state;

  try {
    await deleteNotification(parsePositiveId(formData.get("notificationId"), "通知"));
    revalidateNotifications();
    return { ok: true, message: "通知已删除。" };
  } catch (error) {
    return { ok: false, message: getProductErrorMessage(error, "删除通知失败，请稍后重试。") };
  }
}

export async function cleanupOldNotificationsAction(
  _state: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  void _state;

  try {
    const daysToKeep = Number(formData.get("daysToKeep") ?? "30");
    const result = await cleanupOldNotifications(daysToKeep);
    revalidateNotifications();
    return { ok: true, message: `已清理 ${result.count} 条旧通知。` };
  } catch (error) {
    return { ok: false, message: getProductErrorMessage(error, "清理通知失败，请稍后重试。") };
  }
}

