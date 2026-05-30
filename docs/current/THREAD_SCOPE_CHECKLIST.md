# Thread Scope Checklist

Use this as a short boundary/status record for development threads. Do not paste full instructions or long plans here.

## Thread

- Name: V1-Plus Thread 06 - File Cleanup And Trash
- Date: 2026-05-30
- Type: feature
- Approved version scope: V1-Plus Thread 06 only
- Existing working-tree changes belong to: this thread

## Safety

- `git status --short` checked before work: yes
- Touches schema, migration, filesystem writes, batch writes, AI batch generation, or destructive operations: yes - additive `CleanupLog`, manual local scan/move/delete in app trash only
- Backup need evaluated when risky writes are involved: yes - local SQLite backup created before migration
- Database reset planned: no
- Vercel remains read-only: yes

## Scope

- Goal: manual local file scan, cleanup suggestions, app-managed trash, confirmed permanent delete for trash files only, and `CleanupLog`
- Non-goals: background cleanup, scheduled cleanup, AI image quality judgment, OCR, compression, cloud sync, Windows recycle bin integration, restore workflow, database-record deletion, crawlers, publishing, Electron, multi-agent systems, or V1.5/V2 behavior
- Allowed files/systems: file maintenance service, thin server actions, maintenance page/component, local-path/runtime/logging/notification reuse, additive migration, current docs/memory
- Forbidden files/systems: direct fs work in page components, action-level path joins, new path/runtime systems, Vercel real scans/writes/deletes, permanent delete outside app trash, active file auto-delete, old migrations, dependency changes
- Module README needed: yes - cleanup service README added

## Patch Fields

- Patch Thread: no
- Origin version: V1-Plus
- Discovered in: user-approved Thread 06 scope
- Severity: P3
- Historical data affected: no
- Migration required: yes - additive `CleanupLog`
- Data repair required: no

## Boundary Check

- Business logic stays in services/modules.
- Pages/components only display, interact, and call actions.
- No full local paths, database paths, API keys, `.env` values, full stacks, or raw prompts exposed.
- No unrelated refactor or future-version feature added.
- Old migrations untouched and no database reset used.
- Cache invalidation strategy recorded for writes.
- Core dependencies unchanged unless approved.
- `CURRENT_STATUS.md` and `SESSION_LOG.md` remain short.
- Move-to-trash and permanent-delete require confirm text plus browser confirmation.
- Permanent delete only accepts files under application `trash/`.
- Active product main images, active material files, active competitor screenshots, and active inspiration images are not directly movable or permanently deletable.
- Cleanup notifications and logs use relative paths only.

## Verification

- Commands: `npm run lint`, `npm run build`, `npx prisma validate`, `npm run encoding:check`, `npx tsc --noEmit`, `npx tsx scripts/thread06-file-cleanup-acceptance.mts`, `npx tsx scripts/thread06-preview-guard.mts`
- Browser/routes: `/maintenance/files` local smoke checked manual scan and no console errors; preview-mode smoke checked read-only message and disabled scan/move/delete controls
- Data setup: temporary Thread 06 files/products created and cleaned by acceptance script
- Cleanup: temporary acceptance files and records removed by script
- Commit/push/deploy status: local commit pending; no push or Vercel refresh requested
