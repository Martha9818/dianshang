# V1.5 Thread 02 Screenshot Recognition Design

## Scope

Thread 02 supports only user-initiated screenshot or local image import. It does not capture screens, open webpages, use browser automation, parse links, crawl platforms, auto-publish, auto-message, auto-comment, generate images, ship Electron, or run multi-agent scheduling.

## Additive Model

Add `ScreenshotRecognitionJob` as an additive Prisma model. Suggested fields:

- `id`
- `sourceType`: `inspiration`, `product`, `competitor`, `material`, or `manual`
- `sourceId`: optional related record id as text for loose coupling
- `productId`, `inspirationId`, `materialId`, `competitorId`: optional relations where useful
- `imagePath`: managed upload relative path
- `thumbnailPath`: optional managed thumbnail relative path
- `materialId`: optional when a screenshot is stored as a conservative material record
- `status`: `pending`, `processing`, `success`, `failed`, or `skipped`
- `resultSummary`: sanitized short AI summary
- `structuredDraft`: JSON draft, never formal facts
- `confirmedDraft`: user-edited/confirmed JSON draft
- `qualityLevel`: `high`, `medium`, `low`, or `failed`
- `errorSummary`: sanitized error only
- `aiJobId`
- `needsUserConfirmation`, `confirmedAt`, `ignoredAt`
- `createdAt`, `updatedAt`

No existing product, inspiration, material, competitor, upload, or AI log schema is modified beyond additive relations needed for safe navigation.

## Service Layer

Create `src/lib/services/screenshot/` for Thread 02. The service owns upload/import, preview metadata, AI recognition, history, draft editing, ignore, and confirmation.

The service reuses existing foundations:

- image/upload service for validation, managed relative paths, hash, metadata, and thumbnails
- AI provider, `AIJob`, `AIRequestLog`, prompt sanitizers, and JSON validation
- runtime/write guard for local-only writes
- local path service through existing upload APIs
- `OperationLog` for user confirmation, ignore, and draft edits

Pages and server actions remain thin wrappers. They do not perform `fs`, `path.join`, `process.cwd`, AI calls, or database business logic.

## Source Types

`sourceType` records the user entry point:

- `inspiration`: launched from an inspiration record
- `product`: launched from product detail
- `competitor`: launched from a competitor/product competitor section
- `material`: launched from a material record
- `manual`: standalone manual upload

The value is descriptive and does not grant automatic write authority.

## Draft Confirmation Flow

1. User uploads or selects a screenshot.
2. The service saves the image locally and creates a `ScreenshotRecognitionJob` in `pending`.
3. User triggers recognition explicitly.
4. AI result is schema-validated and stored as `structuredDraft` with `qualityLevel`.
5. The draft remains `needsUserConfirmation=true`.
6. User may edit, ignore, or confirm the draft.
7. Confirmation stores `confirmedDraft`, records `OperationLog`, and marks `needsUserConfirmation=false`.

AI output is always a draft. It is not a factual record until the user confirms and a future/manual workflow applies fields.

## Write Boundaries

Product: do not overwrite title, price, cost, score, status, recommendation, or formal fields. Confirmation keeps the edited draft in `ScreenshotRecognitionJob.confirmedDraft`; users can manually copy details later.

Competitor: do not auto-create an effective competitor and do not silently update platform, price, heat, link, screenshot, or title. Thread 02 may hold a competitor draft only. Any future create/update must show a field diff and require second confirmation.

Material: screenshots may be saved as conservative material records only when a product context exists, but recognition does not change material status, usage permission, adoption state, archive state, or file cleanup state.

Inspiration: recognition can attach to the source inspiration and store a confirmed draft, but it does not convert inspiration into product facts.

Manual: standalone history only unless the user later attaches the draft through an explicit workflow.

## Vercel Read-Only

Vercel can render pages and explanatory UI only. It cannot upload files, call high-cost AI, write SQLite, or write uploads, exports, backups, logs, or trash. Write attempts return:

`预览环境只读，请在 Windows 本地验收截图识别。`

## AI Failure Degradation

Image save and job creation are separate from AI recognition. AI failure updates only the screenshot job and AI job/request logs with sanitized summaries. It must not block product, competitor, material, inspiration, export, backup, file cleanup, or manual edit workflows.

## Sanitization

The frontend, logs, operation records, AI prompts, and AI summaries use relative paths or short labels only. The service does not store API keys, full local absolute paths, full prompts, full stack traces, provider-sensitive raw responses, or personal/private data as formal fields unless the user explicitly confirms product-relevant content in the draft.
