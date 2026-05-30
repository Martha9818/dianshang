# Current Status

## Current Progress

- Current stage: V1-Plus has started after V1-Core completion.
- Current task: EcomPilot V1-Plus Thread 01 global search and filter enhancement is implemented, committed, pushed, and refreshed on Vercel.
- The prior AI Provider default-selection patch was preserved separately as local commit `788bc4c` before the V1-Plus Thread 01 commit.
- Deployment refresh requested on 2026-05-30 pushed the Thread 01 feature commit `8984a19335c0e9ac382d8f224756066edf75b36c`; follow-up continuity-only commits may sit after it on `origin/main`.

## Current Product Direction

- Keep EcomPilot local-first: Windows local runtime, SQLite, and local `uploads/`, `exports/`, `backups/`, and `logs/`.
- Treat Vercel as read-only preview only: search/filter reads may render, but writes must remain blocked with `预览环境只读，请在 Windows 本地验收。`.
- Keep query and business logic in services/modules, not page components.
- V1-Plus Thread 01 is limited to search, filtering, sorting, and list-query experience; no collection, recognition, generation, automation, AI search, semantic search, or external search agent work belongs here.

## Latest Completed Work

- Added shared query normalization in `src/lib/services/query-service.ts`.
- Enhanced `/products`, `/materials`, `/copywriting`, `/prompt-tasks`, and `/inspirations` list filters through service-layer Prisma queries.
- Added product filters for keyword, status, recommendation, platform, score range, missing competitor, missing cost, material coverage, copywriting coverage, rescore, and created/updated sorting.
- Added material, copywriting, Prompt task, and inspiration filters for the approved Thread 01 dimensions, plus a database-only orphaned-material notice.
- Updated `docs/current/PROJECT_MAP.md` and `docs/current/CHANGELOG_DEV.md`.
- Refreshed Vercel preview at `https://ecompilot-mvp.vercel.app` from `origin/main`.

## Current Blockers Or Risks

- No Prisma schema, migration, dependency, AI prompt, AI call, filesystem write, cleanup, export, backup, or automation behavior changed.
- Product pool UI was simplified to a table-first list while preserving product detail/edit/delete entry points.
- Vercel preview remains read-only; write entry points should continue to show `预览环境只读，请在 Windows 本地验收。`.
- Browser verification confirmed refreshed search/filter controls on `/products`, `/materials`, `/copywriting`, and `/prompt-tasks`; `/inspirations` loads preview read-only messaging on Vercel but did not show the full filter panel during the deploy-refresh smoke check.

## Current Documentation Entry Points

- Startup files: `AGENTS.md`, `agent-memory/CURRENT_STATUS.md`, `agent-memory/SESSION_LOG.md`.
- Then read `docs/current/DOC_INDEX.md`.
- For V1-Plus search/filter work, read `PROJECT_MAP.md`, `ARCHITECTURE_RULES.md`, `THREAD_SCOPE_CHECKLIST.md`, `RISK_REGISTER.md`, and the affected service/page files.

## Next Recommended Step

- If continuing Thread 01 acceptance, re-check `/inspirations` preview behavior and decide whether the read-only fallback should still render the search/filter controls when the local SQLite data source is unavailable.
