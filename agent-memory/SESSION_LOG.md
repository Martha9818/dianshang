# Session Log

Only the latest key summaries stay here. Detailed entries and older history are archived under `agent-memory/archive/`; use `ARCHIVE_INDEX.md` only when older history is explicitly needed.

## 2026-05-31

### V1.5 Thread 08 Follow-Up - Query Service Reuse For Assistant Filters

- Changed: Reworked local-assistant filter-link generation to reuse `src/lib/services/query-service.ts` normalization and new serialization helpers instead of manually composing product/material/copywriting/prompt/inspiration query strings.
- Result: `/assistant` now stays aligned with existing page query contracts while keeping the same read-only action boundary and allowlisted destinations.
- Verification: Encoding check, lint, build, Prisma validate, typecheck, and `npm run thread08:verify` passed; `npm test` is still not available in the current scripts.

### V1.5 Thread 08 - Site-Search Assistant And Notification-Summary Assistant

- Changed: Added `/assistant` as a lightweight local-only assistant page with two read-only sections: site-search assistant and notification-summary assistant.
- Search assistant: Accepts natural-language questions, optionally uses the existing text AI provider locally for intent parsing, validates AI output through a local allowlist, and returns only safe `view` / `search` / `filter` / `navigate` links.
- Summary assistant: Aggregates dashboard todos, in-app notifications, recent AI-failure reminders, backup status, and existing cleanup-log summaries into “today focus”, “needs attention”, and “ignorable or handled” sections.
- Safety: This thread does not implement multi-agent orchestration, autonomous execution, external search, crawler behavior, browser automation, auto collection, auto listing, private messages, comments, file cleanup execution, notification write execution, batch execution, image generation, or product-status updates.
- Cleanup boundary: The assistant may only remind, summarize existing cleanup records, and link to `/maintenance/files`; it does not scan files, move files, delete files, call cleanup write services, or bypass user confirmation.
- Runtime: Vercel preview shows `/assistant` in read-only mode with rule degradation and the notice `预览环境只读，请在 Windows 本地验收站内助手。`
- Verification: Encoding check, lint, build, Prisma validate, typecheck, and lightweight `npm run thread08:verify` passed; `npm test` is still not available in the current scripts.

### V1.5 Thread 07 - Electron Technical Validation

- Changed: Added isolated `experiments/electron-poc/` with POC-only Electron package, localhost-only main process, marker-only preload, static/local-port smoke, Electron smoke, POC README, and `.vercelignore` exclusion.
- Safety: No root Electron dependency, no core page/service/schema/runtime changes, no installer, auto-update, tray, Windows notification, crash recovery, background residency, file association, auto-start, `start.bat` replacement, crawler, automated publishing, or V2 desktop behavior.
- Runtime: POC loads the existing local Next.js app at `http://127.0.0.1:3000/`; Vercel remains preview-only/read-only and does not upload or execute the POC directory.
- Risk: Electron smoke passes but Next.js dev mode emits an Electron CSP warning; V2 formal desktop must define strict production CSP, desktop data root, runtime identity, preload contract, lifecycle, installer/signing, and upgrade strategy.
- Verification: POC install required a POC-scoped Electron mirror after default download timeout; encoding check, lint, build, Prisma validate, typecheck, POC smoke, and Electron smoke passed; `npm test` reported no root `test` script.

### V1.5 Thread 07 Follow-Up - Managed Local Production Shell

- Changed: Added managed local-production-shell scripts in `experiments/electron-poc/`, moved the default POC flow from attaching to a dev server to building the root app and running local `next start`, and added production CSP response headers in `next.config.ts`.
- Result: The default `npm run smoke` path now loads `http://127.0.0.1:3001/` without the Electron CSP warning. Explicit `attach` mode remains available for diagnostics against a user-run local server.
- Verification: Root encoding check, lint, build, Prisma validate, typecheck, and managed POC smoke passed. Root `npm test` still does not exist.

### V1.5 Thread 06 - Lightweight API Image Generation

- Changed: Added optional API image generation settings, image-purpose AI Provider support, `ImageGenerationJob`, a local-only image-generation service, Prompt task detail trigger, generated-result material creation, AI job/request logs, operation logs, and success/failure notifications.
- Safety: API image generation is disabled by default, user-triggered only, one image per click, confirmed before calling, with a second confirmation for high-cost model/quality/size hints.
- Runtime: Vercel/read-only write attempts return `预览环境只读，请在 Windows 本地验收 API 生图。`; preview does not call image APIs, write SQLite, or save uploads.
- Boundary: Thread 06 does not add batch generation, background generation, browser automation, ChatGPT opening, platform crawling, automatic publishing, listing, private messages, comments, inventory, suppliers, Electron release behavior, or multi-agent orchestration.
- Verification: Encoding check, lint, build, Prisma validate, typecheck, local panel smoke, Vercel read-only simulation, and browser page smoke for `/settings/ai` + `/prompt-tasks` passed; `npm test` reported no `test` script.

### V1.5 Thread 05 - Image Dedupe And Lightweight Originality-Risk Hints

- Changed: Added `ImageFingerprint` and `ImageReviewLog`, a local-only `image-dedup` service, manual material/inspiration fingerprint rebuild actions, exact duplicate detection, 8x8 perceptual-hash high-similarity detection, source-risk hints, ignore, and archive-suggestion records.
- UI: Material library cards/list/detail and inspiration cards/detail now show duplicate/risk badges, similar-image lists, similarity values, manual ignore, archive-suggestion marking, and links to the existing V1-Plus file cleanup/trash page.
- Safety: Thread 05 does not delete, move to trash, permanently delete, compress, replace, upload images, call AI image generation, use reverse-image search, or make copyright/legal conclusions.
- Runtime: Vercel/read-only write attempts return `预览环境只读，请在 Windows 本地验收图片去重。`; preview must not scan files, hash images, or write SQLite.
- Verification: Encoding check, lint, build, Prisma validate, typecheck, local image-dedupe service smoke, Vercel read-only simulation, and `/materials` + `/inspirations` HTTP smoke checks passed; `npm test` reported no `test` script.

### V1.5 Thread 04 - Competitor Intelligent Analysis And Differentiation Suggestions

- Changed: Added `CompetitorAnalysisSnapshot`, local-only competitor analysis service, centralized prompt template, product-detail analysis tab, competitor-tab entry, competitor selection, history, regeneration, reference-version marking, and archive with double confirmation.
- Safety: Analysis uses only local product, manually entered competitor, screenshot-draft, and link-import-draft summaries; it does not open links, crawl platforms, auto-collect competitors, overwrite scoring, update recommendations, update product status, or mutate competitor facts.
- Acceptance fix: AI error summaries now redact local-path-like provider error details before being saved to failed snapshots, AI jobs, or AI request logs.
- Verification fix: Replaced the legacy `thread04:verify` / `thread04:preview` copywriting-provider scripts with competitor-analysis-specific local and preview acceptance scripts.
- Runtime: Vercel/read-only write attempts return `预览环境只读，请在 Windows 本地验收竞品智能分析。`; preview does not call AI or save analysis snapshots.
- Verification: Encoding check, lint, build, Prisma validate, typecheck, mock-provider local acceptance, Vercel read-only simulation, and HTTP page smoke checks passed; Codex Browser tool timed out, so browser inspection fell back to HTTP smoke; no `test` script exists.

### V1.5 Thread 03 - Link Import Attempts And Quality Grading

- Changed: Added `LinkImportDraft`, `/link-imports`, single pasted-link draft creation, URL normalization, source-platform labels, public OpenGraph/title/description attempts, quality grading, auxiliary screenshot/text/note input, draft list/detail, reject/archive, and explicit conversion actions.
- Safety: Public metadata attempts are SSRF-guarded, timeout/byte-limited, no-cookie, no-browser Node HTTP(S) requests; failures degrade to safe summaries and do not block draft save.
- Boundary: Thread 03 does not implement platform crawling, batch link import, browser automation, login/cookies, private APIs, captcha/anti-crawler bypass, automatic product-detail/image/comment/sales/shop collection, automatic product creation, or formal competitor fact creation.
- Runtime: Vercel remains read-only; link draft writes, screenshot uploads, and external metadata attempts are blocked with `预览环境只读，请在 Windows 本地验收链接导入。`.
- Verified: Encoding check, lint, build, Prisma validate, typecheck, local service acceptance for normal/SSRF-blocked drafts, Vercel read-only simulation, and browser smoke test passed; no `test` script exists.

### V1.5 Thread 02 - Screenshot Recognition And Structured Image Import

- Changed: Added a separate `ScreenshotRecognitionJob` task model, `/screenshots` workspace, screenshot upload/source selection, AI recognition draft, quality grading, recognition history, edit/ignore/confirm flow, and conservative entry links from inspiration, product detail, competitor, and material views.
- Safety: Thread 02 does not reuse `InspirationAiDraftJob`; AI results stay in `structuredDraft` / `confirmedDraft` and do not automatically create products, overwrite product facts, create effective competitors, update competitor fields, change material status/permission, or run cleanup.
- Runtime: Uploads and AI calls are local-only; Vercel write attempts show `预览环境只读，请在 Windows 本地验收截图识别。`.
- Local acceptance: A readable fixture screenshot uploaded into managed `uploads/screenshots/`, AI recognition generated a `high` quality structured draft, and confirmation saved only `confirmedDraft`; Vercel write simulation returned the required read-only notice.

### V1.5 Thread 01 - Inspiration Folder Scheduled Scan And AI Drafts

- Changed: Added local inspiration scan config, app-runtime scheduled scan trigger, per-file scan jobs, AI draft jobs, manual retry, and AI draft confirm/ignore/edit flow.
- Safety: Reused runtime/read-only guards, path validation, managed uploads, hash dedupe, AI base, sanitized logs, and service-layer actions; no platform crawler, screenshot import, link import, auto-publish, background service, tray, Windows notification, or formal Electron behavior was added.
- Local acceptance: Fixture folder import created one inspiration successfully while AI draft failed because no default provider was configured, proving AI failure isolation; scheduled scan then skipped the duplicate by hash. Scheduled scanning was disabled afterward to avoid surprise local polling.
- Provider patch: After adding a vision-capable Doubao provider, patched the vision prompt fallback and image request timeout; a real local inspiration image generated an `AI 草稿 / 待用户确认` draft successfully without applying it to formal product fields.

### V1.5 Thread 00 - V1-Plus Closeout And Baseline Freeze

- Changed: Marked V1-Plus complete, set V1.5 as the current stage, recorded V1.5 boundaries, slimmed active memory/current docs, and added baseline archive files.
- Supplement: Corrected the next-thread route so V1.5 Thread 01 is inspiration-folder scheduled scanning and automatic AI image-recognition drafts, while Thread 02 remains screenshot recognition and structured image import.
- Baseline fix: Restored V1.5 Thread 03-09 to the frozen feature route and documented that file cleanup/trash belongs to V1-Plus Thread 06, not a V1.5 rebuild.
- Verification refresh: For the baseline route correction, reran encoding check, lint, diff whitespace check, and sensitive-pattern scans; build and Prisma validation were skipped because only docs/memory changed.
- Verified: `npm run lint`, `npm run build`, `npx prisma validate`, `npm run typecheck`, `npm run encoding:check`, and changed-doc sensitive-pattern scans all passed; no `test` script exists.
- Scope: Documentation, status, risk, issue, patch, changelog, and archive-index cleanup only.
- Handoff: No business feature, schema, migration, dependency, filesystem write behavior, AI behavior, Electron feature, OCR, link parsing, API image generation, crawler, automation, SKU, inventory, PDF, or multi-agent behavior was implemented.

### V1-Plus Completed Baseline

- Status: MVP, V1-Core, and V1-Plus are complete; V1-Plus is frozen as the baseline for V1.5.
- Foundation: Future V1.5 threads must reuse RuntimeConfig, LocalPathService, EnvironmentGuard, LogService, OperationLog, local diagnostics, and Vercel read-only degradation.
- Next: Start V1.5 Thread 01 only after explicit approval of its narrow scope: 灵感文件夹定时扫描与自动 AI 识图草稿. Do not merge it with Thread 02 screenshot recognition and structured image import.
