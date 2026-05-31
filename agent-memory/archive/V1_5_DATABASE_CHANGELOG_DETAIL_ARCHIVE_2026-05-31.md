# V1.5 Database Changelog Detail Archive

This archive preserves the field-level migration detail moved out of the active `docs/current/DATABASE_CHANGELOG.md`.

## V1.5 Thread 06 - `20260531071423_v15_thread06_image_generation`

- Added `ImageGenerationJob`
- Key fields:
  - `promptTaskId`, `productId`, optional `aiJobId`
  - provider/model/size/quality summaries
  - `status`, `resultMaterialId`, `errorSummary`, parameter summary JSON
- Added relations from Product, PromptTask, AIJob, and Material
- Applied after creating a local backup under `backups/v15_thread06_migration_20260531_150255/`

## V1.5 Thread 05 - `20260531063406_v15_thread05_image_dedup`

- Added `ImageFingerprint`
- Key fields:
  - `imageType`, `imageId`, optional `productId`
  - relative path, SHA-256 `fileHash`, `perceptualHash`
  - dimensions, file size, MIME, `status`, `errorSummary`, `lastCheckedAt`
- Added `ImageReviewLog`
- Key fields:
  - source and matched fingerprint ids
  - source/matched object type and id
  - `matchType`, `riskLevel`, similarity, advisory message
  - user handling state, ignored flag, archive-suggested flag
- Applied after creating a local backup under `backups/v15_thread05_migration_20260531_143358/`

## V1.5 Thread 04 - `20260531042549_v15_thread04_competitor_analysis`

- Added `CompetitorAnalysisSnapshot`
- Key fields:
  - `productId`, optional `aiJobId`, `competitorIds`
  - `summary`, `differentiationAdvice`, `priceBandSummary`
  - `sellingPointSummary`, `imageStyleSummary`, `copywritingStyleSummary`
  - `riskTips`, `nextStepAdvice`, `dataGapAdvice`, `uncertaintyNotes`
  - `model`, `provider`, `status`, `errorSummary`, `riskScanResultJson`
  - `isReference`, `archivedAt`, `createdAt`
- Added relations from Product and AIJob

## V1.5 Thread 03 - `20260531034342_v15_thread03_link_import_drafts`

- Added `LinkImportDraft`
- Key fields:
  - `url`, `normalizedUrl`, `sourcePlatform`, `purpose`
  - `status`, `qualityLevel`, `manualText`, `note`
  - optional screenshot fields: material id, relative path, thumbnail path, file hash
  - `metaTitle`, `metaDescription`, `errorSummary`
  - optional links to Product, Competitor, or converted Inspiration

## V1.5 Thread 02 - `20260531030346_v15_thread02_screenshot_recognition`

- Added `ScreenshotRecognitionJob`
- Key fields:
  - `sourceType`, `sourceId`
  - optional `productId`, `inspirationId`, `materialId`, `competitorId`, `aiJobId`
  - `imagePath`, `thumbnailPath`
  - `status`, `resultSummary`, `structuredDraft`, `confirmedDraft`
  - `qualityLevel`, `errorSummary`, confirmation timestamps

## V1.5 Thread 01 - `20260531010807_v15_thread01_inspiration_scan_ai_draft`

- Added `InspirationScanJob`
- Key fields:
  - `scanLogId`, `inspirationId`
  - `sourceRelativePath`, `sourceFileHash`
  - `status`, `failureReasonSummary`, `aiDraftGenerated`, `needsUserConfirmation`, `retryCount`
- Added `InspirationAiDraftJob`
- Key fields:
  - `inspirationId`, optional `aiJobId`
  - `sourceRelativePath`, `status`
  - `failureReasonSummary`, `rawResponseSummary`
  - `needsUserConfirmation`, `retryCount`

## V1-Plus Thread 06 - `20260530081700_v1_plus_thread_06_file_cleanup`

- Added `CleanupLog`
- Key fields:
  - `action`, `fileScope`
  - `originalRelativePath`, `trashRelativePath`
  - `fileSize`, `relatedType`, `relatedId`
  - `status`, `reason`, `createdAt`
- Added indexes for action, scope, status, createdAt, original path, and trash path

## V1-Plus Thread 04 - `20260530141322_v1_plus_thread_04_notification_center`

- Added `AppNotification`
- Key fields:
  - `type`, `level`, `title`, `message`, `status`
  - `relatedType`, `relatedId`, `actionUrl`, `dedupeKey`
  - `createdAt`, `readAt`

## V1-Plus Thread 02 - `20260530033400_v1_plus_thread_02_inspiration_management`

- Reused the existing `Inspiration` table
- Added `reviewedAt`, `archivedAt`, `rejectedReason`
- Mapped historical `pending_review` to `pending`
- Mapped historical `ignored` to `rejected`
- Extended `OperationLog` with `relatedInspirationId` and `productId`

## V1-Core Detail Preserved Here

- `20260529103936_v1_core_06_inspiration_inbox`: `AppSetting`, `Inspiration`, `ScanLog`, and inspiration relations
- `20260529093455_v1_core_05_multi_platform_copywriting`: history-friendly copywriting fields and AI relation
- `20260529130000_v1_core_04_image_safety`: `fileHash`, size, MIME, thumbnail, source, permission
- `20260529090000_v1_core_03_ai_base`: `AIJob`, `AIRequestLog`, cost and error summary fields

All V1.5 migrations stayed additive. No old migration folder was edited, and Thread 09 added no migration.
