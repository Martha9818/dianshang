# Current Status

## Current Progress

- Current stage: V1-Plus has started after V1-Core completion.
- Current task: EcomPilot V1-Plus Thread 01 global search and filter enhancement is implemented locally and in final closeout verification.
- Pre-thread dirty state was resolved by committing the prior AI Provider default-selection patch separately as `788bc4c`.
- Vercel remains preview-only/read-only; this thread did not request a push or deployment refresh.

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

## Current Blockers Or Risks

- No Prisma schema, migration, dependency, AI prompt, AI call, filesystem write, cleanup, export, backup, or automation behavior changed.
- Product pool UI was simplified to a table-first list while preserving product detail/edit/delete entry points.
- Vercel preview was not refreshed because no push was requested; local code keeps write controls disabled/read-only in preview paths.
- Browser plugin initialization timed out, so local page QA used the available Chrome DevTools browser channel.

## Current Documentation Entry Points

- Startup files: `AGENTS.md`, `agent-memory/CURRENT_STATUS.md`, `agent-memory/SESSION_LOG.md`.
- Then read `docs/current/DOC_INDEX.md`.
- For V1-Plus search/filter work, read `PROJECT_MAP.md`, `ARCHITECTURE_RULES.md`, `THREAD_SCOPE_CHECKLIST.md`, `RISK_REGISTER.md`, and the affected service/page files.

## Next Recommended Step

- Finish final verification, commit V1-Plus Thread 01 locally, and do not push unless the user asks for a deployment refresh.
