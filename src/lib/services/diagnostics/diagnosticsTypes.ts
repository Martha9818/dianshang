export type DiagnosticsRuntimeMode = "local" | "vercel" | "unknown";

export type DiagnosticsStatus = "ok" | "warning" | "error" | "unknown";

export type DiagnosticsAppInfo = {
  appVersion: string;
  runtimeMode: DiagnosticsRuntimeMode;
  runtimeServiceMode: string;
  runtimeServiceLabel: string;
  isVercel: boolean;
  generatedAt: string;
  nodeVersion: string;
  osSummary: string;
  isWritableRuntime: boolean;
  readonlyMessage: string | null;
};

export type DiagnosticsDatabaseStatus = {
  status: DiagnosticsStatus;
  canConnect: boolean;
  message: string;
  counts: {
    products: number | null;
    materials: number | null;
    inspirations: number | null;
    copywritings: number | null;
    multiPlatformCopywritings: number | null;
    promptTasks: number | null;
    backups: number | null;
    exports: number | null;
  };
  latestBackup: string | null;
  latestExport: string | null;
  sqlitePragmas: {
    attempted: boolean;
    walEnabled: boolean;
    busyTimeoutSet: boolean;
    message: string;
  };
};

export type DiagnosticsDirectoryStatus = {
  key: "uploads" | "exports" | "backups" | "logs";
  label: string;
  displayPath: string;
  exists: boolean | null;
  writable: boolean | null;
  status: DiagnosticsStatus;
  message: string;
};

export type DiagnosticsRecentErrors = {
  status: DiagnosticsStatus;
  message: string;
  entries: string[];
};

export type DiagnosticsAIStatus = {
  status: DiagnosticsStatus;
  message: string;
  settingsConfigured: boolean | null;
  providerCount: number | null;
  recentJobCount: number | null;
  recentJobs: string[];
  recentFailedJobs: string[];
  recentCopywritingFailedJobs: string[];
  recentRequestLogs: string[];
  recentCopywritingRequestLogs: string[];
  estimatedCostTotal: string | null;
};

export type DiagnosticsImageStorageStatus = {
  status: DiagnosticsStatus;
  message: string;
  materialTotal: number | null;
  withThumbnail: number | null;
  missingFiles: number | null;
  referenceOnly: number | null;
  uploadsSummary: string;
};

export type DiagnosticsInspirationStatus = {
  status: DiagnosticsStatus;
  message: string;
  total: number | null;
  pendingReview: number | null;
  recentScanLogs: string[];
  recentFailedScans: string[];
  recentFailedVisionJobs: string[];
};

export type DiagnosticsSnapshot = {
  app: DiagnosticsAppInfo;
  database: DiagnosticsDatabaseStatus;
  directories: DiagnosticsDirectoryStatus[];
  recentErrors: DiagnosticsRecentErrors;
  ai: DiagnosticsAIStatus;
  images: DiagnosticsImageStorageStatus;
  inspirations: DiagnosticsInspirationStatus;
  recentAiFailures: string;
  summaryMarkdown: string;
};
