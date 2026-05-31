# EcomPilot Current Documentation Index

Use this file only as a routing table after the required startup read. Do not copy document bodies here.

## Startup Order

1. `AGENTS.md`
2. `agent-memory/CURRENT_STATUS.md`
3. `agent-memory/SESSION_LOG.md`
4. `docs/current/DOC_INDEX.md`

## Current Docs

| Document | Purpose | Read When |
| --- | --- | --- |
| `PROJECT_MAP.md` | Module and route map. | Code structure, routes, services, runtime, AI, file, export, backup, or diagnostics work. |
| `ARCHITECTURE_RULES.md` | Stable architecture and safety rules. | Before behavior, data, filesystem, AI, runtime, or dependency changes. |
| `THREAD_SCOPE_CHECKLIST.md` | Thread boundary/status checklist, frozen V1.5 range map, and file-cleanup boundary note. | At development-thread start and final boundary check. |
| `RISK_REGISTER.md` | Open, mitigated, and deferred risks. | Risk-sensitive work, V1.5 feature planning, migrations, filesystem writes, AI, secrets, or Vercel behavior. |
| `CHANGELOG_DEV.md` | Version-level change summary and V1.5 baseline note. | Recent version context and after meaningful behavior/docs changes. |
| `DATABASE_CHANGELOG.md` | Schema and migration history. | Prisma schema, migration, compatibility, or data-repair work. |
| `PATCH_LOG.md` | Current effective patch state. | Patch threads or regression investigations. |
| `KNOWN_ISSUES.md` | Unresolved limitations/issues. | Known-issue triage or when leaving a limitation. |
| `V1_CORE_UNDERSTANDING_CHECK.md` | V1-Core handoff explanation. | Explaining or checking the V1-Core baseline. |

## Module READMEs

Read module READMEs only when changing that module. The module index lives in `PROJECT_MAP.md`.

## Archive Rule

Archived history lives in `agent-memory/archive/` and is indexed by `agent-memory/ARCHIVE_INDEX.md`. Do not read archives by default.

## Current Baseline

- MVP, V1-Core, and V1-Plus are complete.
- V1.5 is the current stage after baseline freeze.
- The frozen V1.5 route lives in `THREAD_SCOPE_CHECKLIST.md`; V1-Plus Thread 06 file cleanup/trash remains existing baseline capability.
- Vercel remains preview-only and read-only; Windows local runtime remains the source of truth.
