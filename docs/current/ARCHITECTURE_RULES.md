# EcomPilot Architecture Rules

These are stable rules for the current mainline. Historical specs are secondary when they conflict with this file, `AGENTS.md`, `CURRENT_STATUS.md`, or the current user-approved scope.

## Version Boundary

- Current line: V1.5 after V1-Plus completion and baseline freeze.
- New behavior requires an explicitly approved thread.
- Historical issues are fixed on the latest mainline through Patch Threads, not by editing old versions or old migrations.
- Docs-only threads must not change business code, UI behavior, schema, migrations, dependencies, AI behavior, or runtime write behavior.

## Local And Vercel Boundary

- Windows local runtime is the writable source of truth.
- Vercel is preview-only and read-only.
- Vercel must not write SQLite data, uploads, exports, backups, logs, or perform high-cost AI calls.
- Preview write attempts should return `预览环境只读，请在 Windows 本地验收。`

## Service Boundary

- Business logic belongs in services/modules.
- Pages and client components handle display, form interaction, action calls, and user-safe messages.
- Server actions should be thin wrappers around services, known-error handling, and cache invalidation.
- Database queries, filesystem access, AI calls, export/backup copying, and diagnostics collection must not be implemented directly in pages.

## Data And Migration Safety

- Add new migrations only; never edit old migration folders.
- Do not reset a real database.
- Evaluate backup needs before schema changes, migrations, batch writes, filesystem writes, or data repair.
- Historical incomplete data should use nullable, legacy, unknown, repair script, or manual review strategies rather than fabricated values.

## Filesystem Safety

- Known local runtime folders are `uploads/`, `exports/`, `backups/`, `logs/`, and application-managed `trash/`.
- Folder checks, safe display labels, filename safety, and path safety should reuse local-path services.
- Frontend, diagnostics, logs, exports, backups, and docs must not expose full local paths, database paths, API keys, `.env` values, raw prompts, full stacks, or sensitive cost data.
- File cleanup may permanently delete only files already moved into application-managed `trash/`; it must not call the Windows system recycle bin or delete active product/material/inspiration files directly.
- File cleanup and app trash are V1-Plus Thread 06 baseline capabilities. V1.5 must not create timed/background cleanup, AI-driven auto-delete, auto-compression, cloud sync, Windows recycle-bin integration, database-record deletion, or a second cleanup system.

## AI Safety

- AI calls must stay inside the AI service layer or approved compatibility facade.
- API keys are server-side only.
- AI outputs must be schema-validated before writing formal business records.
- Prompt/error summaries must be sanitized before logging or diagnostics display.
- AI failures must not block non-AI product, scoring, material, export, backup, diagnostics, or manual-edit workflows.
- AIJob and AIRequestLog are lightweight status/log records, not a background queue or agent system.

## Cache And Side Effects

- Every server-side write must have a cache invalidation strategy or an explicit stale-data risk note.
- Writes should revalidate the affected list/detail/diagnostics/dashboard paths as appropriate.
- Diagnostics must not mutate business data, assets, exports, backups, settings, or schema.

## Dependency Policy

Do not upgrade core dependencies or add new dependencies unless the current thread explicitly requires it and documents Windows local impact, Vercel impact, lockfile impact, and verification.

## Forbidden Future Scope Without Approval

Do not implement login/register, cloud accounts, payments, crawlers, OCR, link parsing, API image generation, Electron, notification center, scheduled jobs, background queues, multi-agent systems, automated publishing, inventory, supplier management, restore workflow, image cleanup workflow, or other V1.5/V2 behavior unless the user explicitly opens that thread.
