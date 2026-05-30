# EcomPilot Patch Log

Use this file for future historical bug fixes and regressions. V1-Core-01 only creates the template.

## Severity Rules

- `P0`: Causes data loss, API key leakage, wrong file deletion, database startup failure, backup/restore danger, or Vercel writing real data. Stop current development and fix immediately.
- `P1`: Breaks a core flow such as product save, scoring, copywriting save, image upload, export, or backup. Open a high-priority Patch Thread.
- `P2`: Meaningful impact with a workaround. Schedule it into the current version's Patch Thread.
- `P3`: Minor UX, display, or non-core error. Track it in `KNOWN_ISSUES.md` and handle near version closeout.
- `P4`: Not a bug. Treat it as a later enhancement request instead of a Patch Thread.

## Data Repair Script Policy

- If a Patch needs a data-repair script, the script must:
  - support dry-run
  - report how many records would be affected
  - avoid automatic data deletion
  - be safe to run more than once without repeated damage
  - require a backup before execution
  - print a repair summary after execution
- When a Patch includes a data-repair script, update this file with the repair strategy and result.
- If the Patch also changes database structure, update `docs/current/DATABASE_CHANGELOG.md`.

### 2026-05-30 - AI Provider Default Selection

- Severity: P2 for copywriting AI workflow friction.
- User impact: The AI settings default switch could appear unclear after saving, and `/copywriting` stayed on `请选择 Provider` when no Provider was persisted as the enabled default.
- Root cause: The settings save action did not return the saved Provider state to the client, and the copywriting Provider select did not guard against blank or stale local Provider state with a default fallback.
- Files changed: `src/app/settings/actions.ts`, `src/components/settings/ai-settings-manager.tsx`, `src/components/copywriting/copywriting-manager.tsx`.
- Database impact: No schema change or migration. Saving a Provider as default updates `AIProvider.isDefault` through the existing service path and clears other defaults.
- Filesystem impact: None.
- Vercel impact: Read-only behavior is unchanged; Provider writes remain blocked outside local writable runtime.
- Verification: `npm.cmd run encoding:check`, `npx.cmd tsc --noEmit`, `npm.cmd run lint`, `npm.cmd run build`, local browser save/disable/re-enable checks for `/settings/ai`, local browser check for `/copywriting` auto-selecting `deepseek（默认）`, and Prisma data checks confirming exactly one enabled default Provider with API key presence preserved.
- Rollback notes: Revert the three source files if the older manual Provider selection behavior is needed again.
- Follow-up: None expected after verification.

### 2026-05-30 - Diagnostics Compact Layout

- Severity: P3 for diagnostics usability.
- User impact: The sanitized diagnostic summary and copy/export actions were buried below long diagnostic cards, forcing unnecessary scrolling before sharing a support summary.
- Root cause: V1-Core diagnostics kept every detail expanded by default as the feature grew across runtime, AI, image, and inspiration threads.
- Files changed: `src/app/system/diagnostics/page.tsx`, `src/components/diagnostics/diagnostics-summary-actions.tsx`.
- Database impact: None.
- Filesystem impact: None. The existing controlled local test-error action still uses the pre-existing server action.
- Vercel impact: Read-only behavior is unchanged; preview shows readonly messaging and blocks server-side test writes.
- Verification: `npm.cmd run encoding:check`, `npx.cmd tsc --noEmit`, `npm.cmd run lint`, `npm.cmd run build`, local browser checks for first-screen summary, copy/export, controlled test write, summary sanitization, mobile button layout, and Vercel readonly preview behavior.
- Rollback notes: Revert the two UI files if the older fully expanded diagnostics layout is needed again.
- Follow-up: None for this patch.

### 2026-05-29 - Clean Product Detail Mojibake Aliases

- Severity: Medium for maintainability and future edits.
- User impact: Some project files appeared to contain mojibake; one product detail tab alias map actually did contain mojibake strings.
- Root cause: Older Chinese labels had likely been decoded through the wrong Windows code page and then saved back into source.
- Files changed: `src/app/products/[id]/page.tsx`, `scripts/check-encoding.mjs`, `package.json`.
- Database impact: None.
- Filesystem impact: None beyond adding the encoding check script.
- Vercel impact: Source-only cleanup; Vercel remains preview-only and read-only.
- Verification: `npm.cmd run encoding:check`, `git diff --check`, `npm.cmd run lint`, `npm.cmd run build`.
- Rollback notes: Reverting would restore visible mojibake in the source alias table and remove the guard command.
- Follow-up: Run `npm.cmd run encoding:check` before final verification whenever Chinese text or docs are edited.

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
