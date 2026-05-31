# Thread Scope Checklist

Use this as a short boundary/status record for development threads. Do not paste full instructions or long plans here.

## Thread

- Name: V1.5 Thread 05 - Image Dedupe And Lightweight Originality-Risk Hints
- Date: 2026-05-31
- Type: feature / local-first validation
- Approved version scope: V1.5 Thread 05 only
- Existing working-tree changes belong to: this thread

## Safety

- `git status --short` checked before work: yes
- Touches schema, migration, new dependencies, new business feature, or destructive production operation: additive schema migration and local feature only; no new dependency or destructive operation
- Touches local filesystem behavior: user-triggered reads of managed upload images for hashing only; no writes, deletion, trash movement, compression, browser automation, crawler, link fetching, or batch collection
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
| V1.5 Thread 04 | 竞品智能分析与差异化建议 | COMPLETE | AI-assisted local analysis snapshots only; no crawling, link fetching, scoring overwrite, status overwrite, automated publishing, messaging, comments, SKU, supplier, or inventory. |
| V1.5 Thread 05 | 图片去重与轻量原创性风险提示 | COMPLETE | Detect duplicates/similarity/originality risk, manual ignore, and manual archive suggestions only; no auto delete, permanent delete, trash movement, uploads cleanup, auto compression, or new cleanup system. |
| V1.5 Thread 06 | API 生图轻量版 | NOT STARTED | Lightweight API image generation only; no Vercel high-cost AI calls or automated publishing. |
| V1.5 Thread 07 | Electron 技术验证 | NOT STARTED | Technical validation only; no formal Electron desktop app, installer, tray, auto-update, or system notifications. |
| V1.5 Thread 08 | 站内搜索助手与通知摘要助手 | NOT STARTED | May remind and link to existing maintenance pages; must not scan, move, delete, or clean uploads/exports/backups automatically. |
| V1.5 Thread 09 | 最终集成验收、README 与 V2 准备 | NOT STARTED | Final acceptance, README, risks, safety scan, V1-Plus Thread 06 cleanup regression, and V2 preparation only. |

Thread 03 closeout note: V1.5 Thread 03 is now complete on the current mainline. It implemented single-link manual draft creation, URL normalization, SSRF-guarded public metadata attempts, source-platform labels, quality grading, auxiliary screenshot upload, list/detail views, reject/archive, and user-confirmed conversion to inspiration or association with existing product/competitor records only; no platform crawler, batch import, browser automation, login/cookie storage, private API, auto image collection, auto product creation, or formal competitor fact creation was added.

Thread 04 closeout note: V1.5 Thread 04 is now implemented on the current mainline. It added local-only AI-assisted competitor analysis snapshots, product-detail analysis entry, competitor-tab entry, competitor selection, history, regeneration without overwrite, reference-version marking, archive confirmation, AI failure isolation, and banned-word/risk scan hints. It does not auto-collect competitors, access external platforms, crawl or fetch links, auto-modify scoring, update recommendations, update product status, mutate competitor facts, publish, message, comment, manage SKU/suppliers/inventory, place purchase orders, generate images, or orchestrate agents.

Thread 05 closeout note: V1.5 Thread 05 is now implemented on the current mainline. It added local-only `ImageFingerprint` / `ImageReviewLog`, a user-triggered image-dedup service, exact SHA-256 duplicate detection, 8x8 perceptual-hash similarity hints, source-risk reminders, material/inspiration UI badges, similar-image lists, manual ignore, and archive-suggestion marking. It only detects and提示; it does not delete files, permanently delete files, move files to trash, clean uploads, compress images, replace images, upload images to search services, perform reverse-image search, call AI image generation, or make legal/copyright conclusions. Any cleanup, deletion, or trash action must go through the existing V1-Plus Thread 06 file cleanup/trash page.

## File Cleanup Boundary

- Existing owner: V1-Plus Thread 06 already owns uploads/exports/backups manual scan, orphan-file detection, old export/backup detection, application-managed `trash/`, confirmed permanent delete, CleanupLog, Vercel no-real-scan/delete behavior, path sanitization, path traversal protection, and active product/material/competitor/inspiration file protection.
- V1.5 must not create a second file cleanup system.
- V1.5 Thread 05 may only detect duplicates/similar images/originality risk, support manual ignore, and suggest manual archive. It must not delete, move to trash, permanently delete, compress, replace, or clean uploads. If deletion or trash movement is needed, guide the user to the existing V1-Plus Thread 06 file maintenance page.
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

- Goal: implement V1.5 Thread 05 image dedupe and lightweight originality-risk hints for local materials and inspirations.
- Non-goals for Thread 05: reverse-image search, copyright verdicts, automatic deletion, permanent deletion, automatic trash movement, automatic compression, image replacement, uploads cleanup, API image generation, platform crawling, automatic collection, Electron, or multi-agent scheduling.
- Frozen thread rule: Thread 05 only detects and提示; file cleanup/trash remains V1-Plus Thread 06 and must not be rebuilt or bypassed.
- Allowed files/systems: additive Prisma schema/migration, image-dedup service README, material/inspiration UI hints, manual fingerprint actions, review-log actions, OperationLog/LogService reuse, and short current docs/status updates.
- Forbidden files/systems: old migrations, dependency changes, crawler/browser automation libraries, cleanup/trash behavior, direct image-file mutation, deletion, uploads cleanup, platform access, AI image generation, and Vercel write behavior.
- Module README needed: yes, `src/lib/services/image-dedup/README.md`.

## Patch Fields

- Patch Thread: no
- Origin version: V1.5 baseline
- Discovered in: user-approved Thread 05 scope
- Severity: P4 feature
- Historical data affected: no
- Migration required: yes, additive `ImageFingerprint` and `ImageReviewLog`
- Data repair required: no

## Boundary Check

- Business logic, schema, runtime services, and UI behavior changed only inside Thread 05 image-dedupe scope.
- V1.5 future threads must reuse the V1-Core desktop base instead of duplicating path, environment, logging, diagnostic, or Vercel-readonly logic.
- Vercel remains preview-only and read-only; docs must not imply it is the formal runtime.
- Docs must not include API keys, `.env` values, full local paths, database paths, full stack traces, or raw prompts.
- `CURRENT_STATUS.md`, `SESSION_LOG.md`, `PATCH_LOG.md`, `CHANGELOG_DEV.md`, `RISK_REGISTER.md`, and `KNOWN_ISSUES.md` remain short.

## Verification

- Required commands: `npm run encoding:check`, `npm run lint`, `npm run build`, `npx prisma validate`, and `npm run typecheck` passed.
- Optional commands: `npm test` was attempted and reported no `test` script.
- Local acceptance: service smoke skipped material because no active material row existed, generated a ready fingerprint for inspiration `#1`, recorded source-risk advice, and did not delete, move, compress, replace, or clean files; `/materials` and `/inspirations` HTTP smoke checks returned 200.
- Vercel preview simulation: `VERCEL=1` blocks image-dedupe writes with `预览环境只读，请在 Windows 本地验收图片去重。`; preview does not scan files, generate hashes, or write SQLite.
- Security scans: changed source/docs were checked through encoding/build/lint and runtime guards for path/preview behavior; no full local absolute paths, API keys, stack traces, reverse-image search, or cleanup execution were added.
- Commit/push/deploy status: local commit expected after verification; no push or Vercel live refresh requested.
