# EcomPilot Project Map

EcomPilot V1-Core is a Windows local-first Next.js application for personal ecommerce product evaluation, copywriting, inspiration inbox review, material management, export, backup, AI base services, and diagnostics.

V1-Core-07 final integration acceptance passed locally on 2026-05-30. Future net-new features should move to V1-Plus or later; V1-Core should only receive tightly scoped Patch work.

## Runtime Shape

- Framework: Next.js App Router, React, TypeScript.
- Database: Prisma and SQLite, configured by `DATABASE_URL`.
- Local runtime folders: `uploads/`, `exports/`, `backups/`, and `logs/`.
- Vercel: preview-only and read-only. Vercel must not perform real local SQLite writes, uploads, exports, backups, log writes, or high-cost AI calls.

## Pages

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Dashboard summary and recent local work. |
| `/products` | `src/app/products/page.tsx` | Product pool list and filters. |
| `/products/new` | `src/app/products/new/page.tsx` | Product creation form. |
| `/products/[id]` | `src/app/products/[id]/page.tsx` | Product detail tabs. |
| `/products/[id]/edit` | `src/app/products/[id]/edit/page.tsx` | Product editing form. |
| `/copywriting` | `src/app/copywriting/page.tsx` | Multi-platform copywriting workspace, history-preserving drafts, manual editing, usage marking, and AI fallback handling. |
| `/prompt-tasks` | `src/app/prompt-tasks/page.tsx` | Prompt task list and creation. |
| `/prompt-tasks/[taskCode]/upload` | `src/app/prompt-tasks/[taskCode]/upload/page.tsx` | Upload generated or manual material for a Prompt task. |
| `/materials` | `src/app/materials/page.tsx` | Material library. |
| `/inspirations` | `src/app/inspirations/page.tsx` | Manual-scan inspiration inbox with status filtering, notes, processing records, archive/reject, optional AI suggestion, and confirm-then-convert flow. |
| `/settings/ai` | `src/app/settings/ai/page.tsx` | AI provider settings. |
| `/settings/banned-words` | `src/app/settings/banned-words/page.tsx` | Banned-word settings. |
| `/export` | `src/app/export/page.tsx` | Excel export. |
| `/backup` | `src/app/backup/page.tsx` | Manual local backup. |
| `/system/diagnostics` | `src/app/system/diagnostics/page.tsx` | Local diagnostics center and sanitized diagnostic summary. |

## Actions

| Area | Action File | Notes |
| --- | --- | --- |
| Product CRUD and upload | `src/app/products/actions.ts` | Must enforce local write checks and use product/file services. |
| Copywriting | `src/app/copywriting/actions.ts` | AI failures must not block manual editing or non-AI data work. |
| Prompt tasks | `src/app/prompt-tasks/actions.ts` | Must preserve task status rules and Vercel read-only fallback. |
| Materials | `src/app/materials/actions.ts` | Must avoid unsafe file deletion. |
| Inspirations | `src/app/inspirations/actions.ts` | Thin validation wrappers for folder, scan, note, review/archive/reject, AI suggestion, and confirm-convert actions; Vercel writes/AI calls stay blocked by runtime services. |
| Settings | `src/app/settings/actions.ts` | Must never leak full API keys to the frontend. |
| Export | `src/app/export/actions.ts` | Writes only in local writable runtime. |
| Backup | `src/app/backup/actions.ts` | Keeps backup filesystem traversal runtime-only. |
| Diagnostics | `src/app/system/diagnostics/actions.ts` | Returns sanitized text; Vercel stays read-only. |

## Services And Modules

| Area | Files | Responsibility |
| --- | --- | --- |
| Runtime mode | `src/lib/services/runtime/`, `src/lib/modules/products/runtime.ts`, `src/lib/services/product-runtime-service.ts` | Detect local/preview/cloud runtime and normalize read/write errors. |
| Local paths | `src/lib/services/local-paths/` | Known local runtime folders, safe display labels, directory creation/checks, filename and path safety. |
| Logging | `src/lib/services/logging/` | Sanitized local `logs/app.log` and `logs/error.log`; console fallback on Vercel. |
| AI base | `src/lib/services/ai/`, `src/lib/services/ai-client.ts` | Shared model registry, client factory, prompt sanitizer, output validator, AIJob, AIRequestLog, and cost estimates. |
| Products | `src/lib/services/product-service.ts`, `src/lib/services/product-mutation-service.ts`, `src/lib/modules/products/` | Product reads, writes, formatting, SPU generation, status. |
| Images/uploads | `src/lib/services/images/`, `src/lib/services/file-storage-service.ts`, `src/app/api/uploads/[...path]/route.ts` | Unified image validation, short filenames, local upload writes, thumbnail generation, file hash metadata, and safe serving. |
| Scoring | `src/lib/services/scoring-service.ts`, `src/lib/modules/scoring/` | Rule-based scoring only. |
| Copywriting | `src/lib/services/copywriting-service.ts`, `src/lib/services/copywriting/README.md`, `src/lib/modules/copywriting/` | Multi-platform package generation, history-preserving drafts, manual editing, banned-word scan reuse, usage marking, and AI base reuse. |
| Prompt tasks | `src/lib/services/prompt-task-service.ts`, `src/lib/modules/prompt-task/` | Prompt generation templates and task persistence. |
| Materials | `src/lib/services/material-service.ts`, `src/lib/services/materials/README.md`, `src/lib/modules/materials.ts` | Material records, image metadata persistence, thumbnail-first display data, and status updates. |
| Inspirations | `src/lib/services/inspirations/`, `src/lib/services/inspirations/README.md` | Local inspiration-folder setting, manual scan, fileHash dedupe, review-only drafts, status management, processing records, optional AI suggestion, ScanLog, and confirm-then-convert product flow. |
| Export | `src/lib/services/export-service.ts`, `src/app/api/exports/[id]/route.ts` | Local Excel export and safe download. |
| Backup | `src/lib/services/backup-service.ts`, `src/lib/services/backup-log-service.ts`, `src/lib/services/file-copy-service.ts` | Manual local backup, backup history, and display-safe backup path labels. |
| Diagnostics | `src/lib/services/diagnostics/` | Runtime, database, directory, log, and AI status summaries. |
| Query services | `src/lib/services/query-service.ts` | Unified list-query parameter defaults, normalization, boolean filters, numeric ranges, and sort handling for V1-Plus search/filter pages. |

## Module README Index

| Module | README |
| --- | --- |
| AI base | `src/lib/services/ai/README.md` |
| Diagnostics | `src/lib/services/diagnostics/README.md` |
| Runtime mode | `src/lib/services/runtime/README.md` |
| Local paths | `src/lib/services/local-paths/README.md` |
| Logging | `src/lib/services/logging/README.md` |
| Images/uploads | `src/lib/services/images/README.md` |
| Materials | `src/lib/services/materials/README.md` |
| Copywriting | `src/lib/services/copywriting/README.md` |
| Inspirations | `src/lib/services/inspirations/README.md` |

Read module README files only when modifying that module.

## Acceptance And Handoff Artifacts

| Artifact | Purpose |
| --- | --- |
| `scripts/v1-core-07-acceptance.mts` | V1-Core final service-level acceptance: diagnostics, runtime, AI, image safety, multi-platform copywriting, inspiration scan, MVP regression, and Vercel read-only simulation. |
| `scripts/thread08-final-acceptance.mts` | Historical MVP service acceptance for product, competitor, scoring, copywriting fallback, prompt/material linkage, export, and backup. |
| `docs/current/V1_CORE_UNDERSTANDING_CHECK.md` | Plain-language explanation of what V1-Core added, daily use, failure handling, Vercel limits, and pre-next-thread backup expectations. |

## Prisma Models

Current models in `prisma/schema.prisma`:

- `Product`
- `AppSetting`
- `ProductVariant`
- `Competitor`
- `Copywriting`
- `PromptTask`
- `Material`
- `Inspiration`
- `ScanLog`
- `ScoreSnapshot`
- `AIProvider`
- `AIRequestLog`
- `AIJob`
- `BannedWord`
- `OperationLog`
- `ExportLog`
- `BackupLog`

Schema changes require a new migration. Do not edit old migrations and do not reset the database unless the user explicitly confirms a test-only reset.

## Main Entry Functions

| Function | File | Side Effects |
| --- | --- | --- |
| `getRuntimeModeSummary` | `src/lib/services/runtime/runtimeService.ts` | Reads environment only. |
| `assertLocalWritable` | `src/lib/services/runtime/runtimeService.ts` | Throws a user-safe readonly error when writes are blocked. |
| `inspectLocalRuntimeDirectories` | `src/lib/services/local-paths/localPathsService.ts` | Checks/creates known local folders only in local writable runtime. |
| `sanitizeFileName` / `assertPathLength` | `src/lib/services/local-paths/pathSafetyService.ts` | Sanitizes filenames and blocks overly long write paths. |
| `logInfo` / `logWarn` / `logError` | `src/lib/services/logging/loggingService.ts` | Writes sanitized local logs; Vercel uses console fallback only. |
| `createAIClient` | `src/lib/services/ai/aiClientFactory.ts` | Performs server-side AI calls only in local writable runtime and logs sanitized request outcomes. |
| `createAIJob` / `markAIJob*` | `src/lib/services/ai/aiJobService.ts` | Writes lightweight AI task state in local writable runtime only. |
| `createAIRequestLog` | `src/lib/services/ai/aiRequestLogService.ts` | Writes sanitized AI request logs and rough cost estimates in local writable runtime only. |
| `saveInspirationFolderPath` | `src/lib/services/inspirations/inspirationSettingsService.ts` | Writes the local-only inspiration folder setting after folder validation. |
| `runManualInspirationScan` | `src/lib/services/inspirations/inspirationScanService.ts` | Reads the configured local folder, copies new images into `uploads/inspirations/`, creates review drafts, and records `ScanLog`. |
| `generateInspirationAiSuggestion` | `src/lib/services/inspirations/inspirationAiService.ts` | Performs local-only lightweight image suggestion through AIJob plus schema validation. |
| `markReviewed` / `archiveInspiration` / `rejectInspiration` | `src/lib/services/inspirations/inspirationService.ts` | Update inspiration processing state and write shared `OperationLog` records in local writable runtime only. |
| `convertInspirationToProduct` / `convertToProduct` | `src/lib/services/inspirations/inspirationService.ts` | Creates a formal `Product` only after explicit confirmation, preserves the source inspiration, links `convertedProductId`, and blocks repeat conversion. |
| `createExcelExport` | `src/lib/services/export-service.ts` | Writes `exports/` and `ExportLog` in local runtime only. |
| `createManualBackup` | `src/lib/services/backup-service.ts` | Writes `backups/` and `BackupLog` in local runtime only. |
| `getBackupDisplayPath` | `src/lib/services/backup-log-service.ts` | Converts real or historical backup paths into safe `backups/.../` display labels; no writes. |
| `getDiagnosticsSnapshot` | `src/lib/services/diagnostics/diagnosticsService.ts` | Reads runtime, database, directory, log, and AI status. |
| `buildDiagnosticsMarkdown` | `src/lib/services/diagnostics/diagnosticsSanitizer.ts` | Builds sanitized markdown text; no writes. |
| `normalizeProductPoolQuery` / `normalizeMaterialLibraryQuery` / `normalizeCopywritingListQuery` / `normalizePromptTaskQuery` / `normalizeInspirationListQuery` | `src/lib/services/query-service.ts` | Normalizes read-only list query parameters before service-layer Prisma queries; no writes. |

## Side Effect Map

| Side Effect | Allowed Location |
| --- | --- |
| Write database | Services called by server actions, local writable runtime only. |
| Read database | Services. Pages may call services but must not hold query logic. |
| Write uploads | File service and related actions only, local writable runtime only. |
| Write exports | Export service only, local writable runtime only. |
| Write backups | Backup service only, local writable runtime only. |
| Write logs | Logging service only; local `logs/app.log` and `logs/error.log`, no real local log writes on Vercel. |
| Call AI | `src/lib/services/ai/` only. Failures must be caught, logged as sanitized summaries, and surfaced as friendly fallback. |
| Generate diagnostic text | Diagnostics service/action and client download only. |

## Forbidden Modification Points

- Do not move business logic into `page.tsx` or client components.
- Do not expose `.env`, API keys, full local paths, SQLite file paths, full stack traces, or full prompts to the frontend.
- Do not implement login, cloud accounts, payments, crawlers, OCR, link parsing, API image generation, Electron, scheduled jobs, or agent systems in V1-Core.
- Do not convert Vercel preview into a writable runtime.
- Do not edit old migrations or reset the database without explicit test-only approval.
