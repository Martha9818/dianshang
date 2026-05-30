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
