# EcomPilot Current Documentation Index

Use this file only as the routing table after the required startup read.

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
| `THREAD_SCOPE_CHECKLIST.md` | Frozen V1.5 thread range, current closeout status, and cleanup boundary. | At thread start and final scope check. |
| `RISK_REGISTER.md` | Only risks still valid after V1.5 completion. | Risk-sensitive work and V2 planning. |
| `CHANGELOG_DEV.md` | Version-level summary through V1.5 completion. | Version context and V2 planning entry. |
| `DATABASE_CHANGELOG.md` | Migration purpose summary. | Prisma schema, migration, compatibility, or data-repair work. |
| `PATCH_LOG.md` | Active patch state only. | Regression investigations and current closeout verification. |
| `KNOWN_ISSUES.md` | Unresolved limitations only. | Known-issue triage or when leaving a limitation. |
| `ELECTRON_POC_REPORT.md` | Thread 07 desktop feasibility report. | Electron POC, desktop feasibility, path/runtime risk, or V2 desktop preparation. |
| `V1_CORE_UNDERSTANDING_CHECK.md` | Short V1-Core capability index. | Recalling the V1-Core baseline before future planning. |

## Archive Rule

- Archived history lives under `agent-memory/archive/` and is indexed by `agent-memory/ARCHIVE_INDEX.md`.
- Do not read archives by default.
- Current docs always win if archive wording conflicts.

## Current Baseline

- MVP, V1-Core, V1-Plus, and V1.5 are complete on the current mainline.
- V1.5 is frozen after Thread 09 closeout.
- Vercel remains preview-only and read-only.
- Windows local runtime remains the writable source of truth.
