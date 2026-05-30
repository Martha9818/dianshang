export const FILE_MAINTENANCE_SCOPES = ["uploads", "exports", "backups"] as const;
export const MOVE_TO_TRASH_CONFIRM_TEXT = "移入回收站";
export const PERMANENT_DELETE_CONFIRM_TEXT = "永久删除";
export const PREVIEW_FILE_MAINTENANCE_MESSAGE = "预览环境只读，请在 Windows 本地验收文件清理功能。";

export type FileMaintenanceScope = (typeof FILE_MAINTENANCE_SCOPES)[number];
export type FileMaintenanceRecommendation =
  | "keep"
  | "move_to_trash"
  | "review_before_trash"
  | "backup_warning"
  | "missing_file";

export type FileMaintenanceItem = {
  id: string;
  scope: FileMaintenanceScope;
  relativePath: string;
  fileName: string;
  fileType: string;
  fileSize: number | null;
  fileSizeLabel: string;
  modifiedAt: string | null;
  modifiedAtLabel: string;
  exists: boolean;
  relatedType: string | null;
  relatedId: string | null;
  relationStatus: "active_reference" | "soft_deleted_reference" | "orphan" | "log_reference" | "missing_file";
  relationStatusLabel: string;
  recommendation: FileMaintenanceRecommendation;
  recommendationLabel: string;
  reason: string;
  canMoveToTrash: boolean;
  warningLevel: "info" | "warning" | "danger";
};

export type TrashFileItem = {
  id: string;
  trashRelativePath: string;
  originalRelativePath: string | null;
  fileName: string;
  fileType: string;
  fileSize: number | null;
  fileSizeLabel: string;
  modifiedAt: string | null;
  modifiedAtLabel: string;
};

export type CleanupOperationSummary = {
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errors: Array<{ relativePath: string; reason: string }>;
};

export type FileMaintenancePageData = {
  runtime: {
    mode: "local" | "preview" | "cloud";
    label: string;
    isVercel: boolean;
    isWritable: boolean;
    readonlyMessage: string | null;
  };
  scannedAt: string | null;
  readonlyMessage: string | null;
  items: FileMaintenanceItem[];
  trashItems: TrashFileItem[];
  logs: Array<{
    id: number;
    action: string;
    fileScope: string;
    originalRelativePath: string | null;
    trashRelativePath: string | null;
    fileSize: number | null;
    relatedType: string | null;
    relatedId: string | null;
    status: string;
    reason: string | null;
    createdAt: Date;
  }>;
  stats: {
    total: number;
    movable: number;
    missing: number;
    trash: number;
    byScope: Record<FileMaintenanceScope, number>;
  };
};
