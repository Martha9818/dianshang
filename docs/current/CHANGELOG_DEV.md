# EcomPilot Development Changelog

This file keeps version-level summaries only. Detailed per-task history is in `agent-memory/archive/` and recent summaries are in `agent-memory/SESSION_LOG.md`.

## V1-Plus

- Thread 01 added global search/filter normalization across product, material, copywriting, prompt-task, and inspiration lists while keeping schema, dependencies, AI search, semantic search, filesystem cleanup, and Vercel writes unchanged.
- Thread 02 enhanced inspiration management with review/archive/reject/converted states, processing records, repeat-conversion protection, and confirm-then-convert behavior using existing inspiration/runtime/AI/operation-log foundations.
- Thread 03 added a read-only homepage todo summary for actionable reminders from products, inspirations, materials, copywriting, AI logs, backups, runtime, and diagnostics without creating a task system or background queue.
- Thread 04 added a lightweight in-app notification center with sanitized notification records, unread/read state, type filtering, safe internal action links, manual cleanup, and local-only write guards.
- Thread 05 added selected-record batch operation safety for products, inspirations, materials, and notifications with centralized rules, per-item execution, result counts, confirmation for dangerous actions, OperationLog reuse, and no batch AI/API image generation/product conversion/permanent file deletion.
- Thread 06 added manual local file maintenance for `uploads/`, `exports/`, and `backups/`, with cleanup suggestions, app-managed `trash/`, confirmed permanent delete for trash files only, `CleanupLog`, and Vercel read-only guards.
- V1-Plus closeout shortened active docs and moved detailed history into `agent-memory/archive/` without changing business behavior.

## V1-Core

- Established diagnostics, runtime/local-path/logging foundations, AI base services, image safety, multi-platform copywriting, inspiration inbox, and final integration acceptance.
- Kept the app Windows local-first and Vercel preview read-only.
- Added module READMEs and current documentation for architecture, risks, database changes, patches, known issues, and handoff.

## MVP Baseline

- Built product pool, product detail/editing, scoring, copywriting fallback, prompt tasks, materials, Excel export, manual backup, Vercel preview, and final MVP acceptance.

## Patch / Governance Summary

- Added patch-thread rules, startup memory rules, archive indexing, encoding checks, push-cadence rules, and history-cleanup guidance.
- Recent patch detail remains in `PATCH_LOG.md`; older patch detail is archived.
