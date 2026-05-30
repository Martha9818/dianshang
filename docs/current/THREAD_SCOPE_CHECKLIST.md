# Thread Scope Checklist

Use this as a short boundary/status record for development threads. Do not paste full instructions or long plans here.

## Thread

- Name: V1-Plus Thread 07 - Final Integration Acceptance And README Closeout
- Date: 2026-05-30
- Type: closeout / regression / docs
- Approved version scope: V1-Plus Thread 07 only
- Existing working-tree changes belong to: this thread

## Safety

- `git status --short` checked before work: yes
- Touches schema, migration, new dependencies, new business feature, or destructive production operation: no
- Touches local filesystem behavior: only startup/runtime path-service alignment and acceptance scripts
- Backup need evaluated when risky writes are involved: no schema/data-repair change; acceptance scripts create normal export/backup artifacts
- Database reset planned: no
- Vercel remains read-only: yes

## Scope

- Goal: final regression, bug/script fixes, path-service consolidation, README V1-Plus update, acceptance checklist, and scope closeout.
- Non-goals: new business features, OCR, screenshot recognition, link parsing, API image generation, crawlers, publishing, Electron, Windows notifications, tray, auto-update, restore, SKU, supplier, inventory, PDF reports, or multi-agent behavior.
- Allowed files/systems: README, current docs/memory, acceptance scripts, local-path/runtime reuse, export/backup/upload path handling, startup script wording/directory checks.
- Forbidden files/systems: schema changes, dependency changes, old migration edits, new runtime foundation, direct fs work in page components, Vercel writes, active file auto-delete, future-version features.
- Module README needed: no new module; root README updated.

## Patch Fields

- Patch Thread: no
- Origin version: V1-Plus
- Discovered in: user-approved Thread 07 closeout scope
- Severity: P3
- Historical data affected: no
- Migration required: no
- Data repair required: no

## Boundary Check

- Business logic stays in services/modules.
- Pages/components only display, interact, and call actions.
- Upload, export, backup, logs, and trash path roots reuse local-path services.
- Vercel read-only checks stay centralized through runtime/product-runtime guards.
- Logs, notifications, operation logs, diagnostics, exports, and CleanupLog do not expose API keys or full local paths in user-facing surfaces.
- No page or client component directly executes fs operations.
- No unrelated refactor or future-version feature added.
- Old migrations untouched and no database reset used.
- Core dependencies unchanged.
- `CURRENT_STATUS.md` and `SESSION_LOG.md` remain short.

## Verification

- Commands: `npm run lint`, `npm run build`, `npx prisma validate`, `npm run typecheck`, `npm run encoding:check`, `npx prisma migrate status`.
- Acceptance scripts: `scripts/thread07-final-acceptance.mts`, `scripts/thread08-final-acceptance.mts`, `scripts/v1-core-07-acceptance.mts`, `scripts/thread04-acceptance.mts`, `scripts/thread04-preview-verify.mts`, `scripts/thread05-batch-acceptance.mts`, `scripts/thread05-preview-guard.mts`, `scripts/thread06-file-cleanup-acceptance.mts`, `scripts/thread06-preview-guard.mts`.
- Security scans: recent `CleanupLog`, `AppNotification`, and `OperationLog` records checked for API-key/full-path leakage; no runtime bad records found.
- Data setup: acceptance scripts create temporary local records/files and clean test products/files where scripted; export/backup history artifacts may remain as normal acceptance evidence.
- Commit/push/deploy status: local commit pending; no push or Vercel live refresh requested.
