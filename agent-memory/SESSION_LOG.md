# Session Log

Only the latest summary stays here. Older V1.5 detail is archived; do not use archive files as default startup context.

## 2026-06-02

### V1.5 Stabilization - Circled Stat Card Color Follow-up

- Changed: Replaced the circled gray/red stat-card accents without changing data or layout. Home `已生成文案数量` now uses teal, home `已上传素材数量` now uses cyan, notifications `通知总数` now uses amber, and inspirations `已放弃` now uses teal.
- Changed: Extended the shared dashboard stat-card tone set with teal/cyan so future top rows can avoid repeated gray/red fallback tones while keeping stat numbers colored by their accent.
- Verification: `npm run encoding:check`, `npm run typecheck`, `npm run lint`, and `npm run build` passed. HTTP smoke returned 200 for `/`, `/notifications`, and `/inspirations`; browser DOM checks confirmed `text-teal-600`, `text-cyan-600`, and `text-amber-600` on the changed stat values with no console warnings/errors.
- Boundary: No schema migration, dependency change, data write behavior, cleanup behavior, AI behavior, or V2 scope was added.

### V1.5 Stabilization - File Cleanup Backup Scan And Stat Card Colors

- Changed: `/maintenance/files` no longer deep-scans inside `backups/` packages. Backup cleanup entries are now top-level backup packages, which prevents thousands of internal backup paths from filling the scan result.
- Changed: Scan results and app-trash results now render 30 rows by default with explicit expand/collapse controls. The existing select-all behavior was preserved; it was not narrowed to visible rows.
- Changed: App-trash permanent delete can remove directories already inside the app-managed trash, so a backup package moved to trash can be permanently deleted after confirmation.
- Changed: Stat-card numbers now use the card accent color instead of black. Product, materials, inspirations, and dashboard stat rows were adjusted to avoid repeated tones in the same top row.
- Verification: `npm run encoding:check`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npx prisma validate` passed. Browser verification on `http://localhost:3000/maintenance/files` showed scan results reduced from the previous 1632 entries to 171 entries, with backups shown as top-level `备份包` rows and scan/trash tables collapsed to 30 rows. HTTP smoke returned 200 for `/`, `/products`, `/materials`, `/inspirations`, `/maintenance/files`, and `/notifications`.
- Boundary: No schema migration, dependency change, second cleanup system, background cleanup, backup restore workflow, or V2 behavior was added.

### V1.5 Stabilization - File Maintenance Scan Fetch Failure Fix

- Fixed: `/maintenance/files` could show `Runtime TypeError: Failed to fetch` after triggering the scan Server Action because the empty-directory cleanup follow-up let directory entries bypass the existing per-scope scan cap and continue recursive traversal.
- Changed: `listFilesUnderScope()` now applies the same scan cap to files and empty directories, and stops descending once the cap is reached.
- Verification: `npm run encoding:check`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npx prisma validate` passed. Browser verification on `http://localhost:3000/maintenance/files` loaded successfully and `scanFileMaintenanceAction` returned 200 in about 1.5s with no `Failed to fetch`; HTTP smoke returned 200 for `/`, `/products`, `/materials`, `/maintenance/files`, and `/notifications`.
- Boundary: No schema migration, dependency change, second cleanup system, background cleanup, or ID behavior change was added.

### UI Preference Note - Stat Card Colors

- Recorded: Future stat-card UI cleanup should avoid repeated accent colors within the same top stat row.
- Recorded: Stat numbers and emphasis text should not use black; use distinct non-black tones that still preserve readability and hierarchy.
- Boundary: No UI code was changed in this step; this is a preference note for a future visual pass.

## 2026-06-01

### V1.5 Stabilization - Display Numbering, Product Pool Cleanup, And Empty Directory Cleanup

- Changed: Replaced the temporary primary-ID emphasis with computed display numbering. `/products` now shows `商品 {n}` inside the product-info cell instead of a standalone `Product ID` column, while `/products/[id]` keeps both the display number and real `Product ID` in the detail view.
- Changed: `/materials` now shows per-product `素材 {n}` display numbering in grid/list surfaces, keeps real `素材ID` and real `Product ID` in the detail metadata, and shows the related product with its display-number context when available.
- Changed: Removed the duplicate copywriting shortcut from the materials detail action row and the mirrored product-detail materials panel, keeping the clearer `查看文案素材` entry only.
- Changed: Extended the existing file-cleanup flow so `/maintenance/files` can surface empty directories as cleanup candidates and as trash entries, while reusing the same read-only guards, move-to-trash flow, and permanent-delete safety checks. The cleanup panel now labels empty directories distinctly from normal files.
- Verification: `npm run typecheck`, `npm run lint`, `npm run build`, and `npx prisma validate`.
- Boundary: No schema migration, dependency change, real-ID reset/reindex, second cleanup system, or V2 behavior was added.

### V1.5 Stabilization - Display Numbering, Product Pool Cleanup, And Empty Directory Cleanup Design

- Changed: Wrote the approved follow-up design spec at `docs/superpowers/specs/2026-06-01-products-materials-display-number-and-cleanup-design.md`.
- Changed: Locked the direction to computed display numbering instead of real-ID reset: `/products` will show global active-product display numbers, `/materials` will show per-product active-material display numbers, and real `product.id` / `material.id` remain secondary detail-only information.
- Changed: Locked the UI cleanup scope to remove the standalone `Product ID` table column, fold product numbering into the product-info cell, remove the duplicate material copywriting action, and extend the existing file-cleanup surface to detect empty directory shells rather than creating a second cleanup tool.
- Verification: Spec self-review only; no code, schema, dependency, or runtime verification was run in this step.
- Boundary: The approved design keeps V1.5 constraints: no schema migration, no real-ID reindex/reset, no background cleanup, and no second cleanup system.

### V1.5 Stabilization - Product And Material ID Visibility

- Changed: Added an internal `Product ID` column to the `/products` pool table while keeping SPU as the human-facing business code, so users can directly map screenshot/link/material records back to the numeric product primary key.
- Changed: Added a compact `素材ID {id}` badge to the top-right of `/materials` grid cards, making screenshot-recognition `sourceId` lookup easier without opening the right-side detail pane first.
- Verification: `npm run lint` and `npm run typecheck`.
- Boundary: No schema, migration, dependency, routing, filesystem, AI, or business-logic change was added; this is display-only UI clarification within the current V1.5 scope.

### V1.5 Stabilization - Notifications, Prompt Tasks, Materials, And ScanLog Tightening

- Changed: Removed the duplicated notification action areas, kept only the filter bar plus a unified notification-list toolbar, and moved `全选` / `全部标记已读` / `全部删除` / `清理旧通知` into the list header. Notification delete actions no longer prompt for a second confirmation, while the existing cleanup guard remains in place.
- Changed: Tightened the shared batch-operation form so products, materials, and inspirations now show clearer selected counts, target-status feedback, action summaries, and execution readiness instead of feeling like the dropdowns do nothing.
- Changed: Prompt task cards now switch the right-side detail pane by clicking the whole card, while the upload button stays independent. The extra `查看 / 当前查看` button is removed.
- Changed: Product material records now use a looser table layout with more room for long Task IDs and actions. Material detail actions were moved above the metadata block, and `查看文案素材` now jumps to the copywriting workspace by product filter.
- Changed: Inspiration `最近 ScanLog` now defaults to a shorter list, supports expand/collapse, truncates long error summaries, and allows deleting individual `ScanLog` rows without touching inspirations, tasks, or files.
- Changed: Multi-platform copywriting package generation now gets a longer text-request timeout window and a clearer timeout-vs-provider-config error hint, while keeping the existing one-request-for-four-platforms behavior.
- Verification: `npm run encoding:check`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npx prisma validate` passed. HTTP smoke returned 200 for `/notifications`, `/products`, `/copywriting`, `/prompt-tasks`, `/materials`, and `/inspirations`. Chrome DevTools snapshots verified the new notification toolbar, Prompt task full-card selection, material detail action placement, and collapsed ScanLog block.
- Boundary: No schema, migration, dependency, V2 behavior, second cleanup system, background queue, or file-deletion workflow change was added.

### V1.5 Stabilization - Auto Filter Controls

- Changed: Added a shared client auto-filter form and removed the visible `筛选` submit buttons from notifications, products, copywriting history, Prompt tasks, materials, and inspirations. Select filters now route immediately; text/number filters route on Enter or blur.
- Changed: Auto-filter navigation serializes the full current form state so multiple filters remain combined, uses `scroll: false`, clears product `analysisError`, clears material `materialId` / material feedback params on material filter changes, and clears Prompt task `taskCode` on Prompt filter changes.
- Fixed: Home dashboard recent Prompt task list now excludes cancelled Prompt tasks, so cancelled rows no longer appear in the first-screen recent task table.
- Verification: `npm run encoding:check`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npx prisma validate` passed. HTTP smoke returned 200 for `/notifications`, `/products`, `/copywriting`, `/prompt-tasks`, `/materials`, and `/inspirations`; Chrome DevTools verified product multi-filter preservation without scroll reset, material `materialId` clearing, Prompt `taskCode` clearing, and copywriting input blur behavior with no console errors.
- Boundary: No schema, migration, dependency, V2 feature, server-side data behavior, Vercel write behavior, or link-import rework was added.

### V1.5 Stabilization - Small Fix Batch

- Changed: Refined materials selection/detail behavior so batch selection toggles cleanly, grid cards open right-side detail by clicking the card, and the extra detail button was removed while keeping the layout denser.
- Fixed: Follow-up corrected the material grid card click layer so clicking non-checkbox card content updates the selected detail panel.
- Changed: Synced API image default Provider saves to the existing `ai.sceneDefault.imageProviderId` AppSetting and refreshed the AI image scene dropdown immediately after save.
- Changed: Unified inspiration scan intervals to 5/10/15/30/60/120/240/1440 minutes, added manual deletion for inspiration scan and AI draft task history rows, and added single/batch deletion for link-import drafts without deleting converted business records or screenshot files.
- Changed: Moved link-import return shortcuts to the top, tightened export record wrapping/truncation, clarified backup as manual-only with retention guidance, and removed the two typed confirmation inputs from file cleanup while preserving browser confirmation, Vercel read-only guards, trash limits, and CleanupLog.
- Fixed: Follow-up changed the link-import draft cleanup toolbar from the ambiguous batch-delete button to explicit `全选` and `全部删除` controls for the current draft list.
- Fixed: Follow-up made `全部删除` submit in place without redirecting the page to the top, replaced the material card transparent-link layer with a client-side card click handler, and preserved numeric query IDs through service-level query normalization so `materialId` actually switches the right-side detail panel.
- Verification: `npm run encoding:check`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npx prisma validate` passed. HTTP smoke returned 200 for `/materials`, `/settings/ai`, `/inspirations`, `/link-imports`, `/export`, `/backup`, and `/maintenance/files`; Playwright CLI screenshots were captured for the same routes.
- Boundary: No schema, migration, dependency, V2 feature, background queue, timed cleanup, automatic backup deletion, second cleanup system, crawler, publishing workflow, API key exposure, or Vercel write behavior was added.

### V1.5 Stabilization - Materials, Prompt Tasks, And CodesOnline Preset

- Changed: Added an in-page material image previewer with wheel zoom, drag pan, backdrop/Esc close, and no new dependency; material detail images no longer open a separate browser page for large preview.
- Changed: Refined Prompt task selection feedback by adding a detail anchor, `当前查看` active state, Task ID in the detail title, and separated primary actions from the upload action in the sticky operation row.
- Changed: Refined AI image settings by making the API image enable toggle a full setting row and adding a CodesOnline OpenAI-compatible preset with `https://image.codesonline.dev/v1` and `gpt-image-2`.
- Verification: `npm run encoding:check`, `npm run lint`, `npm run build`, `npx prisma validate`, and `npm run typecheck` passed. Root `npm test` remains unavailable because the project has no `test` script. HTTP smoke returned 200 for `/materials`, `/prompt-tasks`, and `/settings/ai`; Playwright CLI screenshots were captured for the same pages without triggering real API image generation.
- Boundary: No schema, migration, dependency, V2 feature, batch/background image generation, image edit workflow, filesystem delete behavior, or API key exposure was added.

### V1.5 Stabilization - API Image Provider Adaptation

- Changed: Added approved lightweight API image Provider modes for Nova chat/SSE image generation and AtlasCloud async prediction image generation, while preserving the existing OpenAI-compatible Images path. AI settings now exposes Provider-type-specific model presets, including Nova Firefly/Nano Banana choices and AtlasCloud `OpenAI GPT Image 2 Text-to-Image`.
- Changed: Added manual deletion for failed Prompt task API image job rows with no material result, and clarified HTML provider errors so mis-matched Provider type/Base URL failures no longer surface as raw `<html>`.
- Changed: Fixed the materials grid batch-selection checkbox RSC boundary error by removing the server-rendered `onClick` handler from checkbox children passed into the client batch form; image/title links remain clickable separately.
- Changed: Clarified material grid selection UX: the checkbox is labeled as batch selection, the detail pane defaults to the first material, and grid cards now show an explicit `查看详情` link.
- Changed: Refined material detail UX: detail navigation preserves scroll position, right-side preview opens the original image in a new tab, library similarity check redirects with a success message instead of `NEXT_REDIRECT`, the duplicate single-material detect button was removed, and the batch select button is now in the top batch toolbar.
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
