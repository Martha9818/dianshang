export const BATCH_ENTITIES = ["PRODUCT", "INSPIRATION", "MATERIAL", "NOTIFICATION"] as const;
export const DANGEROUS_CONFIRM_TEXT = "确认批量操作";

export type BatchEntity = (typeof BATCH_ENTITIES)[number];

export type BatchOperationRule = {
  entity: BatchEntity;
  action: string;
  label: string;
  dangerous: boolean;
  requiresValue?: "status";
  impact: string;
};

export type BatchOperationError = {
  id: number;
  reason: string;
};

export type BatchOperationResult = {
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errors: BatchOperationError[];
  selectedCount: number;
  actionLabel: string;
  dangerous: boolean;
  impact: string;
};

export const BATCH_OPERATION_RULES = {
  PRODUCT: {
    UPDATE_STATUS: {
      entity: "PRODUCT",
      action: "UPDATE_STATUS",
      label: "批量修改商品状态",
      dangerous: false,
      requiresValue: "status",
      impact: "只修改已选商品的状态，不会删除商品或触发 AI。",
    },
    SOFT_DELETE: {
      entity: "PRODUCT",
      action: "SOFT_DELETE",
      label: "批量软删除商品",
      dangerous: true,
      impact: "已选商品会从默认商品池隐藏，相关文件不会被删除。",
    },
  },
  INSPIRATION: {
    MARK_REVIEWED: {
      entity: "INSPIRATION",
      action: "MARK_REVIEWED",
      label: "批量标记灵感已查看",
      dangerous: false,
      impact: "只修改已选灵感的查看状态，不会转为商品。",
    },
    ARCHIVE: {
      entity: "INSPIRATION",
      action: "ARCHIVE",
      label: "批量归档灵感",
      dangerous: true,
      impact: "已选灵感会从默认列表隐藏，不会删除图片或转为商品。",
    },
    REJECT: {
      entity: "INSPIRATION",
      action: "REJECT",
      label: "批量放弃灵感",
      dangerous: true,
      impact: "已选灵感会标记为已放弃，不会删除图片或转为商品。",
    },
  },
  MATERIAL: {
    UPDATE_STATUS: {
      entity: "MATERIAL",
      action: "UPDATE_STATUS",
      label: "批量修改素材状态",
      dangerous: false,
      requiresValue: "status",
      impact: "只修改已选素材的状态，不会删除素材文件。",
    },
    ARCHIVE: {
      entity: "MATERIAL",
      action: "ARCHIVE",
      label: "批量归档素材",
      dangerous: true,
      impact: "已选素材会标记为已弃用，不会永久删除文件。",
    },
  },
  NOTIFICATION: {
    MARK_READ: {
      entity: "NOTIFICATION",
      action: "MARK_READ",
      label: "批量标记通知已读",
      dangerous: false,
      impact: "只修改已选通知的已读状态。",
    },
    DELETE: {
      entity: "NOTIFICATION",
      action: "DELETE",
      label: "批量删除通知",
      dangerous: true,
      impact: "已选通知记录会被删除，业务数据不会被删除。",
    },
  },
} as const satisfies Record<BatchEntity, Record<string, BatchOperationRule>>;

export function getBatchOperationRule(entity: BatchEntity, action: string): BatchOperationRule | null {
  return BATCH_OPERATION_RULES[entity][action as keyof (typeof BATCH_OPERATION_RULES)[typeof entity]] ?? null;
}

export function isBatchEntity(value: string): value is BatchEntity {
  return (BATCH_ENTITIES as readonly string[]).includes(value);
}
