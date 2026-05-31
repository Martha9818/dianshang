# V1.5 Baseline Changelog History Archive - 2026-05-31

This archive preserves the version-level history that was moved out of active `CHANGELOG_DEV.md` during V1.5 Thread 00. It is historical context only.

## V1-Plus Thread History

- Thread 01 added global search/filter normalization across product, material, copywriting, prompt-task, and inspiration lists while keeping schema, dependencies, AI search, semantic search, filesystem cleanup, and Vercel writes unchanged.
- Thread 02 enhanced inspiration management with review/archive/reject/converted states, processing records, repeat-conversion protection, and confirm-then-convert behavior using existing inspiration/runtime/AI/operation-log foundations.
- Thread 03 added a read-only homepage todo summary for actionable reminders from products, inspirations, materials, copywriting, AI logs, backups, runtime, and diagnostics without creating a task system or background queue.
- Thread 04 added a lightweight in-app notification center with sanitized notification records, unread/read state, type filtering, safe internal action links, manual cleanup, and local-only write guards.
- Thread 05 added selected-record batch operation safety for products, inspirations, materials, and notifications with centralized rules, per-item execution, result counts, confirmation for dangerous actions, OperationLog reuse, and no batch AI/API image generation/product conversion/permanent file deletion.
- Thread 06 added manual local file maintenance for `uploads/`, `exports/`, and `backups/`, with cleanup suggestions, app-managed `trash/`, confirmed permanent delete for trash files only, `CleanupLog`, and Vercel read-only guards.
- Thread 07 completed final integration acceptance, README V1-Plus closeout, path-service consolidation for export/backup/upload read paths, startup script `trash/` checks, and acceptance-script alignment without adding new product scope.
- Thread 07 follow-up added a `typecheck` npm script for the existing TypeScript verification command.
- V1-Plus closeout shortened active docs and moved detailed history into `agent-memory/archive/` without changing business behavior.

## Earlier Baselines

- V1-Core established diagnostics, runtime/local-path/logging foundations, AI base services, image safety, multi-platform copywriting, inspiration inbox, final integration acceptance, module READMEs, and current documentation.
- MVP built product pool, product detail/editing, scoring, copywriting fallback, prompt tasks, materials, Excel export, manual backup, Vercel preview, and final MVP acceptance.
- Patch/governance work added patch-thread rules, startup memory rules, archive indexing, encoding checks, push-cadence rules, and history-cleanup guidance.
