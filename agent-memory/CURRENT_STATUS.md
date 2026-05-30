# Current Status

## Current Progress

- Current stage: V1-Plus after V1-Core completion.
- Current task: EcomPilot V1-Plus Thread 03 homepage todo and processing queue final acceptance is complete locally after splitting AI failures into separate task-failure and request-failure todo cards.
- Working scope: homepage information organization only. The todo area is reminder-only and does not execute work.

## Current Product Direction

- Keep EcomPilot local-first: Windows local runtime, SQLite, and local `uploads/`, `exports/`, `backups/`, and `logs/`.
- Treat Vercel as read-only preview only: write attempts must return `预览环境只读，请在 Windows 本地验收。`.
- V1-Plus Thread 03 uses existing product, inspiration, material, copywriting, AI log, backup, runtime, and diagnostics foundations instead of creating a task system.

## Latest Completed Work

- Added `src/lib/services/dashboardTodoService.ts` with unified todo item types and lightweight read-only counts.
- Updated `/` to show actionable todo rows with counts, descriptions, source labels, and filtered jump links.
- Todo sources include pending inspirations, missing competitors, missing costs, low-score unhandled products, missing copywriting, missing materials, separate recent AI task failures, separate recent AI request failures, stale backup reminders, and a diagnostics-only cleanup entry.
- Trimmed older homepage product stats so old inline todo counts are not computed twice.
- Updated `docs/current/PROJECT_MAP.md` and `docs/current/CHANGELOG_DEV.md` for Thread 03.

## Current Blockers Or Risks

- Local verification after the AI failure split passed: `npm.cmd run lint`, `npm.cmd run build`, `npx.cmd prisma validate`, `npx.cmd tsc --noEmit`, `npm.cmd run encoding:check`, `git diff --check`, service-level count checks, Vercel-runtime simulation, and local browser checks for homepage plus filtered jumps.
- `npm run typecheck` and `npm test` remain not applicable because those scripts do not exist.
- Pushed Thread 03 commits through `0bfc8c3` and verified Vercel preview at `https://ecompilot-mvp.vercel.app/`.
- Vercel preview now shows the new todo section, empty actionable state, diagnostics-only cleanup entry, no duplicate local SQLite notice, and no frontend API-key/path leakage detected in the checked pages.
- File cleanup remains an entry only; no real scan, cleanup, or deletion is implemented.
- No database schema, migration, dependency, AI automation, background task, Electron, crawler, OCR, upload automation, or agent feature was added.

## Current Documentation Entry Points

- Startup files: `AGENTS.md`, `agent-memory/CURRENT_STATUS.md`, `agent-memory/SESSION_LOG.md`.
- Then read `docs/current/DOC_INDEX.md`.
- For follow-up homepage todo work, read `PROJECT_MAP.md`, `ARCHITECTURE_RULES.md`, `THREAD_SCOPE_CHECKLIST.md`, `RISK_REGISTER.md`, `CHANGELOG_DEV.md`, and `src/lib/services/dashboardTodoService.ts`.

## Next Recommended Step

- Commit and push the AI failure split, refresh Vercel preview, then record the final deployment verification.
