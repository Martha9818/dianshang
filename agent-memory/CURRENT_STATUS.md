# Current Status

## Current Progress

- Current stage: V1-Plus has started after V1-Core completion.
- Current task: EcomPilot V1-Plus Thread 01 global search and filter enhancement has passed full acceptance on Windows local and Vercel preview.
- Latest pushed acceptance/source commit: `cddf825` on `origin/main`.
- Thread 01 feature commit: `8984a19335c0e9ac382d8f224756066edf75b36c`.

## Current Product Direction

- Keep EcomPilot local-first: Windows local runtime, SQLite, and local `uploads/`, `exports/`, `backups/`, and `logs/`.
- Treat Vercel as read-only preview only: search/filter pages may render, but writes must remain blocked with `预览环境只读，请在 Windows 本地验收。`.
- Keep query and business logic in services/modules, not page components.
- V1-Plus Thread 01 is limited to search, filtering, sorting, and list-query experience; no collection, recognition, generation, automation, AI search, semantic search, or external search agent work belongs here.

## Latest Completed Work

- Completed full Thread 01 acceptance: command verification, local browser checks, Vercel preview checks, security scan, and boundary review.
- Fixed Vercel `/inspirations` read-error fallback so the search/filter panel still renders in preview with an empty read-only list.
- Unified export and backup preview write attempts to return `预览环境只读，请在 Windows 本地验收。`.
- Confirmed `src/lib/services/query-service.ts` provides shared query defaults and normalization for products, materials, copywriting, Prompt tasks, and inspirations.

## Current Blockers Or Risks

- No Prisma schema, migration, dependency, AI prompt, AI call, collection, OCR, crawler, automation, semantic search, AI search, or external search agent behavior changed.
- No known acceptance blocker remains for V1-Plus Thread 01.
- Local runtime data contains prior acceptance records; Vercel remains preview-only and may show empty read-only lists instead of local SQLite content.

## Current Documentation Entry Points

- Startup files: `AGENTS.md`, `agent-memory/CURRENT_STATUS.md`, `agent-memory/SESSION_LOG.md`.
- Then read `docs/current/DOC_INDEX.md`.
- For any follow-up V1-Plus search/filter work, read `PROJECT_MAP.md`, `ARCHITECTURE_RULES.md`, `THREAD_SCOPE_CHECKLIST.md`, `RISK_REGISTER.md`, and the affected service/page files.

## Next Recommended Step

- Start the next approved V1-Plus thread only after a fresh startup read and clean working-tree check.
