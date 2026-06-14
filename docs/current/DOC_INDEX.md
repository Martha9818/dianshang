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
| `THREAD_SCOPE_CHECKLIST.md` | Active thread scope, acceptance boundary, and version freeze notes. | At thread start and final scope check. |
| `RISK_REGISTER.md` | Only risks still valid on the current planning line. | Risk-sensitive work and version planning. |
| `CHANGELOG_DEV.md` | Version-level summary through V1.6 planning entry. | Version context and planning entry. |
| `KNOWN_ISSUES.md` | Unresolved limitations only. | Known-issue triage or when leaving a limitation. |
| `DATABASE_CHANGELOG.md` | Migration purpose summary. | Prisma schema, migration, compatibility, or data-repair work. |
| `PATCH_LOG.md` | Active patch state only. | Regression investigations and current closeout verification. |
| `ELECTRON_POC_REPORT.md` | Thread 07 desktop feasibility report. | Electron POC, desktop feasibility, path/runtime risk, or V2 desktop preparation. |
| `V1_CORE_UNDERSTANDING_CHECK.md` | Short V1-Core capability index. | Recalling the V1-Core baseline before future planning. |
| `../superpowers/specs/2026-06-02-v16-direction-sync-report.md` | V1.6 scope, deferrals, and product direction freeze. | Before V1.6 planning or implementation work. |
| `../superpowers/specs/2026-06-09-v17-confirm-to-competitor-design-gate.md` | V1.7 confirm-to-competitor freeze and MVP rules. | Before V1.7 competitor screenshot draft, confirm, or closeout work. |

## Archive Rule

- Archived history lives under `agent-memory/archive/` and is indexed by `agent-memory/ARCHIVE_INDEX.md`.
- Do not read archives by default.
- Current docs always win if archive wording conflicts.

## Current Baseline

- MVP, V1-Core, V1-Plus, and V1.5 are complete on the current mainline.
- `V1.6-00` through `V1.6-08`, `V1.7 MVP Thread 01-02`, and `V1.7.1 Thread 00-01` are implemented on the current mainline.
- The current line is `V1.7.1 phase closeout`.
- Vercel remains preview-only and read-only.
- Windows local runtime remains the writable source of truth.
