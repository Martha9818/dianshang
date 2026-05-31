# EcomPilot Development Changelog

This file keeps version-level summaries only. Detailed per-task history is in `agent-memory/archive/` and recent summaries are in `agent-memory/SESSION_LOG.md`.

## V1.5 Baseline

- V1.5 begins after MVP, V1-Core, and V1-Plus completion.
- Thread 01 shipped local inspiration-folder scan settings, app-runtime scheduled scans, new image detection with hash dedupe, `InspirationScanJob` / `InspirationAiDraftJob` task states, and AI image-recognition drafts that require user confirmation.
- Thread 01 follow-up patched provider compatibility so a vision-capable OpenAI-compatible provider can complete real local AI draft generation even when `json_schema` is unsupported.
- Thread 02 shipped user-initiated screenshot/local-image recognition with a separate `ScreenshotRecognitionJob`, `/screenshots` workspace, managed upload/source selection, AI structured drafts, quality levels, edit/ignore/confirm flow, recognition history, and conservative entry links from inspiration, product, competitor, and material contexts.
- Thread 02 keeps AI output as draft-only data in `structuredDraft` / `confirmedDraft`; it does not automatically create products, overwrite product facts, create effective competitors, update competitor fields, change material status/permission, or run cleanup.
- Thread 03 shipped single pasted-link import drafts with `LinkImportDraft`, `/link-imports`, URL normalization, source-platform labels, SSRF-guarded public OpenGraph/title/description attempts, quality grading, auxiliary screenshot/text/note input, reject/archive, and explicit conversion to inspiration or association with existing product/competitor records.
- Thread 03 does not implement platform crawling, batch import, browser automation, login/cookies, private platform APIs, captcha/anti-crawler bypass, automatic product-detail/image/comment/sales/shop collection, automatic product creation, or formal competitor fact creation.
- Thread 04 shipped AI-assisted competitor analysis snapshots with `CompetitorAnalysisSnapshot`, a local-only competitor analysis service, centralized prompt templates, product-detail analysis tab, competitor selection, history, regeneration without overwrite, reference-version marking, archive confirmation, AI failure isolation, and banned-word/risk scan hints.
- Thread 04 acceptance tightened AI error summary sanitization so local-path-like provider error details are redacted before failed snapshots, AI jobs, or AI request logs store them.
- Thread 04 verification scripts now target competitor analysis directly: `npm run thread04:verify` covers local snapshot generation, history, reference/archive, prompt privacy, scoring boundary, and AI failure isolation; `npm run thread04:preview` covers preview read-only behavior and no AI calls.
- Thread 04 does not implement automatic competitor collection, platform crawling, link fetching, scoring overwrite, recommendation overwrite, product-status overwrite, automatic publishing, private messages, comments, SKU, supplier, inventory, purchase ordering, or multi-agent orchestration.
- Thread 05 shipped local image dedupe/originality-risk hints with `ImageFingerprint`, `ImageReviewLog`, a user-triggered `image-dedup` service, exact SHA-256 duplicate detection, 8x8 perceptual-hash high-similarity detection, material/inspiration badges, similar-image lists, manual ignore, archive-suggestion records, and links to the existing file cleanup/trash page.
- Thread 05 does not implement reverse-image search, copyright verdicts, automatic deletion, permanent deletion, automatic trash movement, automatic compression, image replacement, uploads cleanup, API image generation, platform crawling, or a second file cleanup system.
- Thread 06 shipped optional lightweight API image generation with image-purpose AI Provider support, AppSetting-based enable/size/quality/cost hints, `ImageGenerationJob`, a local-only service, Prompt task detail trigger, confirmation and high-cost second confirmation, generated image storage through managed uploads, Material creation marked as AI generated, AI job/request logs, operation logs, and notifications.
- Thread 06 does not implement automatic batch generation, background generation, browser automation, ChatGPT opening, platform crawling, automatic listing/publishing, private messages, comments, SKU, supplier, inventory, Electron release behavior, or multi-agent orchestration.
- Thread 07 shipped an isolated Electron POC under `experiments/electron-poc/` to validate loading the existing local Next.js app from a local port, marker-only preload, localhost-only navigation, POC smoke checks, and Vercel exclusion.
- Thread 07 follow-up moved the default POC flow to a managed local production shell, added production CSP headers, and removed the Electron CSP warning from the default validation path.
- Thread 07 does not implement a formal Windows desktop app, installer, auto-update, system tray, Windows system notifications, crash recovery, background residency, file association, auto-start, production packaging, `start.bat` replacement, or V2 desktop behavior.
- Thread 08 shipped `/assistant` as a lightweight in-app site-search assistant and notification-summary assistant backed by local existing data, rules-first link generation, optional local AI intent parsing, dashboard todo reuse, notification reuse, and Vercel read-only degradation.
- Thread 08 does not implement real multi-agent orchestration, autonomous execution, external search, crawler behavior, browser automation, automatic collection, automatic listing/publishing, private messages, comments, automatic cleanup, notification write execution, batch execution, direct image generation, or product-status updates.
- V1.5 is a lightweight intelligence and technical validation stage, not a new product-foundation rewrite.
- Frozen route: Thread 01 is local inspiration-folder scheduled scanning and automatic AI image-recognition drafts; Thread 02 is screenshot recognition and structured image import.
- Frozen route continued: Thread 03 link import/quality grading, Thread 04 competitor intelligence/differentiation, Thread 05 image dedupe/originality risk hints, Thread 06 lightweight API image generation, Thread 07 Electron validation, Thread 08 site-search/notification-summary assistants, and Thread 09 final acceptance/README/V2 preparation.
- Out of V1.5 scope: formal Electron desktop app, platform crawlers, automatic collection, automatic publishing, automatic private messages, automatic comments, SKU, supplier, inventory, trial-sale review, PDF reports, and real multi-agent orchestration.
- V1.5 threads must reuse RuntimeConfig, LocalPathService, EnvironmentGuard, LogService, OperationLog, local diagnostics, Vercel read-only degradation, AI base, image services, service-layer boundaries, and module README patterns.

## V1-Plus

- Status: complete and frozen as the V1.5 starting baseline.
- Summary: V1-Plus added global list search/filter normalization, enhanced inspiration review/conversion protection, read-only homepage todo reminders, lightweight notifications, selected-record batch safety, manual local file maintenance/trash, final integration acceptance, README closeout, path-service consolidation, startup directory checks, and a reusable typecheck script.
- File cleanup position: uploads/exports/backups manual scan, orphan/old-file detection, app trash, confirmed permanent delete, CleanupLog, Vercel no-real-scan/delete, path sanitization, path traversal protection, and active-file protection belong to V1-Plus Thread 06 and are not rebuilt in V1.5.
- Boundary: V1-Plus did not add OCR, link import, API image generation, Electron, platform crawlers, automatic collection, automatic publishing, automatic messages/comments, SKU, supplier, inventory, PDF reports, or real multi-agent behavior.

## V1-Core

- Established diagnostics, runtime/local-path/logging foundations, AI base services, image safety, multi-platform copywriting, inspiration inbox, final integration acceptance, module READMEs, and current documentation.

## MVP Baseline

- Built product pool, product detail/editing, scoring, copywriting fallback, prompt tasks, materials, Excel export, manual backup, Vercel preview, and final acceptance.
