import type { DiagnosticsSnapshot } from "@/lib/services/diagnostics/diagnosticsTypes";

const SECRET_PATTERNS = [
  { pattern: /sk-[A-Za-z0-9_-]{8,}/g, replacement: "[redacted]" },
  { pattern: /(api[_-]?key\s*[:=]\s*)[^\s,;]+/gi, replacement: "$1[redacted]" },
  { pattern: /(authorization\s*[:=]\s*bearer\s+)[^\s,;]+/gi, replacement: "$1[redacted]" },
];

const WINDOWS_ABSOLUTE_PATH_PATTERN = /[A-Za-z]:\\[^\r\n\t*?"<>|]+/g;
const SQLITE_FILE_PATTERN = /file:[^\s)]+/g;

export function sanitizeDiagnosticText(value: string) {
  return SECRET_PATTERNS.reduce((text, item) => text.replace(item.pattern, item.replacement), value)
    .replace(WINDOWS_ABSOLUTE_PATH_PATTERN, "[local-path-redacted]")
    .replace(SQLITE_FILE_PATTERN, "file:[database-path-redacted]")
    .replace(/\bat\s+.+:\d+:\d+/g, "at [stack-redacted]");
}

function yesNoUnknown(value: boolean | null) {
  if (value === null) {
    return "unknown";
  }

  return value ? "yes" : "no";
}

function countText(value: number | null) {
  return value === null ? "unknown" : String(value);
}

export function buildDiagnosticsMarkdown(snapshot: Omit<DiagnosticsSnapshot, "summaryMarkdown">) {
  const lines = [
    "# EcomPilot Diagnostic Summary",
    "",
    "## App",
    "",
    `- appVersion: ${snapshot.app.appVersion}`,
    `- runtimeMode: ${snapshot.app.runtimeMode}`,
    `- runtimeServiceMode: ${snapshot.app.runtimeServiceMode}`,
    `- runtimeServiceLabel: ${snapshot.app.runtimeServiceLabel}`,
    `- isVercel: ${snapshot.app.isVercel ? "yes" : "no"}`,
    `- generatedAt: ${snapshot.app.generatedAt}`,
    `- nodeVersion: ${snapshot.app.nodeVersion}`,
    `- osSummary: ${snapshot.app.osSummary}`,
    `- writableRuntime: ${snapshot.app.isWritableRuntime ? "yes" : "no"}`,
    snapshot.app.readonlyMessage ? `- readonlyNotice: ${snapshot.app.readonlyMessage}` : "- readonlyNotice: none",
    "",
    "## Database",
    "",
    `- canConnect: ${snapshot.database.canConnect ? "yes" : "no"}`,
    `- status: ${snapshot.database.status}`,
    `- message: ${snapshot.database.message}`,
    `- products: ${countText(snapshot.database.counts.products)}`,
    `- materials: ${countText(snapshot.database.counts.materials)}`,
    `- inspirations: ${countText(snapshot.database.counts.inspirations)}`,
    `- copywritings: ${countText(snapshot.database.counts.copywritings)}`,
    `- multiPlatformCopywritings: ${countText(snapshot.database.counts.multiPlatformCopywritings)}`,
    `- promptTasks: ${countText(snapshot.database.counts.promptTasks)}`,
    `- backups: ${countText(snapshot.database.counts.backups)}`,
    `- exports: ${countText(snapshot.database.counts.exports)}`,
    `- latestBackup: ${snapshot.database.latestBackup ?? "none"}`,
    `- latestExport: ${snapshot.database.latestExport ?? "none"}`,
    `- sqliteWalAttempted: ${snapshot.database.sqlitePragmas.attempted ? "yes" : "no"}`,
    `- sqliteWalEnabled: ${snapshot.database.sqlitePragmas.walEnabled ? "yes" : "no"}`,
    `- sqliteBusyTimeoutSet: ${snapshot.database.sqlitePragmas.busyTimeoutSet ? "yes" : "no"}`,
    `- sqlitePragmaMessage: ${snapshot.database.sqlitePragmas.message}`,
    "",
    "## Directories",
    "",
    ...snapshot.directories.flatMap((directory) => [
      `- ${directory.displayPath}: exists=${yesNoUnknown(directory.exists)}, writable=${yesNoUnknown(directory.writable)}, status=${directory.status}, message=${directory.message}`,
    ]),
    "",
    "## Recent Errors",
    "",
    `- status: ${snapshot.recentErrors.status}`,
    `- message: ${snapshot.recentErrors.message}`,
    ...snapshot.recentErrors.entries.map((entry) => `- entry: ${entry}`),
    "",
    "## AI",
    "",
    `- settingsConfigured: ${yesNoUnknown(snapshot.ai.settingsConfigured)}`,
    `- providerCount: ${countText(snapshot.ai.providerCount)}`,
    `- recentJobCount: ${countText(snapshot.ai.recentJobCount)}`,
    `- message: ${snapshot.ai.message}`,
    `- estimatedCostTotal: ${snapshot.ai.estimatedCostTotal ?? "unknown"}`,
    ...snapshot.ai.recentJobs.map((entry) => `- job: ${entry}`),
    ...snapshot.ai.recentFailedJobs.map((entry) => `- failedJob: ${entry}`),
    ...snapshot.ai.recentCopywritingFailedJobs.map((entry) => `- copywritingFailedJob: ${entry}`),
    ...snapshot.ai.recentRequestLogs.map((entry) => `- requestLog: ${entry}`),
    ...snapshot.ai.recentCopywritingRequestLogs.map((entry) => `- copywritingRequestLog: ${entry}`),
    `- recentAiFailures: ${snapshot.recentAiFailures}`,
    "",
    "## Images",
    "",
    `- status: ${snapshot.images.status}`,
    `- message: ${snapshot.images.message}`,
    `- materialTotal: ${countText(snapshot.images.materialTotal)}`,
    `- withThumbnail: ${countText(snapshot.images.withThumbnail)}`,
    `- missingFiles: ${countText(snapshot.images.missingFiles)}`,
    `- referenceOnly: ${countText(snapshot.images.referenceOnly)}`,
    `- uploadsSummary: ${snapshot.images.uploadsSummary}`,
    "",
    "## Inspirations",
    "",
    `- status: ${snapshot.inspirations.status}`,
    `- message: ${snapshot.inspirations.message}`,
    `- total: ${countText(snapshot.inspirations.total)}`,
    `- pendingReview: ${countText(snapshot.inspirations.pendingReview)}`,
    ...snapshot.inspirations.recentScanLogs.map((entry) => `- recentScanLog: ${entry}`),
    ...snapshot.inspirations.recentFailedScans.map((entry) => `- recentFailedScan: ${entry}`),
    ...snapshot.inspirations.recentFailedVisionJobs.map((entry) => `- recentFailedVisionJob: ${entry}`),
    "",
    "## Sanitization",
    "",
    "- API keys: redacted",
    "- Local absolute paths: redacted",
    "- SQLite full path: redacted",
    "- Full stack traces: omitted",
    "- Full AI prompts: omitted",
    "- Sensitive cost data: omitted",
  ];

  return sanitizeDiagnosticText(lines.join("\n"));
}
