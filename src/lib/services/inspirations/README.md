# Inspirations Service

## Responsibility

`src/lib/services/inspirations/` owns the V1-Core-06 inspiration inbox. It stores the local inspiration-folder setting, performs manual folder scans, deduplicates by `fileHash`, copies newly found images into managed `uploads/inspirations/`, saves review-only inspiration drafts, records scan logs, runs lightweight AI vision suggestions through the shared AI base, and converts reviewed inspirations into formal `Product` rows only after user confirmation.

## Not Responsible For

- Scheduled scans, background workers, Electron tasks, or agent flows.
- OCR, link parsing, platform crawling, similarity search, or automatic cleanup.
- Automatic product creation, automatic factual writeback, or auto-publish logic.
- Direct UI rendering in pages or client components.

## Manual Scan Flow

1. Check runtime through `product-runtime-service`; Vercel stays read-only.
2. Read `inspirationFolderPath` from the local setting store.
3. Validate the folder exists and is readable.
4. Scan supported root-level files only: `jpg / jpeg / png / webp`.
5. Read each file, compute `SHA-256 fileHash`, and skip duplicates already in `Inspiration`.
6. Copy new files into `uploads/inspirations/original/` with short safe filenames.
7. Reuse shared thumbnail generation to write thumbnail files under `uploads/thumbnails/...`.
8. Create `Inspiration` rows with `status=pending_review` and `usagePermission=reference_only`.
9. Record a `ScanLog` summary even when some files fail.

## fileHash Rule

- Deduplication is content-based, not filename-based.
- Renaming the same image should still hit the same `fileHash`.
- `fileHash` is unique on `Inspiration`.

## AI Suggestion Reuse

- AI suggestions reuse the shared AI base in `src/lib/services/ai/`.
- Each suggestion must create an `AIJob`, use schema-validated JSON output, and store only sanitized summaries in AI logs.
- Suggestion output is stored in `aiSuggestionJson` and displayed as `AI 建议，仅供参考`.
- AI suggestion failure must not block inspiration import, review, or manual conversion.

## Image Reuse

- This module reuses the image safety base for hashing and thumbnail generation.
- It does not refactor or expand the image module into OCR, compression, or cleanup work.

## Side Effects

- Writes database: yes, for `AppSetting`, `Inspiration`, `ScanLog`, and converted `Product`.
- Writes files: yes, managed copies under `uploads/inspirations/` plus generated thumbnails.
- Calls AI: yes, local-only lightweight image suggestion through the shared AI base.

## Vercel Degradation

- Vercel must not read the real local inspiration folder.
- Vercel must not scan, copy files, write DB rows, or call high-cost AI.
- Preview may only render a readonly shell with safe notices.

## Safety Rules

- Do not expose full local folder paths to frontend, diagnostics, or logs.
- Do not write raw AI suggestions into formal product facts automatically.
- Do not convert an inspiration into a product without the user-confirmation form.
- Do not add scheduled scan, OCR, link parsing, platform capture, or auto-product features here.

## Do Not Change Casually

- Keep scans manual and foreground only.
- Keep `usagePermission` conservative for scanned reference images.
- Keep AI suggestions explicitly non-factual and user-reviewed.
- Keep diagnostics and scan logs path-sanitized.
