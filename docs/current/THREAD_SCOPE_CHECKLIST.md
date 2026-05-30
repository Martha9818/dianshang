# Thread Scope Checklist

Use this as a short boundary/status record for development threads. Do not paste full instructions or long plans here.

## Thread

- Name:
- Date:
- Type: feature / Patch / docs-only / acceptance / other
- Approved version scope:
- Existing working-tree changes belong to:

## Safety

- `git status --short` checked before work: yes/no
- Touches schema, migration, filesystem writes, batch writes, AI batch generation, or destructive operations: yes/no
- Backup need evaluated when risky writes are involved: yes/no/not applicable
- Database reset planned: no unless explicitly approved test-only
- Vercel remains read-only: yes/no

## Scope

- Goal:
- Non-goals:
- Allowed files/systems:
- Forbidden files/systems:
- Module README needed: yes/no

## Patch Fields

- Patch Thread: yes/no
- Origin version:
- Discovered in:
- Severity: P0 / P1 / P2 / P3 / P4
- Historical data affected: yes/no
- Migration required: yes/no
- Data repair required: yes/no

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

- Commands:
- Browser/routes:
- Data setup:
- Cleanup:
- Commit/push/deploy status:
