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
