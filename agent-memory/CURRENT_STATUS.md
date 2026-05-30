# Current Status

## Current Progress

- Current stage: V1-Core completed and feature-frozen after V1-Core-07 closeout.
- Current task: V1-Core Patch for AI Provider default selection completed locally on 2026-05-30.
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

- Patched AI Provider settings so saving returns the saved Provider id, enabled/default state, and key-existence flag without exposing the API key.
- Improved the `是否默认` switch semantics and selected visual state.
- Patched `/copywriting` to automatically select the enabled default Provider when the local selection is blank or stale.
- Verified `deepseek` can be saved as the single enabled default Provider and `/copywriting` auto-selects `deepseek（默认）`.
- Updated patch and development documentation for the Provider default-selection fix.
- Reworked `/system/diagnostics` into an "overview + sanitized summary first" layout so copy/export is visible without long scrolling.

## Current Blockers Or Risks

- Provider default-selection patch is source/docs plus the intended local setting update for `deepseek`; no schema, migration, dependency, filesystem-write, or AI batch-generation change was made.
- External daily AI success still depends on the user configuring a real reachable AI provider.
- Published GitHub history was intentionally rewritten; the rollback reference above is retained in memory.
- Local `codex/*` branches still retain older history locally and should only be deleted after explicit user confirmation.
- Backup restore is still future work; create a local backup before V1-Plus or any schema/bulk-write thread.
- Historical Vercel recovery-code exposure remains an account-side rotation/revocation risk.

## Current Documentation Entry Points

- Startup files: `AGENTS.md`, `agent-memory/CURRENT_STATUS.md`, `agent-memory/SESSION_LOG.md`.
- Then read `docs/current/DOC_INDEX.md`.
- For V1-Core handoff or next-version planning, read `docs/current/V1_CORE_UNDERSTANDING_CHECK.md`, `PROJECT_MAP.md`, `ARCHITECTURE_RULES.md`, `RISK_REGISTER.md`, and `KNOWN_ISSUES.md`.

## Next Recommended Step

- Continue with normal local use; `/copywriting` should auto-select the saved default AI Provider. Push only if a deployment refresh is explicitly requested.
