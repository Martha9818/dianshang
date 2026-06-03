# EcomPilot Architecture Rules

These are the stable rules for the current active planning line. If older docs conflict with this file, `AGENTS.md`, `CURRENT_STATUS.md`, or the approved user thread, follow the newer and stricter rule.

## Version Boundary

- Current line: `V1.6 real-use validation`
- Current thread baseline: `V1.6-00 direction freeze and documentation baseline`
- V1.6 is a scope-freeze-first release line. It is not the place to land large new systems.
- New implementation behavior still requires an explicitly approved thread.

## V1.6 Direction Boundary

V1.6 may do:

- documentation sync
- product-direction freeze
- information-architecture cleanup
- flow-expression cleanup
- lightweight UX clarification
- safe read-only wording and acceptance updates

V1.6 must not do by default:

- competitor screenshot inbox implementation
- automatic content workflow implementation
- new crawler behavior
- browser automation
- automatic product creation
- automatic competitor writes
- automatic score overwrite
- default API image generation expansion

Notes:

- Existing V1.5 optional API image generation remains a legacy/manual capability.
- V1.6 does not expand it, make it default, or use it as the new mainline workflow.
- V1.7 is the first planning target for the competitor screenshot inbox.
- V1.8 is the first planning target for post-confirmation content automation.

## Local And Vercel Boundary

- Windows local runtime is the writable source of truth.
- Vercel is preview-only and read-only.
- Preview must not write SQLite data, uploads, exports, backups, logs, or trash.
- Preview must not run high-cost AI, API image generation, real file cleanup, or Electron POC execution.
- Preview write attempts should return `预览环境只读，请在 Windows 本地验收。`

## Service Boundary

- Business logic belongs in services or modules.
- Pages and client components handle display, form interaction, action calls, and safe user messages.
- Server actions stay thin: service calls, known-error handling, and cache invalidation only.
- Database queries, filesystem access, AI calls, export/backup copying, and diagnostics collection must not be implemented directly in page components.

## Data And Migration Safety

- Add new migrations only; never edit old migration folders.
- Do not reset a real database.
- Evaluate backup needs before schema changes, migrations, batch writes, filesystem writes, or data repair.
- V1.6-00 adds no schema, migration, or dependency changes.

## Filesystem Safety

- Known local runtime folders are `uploads/`, `exports/`, `backups/`, `logs/`, and application-managed `trash/`.
- Runtime folders, display labels, filename safety, and path safety must reuse the existing local-path services.
- Frontend, diagnostics, logs, exports, backups, and docs must not expose full local absolute paths, database paths, API keys, `.env` values, raw prompts, or full stack traces.
- Permanent delete may target only files already moved into application-managed `trash/`.
- File cleanup and app trash remain the single existing V1-Plus Thread 06 implementation.
- Product deletion remains a business delete by default; it must not implicitly become automatic file deletion.

## AI Safety

- AI calls must stay inside the AI service layer or approved compatibility facade.
- API keys are server-side only.
- AI outputs must be schema-validated before writing formal business records.
- Logs, notifications, diagnostics, and stored error summaries must be sanitized before display.
- AI failures must not block non-AI product, scoring, material, export, backup, diagnostics, or cleanup workflows.
- Draft triage and formal product scoring are separate systems and must not be conflated.

## Desktop Base Reuse

- Reuse the existing runtime, local-path, logging, diagnostics, image, export, backup, notification, and cleanup foundations.
- Electron remains POC-only under `experiments/electron-poc/`.
- Do not create an Electron-only second runtime foundation, second path service, or second environment-judgment system.

## Forbidden Future Scope Without Approval

Do not implement the following without an explicitly approved future thread:

- formal Windows desktop release
- restore workflow
- multi-SKU
- supplier management
- procurement batches
- inventory
- trial-sale review
- PDF reports
- formal agent mode or real multi-agent orchestration
- platform crawlers, automatic collection, automatic listing, automatic messaging, or automatic comments
