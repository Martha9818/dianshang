# Thread Scope Checklist

Use this as a short boundary/status record for development threads. Do not paste full instructions or long plans here.

## Thread

- Name: V1-Plus Thread 04 - In-App Notification Center
- Date: 2026-05-30
- Type: feature
- Approved version scope: V1-Plus Thread 04 only
- Existing working-tree changes belong to: this thread

## Safety

- `git status --short` checked before work: yes
- Touches schema, migration, filesystem writes, batch writes, AI batch generation, or destructive operations: yes - additive Prisma table and local migration only
- Backup need evaluated when risky writes are involved: yes - additive migration; local DB backup before applying migration
- Database reset planned: no unless explicitly approved test-only
- Vercel remains read-only: yes

## Scope

- Goal: lightweight app-internal notification center with unread/read, type filter, safe action links, and manual cleanup
- Non-goals: Windows notifications, Electron notifications, browser Push, WebSocket, background queues, scheduled jobs, or notification tray
- Allowed files/systems: Prisma additive model/migration, notification service/actions/page/components, selected module notification hooks, current docs/memory
- Forbidden files/systems: external push systems, OS integrations, crawler/OCR/agent behavior, dependency upgrades, old migrations
- Module README needed: yes

## Patch Fields

- Patch Thread: no
- Origin version: V1-Plus
- Discovered in: user-approved Thread 04 scope
- Severity: P3
- Historical data affected: no
- Migration required: yes
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

## Verification

- Commands: `npx prisma validate`, local DB backup, `npx prisma migrate dev`, `npm run lint`, `npm run build`, `npm run encoding:check`, `npx prisma migrate status`, Vercel-mode service guard checks
- Browser/routes: `/notifications` local browser flow checked for list, unread count, filter, mark read, mark all read, delete confirm, cleanup confirm, and action links
- Data setup: additive migration applied locally; acceptance notifications created through `notificationService`
- Cleanup: notification cleanup confirmed with zero old rows; sample acceptance notifications removed after browser checks
- Commit/push/deploy status: committed and pushed to GitHub; `main` and `origin/main` are aligned after Thread 04 closeout
