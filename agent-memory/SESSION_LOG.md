# Session Log

Only the latest summary stays here. Older V1.5 detail is archived; do not use archive files as default startup context.

## 2026-06-01

### V1.5 Stabilization - API Image Provider Adaptation

- Changed: Added approved lightweight API image Provider modes for Nova chat/SSE image generation and AtlasCloud async prediction image generation, while preserving the existing OpenAI-compatible Images path. AI settings now exposes Provider-type-specific model presets, including Nova Firefly/Nano Banana choices and AtlasCloud `OpenAI GPT Image 2 Text-to-Image`.
- Changed: Added manual deletion for failed Prompt task API image job rows with no material result, and clarified HTML provider errors so mis-matched Provider type/Base URL failures no longer surface as raw `<html>`.
- Changed: Fixed the materials grid batch-selection checkbox RSC boundary error by removing the server-rendered `onClick` handler from checkbox children passed into the client batch form; image/title links remain clickable separately.
- Verification: `npm run encoding:check`, `npm run lint`, `npm run build`, `npx prisma validate`, and `npm run typecheck` passed. Root `npm test` remains unavailable because the project has no `test` script. Browser smoke on `/settings/ai` confirmed the Nova and AtlasCloud Provider type options, model presets, and no console errors; `/prompt-tasks` returned 200 with API image UI present.
- Boundary: No schema, migration, dependency, V2 generic provider framework, background batch generation, crawler, publishing, or filesystem delete behavior was added. API keys remain server-side and Vercel/read-only AI guards remain in the service layer.

### V1.5 Stabilization - Link Import Filter Jump Fix

- Changed: Fixed the remaining `/link-imports` filter jump by preserving the filter controls as a viewport anchor across purpose/status URL updates, blurring the active select before route replacement, reserving stable lower-workspace height for sparse or empty filtered results, and clamping oversized current-draft detail text.
- Verification: `npm run encoding:check`, `npm run lint`, `npm run typecheck`, and `npm run build` passed. Browser regression on `http://localhost:3000/link-imports` switched `status=draft -> all -> draft` and kept the filter/list viewport position stable; screenshot saved to `tmp/link-imports-filter-stable.png`.
- Boundary: No schema, migration, dependency, AI behavior, filesystem write behavior, crawler, automatic publishing, V2 feature, or second cleanup system was added.

### V1.5 Stabilization - UI/AI Follow-up

- Changed: Removed the copywriting note strip, moved Prompt API image generation above long Prompt text, changed empty API image model display to `Provider 默认模型`, improved link-import success feedback and auto-filtering, and added lightweight scene default Provider settings for copywriting, AI vision, and API image generation through existing `AppSetting` keys.
- Changed: Refined link-import auto filtering so changing purpose/status restores the current scroll position instead of jumping to the top. API image generation now retries `/v1/images/generations` when a provider root URL returns an HTML page, and HTML provider errors are shown as a configuration hint instead of raw `<html>`.
- Verification: `npm run encoding:check`, `npm run lint`, `npm run build`, `npx prisma validate`, and `npm run typecheck` passed. Root `npm test` remains unavailable because the project has no `test` script. HTTP smoke checks returned 200 for `/copywriting`, `/prompt-tasks`, `/link-imports`, and `/settings/ai`, with the expected UI text present or removed.
- Boundary: No schema, migration, dependency, V2 feature, crawler, automatic publishing, second cleanup system, formal desktop release, or filesystem delete behavior was added. Vercel/read-only AI and write guards remain in the existing service layers.

## 2026-05-31

### V1.5 Stabilization - Copywriting Filter/Delete Follow-up

- Changed: Fixed the copywriting history view to use the server-filtered route result directly, removed the extra stale client-side platform re-filter, and added selected-record batch deletion plus one-click deletion for the current filtered result. Batch deletion reuses the product write guard and only deletes `Copywriting` records with operation logs; it does not delete products, AI jobs, materials, or files.
- Verification: `npm run encoding:check`, `npm run lint`, `npm run build`, `npx prisma validate`, and `npm run typecheck` passed. Root `npm test` remains unavailable because the project has no `test` script. HTTP smoke checks returned 200 for `/copywriting` and `/copywriting?platform=小红书`, with the filter and batch-delete UI present in the rendered page.
- Boundary: No schema, migration, dependency, V2 feature, second cleanup system, crawler, automatic publishing, formal desktop release, AI behavior change, or filesystem delete behavior was added.

### V1.5 Stabilization - UI/UX Follow-up Pass

- Changed: Completed the ordered follow-up fixes requested after review: tightened the copywriting generation layout and filters, added per-copy delete affordances, fixed Prompt task filter overlap, renamed and added feedback for material/inspiration similarity checks, hid local acceptance fixture inspirations from default view, localized link-import status/platform/quality display, made API image Provider model name optional, improved AI Provider default persistence refresh behavior, changed the header menu to status/check links, and replaced homepage/material/product/banned-word stat placeholders with real day-start deltas.
- Verification: `npm run encoding:check`, `npm run lint`, `npm run build`, `npx prisma validate`, and `npm run typecheck` passed. Root `npm test` remains unavailable because the project has no `test` script. Local HTTP smoke checks returned 200 for `/`, `/copywriting`, `/prompt-tasks`, `/materials`, `/link-imports`, and `/settings/ai`.
- Boundary: No schema, migration, dependency, V2 feature, second cleanup system, crawler, automatic publishing, formal desktop release, or large workflow was added. Fixture cleanup updated local SQLite rows only and did not delete uploaded files.

- Changed: Completed the approved small-fix pass for AI settings entry behavior, copywriting provider/query persistence, copywriting A/B/C batch grouping and deletion, Prompt task layout/prompt wording/cancelled-task filtering, materials empty-state guidance, inspiration scan layout and AI raw-response redaction, link-import card layout and local/private URL display redaction, file-cleanup selection affordances, header settings menu, and AI image configuration status messaging.
- Verification: `npm run encoding:check`, `npm run lint`, `npm run build`, `npx prisma validate`, and `npm run typecheck` passed. Root `npm test` remains unavailable because the project has no `test` script. Browser QA covered `/copywriting`, `/prompt-tasks`, `/inspirations`, `/link-imports`, `/materials`, `/maintenance/files`, and `/settings/ai`; the Codex in-app browser bridge timed out, so Chrome DevTools was used for page snapshots.
- Boundary: No schema, migration, dependency, V2 feature, second cleanup system, crawler, automatic publishing, formal desktop release, or large workflow was added.

### V1.5 Stabilization Thread 01 - Issue Triage And Ordered Hardening

- Changed: Triaged post-V1.5 issues, then completed the approved ordered stabilization fixes: hid legacy AI raw-response display, removed full Prompt text from Excel export, sanitized export/backup console errors, returned a read-only screenshot shell outside local runtime, constrained the acceptance-only cleanup helper, disabled notification actions in preview, updated the Thread 07 export assertion for Prompt summaries, and refreshed current status docs for Stabilization.
- Verification: `npm run encoding:check`, `npm run lint`, `npm run build`, `npx prisma validate`, `npm run typecheck`, and `npm run thread09:verify` passed. Root `npm test` remains unavailable because the project has no `test` script.
- Boundary: No schema, migration, dependency, V2 feature, second cleanup system, or formal desktop runtime added. Provider-side Vercel recovery-code rotation/revocation remains an external manual action.

### V1.5 Thread 09 - Final Integration Acceptance, README Closeout, And V2 Preparation

- Changed: Added `npm run thread09:verify` as the unified final acceptance entry, reran root verification, refreshed README/current docs, archived detailed V1.5 thread and migration history, and marked V1.5 complete/frozen.
- Verification: `npm run encoding:check`, `npm run lint`, `npm run build`, `npx prisma validate`, `npm run typecheck`, `npm run thread09:verify`, and Electron POC smoke passed. `npm test` is still unavailable because the root project has no `test` script.
- Boundary: No new business feature, schema, migration, dependency, desktop release, second cleanup system, or V2 implementation was added.

Detailed Thread 00-08 summaries, previous active session detail, and previous active patch detail are archived in `agent-memory/archive/V1_5_THREAD09_CLOSEOUT_DETAIL_ARCHIVE_2026-05-31.md`.
