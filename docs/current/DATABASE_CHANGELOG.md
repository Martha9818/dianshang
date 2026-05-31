# EcomPilot Database Changelog

This file records active V1-Core schema changes. Add new entries when `prisma/schema.prisma` or migrations change.

## Migration Safety Reference

- Before migration work, read `docs/current/ARCHITECTURE_RULES.md` and `docs/current/THREAD_SCOPE_CHECKLIST.md`.
- Preferred local migration order is:
  - `prisma validate`
  - `prisma generate`
  - `prisma migrate dev`
- Do not modify old migrations.
- Do not reset a real database.
- Evaluate whether a SQLite backup is needed before risky migration work.
- If a migration fails, stop and document the cause plus the safe next step instead of forcing progress with a reset.
- If old data is incomplete, prefer `nullable`, `legacy`, `unknown`, or an explicit repair script over invented values.

## 2026-05-31 - V1.5 Thread 05 Image Dedupe And Review Logs

- Added migration `prisma/migrations/20260531063406_v15_thread05_image_dedup/migration.sql`.
- Added `ImageFingerprint` for local material/inspiration image fingerprints:
  - `imageType`, `imageId`, optional `productId`, relative path
  - SHA-256 `fileHash`, `perceptualHash`, dimensions, file size, MIME
  - `status`, sanitized `errorSummary`, `lastCheckedAt`, timestamps
- Added `ImageReviewLog` for duplicate/similarity/risk review records:
  - source and matched fingerprint IDs, source/matched object type and ID
  - relation scope, match type, risk level, hash values, similarity, message
  - user handling state, ignored flag, archive-suggested flag, timestamps
- Migration is additive; old migrations were not edited and no database reset was used.
- A local SQLite backup was created before applying the migration under `backups/v15_thread05_migration_20260531_143358/`.

## 2026-05-31 - V1.5 Thread 04 Competitor Analysis Snapshots

- Added migration `prisma/migrations/20260531042549_v15_thread04_competitor_analysis/migration.sql`.
- Added `CompetitorAnalysisSnapshot` for AI-assisted competitor analysis history:
  - `productId`, optional `aiJobId`, `competitorIds`
  - analysis sections: `summary`, `differentiationAdvice`, `priceBandSummary`, `sellingPointSummary`, `imageStyleSummary`, `copywritingStyleSummary`, `riskTips`, `nextStepAdvice`, `dataGapAdvice`, `uncertaintyNotes`
  - AI/runtime metadata: `model`, `provider`, `status`, `errorSummary`, `riskScanResultJson`
  - history controls: `isReference`, `archivedAt`, `createdAt`
- Added relations from Product and AIJob to competitor analysis snapshots.
- Migration is additive; old migrations were not edited and no database reset was used.
- A local SQLite backup was created before applying the migration under `backups/v15_thread04_migration_*/`.

## 2026-05-31 - V1.5 Thread 03 Link Import Drafts

- Added migration `prisma/migrations/20260531034342_v15_thread03_link_import_drafts/migration.sql`.
- Added `LinkImportDraft` for single pasted-link import attempts:
  - `url`, `normalizedUrl`, `sourcePlatform`, `purpose`
  - `status`, `qualityLevel`
  - `manualText`, `note`
  - optional auxiliary screenshot fields: `screenshotMaterialId`, `screenshotPath`, `screenshotThumbnailPath`, `screenshotFileHash`
  - public metadata fields: `metaTitle`, `metaDescription`
  - `errorSummary`
  - optional manual conversion links: `productId`, `competitorId`, `convertedInspirationId`
  - `createdAt`, `updatedAt`
- Added optional relations from Product, Competitor, Material, and Inspiration to link import drafts.
- Migration is additive; old migrations were not edited and no database reset was used.
- A local SQLite backup was created before applying the migration under `backups/v15_thread03_migration_*/`.

## 2026-05-31 - V1.5 Thread 02 Screenshot Recognition Jobs

- Added migration `prisma/migrations/20260531030346_v15_thread02_screenshot_recognition/migration.sql`.
- Added `ScreenshotRecognitionJob` for user-initiated screenshot/local-image recognition:
  - `sourceType`, `sourceId`
  - optional `productId`, `inspirationId`, `materialId`, `competitorId`, `aiJobId`
  - `imagePath`, `thumbnailPath`
  - `status`
  - `resultSummary`
  - `structuredDraft`
  - `confirmedDraft`
  - `qualityLevel`
  - `errorSummary`
  - `needsUserConfirmation`, `confirmedAt`, `ignoredAt`
  - `createdAt`, `updatedAt`
- Added additive relations from Product, Inspiration, Material, Competitor, and AIJob to screenshot recognition jobs.
- Migration is additive; old migrations were not edited and no database reset was used.
- A local SQLite backup was created before applying the migration: `backups/v15_thread02_migration_20260531_110306/`.

## 2026-05-31 - V1.5 Thread 01 Inspiration Scheduled Scan And AI Draft Tasks

- Added migration `prisma/migrations/20260531010807_v15_thread01_inspiration_scan_ai_draft/migration.sql`.
- Added `InspirationScanJob` for per-file scan task status:
  - `scanLogId`
  - `inspirationId`
  - `sourceRelativePath`
  - `sourceFileHash`
  - `status`
  - `failureReasonSummary`
  - `aiDraftGenerated`
  - `needsUserConfirmation`
  - `retryCount`
  - timestamps for start/finish/create/update
- Added `InspirationAiDraftJob` for AI draft task status:
  - `inspirationId`
  - `aiJobId`
  - `sourceRelativePath`
  - `status`
  - `failureReasonSummary`
  - `rawResponseSummary`
  - `needsUserConfirmation`
  - `retryCount`
  - timestamps for start/finish/create/update
- Added additive relations from `ScanLog`, `Inspiration`, and `AIJob` to these task models.
- Migration is additive; old migrations were not edited and no database reset was used.
- A local SQLite backup was created before applying the migration: `backups/v15_thread01_migration_20260531_090709/`.

## 2026-05-30 - V1-Plus Thread 06 File Cleanup And Trash

- Added migration `prisma/migrations/20260530081700_v1_plus_thread_06_file_cleanup/migration.sql`.
- Added `CleanupLog` for manual file-maintenance audit records:
  - `action`
  - `fileScope`
  - `originalRelativePath`
  - `trashRelativePath`
  - `fileSize`
  - `relatedType`
  - `relatedId`
  - `status`
  - `reason`
  - `createdAt`
- Added indexes for action, file scope, status, created time, original relative path, and trash relative path.
- Migration is additive; old migrations were not edited and no database reset was used.
- A local SQLite backup was created before applying the migration: `backups/thread06_file_cleanup_migration_20260530_161537/`.

## 2026-05-30 - V1-Plus Thread 04 Notification Center

- Added migration `prisma/migrations/20260530141322_v1_plus_thread_04_notification_center/migration.sql`.
- Added `AppNotification` for lightweight in-app operation notifications:
  - `type`
  - `level`
  - `title`
  - `message`
  - `status`
  - `relatedType`
  - `relatedId`
  - `actionUrl`
  - `dedupeKey`
  - `createdAt`
  - `readAt`
- Added indexes for type, level, status, created time, related target, and unique optional dedupe key.
- Migration is additive; old migrations were not edited and no database reset is planned.

## 2026-05-30 - V1-Plus Thread 02 Inspiration Management

- Added migration `prisma/migrations/20260530033400_v1_plus_thread_02_inspiration_management/migration.sql`.
- Reused the existing `Inspiration` table and status field; no duplicate inspiration table was added.
- Changed the default inspiration status for new rows from `pending_review` to `pending`.
- Added nullable `Inspiration` fields for management workflow:
  - `reviewedAt`
  - `archivedAt`
  - `rejectedReason`
- Migration maps historical `pending_review` rows to `pending`.
- Migration maps historical `ignored` rows to `rejected` with `rejectedReason='历史忽略记录'`.
- Extended `OperationLog` with nullable `relatedInspirationId` and nullable `productId` so inspiration state changes can use the shared operation log without creating a separate logging system.
- Added `OperationLog.relatedInspirationId` index.
- Applied the migration locally with `npx.cmd prisma migrate dev` after a manual local backup.
- Did not edit old migrations and did not reset the local SQLite database.

## 2026-05-29 - V1-Core-06 Inspiration Inbox

- Added migration `prisma/migrations/20260529103936_v1_core_06_inspiration_inbox/migration.sql`.
- Added `AppSetting` for minimal local-only key/value settings storage, currently used for `inspirationFolderPath`.
- Added `Inspiration` with additive review-flow fields:
  - `title`
  - `note`
  - `imagePath`
  - `thumbnailPath`
  - `fileHash`
  - `sourceType`
  - `usagePermission`
  - `status`
  - `aiSuggestionJson`
  - `aiJobId`
  - `convertedProductId`
  - `importedAt`
- Added `ScanLog` for manual scan summaries:
  - `scanType`
  - `folderSummary`
  - `totalFiles`
  - `newFiles`
  - `skippedDuplicates`
  - `failedFiles`
  - `status`
  - `errorSummary`
  - `startedAt`
  - `finishedAt`
- Added inspiration relations to `AIJob` and `AIRequestLog`, plus a converted-product relation on `Product`.
- Added indexes for `Inspiration.fileHash`, `status`, `aiJobId`, `convertedProductId`, `importedAt`, `createdAt`, and for `ScanLog.scanType`, `status`, `startedAt`.
- Applied the migration locally with `npx.cmd prisma migrate dev --name v1_core_06_inspiration_inbox`.
- Did not edit old migrations and did not reset the local SQLite database.

## 2026-05-29 - V1-Core-05 Multi-Platform Copywriting Package

- Added migration `prisma/migrations/20260529093455_v1_core_05_multi_platform_copywriting/migration.sql`.
- Extended `Copywriting` with nullable or additive history-friendly fields:
  - `aiJobId`
  - `versionLabel`
  - `body`
  - `tagsJson`
  - `violationScanResultJson`
  - `isUsedInListing`
  - `usedAt`
  - `usedPlatform`
  - `usageNote`
- Added relation from `Copywriting` to `AIJob`.
- Replaced the old unique overwrite model so history can be preserved across different AI jobs.
- Added indexes for `aiJobId`, `productId + platform`, `productId + platform + versionLabel`, `productId + platform + createdAt`, and `isUsedInListing`.
- Applied the migration locally with `npx.cmd prisma migrate dev --name v1_core_05_multi_platform_copywriting`.
- Did not edit old migrations and did not reset the local SQLite database.

## 2026-05-29 - V1-Core-04 Image Safety Base

- Added migration `prisma/migrations/20260529130000_v1_core_04_image_safety/migration.sql`.
- Extended `Material` with nullable image metadata fields:
  - `fileHash`
  - `originalSizeBytes`
  - `thumbnailSizeBytes`
  - `mimeType`
  - `thumbnailPath`
  - `sourceType`
  - `usagePermission`
- Added indexes on `Material.fileHash`, `Material.usagePermission`, and `Material.sourceType`.
- Applied the migration locally with `npx.cmd prisma migrate dev --name v1_core_04_image_safety`.
- Did not edit old migrations and did not reset the local SQLite database.

## 2026-05-29 - V1-Core-03 AI Base

- Added migration `prisma/migrations/20260529090000_v1_core_03_ai_base/migration.sql`.
- Added `AIRequestLog` for sanitized AI request outcomes, token counts, estimated cost, duration, related ids, and failure summaries.
- Added `AIJob` for lightweight AI task status: `pending`, `running`, `success`, `failed`, or `cancelled`.
- Added optional `Product` relations to AI request logs and jobs through `relatedProductId`.
- Applied the migration locally with `npx.cmd prisma migrate dev`.
- Did not edit old migrations and did not reset the local SQLite database.
