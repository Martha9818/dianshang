# Thread Scope Checklist

Use this as a short boundary/status record for development threads. Do not paste full instructions or long plans here.

## Thread

- Name: V1.5 Thread 00 - V1-Plus Closeout And Baseline Freeze
- Date: 2026-05-31
- Type: closeout / regression / docs
- Approved version scope: V1.5 Thread 00 only
- Existing working-tree changes belong to: this thread

## Safety

- `git status --short` checked before work: yes
- Touches schema, migration, new dependencies, new business feature, or destructive production operation: no
- Touches local filesystem behavior: no business/runtime filesystem behavior change; docs archive files only
- Backup need evaluated when risky writes are involved: no schema/data-repair/runtime write change
- Database reset planned: no
- Vercel remains read-only: yes

## V1-Plus Completion

| Thread | Status | Baseline Note |
| --- | --- | --- |
| Thread 01 Search/filter normalization | COMPLETE | Frozen in V1-Plus baseline. |
| Thread 02 Inspiration management | COMPLETE | Frozen in V1-Plus baseline. |
| Thread 03 Homepage todo summary | COMPLETE | Frozen in V1-Plus baseline. |
| Thread 04 Notification center | COMPLETE | Frozen in V1-Plus baseline. |
| Thread 05 Batch operation safety | COMPLETE | Frozen in V1-Plus baseline. |
| Thread 06 File cleanup/trash | COMPLETE | Frozen in V1-Plus baseline. |
| Thread 07 Final acceptance/README/path closeout | COMPLETE | Frozen in V1-Plus baseline. |

## V1.5 Frozen Thread Range

| Thread | Frozen Name | Status | Boundary |
| --- | --- | --- |
| V1.5 Thread 00 | V1-Plus 收口与 V1.5 基线冻结 | COMPLETE | Docs/status/archive only. |
| V1.5 Thread 01 | 灵感文件夹定时扫描与自动 AI 识图草稿 | NOT STARTED | Do not implement screenshot recognition, screenshot structured import, or product screenshot field extraction here. |
| V1.5 Thread 02 | 截图识别与图片导入结构化 | NOT STARTED | Separate from Thread 01; do not backfill Thread 01 scope here unless explicitly approved. |
| V1.5 Thread 03 | 链接导入尝试与导入质量分级 | NOT STARTED | Import attempt and quality grading only; no platform crawler or automatic collection. |
| V1.5 Thread 04 | 竞品智能分析与差异化建议 | NOT STARTED | Suggestive analysis only; no automated publishing, messaging, comments, SKU, supplier, or inventory. |
| V1.5 Thread 05 | 图片去重与轻量原创性风险提示 | NOT STARTED | Detect duplicates/similarity/originality risk, manual ignore, and manual archive suggestions only; no auto delete, permanent delete, auto compression, or new cleanup system. |
| V1.5 Thread 06 | API 生图轻量版 | NOT STARTED | Lightweight API image generation only; no Vercel high-cost AI calls or automated publishing. |
| V1.5 Thread 07 | Electron 技术验证 | NOT STARTED | Technical validation only; no formal Electron desktop app, installer, tray, auto-update, or system notifications. |
| V1.5 Thread 08 | 站内搜索助手与通知摘要助手 | NOT STARTED | May remind and link to existing maintenance pages; must not scan, move, delete, or clean uploads/exports/backups automatically. |
| V1.5 Thread 09 | 最终集成验收、README 与 V2 准备 | NOT STARTED | Final acceptance, README, risks, safety scan, V1-Plus Thread 06 cleanup regression, and V2 preparation only. |

## File Cleanup Boundary

- Existing owner: V1-Plus Thread 06 already owns uploads/exports/backups manual scan, orphan-file detection, old export/backup detection, application-managed `trash/`, confirmed permanent delete, CleanupLog, Vercel no-real-scan/delete behavior, path sanitization, path traversal protection, and active product/material/competitor/inspiration file protection.
- V1.5 must not create a second file cleanup system.
- V1.5 Thread 05 may only detect duplicates/similar images/originality risk, support manual ignore, and suggest manual archive. If deletion or trash movement is needed, guide the user to the existing file maintenance page.
- V1.5 Thread 08 may remind about cleanup-related todos and link to the existing file maintenance page. It must not automatically scan, move, delete, or clean uploads/exports/backups.
- V1.5 Thread 09 must regression-test V1-Plus Thread 06 cleanup/trash: manual scans, app trash, CleanupLog, Vercel no-real-scan/delete, path sanitization, path traversal protection, and protection against deleting active product main images, materials, or competitor screenshots.
- V1.5 cleanup-related forbidden scope: timed auto-cleanup, background cleanup, AI quality judgment followed by auto-delete, auto-compression, cloud sync, Windows system recycle-bin integration, active material auto-delete, database-record deletion, second cleanup system, and bypassing LocalPathService/path guards.

## Deferred Documentation Slimming

- `DATABASE_CHANGELOG.md`: leave unchanged now; later keep schema/migration summaries and archive old migration detail.
- `V1_CORE_UNDERSTANDING_CHECK.md`: leave unchanged now; later convert to a V1-Core capability index and move long explanation to archive.
- `PROJECT_MAP.md`: do not broadly rewrite now; only correct baseline-route or cleanup-boundary errors.
- `THREAD_SCOPE_CHECKLIST.md`: only correct the frozen V1.5 route and cleanup boundary now.
- `ARCHIVE_INDEX.md`: do not split now; only update index entries when new archive files are created.
- Treat this as a future documentation slimming pass or a V1.5 Thread 09 closeout item.

## Scope

- Goal: mark V1-Plus complete, set V1.5 as current stage, freeze baseline, shorten active docs, archive old summaries, and record V1.5 boundaries.
- Non-goals for Thread 00: new business features, screenshots import, link import, API image generation, Electron implementation, crawlers, automated collection, automated publishing, private messages, comments, SKU, supplier, inventory, trial-sale review, PDF reports, new cleanup systems, or multi-agent scheduling.
- Frozen next-step rule: V1.5 Thread 01 and Thread 02 are separate; Thread 01 must not implement screenshot recognition, screenshot structured import, or product screenshot field extraction.
- Allowed files/systems: AGENTS, README, agent memory, docs/current, and archive indexes.
- Forbidden files/systems: schema changes, migration changes, dependency changes, app behavior, AI behavior, runtime/filesystem write behavior, Vercel policy changes, and module implementation files.
- Module README needed: no.

## Patch Fields

- Patch Thread: no
- Origin version: V1.5 baseline
- Discovered in: user-approved Thread 00 closeout scope
- Severity: docs-only
- Historical data affected: no
- Migration required: no
- Data repair required: no

## Boundary Check

- Business logic, schema, runtime services, and UI behavior remain unchanged.
- V1.5 future threads must reuse the V1-Core desktop base instead of duplicating path, environment, logging, diagnostic, or Vercel-readonly logic.
- Vercel remains preview-only and read-only; docs must not imply it is the formal runtime.
- Docs must not include API keys, `.env` values, full local paths, database paths, full stack traces, or raw prompts.
- `CURRENT_STATUS.md`, `SESSION_LOG.md`, `PATCH_LOG.md`, `CHANGELOG_DEV.md`, `RISK_REGISTER.md`, and `KNOWN_ISSUES.md` remain short.

## Verification

- Required commands: `npm run lint`, `npm run build`, `npx prisma validate`, and `npm run typecheck` passed.
- Optional commands: `npm test` was not run because no test script exists.
- Extra check: `npm run encoding:check` passed.
- Security scans: changed docs were checked for API-key-like strings, full local path strings, database path strings, and full stack-trace markers; no new matches found.
- Latest route-correction verification: `npm run encoding:check`, `npm run lint`, and `git diff --check` passed; build and Prisma validation were skipped because only docs/memory changed.
- Commit/push/deploy status: local commit expected after verification; no push or Vercel live refresh requested.
