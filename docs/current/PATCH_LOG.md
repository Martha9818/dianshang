# EcomPilot Patch Log

Keep only current or recent patch summaries here. Detailed patch history is archived under `agent-memory/archive/`.

## Severity

- P0: data loss, secret leakage, wrong deletion, database startup failure, backup/restore danger, or Vercel writing real data.
- P1: core flow broken.
- P2: meaningful impact with workaround.
- P3: minor UX/display/non-core issue.
- P4: enhancement, not a bug.

## Recent Patches

| Patch | Severity | Summary | Verification |
| --- | --- | --- | --- |
| 2026-05-30 AI Provider Default Selection | P2 | Settings save returns safe Provider state; copywriting auto-selects enabled default Provider when local selection is blank/stale. | Encoding, TypeScript, lint, build, local settings/copywriting browser checks, Prisma default-provider checks. |
| 2026-05-30 Diagnostics Compact Layout | P3 | Diagnostics puts status and sanitized summary first, with long detail sections folded. | Encoding, TypeScript, lint, build, local browser checks, Vercel readonly preview checks. |
| 2026-05-29 Clean Product Detail Mojibake Aliases | Maintainability | Replaced visible mojibake aliases and added repeatable encoding guard. | Encoding, diff check, lint, build. |

## Template

Record: name, discovered/origin version, severity, module, root cause, data impact, fix summary, migration, data repair, verification, remaining risk.
