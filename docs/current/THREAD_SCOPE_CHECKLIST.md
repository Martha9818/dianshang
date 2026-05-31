# Thread Scope Checklist

Use this file as the short frozen boundary and status record for the current mainline.

## Thread

- Name: V1.5 Thread 09 - Final Integration Acceptance, README, And V2 Preparation
- Date: 2026-05-31
- Status: COMPLETE
- Type: final acceptance / scoped bug fix / README closeout / archive slimming / baseline freeze
- Approved scope: regression, scoped bug fixes, README updates, risk closeout, current-doc slimming, archive updates, and V2 prerequisite notes only
- Existing working-tree changes belong to: Thread 09 closeout work; untracked `tmp/` remains outside product scope

## Safety

- `git status --short` checked before work: yes
- New schema, migration, dependency, or major business feature: no
- Second cleanup system, automated cleanup, formal Electron desktop, or V2 implementation: no
- Vercel remains preview-only and read-only: yes
- Windows local runtime remains the writable source of truth: yes

## V1.5 Frozen Thread Range

| Thread | Frozen Name | Status | Boundary |
| --- | --- | --- | --- |
| V1.5 Thread 00 | V1-Plus closeout and V1.5 baseline freeze | COMPLETE | Docs, status, archive, and route freeze only. |
| V1.5 Thread 01 | Inspiration folder scheduled scan and AI drafts | COMPLETE | Local folder scan, app-runtime timer, dedupe, task states, and AI drafts only. |
| V1.5 Thread 02 | Screenshot recognition and structured image import | COMPLETE | User-initiated screenshot recognition only; no automatic overwrite or crawler behavior. |
| V1.5 Thread 03 | Link import attempts and quality grading | COMPLETE | Single pasted-link drafts and public metadata only; no crawler, login, or batch import. |
| V1.5 Thread 04 | Competitor intelligence and differentiation suggestions | COMPLETE | Local AI analysis snapshots only; no scoring overwrite or platform fetch. |
| V1.5 Thread 05 | Image dedupe and originality-risk hints | COMPLETE | Detection and advisory records only; no delete, move, or second cleanup system. |
| V1.5 Thread 06 | Lightweight API image generation | COMPLETE | Manual one-click API image generation only; no batch or background generation. |
| V1.5 Thread 07 | Electron technical validation | COMPLETE | Isolated POC only; no formal desktop app, installer, tray, or auto-update. |
| V1.5 Thread 08 | Site-search assistant and notification-summary assistant | COMPLETE | Local read-only suggestions and summaries only; no auto execution or cleanup. |
| V1.5 Thread 09 | Final integration acceptance, README, and V2 preparation | COMPLETE | Final regression, closeout docs, archive slimming, V2 prerequisites, and freeze only. |

## Final Acceptance Boundary

- Regress MVP, V1-Core, V1-Plus, and V1.5 scope without adding new business features.
- Keep file cleanup and app trash as the single existing V1-Plus Thread 06 implementation.
- Keep AI failure isolated from product CRUD, scoring, materials, export, backup, and cleanup.
- Keep Vercel preview read-only and block SQLite writes, runtime-folder writes, high-cost AI, API image generation, file scanning, file delete, and Electron POC execution.
- Keep assistant behavior reminder-only and link-only; no cleanup execution, no batch execution, no real multi-agent behavior.
- Keep Electron as POC-only and isolated under `experiments/electron-poc/`.

## File Cleanup Boundary

- Existing owner: V1-Plus Thread 06 already owns manual scans, orphan/old-file detection, app trash, confirmed permanent delete, `CleanupLog`, Vercel no-real-scan/delete, path sanitization, path traversal protection, and active-file protection.
- V1.5 image dedupe may detect only; it must not delete, move to trash, or permanently delete files.
- V1.5 assistant may remind and link only; it must not trigger cleanup actions.
- Permanent delete may operate only on files already inside `trash/`.
- No timed cleanup, background cleanup, Windows recycle-bin integration, or second cleanup system is allowed on the frozen V1.5 baseline.

## Verification

- Required commands passed: `npm run encoding:check`, `npm run lint`, `npm run build`, `npx prisma validate`, `npm run typecheck`
- Root `npm test` is not available; the project still has no `test` script
- Final acceptance entry passed: `npm run thread09:verify`
- Electron POC smoke passed: `experiments/electron-poc -> npm run smoke`
- Thread 09 added no Prisma migration; existing migration purposes remain documented in `DATABASE_CHANGELOG.md`

## Archive Pointers

- Detailed Thread 00-08 summaries, previous active patch detail, and pre-closeout thread-scope detail moved to `agent-memory/archive/V1_5_THREAD09_CLOSEOUT_DETAIL_ARCHIVE_2026-05-31.md`
- Field-level migration detail moved to `agent-memory/archive/V1_5_DATABASE_CHANGELOG_DETAIL_ARCHIVE_2026-05-31.md`
- The longer V1-Core explanation moved to `agent-memory/archive/V1_CORE_UNDERSTANDING_CHECK_DETAIL_ARCHIVE_2026-05-31.md`
