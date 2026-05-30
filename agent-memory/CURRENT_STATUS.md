# Current Status

## Current Progress

- Current stage: V1-Core completed and feature-frozen after V1-Core-07 closeout.
- Current task: GitHub history cleanup and push-cadence change completed on 2026-05-30.
- V1-Core-07 final integration acceptance passed locally on 2026-05-30 and was re-verified on 2026-05-30.
- Pre-cleanup Git rollback reference: `c4d4652a9472903f75b7acea157883cf125937fb`.
- GitHub `origin/main` was rewritten to a clean EcomPilot V1-Core root baseline; obsolete remote branch `codex/04` was deleted.
- Vercel remains preview-only/read-only; live preview checked at `https://ecompilot-mvp.vercel.app`.

## Current Product Direction

- Keep EcomPilot local-first: Windows local runtime, SQLite, and local `uploads/`, `exports/`, `backups/`, and `logs/`.
- Treat Vercel as read-only preview only.
- After the V1-Core-07 closeout commit, net-new features should move to V1-Plus or later. V1-Core should only receive tightly scoped Patch work.
- Keep business logic in `src/lib/services/` or `src/lib/modules/`, not page components.
- Push to GitHub at milestones, deployment refreshes, history cleanup tasks, or explicit user requests instead of after every small task.

## Latest Completed Work

- Updated repository workflow docs to reduce GitHub push frequency.
- Added safety guidance for published-history rewrites and documented the pre-cleanup rollback commit.
- Force-pushed the clean root baseline to `origin/main` with `--force-with-lease`.
- Deleted obsolete GitHub branch `codex/04`; local `codex/*` branches remain untouched.
- Reworked `/system/diagnostics` into an "overview + sanitized summary first" layout so copy/export is visible without long scrolling.
- Moved low-frequency diagnostics into folded detail sections while preserving existing diagnostic data.
- Downgraded the controlled test-error action to a secondary diagnostics action and shortened the summary textarea with internal scrolling.

## Current Blockers Or Risks

- No V1-Core acceptance blocker remains.
- Published GitHub history was intentionally rewritten; the rollback reference above is retained in memory.
- Local `codex/*` branches still retain older history locally and should only be deleted after explicit user confirmation.
- Diagnostics page logic, sanitization, database schema, Prisma migrations, runtime service, and Vercel read-only rules are unchanged by this workflow/history task.
- External daily AI success still depends on the user configuring a real reachable AI provider.
- Backup restore is still future work; create a local backup before V1-Plus or any schema/bulk-write thread.
- Historical Vercel recovery-code exposure remains an account-side rotation/revocation risk.

## Current Documentation Entry Points

- Startup files: `AGENTS.md`, `agent-memory/CURRENT_STATUS.md`, `agent-memory/SESSION_LOG.md`.
- Then read `docs/current/DOC_INDEX.md`.
- For V1-Core handoff or next-version planning, read `docs/current/V1_CORE_UNDERSTANDING_CHECK.md`, `PROJECT_MAP.md`, `ARCHITECTURE_RULES.md`, `RISK_REGISTER.md`, and `KNOWN_ISSUES.md`.

## Next Recommended Step

- After cleanup, start a separate V1-Plus planning thread only after creating or confirming a fresh local backup.
