# AGENTS

## Project Position

EcomPilot is a Windows local-first ecommerce operations assistant. The local app, local SQLite data, and local runtime folders are the source of truth.

## Current Stage

- Current line: V1.6-08 final acceptance and closeout after V1.6-00 through V1.6-07 implementation.
- Work must stay inside the approved thread scope.
- Historical V1 / V1-Core issues are fixed only on the latest mainline through a Patch Thread.

## Required Startup Reading

Read these first, in order, before planning or answering detailed project questions:

1. `AGENTS.md`
2. `agent-memory/CURRENT_STATUS.md`
3. `agent-memory/SESSION_LOG.md`
4. `docs/current/DOC_INDEX.md`

Use `DOC_INDEX.md` to choose only the task-relevant current docs. Do not read `agent-memory/archive/` by default.

## Forbidden Scope

Do not add login, cloud accounts, payments, crawlers, OCR, link parsing, automated publishing, inventory, supplier management, notification-center expansion, background queues, real multi-agent systems, or V2 behavior unless the user explicitly opens that thread.

V1.6 is a real-use validation and closeout stage only. Follow the frozen V1.6 route in `THREAD_SCOPE_CHECKLIST.md`; do not mix the completed V1.6 inspiration and product-evaluation flow threads with future V1.7 competitor screenshot inbox work or V1.8 content-workflow work. File cleanup and app trash are existing V1-Plus Thread 06 capabilities, not a V1.6 rebuild. V1.6 does not include a formal Electron desktop release, platform crawlers, automatic collection, automatic publishing, automatic private messages, automatic comments, SKU, supplier, inventory, trial-sale review, PDF reports, or real multi-agent orchestration.

Do not change database schema, migrations, dependencies, filesystem write behavior, AI behavior, UI behavior, or product logic during docs-only tasks.

## Vercel Boundary

Vercel is preview-only and read-only. It must not write SQLite data, uploads, exports, backups, logs, or make high-cost AI calls. Preview write attempts should show: `预览环境只读，请在 Windows 本地验收。`

## Local-First Rules

- Prefer Windows local verification for real writes.
- Keep frontend output free of API keys, `.env` values, full local paths, database paths, full stack traces, and raw prompts.
- Before migrations, batch writes, filesystem writes, or destructive work, evaluate backup needs first.
- Use PowerShell-compatible commands in this workspace; avoid Bash-only chaining.

## Desktop Base Reuse

Reuse the existing Next.js App Router, Prisma/SQLite, service-layer boundaries, runtime guards, local-path services, diagnostics, logging, AI base, image services, and module README pattern. Do not create a second desktop/runtime foundation.

## Closeout

After meaningful work, update `CURRENT_STATUS.md` and `SESSION_LOG.md`, run matching verification, check git status, commit locally when the task is ready to preserve, and push only for approved milestones, deployment refreshes, history cleanup, or explicit user request.
