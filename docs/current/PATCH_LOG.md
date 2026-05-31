# EcomPilot Patch Log

Keep only currently effective patch state here. Detailed patch history is archived under `agent-memory/archive/`.

## Severity

- P0: data loss, secret leakage, wrong deletion, database startup failure, backup/restore danger, or Vercel writing real data.
- P1: core flow broken.
- P2: meaningful impact with workaround.
- P3: minor UX/display/non-core issue.
- P4: enhancement, not a bug.

## Current Patch State

| Patch State | Severity | Summary | Verification |
| --- | --- | --- | --- |
| V1-Plus baseline patch set | MITIGATED | Current mainline includes provider-default selection, compact diagnostics layout, and product-detail encoding cleanup. No separate active patch thread is open at V1.5 baseline freeze. | Historical verification is archived; V1.5 Thread 00 reruns lint, build, Prisma validation, and typecheck. |

## Template

Record: name, discovered/origin version, severity, module, root cause, data impact, fix summary, migration, data repair, verification, remaining risk.
