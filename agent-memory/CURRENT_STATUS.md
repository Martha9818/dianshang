# Current Status

## Current Progress

- Current stage: V1.6 planning and real-use flow review after the V1.5 freeze.
- Current task state: The approved development-only real ID maintenance follow-up is implemented locally. `/maintenance/files` now has a guarded `开发期真实 ID 整理` entry that requires the confirmation text `重排真实ID`, creates an automatic local backup before changes, hard-cleans soft-deleted test products and discarded material records, compacts remaining real `Product.id` and `Material.id` values to `1..N`, renames `uploads/products/<oldId>` folders through a two-stage filesystem move, rewrites product-scoped upload paths, updates strong product/material associations, and resets SQLite autoincrement sequences. Product/material pages no longer expose computed display numbering; product pool/detail and material library/product-material views use real `Product ID` / `素材 ID` as the visible ID. The dangerous maintenance action was not executed during verification.
- Latest product-form layout follow-up: `/products/new` and `/products/[id]/edit` now use a real-field workspace layout instead of the old left-image/right-stacked form. The artificial `建档顺序建议` block was removed after review; visible space is now filled only by actual product fields grouped as main image + basic archive, platform + profit inputs + content judgment, and scoring signals + notes.
- Latest Prompt task card follow-up: the active `当前查看` badge on `/prompt-tasks` is anchored to the card's right-top action area instead of flowing with the Task ID/title text, so long task/product names no longer push it down.
- Direction sync status: `docs/superpowers/specs/2026-06-02-v16-direction-sync-report.md` now records the approved planning baseline for the image-driven draft workbench, link-import downgrade, separated draft-vs-formal scoring, V1.7 competitor screenshot inbox, and V1.8 conditional content workflow.
- Next stage: Review and approve the V1.6 direction-sync baseline before opening any implementation thread for inspiration inbox reshaping, competitor screenshot inbox design, or content-workflow automation.

## Product Direction

- Keep EcomPilot Windows local-first with SQLite and local runtime folders as the source of truth.
- Keep Vercel preview read-only; all real write acceptance belongs to Windows local runtime.
- Reuse the existing runtime, local-path, logging, diagnostics, AI, image, export, backup, notification, and cleanup foundations.
- Planned next flow: `图片/截图 -> 灵感箱扫描 -> AI 草稿 -> 草稿初筛分 -> 用户保留/放弃/转商品 -> 正式商品 -> 正式评估 -> 条件式内容生产`.
- Direction split: inspiration draft triage answers whether a clue deserves more attention; formal product scoring answers whether the product deserves small-batch testing.
- Product deletion remains a soft business delete by default; real `Product.id` / `Material.id` should stay stable in normal workflows, and future competitor records should keep stable real IDs as well.

## V1.5 Freeze Summary

- Thread 01-08 are implemented on the current mainline and covered by Thread 09 regression plus archived thread detail.
- Thread 09 adds a unified final acceptance entry: `npm run thread09:verify`.
- No new business feature, schema, migration, dependency, or second cleanup system was added in Thread 09.

## Open Risks Or Limits

- Vercel remains preview-only and read-only.
- Root `npm test` does not exist in the current scripts.
- Provider-side rotation or revocation is still required for the historical Vercel recovery-code exposure; this must be completed outside the repository.
- Manual backup exists, but in-app restore remains V2 scope.
- Electron remains POC-only and is not a formal desktop runtime.
- Recent UI stabilization adjusted copywriting, Prompt tasks, materials, inspirations, link imports, file cleanup affordances, AI settings, header status menu, and stat deltas without schema, migration, dependency, or V2 scope changes.
- Copywriting history filtering now relies on the route-filtered server result without the stale client-side platform re-filter, and copywriting records can be selected, batch deleted, or one-click deleted for the current filtered result.
- The latest UI/AI follow-up removed the extra copywriting note strip, moved Prompt API image generation above long Prompt text, treats empty API image model names as Provider defaults, improved link-import feedback and auto filters, and added lightweight scene default Provider settings for copywriting, AI vision, and API image generation through existing `AppSetting` rows.
- Link-import auto filters now preserve the filter controls as a viewport anchor, keep the draft workspace height stable for sparse/empty filter results, and clamp oversized current-draft detail text so status/purpose switching no longer jumps.
- API image generation retries `/v1/images/generations` when a provider root URL returns an HTML page instead of JSON.
- API image generation now supports approved lightweight Provider modes for OpenAI-compatible Images, Nova chat/SSE image generation, and AtlasCloud async prediction image generation; AI settings offers model presets while continuing to use the existing `AIProvider.modelName` field.
- AI settings now offers a CodesOnline API image preset through the existing OpenAI-compatible image path and includes `gpt-image-2` in the image model presets; no new provider protocol or schema was added.
- Materials detail image preview now opens in-page with zoom, pan, and Esc/close controls instead of navigating to a new tab.
- Prompt task viewing now uses a detail anchor and current-view state so selecting a task gives visible feedback and lands near the detail panel.
- Prompt task API image failed job rows can be manually removed from the recent history without deleting generated materials or files.
- Build/acceptance fixture inspirations from local verification were hidden from the default inspiration view and related scan/draft jobs were cleared; uploaded files were not deleted.
- Latest small-fix batch keeps V1.5 boundaries: no schema, migration, dependency, V2 behavior, background cleanup, or automatic backup deletion. Link-import and inspiration task deletes remove only history rows; file cleanup still uses the existing service, browser confirmation, Vercel read-only guard, and `CleanupLog`.
- Latest follow-up fixed material `materialId` detail switching by preserving numeric query values through normalization, and made link-import draft `全部删除` submit in place instead of redirecting to the top.
- Latest auto-filter follow-up removed the visible filter submit buttons from notifications, products, copywriting history, Prompt tasks, materials, and inspirations. Select controls update the URL immediately, text/number filters update on Enter or blur, scroll is preserved, multi-filter state is serialized from the whole form, and stale `materialId` / `taskCode` params are cleared on relevant filter changes.
- Latest dashboard follow-up excludes cancelled Prompt tasks from the home dashboard recent Prompt task list while leaving Prompt task history and status filtering intact.
- Latest stabilization batch removes duplicated notification action areas, concentrates selection/read/delete/cleanup controls in the notification list header, makes Prompt tasks switch detail by clicking the whole card, moves high-frequency material detail links above the metadata block, relaxes product material table density, adds collapsed/deletable ScanLog history, and increases the multi-platform copywriting package text timeout without changing schema, migrations, dependencies, or V2 behavior.
- Latest ID-visibility follow-up keeps V1.5 boundaries and only adjusts UI display: `/products` now shows internal `product.id` beside the existing SPU-driven card row, and `/materials` grid cards now show `material.id` in the card header to help users map screenshot source records to products/materials without changing schema, routing, or business logic.
- Latest approved design follow-up keeps real IDs unchanged, moves toward computed display numbering (`商品 1`, per-product `素材 1`), restores real IDs to secondary detail-only information, removes duplicate material copywriting actions, and extends the existing cleanup foundation to surface empty directory shells without adding a second cleanup system or touching schema.
- Latest implementation follow-up keeps real IDs unchanged and fully replaces the temporary primary-ID emphasis: product rows now show computed display numbering, product detail exposes both display number and real `Product ID`, materials show per-product computed numbering with real IDs in detail metadata, the mirrored duplicate copywriting shortcut is removed, and file cleanup now distinguishes empty directories from files while reusing the same guarded trash/delete pipeline.
- Latest UI density and cleanup-speed follow-up keeps V1.5 boundaries: table spacing is stabilized across the requested pages without forcing horizontal scrollbars, Prompt task card selection no longer changes card height, link-import screenshot upload uses a Chinese icon UI while preserving the existing form field, Inspiration ScanLog history is easier to scan, and file cleanup avoids repeated move-time scans plus deep app-trash enumeration without changing schema, dependencies, route contracts, or permanent-delete safety boundaries.
- Latest spacing follow-up keeps the no-horizontal-scroll preference and makes two final display-only refinements: home recent-product dates render date-only, and notification-list content/related columns have clearer separation without changing notification actions or filters.
- Latest file-cleanup display follow-up reduces the default visible scan/trash rows from 30 to 10 and gives cleanup-log `原路径` / `原因` columns clearer spacing without changing cleanup behavior or safety guards.
- Latest inspiration microcopy follow-up removes the English `Thread 02` / `Thread 03` prefixes from the two inspiration detail shortcut buttons while preserving the existing screenshot-recognition and link-import destinations.
- Latest screenshot-page microcopy/layout follow-up replaces the native file-picker text box with an icon-first upload control on `/screenshots` and moves the return shortcuts to the top of the page while keeping the existing upload field name, route targets, and recognition flow unchanged.
- Latest real-ID maintenance follow-up intentionally changes real primary-key behavior only through a manual development-only guard: it auto-backs up first, compacts `Product.id` / `Material.id`, renames product upload folders, and removes computed display numbering from visible product/material pages. It is not an automatic delete-time workflow and was not executed during verification.

## Latest User Preference Notes

- Stat-card cleanup should avoid repeated accent colors within the same top stat row, and stat numbers / emphasis text should not use black. The latest UI follow-up applies this to the previously circled dashboard, notification, and inspiration stat cards.
- Dense management tables should prefer no horizontal scrollbar on normal desktop layouts; use balanced percentage columns, readable wrapping/truncation for long text, and fixed-feeling status/time/action spacing rather than oversized minimum-width tables.
- File cleanup speed work should keep the existing guarded cleanup system, browser confirmation, app-trash boundary, and no-background-cleanup rule intact.

## Next Recommended Step

- Use the new V1.6 direction-sync report as the planning baseline, then decide which docs-only or light-expression follow-up belongs in V1.6 before any schema or workflow implementation work starts.
