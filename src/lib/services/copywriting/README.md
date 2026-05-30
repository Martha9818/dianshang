# Copywriting Service

## Responsibility

`src/lib/services/copywriting/` is responsible for EcomPilot V1-Core copywriting generation, persistence, manual editing, banned-word scan reuse, AIJob linkage, AIRequestLog linkage, usage marking, and readonly degradation for Vercel preview.

## Not Responsible For

- Automatic platform publishing.
- Automatic platform login or browser automation.
- Automatic comments, direct messages, or auto-replies.
- Inspiration scanning, image generation, or trial-sales review.
- Rebuilding the shared AI base.
- Turning AIJob into a queue or agent workflow.

## Multi-Platform Package Flow

1. Read product basics, competitor summary, and banned-word list.
2. Build a sanitized multi-platform prompt with coarse business context only.
3. Create `AIJob`.
4. Call the shared AI base through `src/lib/services/ai-client.ts`.
5. Validate JSON output schema before any `Copywriting` write.
6. Run banned-word scan for each generated draft.
7. Save one `Copywriting` row per `productId + platform + versionLabel`.
8. Mark `AIJob` success or failed.
9. Expose only friendly summaries to pages and diagnostics.

## History Rules

- One row remains one product + one platform + one version.
- New AI jobs create new history rows by default.
- Do not overwrite old copywriting from a different AI job.
- Only retry/update rows that were created by the same source AI job retry chain when explicitly requested.
- Manual editing updates the chosen row and rescans it.

## AI Base Reuse

This module must reuse:

- `AIJob`
- `AIRequestLog`
- `AIClientFactory`
- prompt sanitizer
- output schema validation

Do not move provider calls or prompt sanitization into page components.

## Banned-Word Scan

- Generated drafts are scanned after successful AI output validation.
- Manual saves are rescanned on each save.
- Scan failure must not corrupt product data or destroy the main copywriting record.
- Store scan result summary with the row and show hits in UI.

## Database / AI / Vercel Behavior

- Windows local runtime may write database rows and call AI.
- Vercel preview must not create `AIJob`.
- Vercel preview must not write `Copywriting`.
- Vercel preview must not write local log files.
- Vercel preview must not perform real AI calls.
- Vercel preview may read and show existing copywriting data.

## Prompt Sanitization Rules

Do not send:

- API keys
- local filesystem paths
- full cost formulas
- supplier private details
- raw `.env` content

Allowed coarse business context:

- price bucket
- profit space high / medium / low
- manually confirmed selling points
- target user and usage scenes

## Usage Marking

- Only one row per `productId + platform` may be `isUsedInListing=true`.
- Marking a new used row must clear the old used row for the same product/platform first.
- `usedPlatform` defaults to the row's own `platform`.

## Do Not Change Casually

- Do not reintroduce destructive upsert-by-product/platform/version overwrites for all jobs.
- Do not expose raw prompts in UI, logs, exports, or diagnostics.
- Do not let Vercel preview perform real AI writes or job creation.
- Do not expand this module into publishing, comments, messages, or platform sync.
