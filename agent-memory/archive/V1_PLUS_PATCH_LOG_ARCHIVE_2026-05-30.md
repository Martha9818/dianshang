# V1-Plus Patch Log Archive

Moved from `docs/current/PATCH_LOG.md` during V1-Plus documentation closeout.

### 2026-05-29 - Mask Backup Absolute Paths

- Severity: High for privacy / local path exposure.
- User impact: Local `/backup` rendered the full Windows backup root path from `BackupLog` / backup summary data.
- Root cause: The backup page rendered real filesystem paths returned by `backup-log-service` instead of display-safe labels.
- Files changed: `src/lib/services/backup-log-service.ts`, `src/app/backup/page.tsx`, `src/lib/services/product-service.ts`.
- Database impact: None. Existing `BackupLog.backupPath` values are not mutated.
- Filesystem impact: None. Backup writes still use the real local path internally.
- Vercel impact: Preview remains read-only; historical Windows-style paths are also collapsed to safe `backups/<name>/` labels.
- Verification: `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run typecheck` attempted but script is missing, helper check, local HTTP checks for `/backup`, `/`, and `/system/diagnostics`.
- Rollback notes: Revert this patch if backup history needs raw path display again, but that would violate current frontend path-safety rules.
- Follow-up: Rerun V1-Core-02 acceptance and confirm `/backup` no longer exposes full local paths.

## Patch Template

### Patch Name

For example: `V2-Patch-01`: fix V1 inspiration-scan duplicate import behavior

### Discovered In

Which version discovered the problem.

### Origin Version

Which version likely introduced the problem.

### Severity

`P0 / P1 / P2 / P3 / P4`

### Module

Affected module or system.

### Root Cause

Why the problem happened.

### Data Impact

Whether historical data is affected.

### Fix Summary

What the patch changed.

### Migration

Whether a new migration was added.

### Data Repair

Whether a repair script, legacy marker, or manual review is required.

If a repair script is used, note its dry-run support, affected-row count, rerun safety, backup requirement, and repair summary behavior.

### Verification

How the patch was verified.

### Remaining Risk

Known follow-up risk, if any.
