# Thread Scope Checklist

Use this as a short boundary/status record for development threads. Do not paste full instructions or long plans here.

## Thread

- Name: V1.5 Thread 08 - Site-Search Assistant And Notification-Summary Assistant
- Date: 2026-05-31
- Type: lightweight intelligence / local read-only assistant
- Approved version scope: V1.5 Thread 08 only
- Existing working-tree changes belong to: this thread

## Safety

- `git status --short` checked before work: yes
- Touches schema, migration, new dependencies, new business feature, or destructive production operation: new business feature only; no schema, migration, dependency, or destructive operation
- Touches local filesystem behavior: no runtime-folder write behavior change; no uploads/exports/backups/logs/trash writes were added for assistant actions
- Backup need evaluated when risky writes are involved: yes; no schema, migration, batch write, filesystem cleanup write, or data repair is planned in this thread
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
| V1.5 Thread 06 | API 生图轻量版 | COMPLETE | Optional user-triggered API image generation only; no Vercel high-cost AI calls, batch/background generation, browser automation, or automated publishing. |
| V1.5 Thread 07 | Electron 技术验证 | COMPLETE | Technical validation only; no formal Electron desktop app, installer, tray, auto-update, or system notifications. |
| V1.5 Thread 08 | 站内搜索助手与通知摘要助手 | COMPLETE | Implemented `/assistant` with local read-only suggestions and summaries only; may remind and link to existing maintenance pages, but must not scan, move, delete, or clean uploads/exports/backups automatically. |
| V1.5 Thread 09 | 最终集成验收、README 与 V2 准备 | NOT STARTED | Final acceptance, README, risks, safety scan, V1-Plus Thread 06 cleanup regression, and V2 preparation only. |

Thread 03 closeout note: V1.5 Thread 03 is now complete on the current mainline. It implemented single-link manual draft creation, URL normalization, SSRF-guarded public metadata attempts, source-platform labels, quality grading, auxiliary screenshot upload, list/detail views, reject/archive, and user-confirmed conversion to inspiration or association with existing product/competitor records only; no platform crawler, batch import, browser automation, login/cookie storage, private API, auto image collection, auto product creation, or formal competitor fact creation was added.

Thread 04 closeout note: V1.5 Thread 04 is now implemented on the current mainline. It added local-only AI-assisted competitor analysis snapshots, product-detail analysis entry, competitor-tab entry, competitor selection, history, regeneration without overwrite, reference-version marking, archive confirmation, AI failure isolation, and banned-word/risk scan hints. It does not auto-collect competitors, access external platforms, crawl or fetch links, auto-modify scoring, update recommendations, update product status, mutate competitor facts, publish, message, comment, manage SKU/suppliers/inventory, place purchase orders, generate images, or orchestrate agents.

Thread 05 closeout note: V1.5 Thread 05 is now implemented on the current mainline. It added local-only `ImageFingerprint` / `ImageReviewLog`, a user-triggered image-dedup service, exact SHA-256 duplicate detection, 8x8 perceptual-hash similarity hints, source-risk reminders, material/inspiration UI badges, similar-image lists, manual ignore, and archive-suggestion marking. It only detects and提示; it does not delete files, permanently delete files, move files to trash, clean uploads, compress images, replace images, upload images to search services, perform reverse-image search, call AI image generation, or make legal/copyright conclusions. Any cleanup, deletion, or trash action must go through the existing V1-Plus Thread 06 file cleanup/trash page.

Thread 06 closeout note: V1.5 Thread 06 is now implemented on the current mainline. It added optional API image generation settings, image-purpose AI Provider support, `ImageGenerationJob`, a local-only image-generation service, Prompt task detail trigger, user confirmation plus high-cost second confirmation, generated-result storage through managed uploads, Material creation marked as AI-generated and needs-review, AI job/request logs, operation logs, and sanitized notifications. It does not batch generate, run background generation, open ChatGPT, use browser automation, crawl platforms, publish, list products, send private messages, comment, manage SKU/suppliers/inventory, add Electron release behavior, or orchestrate agents.

Thread 07 closeout note: V1.5 Thread 07 is now implemented as an isolated Electron POC under `experiments/electron-poc/`. It validates loading the existing local Next.js page through a local port, minimal preload marking, localhost-only navigation, POC smoke checks, and Vercel exclusion. It does not add a formal Electron desktop app, installer, auto-update, tray, Windows system notifications, crash recovery, background residency, file associations, automatic startup, production packaging, `start.bat` replacement, platform crawler behavior, automated publishing, or V2 desktop behavior.

Thread 07 managed-shell note: The default POC path now builds the root app, starts a managed local `next start` server, and loads Electron against that local production shell with CSP headers. Explicit `attach` mode remains available for diagnostics against an already running local server.

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

- Goal: add `/assistant` as a lightweight local read-only assistant page with site-search suggestions and notification summaries based only on existing local data.
- Non-goals for Thread 08: real multi-agent orchestration, autonomous execution, external search, crawler behavior, browser automation, automatic collection, automatic listing, automatic private messages/comments, automatic cleanup, notification write execution, batch execution, direct image generation, product-status updates, or any other write-side assistant behavior.
- Frozen thread rule: AI may only assist with intent parsing or summary wording. Every final link must be generated by the local rule allowlist, and every action must stay inside `view` / `search` / `filter` / `navigate`.
- Allowed files/systems: `/assistant`, `src/lib/modules/local-assistant/`, lightweight verification script, README/current docs/status/log risk updates, and reuse of existing read-only services.
- Forbidden files/systems: Prisma schema/migrations, dangerous write actions, file cleanup write calls, direct page-level Prisma query construction, external platform access, browser automation, batch execution, and second cleanup/notification/query systems.
- Module README needed: yes; `src/lib/modules/local-assistant/README.md` documents the module boundary.

## Patch Fields

- Patch Thread: no
- Origin version: V1.5 baseline
- Discovered in: user-approved Thread 08 scope
- Severity: P4 feature
- Historical data affected: no
- Migration required: no
- Data repair required: no

## Boundary Check

- Business logic is isolated to `src/lib/modules/local-assistant/`; pages only collect the question, render summaries, and show safe links.
- The assistant does not call delete/archive/batch/mark-read/generate-image/cleanup/status-update actions and does not call file cleanup write services.
- V1.5 Thread 08 reuses the existing runtime guard, AI provider/log base, dashboard todo service, notification service, backup summary service, and cleanup-log reads instead of creating a second foundation.
- Vercel remains preview-only and read-only; docs and UI must not imply that preview can run high-cost AI or write local data.
- Docs must not include API keys, `.env` values, full local paths, database paths, full stack traces, or raw prompts.
- `CURRENT_STATUS.md`, `SESSION_LOG.md`, `PATCH_LOG.md`, `CHANGELOG_DEV.md`, `RISK_REGISTER.md`, and `KNOWN_ISSUES.md` remain short.

## Verification

- Required commands: `npm run encoding:check`, `npm run lint`, `npm run build`, `npx prisma validate`, and `npm run typecheck` passed.
- Optional commands: `npm run thread08:verify` passed; `npm test` was attempted and reported no `test` script.
- Local acceptance: `/assistant` loads in local runtime, returns safe local suggestions for natural-language queries, keeps notification summaries read-only, shows cleanup reminders only as links, and degrades safely when AI intent parsing is unavailable.
- Vercel preview simulation: `/assistant` shows the assistant read-only notice, skips high-cost AI, and still renders rule-based results and summaries without SQLite write or file-operation attempts.
- Security scans: final links are allowlisted server-side, AI output is not trusted as a URL, frontend shows no API key or absolute path, and file cleanup remains reminder-only.
- Commit/push/deploy status: local commit pending after final verification; no push or Vercel live refresh requested.
