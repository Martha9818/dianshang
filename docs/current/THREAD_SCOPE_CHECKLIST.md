# Thread Scope Checklist

Use this as a short boundary/status record for development threads. Do not paste full instructions or long plans here.

## Thread

- Name: V1.5 Thread 03 - Link Import Attempt And Import Quality Grading
- Date: 2026-05-31
- Type: feature / local-first validation
- Approved version scope: V1.5 Thread 03 only
- Existing working-tree changes belong to: this thread

## Safety

- `git status --short` checked before work: yes
- Touches schema, migration, new dependencies, new business feature, or destructive production operation: additive schema migration and local feature only; no new dependency or destructive operation
- Touches local filesystem behavior: yes, managed auxiliary screenshot uploads only; no browser automation, crawler, or batch collection
- Backup need evaluated when risky writes are involved: yes; local SQLite backup created before migration
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
| V1.5 Thread 01 | 灵感文件夹定时扫描与自动 AI 识图草稿 | COMPLETE | Implemented local folder scan settings, app-runtime scheduled scan, task states, and AI drafts only; no screenshot recognition or structured screenshot import. |
| V1.5 Thread 02 | 截图识别与图片导入结构化 | COMPLETE | User-initiated screenshot/local-image recognition only; no auto screenshot, browser automation, crawler, or formal field overwrite. |
| V1.5 Thread 03 | 链接导入尝试与导入质量分级 | COMPLETE | Single pasted-link drafts, public meta attempts, quality grading, and manual conversion links only; no platform crawler, batch import, browser automation, or automatic collection. |
| V1.5 Thread 04 | 竞品智能分析与差异化建议 | NOT STARTED | Suggestive analysis only; no automated publishing, messaging, comments, SKU, supplier, or inventory. |
| V1.5 Thread 05 | 图片去重与轻量原创性风险提示 | NOT STARTED | Detect duplicates/similarity/originality risk, manual ignore, and manual archive suggestions only; no auto delete, permanent delete, auto compression, or new cleanup system. |
| V1.5 Thread 06 | API 生图轻量版 | NOT STARTED | Lightweight API image generation only; no Vercel high-cost AI calls or automated publishing. |
| V1.5 Thread 07 | Electron 技术验证 | NOT STARTED | Technical validation only; no formal Electron desktop app, installer, tray, auto-update, or system notifications. |
| V1.5 Thread 08 | 站内搜索助手与通知摘要助手 | NOT STARTED | May remind and link to existing maintenance pages; must not scan, move, delete, or clean uploads/exports/backups automatically. |
| V1.5 Thread 09 | 最终集成验收、README 与 V2 准备 | NOT STARTED | Final acceptance, README, risks, safety scan, V1-Plus Thread 06 cleanup regression, and V2 preparation only. |

Thread 03 closeout note: V1.5 Thread 03 is now complete on the current mainline. It implemented single-link manual draft creation, URL normalization, SSRF-guarded public metadata attempts, source-platform labels, quality grading, auxiliary screenshot upload, list/detail views, reject/archive, and user-confirmed conversion to inspiration or association with existing product/competitor records only; no platform crawler, batch import, browser automation, login/cookie storage, private API, auto image collection, auto product creation, or formal competitor fact creation was added.

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

- Goal: implement V1.5 Thread 03 link import attempts and quality grading for single user-pasted links.
- Non-goals for Thread 03: platform crawler, batch link import, browser automation, login, cookies, private platform APIs, captcha/anti-crawler bypass, automatic product-detail scraping, automatic image/comment/sales/shop collection, automatic product creation, automatic competitor fact creation, publishing, messages, comments, API image generation, Electron, or multi-agent scheduling.
- Frozen thread rule: Thread 03 link drafts stay separate from Thread 01 folder scanning and Thread 02 screenshot recognition.
- Allowed files/systems: additive Prisma schema/migration, link-import service/action/page/module README, navigation entry, limited existing module entry links, and short current docs/status updates.
- Forbidden files/systems: old migrations, dependency changes, crawler/browser automation libraries, AI behavior, cleanup/trash behavior, product/scoring/copy/export/backup logic, and Vercel write behavior.
- Module README needed: yes, `src/lib/services/link-import/README.md`.

## Patch Fields

- Patch Thread: no
- Origin version: V1.5 baseline
- Discovered in: user-approved Thread 03 scope
- Severity: P4 feature
- Historical data affected: no
- Migration required: yes, additive `LinkImportDraft`
- Data repair required: no

## Boundary Check

- Business logic, schema, runtime services, and UI behavior changed only inside Thread 03 link-import scope.
- V1.5 future threads must reuse the V1-Core desktop base instead of duplicating path, environment, logging, diagnostic, or Vercel-readonly logic.
- Vercel remains preview-only and read-only; docs must not imply it is the formal runtime.
- Docs must not include API keys, `.env` values, full local paths, database paths, full stack traces, or raw prompts.
- `CURRENT_STATUS.md`, `SESSION_LOG.md`, `PATCH_LOG.md`, `CHANGELOG_DEV.md`, `RISK_REGISTER.md`, and `KNOWN_ISSUES.md` remain short.

## Verification

- Required commands: `npm run lint`, `npm run build`, `npx prisma validate`, and `npm run typecheck` passed.
- Optional commands: `npm test` was not run because no test script exists.
- Extra check: `npm run encoding:check` passed.
- Local acceptance: service-level normal-link draft saved as `needs_review/high`; localhost/127.0.0.1 draft saved as `failed/failed`; `/link-imports` browser smoke test returned 200 and no console errors.
- Vercel preview simulation: `VERCEL=1` blocks link draft writes with `预览环境只读，请在 Windows 本地验收链接导入。`; page data returns an empty read-only shell without SQLite reads or external requests.
- Security scans: changed source/docs were checked for API-key-like strings, full local path strings, database path strings, and full stack-trace markers; only pre-existing sanitizer/test-pattern references matched.
- Commit/push/deploy status: local commit expected after verification; no push or Vercel live refresh requested.
