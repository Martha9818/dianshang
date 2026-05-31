# EcomPilot Development Changelog

This file keeps version-level summaries only. Detailed per-task history is in `agent-memory/archive/` and recent summaries are in `agent-memory/SESSION_LOG.md`.

## V1.5 Baseline

- V1.5 begins after MVP, V1-Core, and V1-Plus completion.
- Thread 01 shipped local inspiration-folder scan settings, app-runtime scheduled scans, new image detection with hash dedupe, `InspirationScanJob` / `InspirationAiDraftJob` task states, and AI image-recognition drafts that require user confirmation.
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
