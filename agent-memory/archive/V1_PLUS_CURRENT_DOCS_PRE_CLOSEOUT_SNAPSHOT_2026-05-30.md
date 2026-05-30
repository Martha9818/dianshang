# V1-Plus Current Docs Pre-Closeout Snapshot

This archive preserves detailed current-document text removed from active startup/current docs during V1-Plus documentation closeout. It is not part of default startup reading.

## AGENTS.md

# AGENTS

## Purpose

This repository keeps a continuity-first workflow for future projects.

Every new task must resume from the latest documented project state instead of relying only on chat context.
After each completed task, the agent must:

1. update the task summary files
2. verify the code
3. safely clean transient files
4. commit locally when the task is ready to preserve
5. push to GitHub only at an approved milestone, when deployment needs a refresh, or when the user explicitly asks
6. confirm the active deployment target is updated when a push/deployment was part of the task

## Required Startup Workflow

At the beginning of every new task, always read these files in this order:

1. `AGENTS.md`
2. `agent-memory/CURRENT_STATUS.md`
3. `agent-memory/SESSION_LOG.md`

Do this before planning, coding, or answering detailed project questions.

If the documented status conflicts with the current repository state, inspect the codebase and update the memory files before continuing.

## Agent Memory Folder

All continuity notes must live in:

```text
agent-memory/
```

Required files:

- `agent-memory/CURRENT_STATUS.md`
- `agent-memory/SESSION_LOG.md`
- `agent-memory/MEMORY_POLICY.md`
- `agent-memory/ARCHIVE_INDEX.md`

Do not store continuity notes in random root files.

## Memory Size Control

- `AGENTS.md` stores long-term workflow rules only. Do not use it for detailed project history.
- `agent-memory/CURRENT_STATUS.md` stores the current project state only. Overwrite outdated details at the end of each task; do not append endlessly.
- Keep `agent-memory/CURRENT_STATUS.md` short, with the latest progress, direction, risks, and next step.
- `agent-memory/SESSION_LOG.md` stores only the most recent 10-20 tasks.
- Move older task logs to `agent-memory/archive/`.
- After archiving logs, update `agent-memory/ARCHIVE_INDEX.md`.
- Do not read `agent-memory/archive/` by default at task startup. Read archive files only when the current task explicitly needs older historical detail.
- If archived history conflicts with `agent-memory/CURRENT_STATUS.md`, follow `CURRENT_STATUS.md`.
- If an old plan conflicts with the current thread instructions, follow the current thread's approved functional scope.
- When safety rules conflict, follow the stricter rule.

## Project Documentation Reading Policy

At the beginning of every new task, still read the startup files first:

1. `AGENTS.md`
2. `agent-memory/CURRENT_STATUS.md`
3. `agent-memory/SESSION_LOG.md`

After the startup files, read:

4. `docs/current/DOC_INDEX.md`

Do not read every `docs/current/` file by default. Use `DOC_INDEX.md` to decide which project documents are relevant to the current task.

Default high-priority project documents:

- `docs/current/PROJECT_MAP.md`
- `docs/current/ARCHITECTURE_RULES.md`

Read these only when needed:

- `docs/current/RISK_REGISTER.md`: risk-sensitive tasks.
- `docs/current/THREAD_SCOPE_CHECKLIST.md`: before starting development threads.
- `docs/current/CHANGELOG_DEV.md`: when checking recent implementation history.
- `docs/current/PATCH_LOG.md`: patch tasks or historical bug investigations.
- `docs/current/DATABASE_CHANGELOG.md`: schema or migration tasks.
- `docs/current/KNOWN_ISSUES.md`: known-issue investigation or unresolved limitation tasks.

## Pre-Thread Safety Check

Before starting any development thread:

- Check whether the current git working tree is clean.
- If the working tree is not clean, explicitly state which task the existing changes belong to before continuing.
- Before touching database structure, filesystem writes, batch writes, or AI batch generation, confirm whether a backup is needed.
- Do not run destructive operations without first stating the risk.
- Do not reset the database unless the user explicitly confirms it is a disposable test database that may be cleared.

## Version Patch Workflow

- The project default is to maintain only the current latest mainline code.
- If a V1 or V1.5 historical issue is discovered during V2 or any later stage, do not go back to the old version to rebuild or redo the fix there.
- Open a Patch Thread on the current latest mainline instead, for example:
  - `V2-Patch-01`: fix V1 inspiration-scan duplicate import behavior.
  - `V2-Patch-02`: fix V1.5 image hash historical compatibility behavior.
- A Patch Thread only fixes the approved problem and must not add new features.
- If a database change is required, add a new migration only; never modify an old migration.
- Never reset the database as part of historical issue repair.
- If historical data may already be wrong, document whether the repair needs a data-fix script, manual review, or legacy / compatibility display handling.
- After a Patch Thread is completed, update `docs/current/PATCH_LOG.md` and `docs/current/CHANGELOG_DEV.md`; update `docs/current/DATABASE_CHANGELOG.md` if database work was required; update `docs/current/KNOWN_ISSUES.md` if any limitation remains.

## Core Dependency Policy

- Unless the current thread explicitly requires it, do not upgrade core dependencies such as Next.js, React, Prisma, Tailwind, TypeScript, the main AI SDK, or the main image-processing library.
- If a new dependency is required, document:
  - why it is needed
  - whether an existing dependency can already solve the problem
  - whether it affects Windows local runtime
  - whether it affects Vercel build behavior
  - whether `package-lock.json` changes
  - how the dependency addition will be verified

## Single Active Thread Policy

- Only one active development thread is allowed at a time.
- If a Patch, docs-governance insert, or urgent fix interrupts the current thread:
  - record the current thread pause point
  - state the inserted task name
  - update `agent-memory/SESSION_LOG.md` after the inserted task finishes
  - return to the original thread explicitly
  - do not mix two thread scopes into one commit description

## Module README Policy

- Do not put module README content in `AGENTS.md`.
- Do not put module README content in `agent-memory/`.
- Keep module README files next to the corresponding code module.
- Read a module README only when modifying that module.
- When adding or substantially changing a large module, add or update that module's README and link it from `docs/current/PROJECT_MAP.md`.

## Required End-Of-Task Summary Update

After every meaningful task, update the memory files before claiming completion.

### `agent-memory/CURRENT_STATUS.md`

This file should always contain the latest high-signal summary of the project.
Keep it short and overwrite outdated details.

It must include:

- current task progress
- current product direction
- latest completed work
- current blockers or risks
- exact next recommended step

### `agent-memory/SESSION_LOG.md`

Append a short dated entry after each completed task.
Each entry should include:

- date
- task handled
- files or systems changed
- verification performed
- deployment / push status
- next handoff note

## Required End-Of-Task Workflow

After finishing any implementation task, follow this order:

1. Update `agent-memory/CURRENT_STATUS.md`
2. Append to `agent-memory/SESSION_LOG.md`
3. Run verification commands that match the change
4. Clean only safe temporary files
5. Check `git status` and confirm only intended files are included
6. Commit the task-related changes with a concise message
7. Push to `origin main` only for an approved milestone, deployment refresh, history cleanup, or explicit user request
8. Confirm the active deployment target is updated when a push/deployment was part of the task
9. Report the commit SHA and the live deployment URL when a push/deployment was part of the task

## Verification Commands

Use project-appropriate verification commands.

If a project does not yet define them, document what was or was not verified before claiming completion.

## Shell Compatibility Rules

- This workspace runs commands in PowerShell by default.
- Do not use Bash-only command chaining such as `&&` in `exec_command` calls for this repository.
- Prefer one command per tool call when possible.
- If multiple PowerShell steps must run in one command, use PowerShell-compatible sequencing instead of Bash syntax.
- When giving future handoff notes, mention shell-specific pitfalls here rather than relying on chat memory alone.

## Safe Cleanup Policy

Run the project-appropriate local cleanup step at the end of each implementation task when one exists.

Cleanup has 2 different layers and they must not be mixed:

- temporary artifact cleanup
- old-solution code cleanup

Clean temporary or generated files when they are not needed after the task.

Do not delete source code, project data, configuration, documentation, or user-created assets unless the user explicitly asks for it.

## Git Rules

- Never leave completed task changes only in the local working tree
- Prefer local commits for small or intermediate tasks; push to GitHub at approved milestones, deployment refreshes, history cleanup tasks, or explicit user requests.
- If unrelated local changes exist, do not silently include them
- Ask before pushing mixed-scope changes
- Use clear commit messages
- Before rewriting published history, record the current commit SHA, confirm the working tree is clean, state the risk, and use `--force-with-lease` rather than a blind force push.

## Default Operating Principle

The default behavior for this repository is:

- resume from documented status
- finish the task
- update summaries
- verify
- safe-clean transient files
- commit locally when the task is ready to preserve
- push only at milestones or when explicitly requested
- confirm deployment state when a push/deployment is performed

Do not leave verified changes unstaged or uncommitted unless blocked by credentials, network failure, unrelated unapproved changes, or the user explicitly asks to pause before committing.

---

## agent-memory/CURRENT_STATUS.md

# Current Status

## Current Progress

- Current stage: V1-Plus after V1-Core completion.
- Current task: EcomPilot V1-Plus Thread 03 homepage todo and processing queue final acceptance is complete after splitting AI failures into separate task-failure and request-failure todo cards.
- Working scope: homepage information organization only. The todo area is reminder-only and does not execute work.

## Current Product Direction

- Keep EcomPilot local-first: Windows local runtime, SQLite, and local `uploads/`, `exports/`, `backups/`, and `logs/`.
- Treat Vercel as read-only preview only: write attempts must return `预览环境只读，请在 Windows 本地验收。`.
- V1-Plus Thread 03 uses existing product, inspiration, material, copywriting, AI log, backup, runtime, and diagnostics foundations instead of creating a task system.

## Latest Completed Work

- Added `src/lib/services/dashboardTodoService.ts` with unified todo item types and lightweight read-only counts.
- Updated `/` to show actionable todo rows with counts, descriptions, source labels, and filtered jump links.
- Todo sources include pending inspirations, missing competitors, missing costs, low-score unhandled products, missing copywriting, missing materials, separate recent AI task failures, separate recent AI request failures, stale backup reminders, and a diagnostics-only cleanup entry.
- Trimmed older homepage product stats so old inline todo counts are not computed twice.
- Updated `docs/current/PROJECT_MAP.md` and `docs/current/CHANGELOG_DEV.md` for Thread 03.

## Current Blockers Or Risks

- Local verification after the AI failure split passed: `npm.cmd run lint`, `npm.cmd run build`, `npx.cmd prisma validate`, `npx.cmd tsc --noEmit`, `npm.cmd run encoding:check`, `git diff --check`, service-level count checks, Vercel-runtime simulation, and local browser checks for homepage plus filtered jumps.
- `npm run typecheck` and `npm test` remain not applicable because those scripts do not exist.
- Pushed Thread 03 commits through `0bfc8c3` and verified Vercel preview at `https://ecompilot-mvp.vercel.app/`.
- Vercel preview now shows the new todo section, empty actionable state, diagnostics-only cleanup entry, no duplicate local SQLite notice, and no frontend API-key/path leakage detected in the checked pages.
- Pushed the AI failure split commit `265984a` and verified Vercel `/` still shows the new todo section, empty state, diagnostics-only cleanup entry, no old combined AI failure card, and no Windows path / `.env` / API-key-like leakage; `/products/new` still shows the read-only preview warning.
- File cleanup remains an entry only; no real scan, cleanup, or deletion is implemented.
- No database schema, migration, dependency, AI automation, background task, Electron, crawler, OCR, upload automation, or agent feature was added.

## Current Documentation Entry Points

- Startup files: `AGENTS.md`, `agent-memory/CURRENT_STATUS.md`, `agent-memory/SESSION_LOG.md`.
- Then read `docs/current/DOC_INDEX.md`.
- For follow-up homepage todo work, read `PROJECT_MAP.md`, `ARCHITECTURE_RULES.md`, `THREAD_SCOPE_CHECKLIST.md`, `RISK_REGISTER.md`, `CHANGELOG_DEV.md`, and `src/lib/services/dashboardTodoService.ts`.

## Next Recommended Step

- Start the next approved thread from this verified V1-Plus Thread 03 baseline after a fresh startup read and clean working-tree check.

---

## docs/current/DOC_INDEX.md

# EcomPilot Current Documentation Index

This folder contains the active documentation for EcomPilot V1-Core. Use this file as the routing table after reading the required startup files.

## Startup Reading Flow

1. Read `AGENTS.md`.
2. Read `agent-memory/CURRENT_STATUS.md`.
3. Read `agent-memory/SESSION_LOG.md`.
4. Read `docs/current/DOC_INDEX.md`.
5. Selectively read only the additional documents needed for the current task.

Do not read every `docs/current/` file by default. Use the tables below to choose the smallest useful document set.

## Active Documents

| Document | Purpose | Read When |
| --- | --- | --- |
| `DOC_INDEX.md` | Lists the current documentation set and reading order. | Every new thread, after the agent-memory files. |
| `PROJECT_MAP.md` | Code and module map overview. | Before changing code structure, actions, services, database access, file access, AI, diagnostics, or routes. |
| `ARCHITECTURE_RULES.md` | V1-Core architecture rules and forbidden future-version work. | Before implementing behavior changes. |
| `THREAD_SCOPE_CHECKLIST.md` | Per-thread scope, side-effect, README, and acceptance checklist. | At the start of every development thread. |
| `RISK_REGISTER.md` | Current product, engineering, documentation, AI, privacy, and memory risks. | Before risk-sensitive work. |
| `CHANGELOG_DEV.md` | High-signal development history by thread/task. | When checking recent implementation history and after meaningful tasks. |
| `DATABASE_CHANGELOG.md` | Database schema and migration history. | Schema, migration, or database lifecycle tasks. |
| `PATCH_LOG.md` | Patch and regression history template. | Patch tasks or historical bug investigations. |
| `KNOWN_ISSUES.md` | Known limitations and unresolved operational notes. | When investigating known issues or leaving a limitation behind. |
| `V1_CORE_UNDERSTANDING_CHECK.md` | Plain-language V1-Core closeout and handoff check. | Before opening V1-Plus / V1.5 planning or when explaining what V1-Core does. |

## Default High-Priority Documents

- `PROJECT_MAP.md`
- `ARCHITECTURE_RULES.md`

Read these after `DOC_INDEX.md` when the task involves implementation, architecture, module boundaries, routes, services, database access, filesystem access, AI, export, backup, diagnostics, or Vercel behavior.

## Task-Specific Reading Guide

| Task Type | Required Reading |
| --- | --- |
| Risk-sensitive task | `RISK_REGISTER.md` |
| Development thread start | `THREAD_SCOPE_CHECKLIST.md` |
| Recent implementation history | `CHANGELOG_DEV.md` |
| Schema or migration task | `DATABASE_CHANGELOG.md`, plus `prisma/schema.prisma` and the latest migration folder |
| AI provider, AI copywriting, prompts, schema validation, or fallback behavior | `ARCHITECTURE_RULES.md`, `PROJECT_MAP.md`, `RISK_REGISTER.md`, `src/lib/services/ai/README.md`, and related AI/copywriting service files |
| File uploads, materials, exports, backups, logs, or diagnostics | `ARCHITECTURE_RULES.md`, `PROJECT_MAP.md`, `RISK_REGISTER.md`, related service files, `.gitignore`, `.vercelignore` |
| Vercel preview behavior | `ARCHITECTURE_RULES.md`, `PROJECT_MAP.md`, `RISK_REGISTER.md`, affected runtime/action files |
| Diagnostics | `ARCHITECTURE_RULES.md`, `PROJECT_MAP.md`, `RISK_REGISTER.md`, `src/lib/services/diagnostics/`, `src/app/system/diagnostics/` |
| Inspiration inbox, local folder scan, image dedupe, or lightweight vision suggestion | `PROJECT_MAP.md`, `ARCHITECTURE_RULES.md`, `RISK_REGISTER.md`, `DATABASE_CHANGELOG.md` when schema changes, `src/lib/services/ai/README.md`, `src/lib/services/images/README.md`, `src/lib/services/runtime/README.md`, `src/lib/services/local-paths/README.md`, and `src/lib/services/inspirations/README.md` |
| Patch or historical bug task | `PATCH_LOG.md` |
| Known issue investigation | `KNOWN_ISSUES.md` |
| Copywriting UI or banned-word review | `PROJECT_MAP.md`, related copywriting and banned-word files |
| Materials or Prompt task workflow | `PROJECT_MAP.md`, related prompt-task and material files |
| Product scoring or product detail tabs | `PROJECT_MAP.md`, related product and scoring files |
| Safety-sensitive development thread, migration planning, dependency change, destructive operation, or secret incident | `ARCHITECTURE_RULES.md`, `THREAD_SCOPE_CHECKLIST.md`, `RISK_REGISTER.md`, `CHANGELOG_DEV.md`, and `DATABASE_CHANGELOG.md` when database work is involved |
| V1-Core final acceptance or version handoff | `PROJECT_MAP.md`, `ARCHITECTURE_RULES.md`, `RISK_REGISTER.md`, `CHANGELOG_DEV.md`, `KNOWN_ISSUES.md`, all relevant module READMEs, and `V1_CORE_UNDERSTANDING_CHECK.md` |

## Patch And Historical-Issue Reading Rules

When the task is a bug fix, historical issue, Patch Thread, data repair, or migration compatibility task, read these after the startup files:

- `docs/current/PROJECT_MAP.md`
- `docs/current/ARCHITECTURE_RULES.md`
- `docs/current/THREAD_SCOPE_CHECKLIST.md`
- `docs/current/RISK_REGISTER.md`
- `docs/current/PATCH_LOG.md`
- `docs/current/KNOWN_ISSUES.md`
- `docs/current/DATABASE_CHANGELOG.md` when schema or migration compatibility is involved
- The related module README files

Document roles:

- `PATCH_LOG.md` records already fixed patches.
- `KNOWN_ISSUES.md` records unresolved or deferred issues.
- `CHANGELOG_DEV.md` records all development changes.
- `DATABASE_CHANGELOG.md` records all database changes.

Safety note:

- For migration safety, dependency changes, destructive-operation review, cache invalidation review, or secret incidents, prefer `ARCHITECTURE_RULES.md`, `THREAD_SCOPE_CHECKLIST.md`, and `RISK_REGISTER.md` together instead of reading only one document in isolation.

## Module README Policy

Module README files stay next to their code. Do not copy module-level detail into `AGENTS.md`, `agent-memory/`, or this index.

Expected module README locations include:

- `src/lib/services/ai/README.md` (exists)
- `src/lib/services/diagnostics/README.md` (exists)
- `src/lib/services/runtime/README.md` (exists)
- `src/lib/services/local-paths/README.md` (exists)
- `src/lib/services/logging/README.md` (exists)
- `src/lib/services/images/README.md` (exists)
- `src/lib/services/materials/README.md` (exists)
- `src/lib/services/copywriting/README.md` (exists)
- `src/lib/services/inspirations/README.md` (exists)

Do not read every module README by default. Read a module README only when modifying the corresponding module or when `PROJECT_MAP.md` points to it for the current task.

For final integration or version-handoff threads, read all module READMEs that belong to the modules being accepted, then update this index only with routing information rather than copying module details here.

## Archived Or Historical Documents

Historical design and acceptance documents live under `docs/superpowers/`. They are useful for context but are not the current operating contract when they conflict with `docs/current/`, `AGENTS.md`, `agent-memory/`, or the current thread scope.

## Documentation Update Rule

After every meaningful implementation task:

1. Update `agent-memory/CURRENT_STATUS.md`.
2. Append to `agent-memory/SESSION_LOG.md`.
3. Update `CHANGELOG_DEV.md` if the task changes source behavior, architecture, docs, or operational process.
4. Update `DATABASE_CHANGELOG.md` if schema or migrations change.
5. Add a `KNOWN_ISSUES.md` entry when a limitation remains.
6. Add a `PATCH_LOG.md` entry when repairing an existing defect.
7. Commit locally when the task is ready to preserve.
8. Push to GitHub only for approved milestones, deployment refreshes, history cleanup tasks, or explicit user requests.

---

## docs/current/PROJECT_MAP.md

# EcomPilot Project Map

EcomPilot V1-Core is a Windows local-first Next.js application for personal ecommerce product evaluation, copywriting, inspiration inbox review, material management, export, backup, AI base services, and diagnostics.

V1-Core-07 final integration acceptance passed locally on 2026-05-30. Future net-new features should move to V1-Plus or later; V1-Core should only receive tightly scoped Patch work.

## Runtime Shape

- Framework: Next.js App Router, React, TypeScript.
- Database: Prisma and SQLite, configured by `DATABASE_URL`.
- Local runtime folders: `uploads/`, `exports/`, `backups/`, and `logs/`.
- Vercel: preview-only and read-only. Vercel must not perform real local SQLite writes, uploads, exports, backups, log writes, or high-cost AI calls.

## Pages

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Dashboard summary and recent local work. |
| `/products` | `src/app/products/page.tsx` | Product pool list and filters. |
| `/products/new` | `src/app/products/new/page.tsx` | Product creation form. |
| `/products/[id]` | `src/app/products/[id]/page.tsx` | Product detail tabs. |
| `/products/[id]/edit` | `src/app/products/[id]/edit/page.tsx` | Product editing form. |
| `/copywriting` | `src/app/copywriting/page.tsx` | Multi-platform copywriting workspace, history-preserving drafts, manual editing, usage marking, and AI fallback handling. |
| `/prompt-tasks` | `src/app/prompt-tasks/page.tsx` | Prompt task list and creation. |
| `/prompt-tasks/[taskCode]/upload` | `src/app/prompt-tasks/[taskCode]/upload/page.tsx` | Upload generated or manual material for a Prompt task. |
| `/materials` | `src/app/materials/page.tsx` | Material library. |
| `/inspirations` | `src/app/inspirations/page.tsx` | Manual-scan inspiration inbox with status filtering, notes, processing records, archive/reject, optional AI suggestion, and confirm-then-convert flow. |
| `/settings/ai` | `src/app/settings/ai/page.tsx` | AI provider settings. |
| `/settings/banned-words` | `src/app/settings/banned-words/page.tsx` | Banned-word settings. |
| `/export` | `src/app/export/page.tsx` | Excel export. |
| `/backup` | `src/app/backup/page.tsx` | Manual local backup. |
| `/system/diagnostics` | `src/app/system/diagnostics/page.tsx` | Local diagnostics center and sanitized diagnostic summary. |

## Actions

| Area | Action File | Notes |
| --- | --- | --- |
| Product CRUD and upload | `src/app/products/actions.ts` | Must enforce local write checks and use product/file services. |
| Copywriting | `src/app/copywriting/actions.ts` | AI failures must not block manual editing or non-AI data work. |
| Prompt tasks | `src/app/prompt-tasks/actions.ts` | Must preserve task status rules and Vercel read-only fallback. |
| Materials | `src/app/materials/actions.ts` | Must avoid unsafe file deletion. |
| Inspirations | `src/app/inspirations/actions.ts` | Thin validation wrappers for folder, scan, note, review/archive/reject, AI suggestion, and confirm-convert actions; Vercel writes/AI calls stay blocked by runtime services. |
| Settings | `src/app/settings/actions.ts` | Must never leak full API keys to the frontend. |
| Export | `src/app/export/actions.ts` | Writes only in local writable runtime. |
| Backup | `src/app/backup/actions.ts` | Keeps backup filesystem traversal runtime-only. |
| Diagnostics | `src/app/system/diagnostics/actions.ts` | Returns sanitized text; Vercel stays read-only. |

## Services And Modules

| Area | Files | Responsibility |
| --- | --- | --- |
| Runtime mode | `src/lib/services/runtime/`, `src/lib/modules/products/runtime.ts`, `src/lib/services/product-runtime-service.ts` | Detect local/preview/cloud runtime and normalize read/write errors. |
| Local paths | `src/lib/services/local-paths/` | Known local runtime folders, safe display labels, directory creation/checks, filename and path safety. |
| Logging | `src/lib/services/logging/` | Sanitized local `logs/app.log` and `logs/error.log`; console fallback on Vercel. |
| AI base | `src/lib/services/ai/`, `src/lib/services/ai-client.ts` | Shared model registry, client factory, prompt sanitizer, output validator, AIJob, AIRequestLog, and cost estimates. |
| Products | `src/lib/services/product-service.ts`, `src/lib/services/product-mutation-service.ts`, `src/lib/modules/products/` | Product reads, writes, formatting, SPU generation, status. |
| Images/uploads | `src/lib/services/images/`, `src/lib/services/file-storage-service.ts`, `src/app/api/uploads/[...path]/route.ts` | Unified image validation, short filenames, local upload writes, thumbnail generation, file hash metadata, and safe serving. |
| Scoring | `src/lib/services/scoring-service.ts`, `src/lib/modules/scoring/` | Rule-based scoring only. |
| Copywriting | `src/lib/services/copywriting-service.ts`, `src/lib/services/copywriting/README.md`, `src/lib/modules/copywriting/` | Multi-platform package generation, history-preserving drafts, manual editing, banned-word scan reuse, usage marking, and AI base reuse. |
| Prompt tasks | `src/lib/services/prompt-task-service.ts`, `src/lib/modules/prompt-task/` | Prompt generation templates and task persistence. |
| Materials | `src/lib/services/material-service.ts`, `src/lib/services/materials/README.md`, `src/lib/modules/materials.ts` | Material records, image metadata persistence, thumbnail-first display data, and status updates. |
| Inspirations | `src/lib/services/inspirations/`, `src/lib/services/inspirations/README.md` | Local inspiration-folder setting, manual scan, fileHash dedupe, review-only drafts, status management, processing records, optional AI suggestion, ScanLog, and confirm-then-convert product flow. |
| Export | `src/lib/services/export-service.ts`, `src/app/api/exports/[id]/route.ts` | Local Excel export and safe download. |
| Backup | `src/lib/services/backup-service.ts`, `src/lib/services/backup-log-service.ts`, `src/lib/services/file-copy-service.ts` | Manual local backup, backup history, and display-safe backup path labels. |
| Diagnostics | `src/lib/services/diagnostics/` | Runtime, database, directory, log, and AI status summaries. |
| Query services | `src/lib/services/query-service.ts` | Unified list-query parameter defaults, normalization, boolean filters, numeric ranges, and sort handling for V1-Plus search/filter pages. |
| Dashboard todos | `src/lib/services/dashboardTodoService.ts` | Read-only homepage todo summary from products, inspirations, materials, copywriting, AI logs, backup records, runtime, and diagnostics entry points. |

## Module README Index

| Module | README |
| --- | --- |
| AI base | `src/lib/services/ai/README.md` |
| Diagnostics | `src/lib/services/diagnostics/README.md` |
| Runtime mode | `src/lib/services/runtime/README.md` |
| Local paths | `src/lib/services/local-paths/README.md` |
| Logging | `src/lib/services/logging/README.md` |
| Images/uploads | `src/lib/services/images/README.md` |
| Materials | `src/lib/services/materials/README.md` |
| Copywriting | `src/lib/services/copywriting/README.md` |
| Inspirations | `src/lib/services/inspirations/README.md` |

Read module README files only when modifying that module.

## Acceptance And Handoff Artifacts

| Artifact | Purpose |
| --- | --- |
| `scripts/v1-core-07-acceptance.mts` | V1-Core final service-level acceptance: diagnostics, runtime, AI, image safety, multi-platform copywriting, inspiration scan, MVP regression, and Vercel read-only simulation. |
| `scripts/thread08-final-acceptance.mts` | Historical MVP service acceptance for product, competitor, scoring, copywriting fallback, prompt/material linkage, export, and backup. |
| `docs/current/V1_CORE_UNDERSTANDING_CHECK.md` | Plain-language explanation of what V1-Core added, daily use, failure handling, Vercel limits, and pre-next-thread backup expectations. |

## Prisma Models

Current models in `prisma/schema.prisma`:

- `Product`
- `AppSetting`
- `ProductVariant`
- `Competitor`
- `Copywriting`
- `PromptTask`
- `Material`
- `Inspiration`
- `ScanLog`
- `ScoreSnapshot`
- `AIProvider`
- `AIRequestLog`
- `AIJob`
- `BannedWord`
- `OperationLog`
- `ExportLog`
- `BackupLog`

Schema changes require a new migration. Do not edit old migrations and do not reset the database unless the user explicitly confirms a test-only reset.

## Main Entry Functions

| Function | File | Side Effects |
| --- | --- | --- |
| `getRuntimeModeSummary` | `src/lib/services/runtime/runtimeService.ts` | Reads environment only. |
| `assertLocalWritable` | `src/lib/services/runtime/runtimeService.ts` | Throws a user-safe readonly error when writes are blocked. |
| `inspectLocalRuntimeDirectories` | `src/lib/services/local-paths/localPathsService.ts` | Checks/creates known local folders only in local writable runtime. |
| `sanitizeFileName` / `assertPathLength` | `src/lib/services/local-paths/pathSafetyService.ts` | Sanitizes filenames and blocks overly long write paths. |
| `logInfo` / `logWarn` / `logError` | `src/lib/services/logging/loggingService.ts` | Writes sanitized local logs; Vercel uses console fallback only. |
| `createAIClient` | `src/lib/services/ai/aiClientFactory.ts` | Performs server-side AI calls only in local writable runtime and logs sanitized request outcomes. |
| `createAIJob` / `markAIJob*` | `src/lib/services/ai/aiJobService.ts` | Writes lightweight AI task state in local writable runtime only. |
| `createAIRequestLog` | `src/lib/services/ai/aiRequestLogService.ts` | Writes sanitized AI request logs and rough cost estimates in local writable runtime only. |
| `saveInspirationFolderPath` | `src/lib/services/inspirations/inspirationSettingsService.ts` | Writes the local-only inspiration folder setting after folder validation. |
| `runManualInspirationScan` | `src/lib/services/inspirations/inspirationScanService.ts` | Reads the configured local folder, copies new images into `uploads/inspirations/`, creates review drafts, and records `ScanLog`. |
| `generateInspirationAiSuggestion` | `src/lib/services/inspirations/inspirationAiService.ts` | Performs local-only lightweight image suggestion through AIJob plus schema validation. |
| `markReviewed` / `archiveInspiration` / `rejectInspiration` | `src/lib/services/inspirations/inspirationService.ts` | Update inspiration processing state and write shared `OperationLog` records in local writable runtime only. |
| `convertInspirationToProduct` / `convertToProduct` | `src/lib/services/inspirations/inspirationService.ts` | Creates a formal `Product` only after explicit confirmation, preserves the source inspiration, links `convertedProductId`, and blocks repeat conversion. |
| `createExcelExport` | `src/lib/services/export-service.ts` | Writes `exports/` and `ExportLog` in local runtime only. |
| `createManualBackup` | `src/lib/services/backup-service.ts` | Writes `backups/` and `BackupLog` in local runtime only. |
| `getBackupDisplayPath` | `src/lib/services/backup-log-service.ts` | Converts real or historical backup paths into safe `backups/.../` display labels; no writes. |
| `getDiagnosticsSnapshot` | `src/lib/services/diagnostics/diagnosticsService.ts` | Reads runtime, database, directory, log, and AI status. |
| `buildDiagnosticsMarkdown` | `src/lib/services/diagnostics/diagnosticsSanitizer.ts` | Builds sanitized markdown text; no writes. |
| `normalizeProductPoolQuery` / `normalizeMaterialLibraryQuery` / `normalizeCopywritingListQuery` / `normalizePromptTaskQuery` / `normalizeInspirationListQuery` | `src/lib/services/query-service.ts` | Normalizes read-only list query parameters before service-layer Prisma queries; no writes. |
| `getDashboardTodoSummary` | `src/lib/services/dashboardTodoService.ts` | Computes homepage todo reminders and filtered jump links from existing records; no writes, no filesystem scan, no AI call. |

## Side Effect Map

| Side Effect | Allowed Location |
| --- | --- |
| Write database | Services called by server actions, local writable runtime only. |
| Read database | Services. Pages may call services but must not hold query logic. |
| Write uploads | File service and related actions only, local writable runtime only. |
| Write exports | Export service only, local writable runtime only. |
| Write backups | Backup service only, local writable runtime only. |
| Write logs | Logging service only; local `logs/app.log` and `logs/error.log`, no real local log writes on Vercel. |
| Call AI | `src/lib/services/ai/` only. Failures must be caught, logged as sanitized summaries, and surfaced as friendly fallback. |
| Generate diagnostic text | Diagnostics service/action and client download only. |

## Forbidden Modification Points

- Do not move business logic into `page.tsx` or client components.
- Do not expose `.env`, API keys, full local paths, SQLite file paths, full stack traces, or full prompts to the frontend.
- Do not implement login, cloud accounts, payments, crawlers, OCR, link parsing, API image generation, Electron, scheduled jobs, or agent systems in V1-Core.
- Do not convert Vercel preview into a writable runtime.
- Do not edit old migrations or reset the database without explicit test-only approval.

---

## docs/current/ARCHITECTURE_RULES.md

# EcomPilot Architecture Rules

These rules apply to EcomPilot V1-Core. They override older historical specs when there is a conflict.

## Version Boundary

V1-Core is a Windows local-first tool for product evaluation, copywriting generation and manual editing, review-only inspiration inbox handling, material management, export, backup, AI base services, and local diagnostics.

Do not implement V1-Plus, V1.5, V2, or V3 features inside V1-Core threads unless a future approved thread explicitly changes scope.

## Page And Service Boundary

- Pages and client components handle display, form interaction, action calls, and success/error messages.
- Business logic belongs in `src/lib/services/` or `src/lib/modules/`.
- Database queries, filesystem access, AI calls, export generation, backup copying, and diagnostics collection must not be implemented directly inside `page.tsx`.
- Server actions should be thin wrappers that call services, catch known errors, revalidate paths when needed, and return user-safe messages.

## Documentation Reading Rules

- At task startup, read `AGENTS.md`, `agent-memory/CURRENT_STATUS.md`, `agent-memory/SESSION_LOG.md`, then `docs/current/DOC_INDEX.md`.
- Do not read all `docs/current/` documents by default.
- Use `DOC_INDEX.md` to choose the smallest relevant document set.

## Module README Rules

- Large modules should have code-adjacent README files.
- Put module README files under paths such as `src/lib/services/**/README.md` or `src/lib/modules/**/README.md`.
- Do not copy module README content into `AGENTS.md` or `agent-memory/`.
- Read a module README only when working on that module.

## Runtime Boundary

- Windows local runtime is the writable source of truth.
- Vercel is preview-only and read-only.
- Vercel must not write SQLite, `uploads/`, `exports/`, `backups/`, or `logs/`.
- Vercel must not perform high-cost AI calls.
- Preview write attempts must return a friendly note: `预览环境只读，请在 Windows 本地验收。`
- Runtime checks must reuse `src/lib/services/runtime/`.

## Filesystem Rules

- Local runtime folders are `uploads/`, `exports/`, `backups/`, and `logs/`.
- Folder creation and checks should go through `src/lib/services/local-paths/`.
- Image upload, validation, hash, and thumbnail generation should go through `src/lib/services/images/`.
- Frontend output must not show full absolute local paths or full SQLite database paths.
- Diagnostic and export outputs must use safe relative labels or sanitized filenames.
- Do not delete source code, project data, configuration, documentation, or user assets as part of safe cleanup.

## Secret And Error Safety

- Never expose API keys, `.env` values, local full paths, SQLite paths, full stack traces, raw AI prompts, or sensitive cost data to frontend output, logs, exports, backups, or diagnostics packages.
- User-facing errors should be friendly summaries.
- Application logs must use `src/lib/services/logging/` and must sanitize API keys, full paths, database paths, full prompts, and stack frames.
- Vercel logging must be console-only fallback and must not write local log files.

## AI Rules

- AI calls must stay inside `src/lib/services/ai/` or the compatibility facade `src/lib/services/ai-client.ts`.
- API keys are server-side only.
- Model names belong in the AI provider settings or model registry, not page components.
- AI outputs must be schema-validated before writing formal business records.
- Prompt and error summaries must be sanitized before logging or diagnostics display.
- AI failures must not block non-AI capabilities such as saving products, scoring, material upload, export, backup, or diagnostics.
- Manual fallback remains a first-class behavior.
- AIJob and AIRequestLog are allowed in V1-Core-03 only as lightweight status/log tables. Do not turn them into a background queue, agent system, automatic routing layer, or cost report.
- Copywriting history must be preserved across different AI jobs. Do not globally overwrite historical rows by `productId + platform + version`.
- Multi-platform copywriting in V1-Core may add usage markers, but only one used row per `productId + platform` may be active at a time.
- V1-Core-06 inspiration AI is limited to optional single-image lightweight suggestion with schema validation; it must not become OCR, link parsing, agent routing, bulk automation, or automatic fact creation.

## Inspiration Inbox Rules

- V1-Core-06 allows only local folder setting, manual scan, fileHash dedupe, review-only inspiration drafts, optional lightweight AI suggestion, ignore, confirm-then-convert, and diagnostics summary.
- Manual scan must stay foreground and user-triggered. Do not add scheduled scan, background scan, or worker queues.
- Scanned images must be copied into managed `uploads/inspirations/` paths with short filenames; do not rely on the source folder forever.
- Frontend and diagnostics must not show the real configured folder path.
- AI suggestions must be labeled as reference-only and must not auto-create products or auto-write factual fields.

## Database Rules

- Database changes require a new Prisma migration.
- Do not modify old migration folders.
- Do not reset the database unless the user explicitly confirms the reset is for a test environment.
- Before schema changes, read `prisma/schema.prisma`, latest migrations, and affected services.
- SQLite WAL and `busy_timeout` may be attempted through Prisma raw PRAGMA during local diagnostics/startup-adjacent checks; this is runtime stability work, not schema migration work.

## Database Migration Safety

- If Prisma schema or migration work is involved, do not modify old migrations.
- Do not reset a real database.
- Before running a migration, strongly consider backing up the local SQLite database.
- Run migration preparation in this order:
  - `prisma validate`
  - `prisma generate`
  - `prisma migrate dev`
- After a migration completes, update `docs/current/DATABASE_CHANGELOG.md`.
- If a migration fails, stop and report the failure cause plus safe repair suggestions. Do not force the issue with a reset.
- If old data is incomplete, use `nullable`, `legacy`, `unknown`, or an explicit data-repair script. Do not fabricate missing historical values.

## Cache Invalidation Policy

- Any Server Action or server-side write must document its cache invalidation strategy.
- Copywriting writes must at least consider:
  - `/copywriting`
  - `/products/[id]`
  - `/system/diagnostics` when related summaries or counts change
- Product writes must at least consider:
  - `/products`
  - `/products/[id]`
  - homepage or dashboard paths when their statistics change
- Material writes must at least consider:
  - `/materials`
  - `/products/[id]`
  - `/system/diagnostics` when related summaries or counts change
- Inspiration writes must at least consider:
  - `/inspirations`
  - `/products`
  - `/products/[id]` when a conversion creates a product
  - `/system/diagnostics` when related summaries or counts change
- If `revalidatePath` or `revalidateTag` is used, mention that explicitly in the delivery summary.
- If no cache invalidation is added yet, explain why and what stale-data risk remains.

## Historical Patch Rules

- Historical bugs must be fixed on the current latest mainline instead of by returning to an old version branch or recreating an old release state.
- Patch Threads only solve the approved problem and must not expand scope into new features.
- Do not modify old migrations.
- Do not reset real data to repair a historical bug.
- Do not use a bug-fix thread as a reason to refactor unrelated modules.
- If historical data may already be wrong, explicitly decide whether the patch needs:
  - a data repair script
  - a `legacy` or `uncertain` marker on old data
  - manual review or confirmation
- Do not fabricate missing historical AI-generated data. For example, if an older `AIRequestLog` row has no `estimatedCost`, keep it `null` or label it legacy instead of guessing a number.
- Patch work resolves the approved defect only and must not expand requirements.

## Data Repair Script Policy

- If a Patch or historical fix needs a data-repair script, the script must:
  - support a dry-run mode
  - report how many records would be affected
  - avoid automatic deletion of data
  - be safe to run more than once without repeated damage
  - require a backup before execution
  - print a repair summary after execution
- After running or shipping a data-repair script, update `docs/current/PATCH_LOG.md`.
- If the repair also depends on database structure changes, update `docs/current/DATABASE_CHANGELOG.md`.

## Dependency Policy

- Unless the current thread explicitly requires it, do not upgrade core dependencies such as Next.js, React, Prisma, Tailwind, TypeScript, the main AI SDK, or the primary image-processing library.
- Before adding any new dependency, document:
  - why it is needed
  - whether an existing dependency can be reused instead
  - whether it affects Windows local runtime
  - whether it affects Vercel build behavior
  - whether it changes `package-lock.json`
  - how it will be verified

## Secret Incident Policy

- If an API key, token, recovery code, database path, full local path, or other sensitive value is found in frontend output, logs, docs, diagnostics packages, or exports, stop the current development task immediately.
- Record the risk in the relevant docs and remove the sensitive value from code paths, logs, or output artifacts.
- Tell the user to rotate or revoke the exposed credential or secret at the source platform.
- Do not treat file deletion alone as a complete response to secret exposure.
- Add or strengthen sanitization tests or checks after the incident is addressed.

## V1-Core Freeze / Release Policy

- After V1-Core-07 final acceptance passes, mark `agent-memory/CURRENT_STATUS.md` as `V1-Core completed`.
- Create a git tag when practical, or at minimum record the final commit used as the V1-Core completion point.
- New feature work after that point belongs in `V1-Plus`.
- V1-Core no longer accepts net-new features after freeze; only Patch work remains allowed.
- Unfinished enhancements must move into `KNOWN_ISSUES.md` or later-version planning instead of being forced back into V1-Core.

## Git And Deployment Cadence

- Keep continuity files current after each meaningful task, but do not push every small local change by default.
- Prefer local commits during small tasks, acceptance-only notes, and UI micro-patches.
- Push to GitHub when a milestone is complete, when Vercel needs a deployment refresh, when cleaning repository history, or when the user explicitly asks.
- When published history must be rewritten, record the pre-rewrite commit SHA, confirm the tree is clean, state the risk, and use `--force-with-lease`.

## V1-Core-07 Acceptance Boundary

- V1-Core-07 is a closeout thread, not a feature thread.
- It may add or update acceptance scripts, README/current docs, and memory files.
- It may fix only regressions that block V1-Core acceptance.
- It must not add V1-Plus, V1.5, V2, or V3 product functionality.
- It must verify that Vercel remains read-only for SQLite, uploads, exports, backups, logs, AI calls, inspiration scans, and conversion writes.

## V1-Core Forbidden Implementation List

Do not implement these features in V1-Core unless a future approved thread explicitly changes scope:

- login/register
- cloud accounts
- payments
- platform crawlers
- automatic product collection/listing/messaging/commenting
- OCR
- link parsing
- API image generation
- Electron
- notification center
- search center
- scheduled tasks
- multi-agent systems
- AIJob behavior beyond the approved V1-Core-03 lightweight status layer
- AIRequestLog cost statistics beyond per-request rough estimates and diagnostic totals
- multi-platform copywriting expansion outside the current copywriting scope
- advanced AI image recognition beyond the approved V1-Core-06 lightweight suggestion
- scheduled or background inspiration folder scanning beyond the approved V1-Core-06 manual scan
- image compression
- file cleanup workflows

## Image Upload Rules

- V1-Core supports `jpg`, `jpeg`, `png`, and `webp` uploads.
- Default maximum single-image size is 10MB.
- Uploads must use short generated filenames and store relative paths only.
- Material uploads should record `fileHash`, `mimeType`, size, width/height, `thumbnailPath`, `sourceType`, and `usagePermission` when available.
- Thumbnail generation may fail without failing the original upload, but the warning must be logged and display should fall back to the original image.
- Vercel preview must not perform real image writes.
- Do not add AI image generation, OCR, auto-cropping, similarity search, historical compression, or cleanup behavior inside V1-Core-04.

## Diagnostics Rules

- Diagnostics must not mutate business data, user assets, exports, backups, settings, or schema.
- Diagnostics may create missing local runtime folders and test directory writability with non-persistent temporary probes only in local writable runtime.
- Diagnostics must not write logs or diagnostic packages to disk in Vercel.
- Diagnostics may write one controlled local test error through the logging service for acceptance, but it must be sanitized and blocked on Vercel.
- The diagnostics summary must be sanitized markdown or JSON and must not include secrets, full paths, full prompts, full stacks, or sensitive cost data.

---

## docs/current/THREAD_SCOPE_CHECKLIST.md

# Thread Scope Checklist

Copy this checklist into working notes for every development thread before coding. Fill it with concrete answers, then use it for the final boundary check.

## Thread Identification

- Thread name:
- Date:
- Current version scope: V1-Core / other approved scope:
- Product direction confirmed:
- Thread type: standard feature / Patch Thread / docs-only / other:
- Existing working-tree changes belong to:

## Pre-Thread Safety Check

- Was `git status --short` checked before work started? yes/no
- If the tree was dirty, was the existing scope explained? yes/no
- Does this thread touch database structure, filesystem writes, batch writes, or AI batch generation? yes/no
- If yes, was backup need evaluated first? yes/no
- Any destructive operation planned? yes/no
- If yes, were the risks stated before execution? yes/no
- Any database reset planned? yes/no
- If yes, did the user explicitly confirm it is a disposable test database? yes/no

## Goal

- This thread goal:
- User-visible acceptance result:
- Non-goals:

## Patch Classification

- Is this a standard feature thread or a Patch Thread?
- If Patch:
  - Origin version:
  - Discovered in version:
  - Severity: P0 / P1 / P2 / P3 / P4
  - Historical data affected? yes/no
  - New migration required? yes/no
  - Data repair script required? yes/no
  - Manual confirmation required for old data? yes/no
  - `PATCH_LOG.md` updated? yes/no
  - `KNOWN_ISSUES.md` updated? yes/no
  - `DATABASE_CHANGELOG.md` updated? yes/no
- If not Patch:
  - Did this thread accidentally repair a historical issue? yes/no
  - If yes, was it recorded in `CHANGELOG_DEV.md` or `PATCH_LOG.md`? yes/no

## Allowed Modification Range

- Pages allowed:
- Components allowed:
- Actions allowed:
- Services/modules allowed:
- Prisma/schema allowed:
- Documentation allowed:
- Scripts/tests allowed:

## Documentation And README Check

- Does this thread need to read a module README? yes/no
- Which module README files were read:
- Does this thread add or substantially change a large module? yes/no
- If yes, README added or updated:
- If yes, `PROJECT_MAP.md` README link updated:

## Forbidden Content

Confirm this thread does not implement:

- [ ] login/register
- [ ] cloud accounts
- [ ] payments
- [ ] platform crawlers
- [ ] automatic collection/listing/messaging/commenting
- [ ] OCR
- [ ] link parsing
- [ ] API image generation
- [ ] Electron
- [ ] notification center
- [ ] search center
- [ ] scheduled tasks
- [ ] multi-agent systems
- [ ] AIJob or AIRequestLog cost statistics
- [ ] out-of-thread AI, material, cleanup, or export features

## Side Effects

- Involves database? yes/no
  - If yes, schema change? yes/no
  - New migration required? yes/no
  - Old migrations untouched? yes/no
  - Backup recommended before migration? yes/no
  - `prisma validate` run first? yes/no
  - `prisma generate` run before `migrate dev`? yes/no
  - `DATABASE_CHANGELOG.md` update required? yes/no
  - Migration failure stop-plan prepared instead of reset? yes/no
  - Legacy / nullable / unknown / repair-script strategy for incomplete old data:
- Involves filesystem? yes/no
  - Reads:
  - Writes:
  - Cleanup:
  - Path sanitization plan:
- Involves AI? yes/no
  - Provider touched:
  - Fallback plan:
- Affects Vercel read-only behavior? yes/no
  - Preview-safe behavior:
  - Write-block message:
- Cache invalidation plan after writes:
  - Paths/tags:
  - Why these paths/tags:
  - If none, stale-data risk:

## Acceptance Criteria

- Local Windows acceptance:
- Vercel preview acceptance:
- Security/privacy acceptance:
- Failure-mode acceptance:

## Verification Plan

- Commands to run:
- Browser routes to check:
- Data setup needed:
- Cleanup needed:

## Data Repair Script Check

- Does this thread need a data-repair script? yes/no
- If yes:
  - Dry-run supported? yes/no
  - Affected-row count reported? yes/no
  - No automatic deletion? yes/no
  - Safe to rerun? yes/no
  - Backup required before execution? yes/no
  - Post-run repair summary required? yes/no
  - `PATCH_LOG.md` update required? yes/no
  - `DATABASE_CHANGELOG.md` update required? yes/no

## Patch Severity Rules

- `P0`: Causes data loss, API key leakage, wrong file deletion, database startup failure, backup/restore danger, or Vercel writing real data. Pause current development and fix immediately.
- `P1`: Breaks a core flow such as product save, scoring, copywriting save, image upload, export, or backup. Open a high-priority Patch Thread.
- `P2`: Meaningful impact with a workaround. Schedule it into the current version's Patch Thread.
- `P3`: Minor UX, display, or non-core error. Record it in `KNOWN_ISSUES.md` and handle it near version closeout.
- `P4`: Not a bug. Treat it as an enhancement request for a later roadmap thread, not a Patch Thread.

## Boundary Check

- [ ] Page components only display/interact/call actions.
- [ ] Business logic remains in services/modules.
- [ ] No full local paths exposed.
- [ ] No API keys or `.env` values exposed.
- [ ] No full stack traces exposed.
- [ ] No raw AI prompts exported unintentionally.
- [ ] Vercel preview stays read-only.
- [ ] No unrelated module refactor.
- [ ] No future-version feature added.
- [ ] Patch Threads fix the approved issue only and do not expand scope.
- [ ] Historical fixes stay on the current latest mainline.
- [ ] Old migrations remain untouched and no database reset was used.
- [ ] Backup need was checked before risky writes, migrations, or repair scripts.
- [ ] Cache invalidation strategy was defined or its risk was documented.
- [ ] Core dependencies were not upgraded without explicit thread scope.
- [ ] Secret exposure handling is stop-and-rotate, not delete-and-ignore.
- [ ] Only one active development thread was in progress for this work.
- [ ] This thread checked whether a module README is needed.
- [ ] If this thread adds or substantially changes a large module, its module README was added or updated.
- [ ] If a module README was added or updated, `docs/current/PROJECT_MAP.md` links to it.
- [ ] Module-level details were not copied into `AGENTS.md` or `agent-memory/`.
- [ ] `CURRENT_STATUS.md` and `SESSION_LOG.md` remain short.
- [ ] Agent memory and dev changelog will be updated before final response.

---

## docs/current/KNOWN_ISSUES.md

# EcomPilot Known Issues

Use this file to track known limitations that remain after a thread. Keep entries short and actionable.

Use this file for deferred fixes, unresolved Patch follow-up, pending data-repair decisions, or post-incident secret-rotation follow-up when the problem is not fully closed yet.

## Current Known Issues

### External AI success depends on user credentials

- Status: Known limitation.
- Impact: AI generation may fail without valid provider credentials, but manual copywriting fallback remains available.
- Mitigation: Keep AI errors friendly and isolated from non-AI workflows.

### Vercel preview is read-only

- Status: Intended limitation.
- Impact: Preview can display degraded/read-only pages but cannot validate real SQLite writes, uploads, exports, backups, or logs.
- Mitigation: Final acceptance for writes must happen in Windows local runtime.

### Restore is not implemented

- Status: Future work.
- Impact: Manual backup exists, but users cannot restore from the app UI yet.
- Mitigation: Keep backup restore clearly labeled as future work and do not imply full disaster recovery.

### Vercel recovery codes existed in Git history

- Status: Operational risk.
- Impact: The file is removed from the current tree, but historical exposure still requires account-side rotation/revocation.
- Mitigation: Rotate/revoke recovery codes in the Vercel account.

### V1-Core is feature-frozen after final acceptance

- Status: Intended limitation.
- Impact: Net-new product behavior should not be added to V1-Core after the final closeout commit.
- Mitigation: Route enhancements such as search, notifications, scheduled scanning, OCR, link parsing, restore, and Electron into V1-Plus / V1.5 / V2 planning.

## Known Issue Template

### Issue ID

For example: `KI-001`

### Found In

Version where the issue was discovered.

### Origin Version

Version where the issue likely started.

### Severity

`P0 / P1 / P2 / P3 / P4`

### Description

What is wrong.

### Impact

What is affected.

### Workaround

Temporary way to reduce impact.

### Planned Fix

Planned patch or future version.

### Status

`open / investigating / deferred / fixed`

---

## docs/current/RISK_REGISTER.md

# EcomPilot Risk Register

| Risk | Current Level | Why It Matters | Mitigation |
| --- | --- | --- | --- |
| Scope drift | High | Future threads may accidentally add V1-Plus/V2 features such as crawlers, cloud accounts, Electron, scheduled jobs, or agent workflows. | Start each thread with `THREAD_SCOPE_CHECKLIST.md`; include a boundary check in final reports. |
| Database migration risk | High | SQLite is the local source of truth. Broken migrations can block local users or corrupt workflow state. | Add only new migrations; never edit old migrations; avoid reset unless explicitly test-only. |
| File/database mismatch | High | Products, materials, exports, and backups can reference local files that no longer exist. | Use service-layer checks, soft/friendly failures, and diagnostics summaries before destructive cleanup. |
| API key leakage | High | AI provider settings may contain sensitive keys. | Never render full keys; never export `.env`; sanitize diagnostics and logs. |
| AI prompt or response leakage | High | AI calls and diagnostic logs can accidentally expose API keys, full prompts, local paths, supplier details, or stack traces. | Route calls through `src/lib/services/ai/`; store only sanitized summaries in `AIJob` and `AIRequestLog`; diagnostics shows existence/status only. |
| AI cost estimate misunderstanding | Medium | Estimated AI cost is approximate and may differ from provider bills. | Label cost as estimate, store unit price snapshot, and avoid V1-Core cost reports. |
| Vercel write operation risk | High | Vercel has no durable local SQLite/uploads/exports/backups/logs and must remain preview-only. | Runtime checks must block writes and show `预览环境只读，请在 Windows 本地验收。` |
| AI output instability | Medium | AI content may be malformed, unsafe, or unavailable. | Keep manual fallback; validate structured output before business writes; mark AIJob failed and record sanitized AIRequestLog on failure. |
| Image file growth | Medium | Local `uploads/` can grow quickly and affect backup size. | Avoid automatic cleanup in V1-Core; expose status through diagnostics; future cleanup must be conservative. |
| Thumbnail dependency risk | Medium | Thumbnail generation now imports `sharp`, a native image dependency that can be platform-sensitive during install/build. | Keep `sharp` as a direct dependency, verify on Windows local with lint/build, and allow original upload to succeed if thumbnail generation fails. |
| Image permission misuse | High | Reference-only images could accidentally be treated as publishable product assets. | Store `usagePermission`, show the reference-only warning in material views, and keep future publish/export logic permission-aware. |
| Backup/restore risk | High | Backup exists, but restore is not implemented. Incomplete backup or restore assumptions can create false confidence. | Keep restore labeled as future work; copy SQLite sidecar files; document latest backup status in diagnostics. |
| Diagnostic information leakage | High | Diagnostics may accidentally include API keys, full paths, database paths, stack traces, or raw prompts. | Use `diagnosticsSanitizer.ts`; summary must use status and relative labels only. |
| Encoding inconsistency | Medium | Some older docs or terminal output can display mojibake, making future edits risky. | Prefer clean UTF-8 in current docs and touched source files; use `npm.cmd run encoding:check` and Node/TypeScript/build output rather than PowerShell display when checking actual file content. |
| Prisma client lock on Windows | Medium | Windows file locks can cause `EPERM rename query_engine-windows.dll.node` during generate. | Stop Node/Next/Prisma processes before install/generate when needed; document in handoffs. |
| Build trace pulling runtime files | Medium | Backup/export filesystem code can be traced into builds if imported incorrectly. | Keep runtime-only filesystem code behind known patterns and guarded build script. |
| Startup memory files grow too long | Medium | Long startup files increase startup cost and make every thread slower. | Keep `CURRENT_STATUS.md` short; keep only recent tasks in `SESSION_LOG.md`; archive older logs. |
| Old archive information misleads current development | Medium | Archived plans may conflict with V1-Core boundaries or newer thread instructions. | Do not read archive by default; when conflicts appear, follow `CURRENT_STATUS.md` and the current thread scope. |
| Too many current docs create unclear reading order | Medium | Agents may waste context or miss the relevant file if all docs look equally mandatory. | Start with `DOC_INDEX.md`, then read only task-relevant documents. |
| Module README files are not indexed | Medium | Code-adjacent README files can become invisible if `PROJECT_MAP.md` does not point to them. | Link existing module README files from `PROJECT_MAP.md`; future module threads update both the README and map. |
| SQLite local lock contention | Medium | Windows local SQLite can return `SQLITE_BUSY` when another process holds the database. | Attempt WAL and `busy_timeout`, normalize busy errors into friendly retry guidance, and avoid complex pooling. |
| Log leakage | High | Logs can accidentally capture API keys, full paths, database URLs, stack traces, or raw prompts. | Use `src/lib/services/logging/` sanitization; diagnostics reads only sanitized summaries and Vercel does not write local logs. |
| Legacy absolute paths in older records | Medium | Some existing backup/export records may contain absolute paths from earlier threads. | Diagnostics and backup UI use relative labels; keep masking legacy DB paths without changing historical data. |
| Copywriting history overwrite | High | Overwriting earlier drafts would erase edited history and block future trial-review analysis. | Preserve one row per draft instance; allow updates only for the explicit row or same-job retry flow. |
| Historical patch workflow confusion | High | If V1 or V1.5 issues are repaired by editing old migrations, revisiting old version branches, or resetting data, version boundaries and local data safety can break down. | Repair on the current latest mainline through a Patch Thread; add new migrations only; never reset the database; document compatibility strategy and repair steps for historical data. |
| Historical bad data residue | High | Some defects may already have written wrong data such as `fileHash`, copywriting platform fields, or AI cost/log fields. | Before patching, decide whether historical data is affected; when needed provide a safe repair script, a manual review list, or a `legacy` marker instead of guessing missing values. |
| No-backup migration or bulk-write damage | High | Running a migration or batch filesystem/database write without evaluating backup needs can permanently damage local data. | Require pre-thread safety review, evaluate backups before risky writes, and stop on migration failure instead of resetting. |
| Unapproved core dependency upgrade | High | Upgrading core framework or runtime dependencies without scope approval can break Windows local runtime, builds, or Vercel preview unexpectedly. | Block core dependency upgrades unless the thread explicitly requires them and the impact/verification plan is documented first. |
| Missing cache invalidation after writes | Medium | Server-side writes can succeed while UI routes still show stale data, leading to false acceptance or operator confusion. | Require each write path to document its `revalidatePath` / `revalidateTag` strategy or the accepted stale-data risk. |
| Inspiration folder path leakage | High | The configured local inspiration folder may expose the operator's Windows directory structure if rendered or logged directly. | Store the real path server-side only; frontend, diagnostics, and scan logs use masked summaries only. |
| Inspiration duplicate-import drift | Medium | If rename-only duplicates bypass fileHash checks, the review queue can inflate and the same image may be converted twice. | Deduplicate by `fileHash`, store unique hashes, and log duplicate skips in `ScanLog`. |
| Inspiration AI suggestion overclaim | High | Lightweight vision suggestions can invent category, material, or marketing claims and accidentally be treated as facts. | Validate structured output, label it as reference-only, keep manual confirmation before product creation, and capture uncertainty notes instead of guessing. |
| Unsafe data repair scripts | High | A repair script without dry-run or rerun safety can damage the same rows twice or hide scope before execution. | Require dry-run, affected-row counts, no automatic deletion, backup-before-run, rerun safety, and a repair summary. |
| Secret rotated too late after exposure | High | Deleting an exposed file without rotating the underlying secret leaves the real credential still valid. | Stop work, remove exposed values from outputs, tell the user to rotate/revoke at the provider, and add sanitization checks afterward. |
| Parallel thread scope mixing | Medium | Running multiple active development threads at once can mix changes, commit messages, and acceptance boundaries. | Keep one active thread at a time; when interrupted, record the pause point, name the inserted task, update `SESSION_LOG.md`, and separate commit descriptions. |
| V1-Core freeze drift | Medium | Without a freeze rule, V1-Core can keep growing past its intended boundary and absorb V1-Plus work. | After V1-Core-07 acceptance, mark V1-Core complete, record a final commit or tag, stop adding new features to V1-Core, and route enhancements to V1-Plus or backlog docs. |
| Multi-platform used-mark inconsistency | Medium | More than one “actual used” row per product/platform would make listing history ambiguous. | Clear existing used marks before setting the next used row for the same product/platform. |
| Post V1-Core feature creep | High | After final acceptance, small "cleanup" requests can accidentally become V1-Plus or V1.5 feature work inside V1-Core. | Treat V1-Core as complete after the closeout commit; require a new V1-Plus or Patch thread name before adding product behavior. |
| GitHub history noise | Medium | Reusing an older repository or pushing every small task can leave confusing old-project history and excessive GitHub commits. | Keep main history clean when explicitly approved, use `--force-with-lease` for history rewrites, delete obsolete remote branches, and push future work at milestones instead of after every small task. |
