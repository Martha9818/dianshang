import { BUSINESS_ERROR_CODES, ProductBusinessError, getProductErrorMessage } from "@/lib/modules/products";
import { MATERIAL_STATUS } from "@/lib/modules/materials";
import {
  DANGEROUS_CONFIRM_TEXT,
  getBatchOperationRule,
  isBatchEntity,
  type BatchEntity,
  type BatchOperationError,
  type BatchOperationResult,
} from "@/lib/modules/batch/rules";
import { sanitizeDiagnosticText } from "@/lib/services/diagnostics";
import { sanitizeLogMessage } from "@/lib/services/logging";
import { createSettingsOperationLog } from "@/lib/services/operation-log-service";
import { getRuntimeModeSummary } from "@/lib/services/product-runtime-service";
import { archiveInspiration, markReviewed, rejectInspiration } from "@/lib/services/inspirations";
import { updateMaterialStatus } from "@/lib/services/material-service";
import { deleteNotification, markNotificationRead } from "@/lib/services/notificationService";
import { softDeleteProduct, updateProductStatus } from "@/lib/services/product-mutation-service";

const PREVIEW_READONLY_MESSAGE = "预览环境只读，请在 Windows 本地验收。";
const MAX_BATCH_ITEMS = 100;

export type BatchOperationInput = {
  entity: string;
  action: string;
  ids: number[];
  value?: string | null;
  confirmText?: string | null;
};

function createValidationError(message: string) {
  return new ProductBusinessError(BUSINESS_ERROR_CODES.VALIDATION_ERROR, message);
}

function sanitizeBatchText(value: unknown, maxLength = 180) {
  return sanitizeDiagnosticText(sanitizeLogMessage(value)).replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeIds(ids: number[]) {
  const normalized = Array.from(
    new Set(ids.filter((id) => Number.isInteger(id) && id > 0)),
  ).slice(0, MAX_BATCH_ITEMS);

  if (normalized.length === 0) {
    throw createValidationError("请先选择要批量操作的记录。");
  }

  return normalized;
}

function normalizeEntity(entity: string): BatchEntity {
  const normalized = entity.trim().toUpperCase();
  if (!isBatchEntity(normalized)) {
    throw createValidationError("不支持的批量操作对象。");
  }

  return normalized;
}

function getSafeErrorMessage(error: unknown) {
  return getProductErrorMessage(error, "操作失败，请稍后重试。");
}

async function executeSingle(input: {
  entity: BatchEntity;
  action: string;
  id: number;
  value?: string | null;
}) {
  if (input.entity === "PRODUCT" && input.action === "UPDATE_STATUS") {
    await updateProductStatus({ productId: input.id, status: input.value ?? "" });
    return;
  }

  if (input.entity === "PRODUCT" && input.action === "SOFT_DELETE") {
    await softDeleteProduct(input.id);
    return;
  }

  if (input.entity === "INSPIRATION" && input.action === "MARK_REVIEWED") {
    await markReviewed(input.id);
    return;
  }

  if (input.entity === "INSPIRATION" && input.action === "ARCHIVE") {
    await archiveInspiration(input.id);
    return;
  }

  if (input.entity === "INSPIRATION" && input.action === "REJECT") {
    await rejectInspiration({ inspirationId: input.id, reason: "批量放弃" });
    return;
  }

  if (input.entity === "MATERIAL" && input.action === "UPDATE_STATUS") {
    await updateMaterialStatus({ materialId: input.id, status: input.value ?? "" });
    return;
  }

  if (input.entity === "MATERIAL" && input.action === "ARCHIVE") {
    await updateMaterialStatus({ materialId: input.id, status: MATERIAL_STATUS.DISCARDED });
    return;
  }

  if (input.entity === "NOTIFICATION" && input.action === "MARK_READ") {
    await markNotificationRead(input.id);
    return;
  }

  if (input.entity === "NOTIFICATION" && input.action === "DELETE") {
    await deleteNotification(input.id);
    return;
  }

  throw createValidationError("该批量操作未开放。");
}

async function recordBatchOperationLog(input: {
  label: string;
  entity: BatchEntity;
  action: string;
  selectedCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
}) {
  const detail = [
    input.label,
    `对象=${input.entity}`,
    `操作=${input.action}`,
    `选择=${input.selectedCount}`,
    `成功=${input.successCount}`,
    `失败=${input.failedCount}`,
    `跳过=${input.skippedCount}`,
  ].join(" / ");

  await createSettingsOperationLog({
    action: "BATCH_OPERATION",
    detail: sanitizeBatchText(detail, 260),
  });
}

export async function runBatchOperation(input: BatchOperationInput): Promise<BatchOperationResult> {
  const runtime = getRuntimeModeSummary();
  if (!runtime.isWritable) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.PREVIEW_READONLY, PREVIEW_READONLY_MESSAGE);
  }

  const entity = normalizeEntity(input.entity);
  const rule = getBatchOperationRule(entity, input.action);
  if (!rule) {
    throw createValidationError("该批量操作未开放。");
  }

  const ids = normalizeIds(input.ids);
  const value = input.value?.trim() ?? "";

  if (rule.requiresValue === "status" && !value) {
    throw createValidationError("请选择目标状态。");
  }

  if (rule.dangerous && input.confirmText?.trim() !== DANGEROUS_CONFIRM_TEXT) {
    throw createValidationError(`危险批量操作需要输入“${DANGEROUS_CONFIRM_TEXT}”。`);
  }

  let successCount = 0;
  const errors: BatchOperationError[] = [];

  for (const id of ids) {
    try {
      await executeSingle({ entity, action: rule.action, id, value });
      successCount += 1;
    } catch (error) {
      errors.push({
        id,
        reason: sanitizeBatchText(getSafeErrorMessage(error)),
      });
    }
  }

  const result = {
    successCount,
    failedCount: errors.length,
    skippedCount: 0,
    errors: errors.slice(0, 10),
    selectedCount: ids.length,
    actionLabel: rule.label,
    dangerous: rule.dangerous,
    impact: rule.impact,
  };

  try {
    await recordBatchOperationLog({
      label: rule.label,
      entity,
      action: rule.action,
      selectedCount: result.selectedCount,
      successCount: result.successCount,
      failedCount: result.failedCount,
      skippedCount: result.skippedCount,
    });
  } catch (error) {
    result.errors.push({
      id: 0,
      reason: sanitizeBatchText(`批量日志记录失败：${getSafeErrorMessage(error)}`),
    });
    result.failedCount = result.errors.length;
  }

  return result;
}

export { BATCH_OPERATION_RULES } from "@/lib/modules/batch/rules";
