# EcomPilot Development Changelog

This changelog records high-signal development changes by thread. Detailed chronology remains in `agent-memory/SESSION_LOG.md`.

## 2026-05-30 - GitHub History Cleanup And Push Cadence

- Updated repository workflow rules so small tasks preserve work with local commits and push to GitHub only at milestones, deployment refreshes, history cleanup tasks, or explicit user requests.
- Added published-history rewrite safety guidance: record the old commit, confirm a clean tree, state risk, and use `--force-with-lease`.
- Planned repository history cleanup to replace the old auto-selection project history with a clean EcomPilot V1-Core baseline and delete obsolete remote branches.
- No product code, database schema, migrations, dependencies, or runtime behavior changed.

## 2026-05-30 - Diagnostics Compact Layout Patch

- Reworked `/system/diagnostics` into a compact "status overview + sanitized summary first" page so users can copy/export the diagnostic summary without scrolling through long detail blocks.
- Moved database counts, directory table, image/inspiration summaries, AIJob/AIRequestLog details, ScanLog summaries, and recent errors into folded detail sections.
- Kept diagnostics service behavior, sanitization, database schema, Prisma migrations, runtime write logic, and Vercel read-only rules unchanged.
- Updated the summary action component so copy/export are primary, the controlled test-error write is secondary, and the markdown preview uses a shorter internally scrollable textarea.

## 2026-05-30 - V1-Core-07 Final Integration Acceptance

- Added `scripts/v1-core-07-acceptance.mts` to verify V1-Core diagnostics, local runtime, AI base, image safety, multi-platform copywriting, inspiration scanning, MVP regression flows, and Vercel read-only simulation.
- Added `docs/current/V1_CORE_UNDERSTANDING_CHECK.md` as a plain-language V1-Core closeout and handoff guide.
- Updated README and current docs for V1-Core completed scope, Vercel limits, daily use, acceptance commands, and future-version boundaries.
- Re-ran MVP `thread08` acceptance, V1-Core-07 acceptance, TypeScript, lint, build, encoding check, Prisma migration status, local browser checks, and Vercel preview checks.
- No Prisma schema, migration, dependency, or runtime deployment configuration changed.

## 2026-05-29 - Sidebar Layout Patch

- Removed the desktop sidebar bottom `本地运行中 / Windows · SQLite / Thread 00...` status card.
- Hid the desktop sidebar's internal scrollbar line while preserving wheel scrolling for short screens.
- No database schema, migration, dependency, runtime-folder, or deployment configuration changed.

## 2026-05-29 - V1-Core-06 Inspiration Inbox

- Added `/inspirations` as the manual-scan inspiration inbox.
- Added Prisma models and migration for `AppSetting`, `Inspiration`, and `ScanLog`, plus AI/Product relations needed for inspiration review.
- Added local-only inspiration folder setting with masked frontend display and folder validation.
- Added manual scan flow for `jpg / jpeg / png / webp`, fileHash dedupe, managed copies under `uploads/inspirations/`, thumbnail generation reuse, and `ScanLog` summaries.
- Added optional lightweight AI image suggestion through the shared AI base, AIJob, AIRequestLog, schema validation, and reference-only UI wording.
- Added ignore flow, AI apply-to-draft flow, and confirm-then-convert product creation without auto-filling forbidden factual fields.
- Extended `/system/diagnostics` with inspiration totals, pending-review counts, recent scan summaries, recent failed scans, and recent failed inspiration vision AI jobs.
- Added `src/lib/services/inspirations/README.md` and linked it from the current project map.

## 2026-05-29 - Memory / Docs Governance Update

- Added Version Patch Workflow documentation.
- Added patch severity rules.
- Added `KNOWN_ISSUES.md` issue template.
- Added `PATCH_LOG.md` patch template.
- No business code changed.
- No database migration added.

## 2026-05-29 - Development Safety Addendum

- Added pre-thread safety check.
- Added database migration safety rules.
- Added cache invalidation policy.
- Added dependency policy.
- Added data repair script policy.
- Added secret incident policy.
- Added single active thread policy.
- Added V1-Core freeze / release policy.
- No business code changed.
- No database migration added.

## 2026-05-29 - V1-Core-05 Multi-Platform Copywriting Package

- Extended copywriting from single-platform generation into one-click multi-platform package generation for 闲鱼、淘宝、小红书、抖音.
- Reused the shared AI base for AIJob creation, AIRequestLog writing, prompt sanitization, output schema validation, and friendly failure handling.
- Changed copywriting persistence rules to preserve historical rows across different AI jobs instead of overwriting by product/platform/version.
- Added usage-mark fields so one row per `productId + platform` can be marked as the actual listing version.
- Added per-row violation scan result persistence and rescans on manual save, while keeping scan failure non-destructive.
- Updated `/copywriting`, product copywriting tab, and `/system/diagnostics` to surface grouped drafts, AI summaries, usage markers, and readonly Vercel degradation.
- Added `src/lib/services/copywriting/README.md`.

## 2026-05-29 - V1-Core-04 Image Safety Base

- Added shared image services under `src/lib/services/images/` for format validation, 10MB limit enforcement, short filenames, SHA-256 file hash, dimension reads, and thumbnail generation.
- Declared `sharp` as a direct dependency because application code now generates WebP thumbnails.
- Extended `Material` with image metadata fields for hash, original/thumbnail size, MIME type, thumbnail path, source type, and usage permission.
- Updated material creation to persist image metadata and default manual uploads to `own_photo / usable`, prompt result uploads to `ai_generated / needs_review`.
- Updated material library and product material tab to prefer thumbnails, show source/permission labels, and show the reference-only warning text.
- Extended `/system/diagnostics` with image storage summary: material totals, thumbnail count, missing file count, reference-only count, and safe `uploads/` summary.
- Added module READMEs for images and materials.
- Vercel remains preview-only: upload writes are blocked through the runtime service and full local paths are not exposed.

## 2026-05-29 - V1-Core-03 AI Base

- Added shared AI base services under `src/lib/services/ai/`: model registry, client factory, prompt sanitizer, output validator, cost estimator, AIJob service, and AIRequestLog service.
- Kept `src/lib/services/ai-client.ts` as a compatibility facade for existing settings and copywriting callers.
- Added Prisma models and migration for `AIRequestLog` and `AIJob`.
- Updated copywriting generation to create/update AIJob state, record sanitized request logs, and block malformed AI JSON from writing formal Copywriting records.
- Extended `/system/diagnostics` with AI settings existence, recent AIJob entries, failed AIJob summaries, AIRequestLog summaries, and estimated cost total without exposing keys, full prompts, or full local paths.
- Rewrote current docs and touched runtime/diagnostics copy into clear UTF-8 where earlier terminal output or historical text was confusing.
- Added `src/lib/services/ai/README.md`.
- Vercel remains preview-only: real AI jobs/calls/log writes are blocked or skipped with a Windows local acceptance message.

## 2026-05-29 - Encoding Cleanup Guard

- Rewrote the remaining visible mojibake tab aliases in `src/app/products/[id]/page.tsx` as clear Chinese labels.
- Added `scripts/check-encoding.mjs` and `npm run encoding:check` to verify tracked text files are valid UTF-8 and do not contain known mojibake markers.
- Confirmed apparent mojibake in current docs was a PowerShell display issue, not corrupted file content, by reading the files through Node UTF-8 decoding.

## 2026-05-29 - V1-Core-02 Local Runtime Stability

- Added centralized runtime service under `src/lib/services/runtime/` with Vercel always read-only.
- Added local paths and path safety service under `src/lib/services/local-paths/` for `uploads/`, `exports/`, `backups/`, and `logs/`.
- Added sanitized logging service under `src/lib/services/logging/` writing local `logs/app.log` and `logs/error.log`, with console fallback on Vercel.
- Extended `/system/diagnostics` with runtime service status, auto-created local directory checks, sanitized recent log summaries, SQLite connectivity, and WAL / `busy_timeout` attempt status.
- Added a controlled diagnostics test-error action for local log acceptance; Vercel blocks it as read-only.
- Enhanced `start.bat` with clearer Node/npm/`.env`/directory/port checks and log location hints.
- Added module README files for runtime, local paths, logging, and diagnostics.
- Acceptance fix: `/backup` and homepage backup activity now display safe `backups/.../` labels instead of full local backup paths, without mutating `BackupLog.backupPath`.
- Did not add schema changes, dependency version changes, or future-version features.

## 2026-05-29 - Memory-Docs-Governance-01

- Compressed memory startup files and archived older session history under `agent-memory/archive/`.
- Added `agent-memory/MEMORY_POLICY.md` and `agent-memory/ARCHIVE_INDEX.md`.
- Clarified selective docs/current reading rules and module README placement/index rules.
- Updated project map, architecture rules, thread checklist, and risk register for documentation governance.
- Did not modify business code, database schema, migrations, Vercel configuration, or deployment state.

## 2026-05-29 - V1-Core-01 Project Maintenance And Diagnostics Base

- Added `docs/current/` as the active documentation set for future V1-Core threads.
- Added project map, architecture rules, thread scope checklist, risk register, development changelog, patch log template, and known issues template.
- Added `/system/diagnostics` diagnostics center.
- Added read-only diagnostics service under `src/lib/services/diagnostics/`.
- Added sanitized markdown diagnostic summary with copy and browser-download controls.
- Kept diagnostics read-only on Vercel and avoided persistent diagnostic file writes.

## Historical Threads

- Thread 00: Project scaffold, local database, route skeletons, Windows startup.
- Thread 01: Product pool, product create/edit/detail, main image upload, soft delete, SPU generation.
- Thread 03: Product scoring.
- Thread 04: Copywriting and AI provider fallback.
- Thread 05: Prompt tasks.
- Thread 06: Materials.
- Thread 07: Excel export and manual local backup.
- Thread 08: Final MVP integration acceptance and local closeout.

See `docs/superpowers/specs/`, `docs/superpowers/acceptance/`, and `agent-memory/SESSION_LOG.md` for detailed historical records.
