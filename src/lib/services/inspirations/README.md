# Inspirations Service

## Responsibility

`src/lib/services/inspirations/` owns the V1-Core inspiration inbox, the V1-Plus management flow, and V1.5 Thread 01 local inspiration-folder scanning. It stores the local inspiration-folder setting, supports manual and app-runtime scheduled scans, deduplicates by `fileHash`, copies newly found images into managed `uploads/inspirations/`, saves review-only inspiration drafts, records scan/task logs, runs lightweight AI vision drafts through the shared AI base, supports manual status management, and converts reviewed inspirations into formal `Product` rows only after user confirmation.

## Not Responsible For

- Background workers, system scheduled tasks, Windows services, Electron tasks, tray behavior, system notifications, or agent flows.
- OCR, screenshot structured import, link parsing, platform crawling, reverse-image search, copyright judgment, or automatic cleanup.
- Automatic product creation, automatic factual writeback, automatic publishing, private messages, or comments.
- Direct UI rendering in pages or client components.

## Management Flow

- Supported inspiration status values are `pending`, `reviewed`, `converted`, `archived`, and `rejected`.
- Archived and rejected inspirations are excluded from the default list unless a status filter is selected.
- Status changes are service methods and are recorded through the shared `OperationLog`.
- Converted inspirations keep their source record and `convertedProductId`; they cannot be converted again.

## Manual And Scheduled Scan Flow

1. Check runtime through `product-runtime-service`; Vercel stays read-only.
2. Read `inspirationFolderPath`, `inspirationScanEnabled`, and `inspirationScanIntervalMinutes` from `AppSetting`.
3. Validate the folder exists and is readable through the existing path guard.
4. Scan supported root-level files only: `jpg / jpeg / png / webp`.
5. Read each file, compute `SHA-256 fileHash`, and skip duplicates already in `Inspiration`.
6. Copy new files into `uploads/inspirations/original/` with short safe filenames.
7. Reuse shared thumbnail generation under `uploads/thumbnails/...`.
8. Create `Inspiration` rows with `status=pending` and `usagePermission=reference_only`.
9. Record `InspirationScanJob` task status for each handled image and a `ScanLog` summary.
10. For new imports, attempt an AI draft in `InspirationAiDraftJob`; AI failure is isolated from file import success.

Scheduled scans are application-runtime only: the client scheduler calls a guarded server action while a page is open. There is no background resident process, Windows service, OS scheduler, Electron background process, tray behavior, or system notification.

## fileHash Rule

- Deduplication is content-based, not filename-based.
- Renaming the same image should still hit the same `fileHash`.
- `fileHash` is unique on `Inspiration`.

## AI Draft Reuse

- AI drafts reuse the shared AI base in `src/lib/services/ai/`.
- Each draft creates an `AIJob`, uses schema-validated JSON output, and stores only sanitized summaries in AI/task logs.
- Draft output is stored in `aiSuggestionJson` and displayed as `AI 草稿 / 待用户确认`.
- AI draft failure must not block inspiration import, review, manual editing, or manual conversion.
- Users can confirm/apply, ignore, edit, or retry failed AI draft jobs manually.

## Image Reuse

- This module reuses the image safety base for hashing and thumbnail generation.
- It does not refactor or expand the image module into OCR, compression, cleanup, screenshot import, or link import.
- V1.5 Thread 05 dedupe summaries are read from `src/lib/services/image-dedup/`; manual fingerprinting reads managed uploads only after an explicit user click and never deletes or moves files.

## Side Effects

- Writes database: yes, for `AppSetting`, `Inspiration`, `ScanLog`, `InspirationScanJob`, `InspirationAiDraftJob`, AI/task logs, and converted `Product`.
- Writes files: yes, managed copies under `uploads/inspirations/` plus generated thumbnails.
- Calls AI: yes, local-only lightweight image draft generation through the shared AI base.

## Vercel Degradation

- Vercel must not read the real local inspiration folder.
- Vercel must not scan, copy files, write DB rows, or call high-cost AI.
- Preview may only render a read-only shell with the required notice.

## Safety Rules

- Do not expose full local folder paths to frontend, diagnostics, or logs.
- Do not write AI drafts into formal product facts automatically.
- Do not convert an inspiration into a product without the user-confirmation form.
- Do not add OCR, link parsing, platform capture, background queues, OS scheduling, or auto-product features here.

## Do Not Change Casually

- Keep scheduled scans app-runtime only and guarded by user settings.
- Keep `usagePermission` conservative for scanned reference images.
- Keep AI drafts explicitly non-factual and user-reviewed.
- Keep diagnostics, task summaries, and scan logs path-sanitized.
