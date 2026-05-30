# Thread Scope Checklist

Use this as a short boundary/status record for development threads. Do not paste full instructions or long plans here.

## Thread

- Name: V1-Plus Thread 05 - Batch Operation Safety
- Date: 2026-05-30
- Type: feature
- Approved version scope: V1-Plus Thread 05 only
- Existing working-tree changes belong to: this thread

## Safety

- `git status --short` checked before work: yes
- Touches schema, migration, filesystem writes, batch writes, AI batch generation, or destructive operations: yes - selected-record batch database writes only
- Backup need evaluated when risky writes are involved: yes - no schema/migration/filesystem writes; batch writes use temporary acceptance records and existing services
- Database reset planned: no unless explicitly approved test-only
- Vercel remains read-only: yes

## Scope

- Goal: limited, safe, confirmable, auditable batch operations for product, inspiration, material, and notification lists
- Non-goals: batch AI, batch automation, permanent file deletion, batch product conversion, external API calls, crawlers, OCR, Electron, background queues, inventory, supplier, or V1.5/V2 behavior
- Allowed files/systems: batch rules/service, thin server actions, minimal list UI selection/confirmation/result display, existing business services, existing OperationLog/runtime guards, current docs/memory
- Forbidden files/systems: schema/migrations/dependencies, direct dangerous bulk database writes outside services, new path/runtime/log systems, permanent uploads cleanup, AI/API image generation, old migrations
- Module README needed: no - small batch module plus service and scripts

## Patch Fields

- Patch Thread: no
- Origin version: V1-Plus
- Discovered in: user-approved Thread 05 scope
- Severity: P3
- Historical data affected: no
- Migration required: no
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
- Dangerous batch operations require confirm text and show selected count/impact.
- Batch execution is selected-record and per-item; independent failures produce summarized errors.
- Batch convert-to-product, batch AI, batch API image generation, and permanent file deletion remain unavailable.

## Verification

- Commands: `npm run lint`, `npm run build`, `npx prisma validate`, `npm run encoding:check`, `npx tsx scripts/thread05-batch-acceptance.mts`, Vercel-mode `scripts/thread05-preview-guard.mts`
- Browser/routes: `/products`, `/materials`, `/inspirations`, and `/notifications` local browser smoke checked for batch toolbar and selected-record checkboxes
- Data setup: temporary acceptance products/materials/inspirations/notifications created and cleaned by script
- Cleanup: temporary Thread 05 records and product-delete notifications removed after acceptance
- Commit/push/deploy status: local commit pending; no push or Vercel refresh yet
