# EcomPilot Patch Log

Keep only the active patch state here. Detailed V1.5 patch history is archived.

## Severity

- P0: data loss, secret leakage, wrong deletion, database startup failure, or preview writing real data
- P1: core flow broken
- P2: meaningful impact with workaround
- P3: minor UX or non-core issue
- P4: enhancement

## Current Patch State

| Patch State | Severity | Summary | Verification |
| --- | --- | --- | --- |
| Long-term UTF-8 baseline hardening | P2 | Added `.editorconfig`, UTF-8 workspace editor defaults, a repo-local pre-commit encoding guard, and a persistent local PowerShell UTF-8 profile so encoding issues are blocked both before save and before commit, while terminal false positives are reduced at session start. | Fresh PowerShell sessions now report `65001 / utf-8 / utf-8 / utf-8`, `npm run encoding:check` passes, and the repo now uses `core.hooksPath=.githooks` to re-run the encoding guard on commit. |
| Encoding check non-ASCII path fix | P2 | Fixed the repo encoding guard so tracked Chinese paths no longer break `encoding:check`, and confirmed the recent mojibake confusion was primarily terminal/display-layer distortion rather than fresh UTF-8 source corruption. | `npm run encoding:check` passed after the script change, and `git ls-files` now renders `重装恢复/*.md` as readable Chinese paths with repo-local `core.quotepath=false`. |
| Inspiration inbox legacy-route compatibility patch | P2 | Added a narrow `/inspirations/[...slug]` redirect layer plus shared inbox URL helpers so legacy or mistyped subpaths no longer leave users inside the app shell with a misleading default 404. | `npx tsx scripts/inspiration-route-compat-verify.mts`, `npm run typecheck`, `npm run lint`, `npm run build`, and local HTTP checks for `/inspirations/14` and `/inspirations/legacy-path?status=pending` passed. |
| V1.6 final closeout patch | P2 | Corrected outdated current-line wording, recorded the V1.6 final acceptance result, and closed the line on the current local mainline without reopening feature scope. | `thread-v16-02` through `thread-v16-07` verification scripts, `npm run typecheck`, `npm run lint`, `npm run encoding:check`, `npm run build`, `npx prisma validate`, and local browser checks for `/inspirations` and `/products/[id]` passed. |
| V1.5 Thread 09 closeout patch | P2 | Added the unified final acceptance entry `npm run thread09:verify`, refreshed README/current docs, archived detailed V1.5 history, and marked the baseline frozen for V2 planning. | Encoding check, lint, build, Prisma validate, typecheck, `npm run thread09:verify`, and Electron POC smoke passed; root `npm test` is still unavailable. |
| V1.5 Thread 01-08 patch history | ARCHIVED | Detailed feature and follow-up patch history moved out of the active current-doc set. | See archive pointer below. |

## Archive Pointer

Detailed V1.5 thread and patch history moved to `agent-memory/archive/V1_5_THREAD09_CLOSEOUT_DETAIL_ARCHIVE_2026-05-31.md`.
