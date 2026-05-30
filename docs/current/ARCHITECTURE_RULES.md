# EcomPilot Architecture Rules

These rules apply to EcomPilot V1-Core. They override older historical specs when there is a conflict.

## Version Boundary

V1-Core is a Windows local-first tool for product evaluation, copywriting generation and manual editing, review-only inspiration inbox handling, material management, export, backup, AI base services, and local diagnostics.

Do not implement V1-Plus, V1.5, V2, or V3 features inside V1-Core threads unless a future approved thread explicitly changes scope.

## Page And Service Boundary

- Pages and client components handle display, form interaction, action calls, and success/error messages.
- Business logic belongs in `src/lib/services/` or `src/lib/modules/`.
- Database queries, filesystem access, AI calls, export generation, backup copying, and diagnostics collection must not be implemented directly inside `page.tsx`.
- Server actions should be thin wrappers that call services, catch known errors, revalidate paths when needed, and return user-safe messages.

## Documentation Reading Rules

- At task startup, read `AGENTS.md`, `agent-memory/CURRENT_STATUS.md`, `agent-memory/SESSION_LOG.md`, then `docs/current/DOC_INDEX.md`.
- Do not read all `docs/current/` documents by default.
- Use `DOC_INDEX.md` to choose the smallest relevant document set.

## Module README Rules

- Large modules should have code-adjacent README files.
- Put module README files under paths such as `src/lib/services/**/README.md` or `src/lib/modules/**/README.md`.
- Do not copy module README content into `AGENTS.md` or `agent-memory/`.
- Read a module README only when working on that module.

## Runtime Boundary

- Windows local runtime is the writable source of truth.
- Vercel is preview-only and read-only.
- Vercel must not write SQLite, `uploads/`, `exports/`, `backups/`, or `logs/`.
- Vercel must not perform high-cost AI calls.
- Preview write attempts must return a friendly note: `预览环境只读，请在 Windows 本地验收。`
- Runtime checks must reuse `src/lib/services/runtime/`.

## Filesystem Rules

- Local runtime folders are `uploads/`, `exports/`, `backups/`, and `logs/`.
- Folder creation and checks should go through `src/lib/services/local-paths/`.
- Image upload, validation, hash, and thumbnail generation should go through `src/lib/services/images/`.
- Frontend output must not show full absolute local paths or full SQLite database paths.
- Diagnostic and export outputs must use safe relative labels or sanitized filenames.
- Do not delete source code, project data, configuration, documentation, or user assets as part of safe cleanup.

## Secret And Error Safety

- Never expose API keys, `.env` values, local full paths, SQLite paths, full stack traces, raw AI prompts, or sensitive cost data to frontend output, logs, exports, backups, or diagnostics packages.
- User-facing errors should be friendly summaries.
- Application logs must use `src/lib/services/logging/` and must sanitize API keys, full paths, database paths, full prompts, and stack frames.
- Vercel logging must be console-only fallback and must not write local log files.

## AI Rules

- AI calls must stay inside `src/lib/services/ai/` or the compatibility facade `src/lib/services/ai-client.ts`.
- API keys are server-side only.
- Model names belong in the AI provider settings or model registry, not page components.
- AI outputs must be schema-validated before writing formal business records.
- Prompt and error summaries must be sanitized before logging or diagnostics display.
- AI failures must not block non-AI capabilities such as saving products, scoring, material upload, export, backup, or diagnostics.
- Manual fallback remains a first-class behavior.
- AIJob and AIRequestLog are allowed in V1-Core-03 only as lightweight status/log tables. Do not turn them into a background queue, agent system, automatic routing layer, or cost report.
- Copywriting history must be preserved across different AI jobs. Do not globally overwrite historical rows by `productId + platform + version`.
- Multi-platform copywriting in V1-Core may add usage markers, but only one used row per `productId + platform` may be active at a time.
- V1-Core-06 inspiration AI is limited to optional single-image lightweight suggestion with schema validation; it must not become OCR, link parsing, agent routing, bulk automation, or automatic fact creation.

## Inspiration Inbox Rules

- V1-Core-06 allows only local folder setting, manual scan, fileHash dedupe, review-only inspiration drafts, optional lightweight AI suggestion, ignore, confirm-then-convert, and diagnostics summary.
- Manual scan must stay foreground and user-triggered. Do not add scheduled scan, background scan, or worker queues.
- Scanned images must be copied into managed `uploads/inspirations/` paths with short filenames; do not rely on the source folder forever.
- Frontend and diagnostics must not show the real configured folder path.
- AI suggestions must be labeled as reference-only and must not auto-create products or auto-write factual fields.

## Database Rules

- Database changes require a new Prisma migration.
- Do not modify old migration folders.
- Do not reset the database unless the user explicitly confirms the reset is for a test environment.
- Before schema changes, read `prisma/schema.prisma`, latest migrations, and affected services.
- SQLite WAL and `busy_timeout` may be attempted through Prisma raw PRAGMA during local diagnostics/startup-adjacent checks; this is runtime stability work, not schema migration work.

## Database Migration Safety

- If Prisma schema or migration work is involved, do not modify old migrations.
- Do not reset a real database.
- Before running a migration, strongly consider backing up the local SQLite database.
- Run migration preparation in this order:
  - `prisma validate`
  - `prisma generate`
  - `prisma migrate dev`
- After a migration completes, update `docs/current/DATABASE_CHANGELOG.md`.
- If a migration fails, stop and report the failure cause plus safe repair suggestions. Do not force the issue with a reset.
- If old data is incomplete, use `nullable`, `legacy`, `unknown`, or an explicit data-repair script. Do not fabricate missing historical values.

## Cache Invalidation Policy

- Any Server Action or server-side write must document its cache invalidation strategy.
- Copywriting writes must at least consider:
  - `/copywriting`
  - `/products/[id]`
  - `/system/diagnostics` when related summaries or counts change
- Product writes must at least consider:
  - `/products`
  - `/products/[id]`
  - homepage or dashboard paths when their statistics change
- Material writes must at least consider:
  - `/materials`
  - `/products/[id]`
  - `/system/diagnostics` when related summaries or counts change
- Inspiration writes must at least consider:
  - `/inspirations`
  - `/products`
  - `/products/[id]` when a conversion creates a product
  - `/system/diagnostics` when related summaries or counts change
- If `revalidatePath` or `revalidateTag` is used, mention that explicitly in the delivery summary.
- If no cache invalidation is added yet, explain why and what stale-data risk remains.

## Historical Patch Rules

- Historical bugs must be fixed on the current latest mainline instead of by returning to an old version branch or recreating an old release state.
- Patch Threads only solve the approved problem and must not expand scope into new features.
- Do not modify old migrations.
- Do not reset real data to repair a historical bug.
- Do not use a bug-fix thread as a reason to refactor unrelated modules.
- If historical data may already be wrong, explicitly decide whether the patch needs:
  - a data repair script
  - a `legacy` or `uncertain` marker on old data
  - manual review or confirmation
- Do not fabricate missing historical AI-generated data. For example, if an older `AIRequestLog` row has no `estimatedCost`, keep it `null` or label it legacy instead of guessing a number.
- Patch work resolves the approved defect only and must not expand requirements.

## Data Repair Script Policy

- If a Patch or historical fix needs a data-repair script, the script must:
  - support a dry-run mode
  - report how many records would be affected
  - avoid automatic deletion of data
  - be safe to run more than once without repeated damage
  - require a backup before execution
  - print a repair summary after execution
- After running or shipping a data-repair script, update `docs/current/PATCH_LOG.md`.
- If the repair also depends on database structure changes, update `docs/current/DATABASE_CHANGELOG.md`.

## Dependency Policy

- Unless the current thread explicitly requires it, do not upgrade core dependencies such as Next.js, React, Prisma, Tailwind, TypeScript, the main AI SDK, or the primary image-processing library.
- Before adding any new dependency, document:
  - why it is needed
  - whether an existing dependency can be reused instead
  - whether it affects Windows local runtime
  - whether it affects Vercel build behavior
  - whether it changes `package-lock.json`
  - how it will be verified

## Secret Incident Policy

- If an API key, token, recovery code, database path, full local path, or other sensitive value is found in frontend output, logs, docs, diagnostics packages, or exports, stop the current development task immediately.
- Record the risk in the relevant docs and remove the sensitive value from code paths, logs, or output artifacts.
- Tell the user to rotate or revoke the exposed credential or secret at the source platform.
- Do not treat file deletion alone as a complete response to secret exposure.
- Add or strengthen sanitization tests or checks after the incident is addressed.

## V1-Core Freeze / Release Policy

- After V1-Core-07 final acceptance passes, mark `agent-memory/CURRENT_STATUS.md` as `V1-Core completed`.
- Create a git tag when practical, or at minimum record the final commit used as the V1-Core completion point.
- New feature work after that point belongs in `V1-Plus`.
- V1-Core no longer accepts net-new features after freeze; only Patch work remains allowed.
- Unfinished enhancements must move into `KNOWN_ISSUES.md` or later-version planning instead of being forced back into V1-Core.

## Git And Deployment Cadence

- Keep continuity files current after each meaningful task, but do not push every small local change by default.
- Prefer local commits during small tasks, acceptance-only notes, and UI micro-patches.
- Push to GitHub when a milestone is complete, when Vercel needs a deployment refresh, when cleaning repository history, or when the user explicitly asks.
- When published history must be rewritten, record the pre-rewrite commit SHA, confirm the tree is clean, state the risk, and use `--force-with-lease`.

## V1-Core-07 Acceptance Boundary

- V1-Core-07 is a closeout thread, not a feature thread.
- It may add or update acceptance scripts, README/current docs, and memory files.
- It may fix only regressions that block V1-Core acceptance.
- It must not add V1-Plus, V1.5, V2, or V3 product functionality.
- It must verify that Vercel remains read-only for SQLite, uploads, exports, backups, logs, AI calls, inspiration scans, and conversion writes.

## V1-Core Forbidden Implementation List

Do not implement these features in V1-Core unless a future approved thread explicitly changes scope:

- login/register
- cloud accounts
- payments
- platform crawlers
- automatic product collection/listing/messaging/commenting
- OCR
- link parsing
- API image generation
- Electron
- notification center
- search center
- scheduled tasks
- multi-agent systems
- AIJob behavior beyond the approved V1-Core-03 lightweight status layer
- AIRequestLog cost statistics beyond per-request rough estimates and diagnostic totals
- multi-platform copywriting expansion outside the current copywriting scope
- advanced AI image recognition beyond the approved V1-Core-06 lightweight suggestion
- scheduled or background inspiration folder scanning beyond the approved V1-Core-06 manual scan
- image compression
- file cleanup workflows

## Image Upload Rules

- V1-Core supports `jpg`, `jpeg`, `png`, and `webp` uploads.
- Default maximum single-image size is 10MB.
- Uploads must use short generated filenames and store relative paths only.
- Material uploads should record `fileHash`, `mimeType`, size, width/height, `thumbnailPath`, `sourceType`, and `usagePermission` when available.
- Thumbnail generation may fail without failing the original upload, but the warning must be logged and display should fall back to the original image.
- Vercel preview must not perform real image writes.
- Do not add AI image generation, OCR, auto-cropping, similarity search, historical compression, or cleanup behavior inside V1-Core-04.

## Diagnostics Rules

- Diagnostics must not mutate business data, user assets, exports, backups, settings, or schema.
- Diagnostics may create missing local runtime folders and test directory writability with non-persistent temporary probes only in local writable runtime.
- Diagnostics must not write logs or diagnostic packages to disk in Vercel.
- Diagnostics may write one controlled local test error through the logging service for acceptance, but it must be sanitized and blocked on Vercel.
- The diagnostics summary must be sanitized markdown or JSON and must not include secrets, full paths, full prompts, full stacks, or sensitive cost data.
