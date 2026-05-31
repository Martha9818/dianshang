# Current Status

## Current Progress

- Current stage: V1.5 after Thread 08 implementation.
- V1-Plus status: completed and frozen as the current development baseline.
- Current task: V1.5 Thread 08 - site-search assistant and notification-summary assistant completed locally as a lightweight read-only assistant thread.
- Next thread: V1.5 Thread 09 - final integration acceptance, README closeout, and V2 preparation, only if explicitly approved.

## Product Direction

- Keep EcomPilot local-first for Windows local runtime and SQLite-backed work.
- Keep Vercel preview read-only with local write acceptance performed on Windows.
- Reuse the existing Next.js / Prisma / service-layer / diagnostics / logging / notification / local-path foundations.
- Reuse the V1-Core desktop base: RuntimeConfig, LocalPathService, EnvironmentGuard, LogService, OperationLog, local diagnostics, and Vercel read-only degradation.

## V1.5 Boundary

- V1.5 is for lightweight intelligence and technical validation.
- Thread 01 covers only local inspiration-folder scan settings, app-runtime scheduled scans, new image detection, task states, and AI drafts pending user confirmation.
- Thread 02 covers only user-initiated screenshot/local-image import, preview, AI recognition draft, quality grading, recognition history, edit/ignore/confirm draft flow, and conservative source links.
- Thread 03 covers only single user-pasted link import drafts, URL normalization, SSRF-guarded public meta attempts, source-platform labels, quality grading, auxiliary screenshot/text/note input, reject/archive, and user-confirmed conversion to inspiration or association with existing product/competitor records.
- Thread 04 covers only AI-assisted analysis snapshots from local product, competitor, screenshot-draft, and link-import-draft data. It does not crawl platforms, open links, auto-collect competitors, overwrite scoring, update recommendations, update product status, or change competitor fact fields.
- Thread 05 covers only user-triggered local image fingerprinting, exact duplicate/high-similarity hints, source-risk reminders, manual ignore, and archive-suggestion records for materials and inspirations. It does not delete, move to trash, compress, replace, upload, or run reverse-image search.
- Thread 06 covers only optional user-triggered API image generation from an existing Prompt task into the material library. It does not batch generate, run in the background, publish, list products, open browsers, crawl platforms, or bypass model safety limits.
- Thread 07 covers only isolated Electron POC validation for loading the existing local Next.js page, local port access, minimal preload marking, path/runtime risk review, and Vercel exclusion. It does not ship a formal desktop app, installer, auto-update, tray, Windows system notification, crash recovery, background residency, or `start.bat` replacement.
- Thread 08 covers only a lightweight `/assistant` page with site-search suggestions and notification summaries from local existing data. It is not a real multi-agent system, does not auto-execute tasks, and only returns read-only view/search/filter/navigate suggestions.
- File cleanup and app trash remain V1-Plus Thread 06 capabilities; V1.5 must not create a second cleanup system.

## Blockers Or Risks

- No active product blocker is recorded for V1.5 Thread 08.
- Vercel remains preview-only and read-only; it is not a formal runtime environment.
- No `test` script exists in the current project scripts.
- V1.5 threads must not reimplement path, environment, logging, or Vercel-readonly foundations.
- Thread 05 verification passed encoding check, lint, build, Prisma validate, typecheck, local image-dedupe service smoke, Vercel read-only simulation, and `/materials` + `/inspirations` HTTP smoke checks. `npm test` was attempted and reported no `test` script.
- Thread 05 similarity detection is conservative and may produce false positives/negatives; findings are advisory records only and do not modify image files or cleanup state.
- Thread 06 does not perform real API image generation unless the user manually triggers it with enabled image settings and a configured image provider; no automatic or background image generation exists.
- Thread 06 verification passed encoding check, lint, build, Prisma validate, typecheck, local panel smoke, Vercel read-only simulation, and browser page smoke for `/settings/ai` + `/prompt-tasks`. `npm test` was attempted and reported no `test` script.
- Real image generation success depends on a valid image-generation provider, API key, model, quota, and provider safety policy.
- Thread 07 Electron POC now defaults to a managed local production shell on `http://127.0.0.1:3001/`, and the default Electron smoke path no longer emits the Electron CSP warning.
- Thread 07 root verification passed encoding check, lint, build, Prisma validate, and typecheck; `npm test` was attempted and reported no `test` script.
- Thread 08 verification passed encoding check, lint, build, Prisma validate, typecheck, and lightweight `npm run thread08:verify`; `npm test` was attempted and reported no `test` script.
- Thread 08 assistant search is rules-first. AI only helps infer intent locally when a default text provider exists, and every final link still comes from a service-side allowlist.
- Thread 08 competitor search remains a guided jump into existing product detail / competitor views; there is still no standalone competitor list route.
- Explicit `attach` mode can still target a user-run Next.js dev server for diagnostics, and that dev target may still show the expected Electron development CSP warning.
- POC Electron install may need a reachable Electron binary mirror in restricted networks; this remains POC-only and does not affect root app install.
- Follow-up doc slimming for long files is deferred to a later documentation slimming pass or V1.5 Thread 09 closeout.

## Next Recommended Step

- Thread 08 should be committed locally after verification. Start V1.5 Thread 09 only after explicit approval.
