# Current Status

## Current Progress

- Current stage: V1.5 Stabilization after V1.5 Thread 09 closeout.
- Current task state: The approved V1.5 UI density and file-cleanup speed follow-up is implemented locally, with the latest correction removing the newly introduced horizontal table scrollbars from the affected overview/management pages. Dashboard/product/export/AI/file-cleanup tables now stay within their cards and use balanced percentage columns plus hidden overflow/truncation where needed, Prompt task cards keep a fixed current-view placeholder so selection no longer changes card height, link-import screenshot upload uses a Chinese icon upload control while preserving the real `name="screenshot"` file input, and Inspiration ScanLog history uses readable record cards for long summaries. File cleanup performance is tightened by avoiding repeated full scans during move-to-trash and by building app-trash entries primarily from successful `move_to_trash` logs plus bounded package-level fallback enumeration; move/delete refreshes no longer create extra scan logs or scan notifications. Stat-card color cleanup now separates the previously too-similar green/teal areas with indigo and sky accents.
- Next stage: Continue only with the next explicitly approved V1.5 cleanup thread after reviewing this local follow-up if needed.

## Product Direction

- Keep EcomPilot Windows local-first with SQLite and local runtime folders as the source of truth.
- Keep Vercel preview read-only; all real write acceptance belongs to Windows local runtime.
- Reuse the existing runtime, local-path, logging, diagnostics, AI, image, export, backup, notification, and cleanup foundations.

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

## Latest User Preference Notes

- Stat-card cleanup should avoid repeated accent colors within the same top stat row, and stat numbers / emphasis text should not use black. The latest UI follow-up applies this to the previously circled dashboard, notification, and inspiration stat cards.
- Dense management tables should prefer no horizontal scrollbar on normal desktop layouts; use balanced percentage columns, readable wrapping/truncation for long text, and fixed-feeling status/time/action spacing rather than oversized minimum-width tables.
- File cleanup speed work should keep the existing guarded cleanup system, browser confirmation, app-trash boundary, and no-background-cleanup rule intact.

## Next Recommended Step

- Continue with the next explicitly approved V1.5 cleanup thread. File cleanup remains the existing V1-Plus system, now with bounded backup-package scanning, collapsed result rendering, faster move refresh, and package-level app-trash enumeration.
