# V1.5 Baseline Patch Log Archive - 2026-05-31

This archive contains patch summaries moved out of the active patch log during V1.5 Thread 00. Keep active `PATCH_LOG.md` focused on currently effective patch state.

## Archived Patch Summaries

| Patch | Severity | Summary | Verification |
| --- | --- | --- | --- |
| 2026-05-30 AI Provider Default Selection | P2 | Settings save returns safe Provider state; copywriting auto-selects enabled default Provider when local selection is blank/stale. | Encoding, TypeScript, lint, build, local settings/copywriting browser checks, Prisma default-provider checks. |
| 2026-05-30 Diagnostics Compact Layout | P3 | Diagnostics puts status and sanitized summary first, with long detail sections folded. | Encoding, TypeScript, lint, build, local browser checks, Vercel readonly preview checks. |
| 2026-05-29 Clean Product Detail Mojibake Aliases | Maintainability | Replaced visible mojibake aliases and added repeatable encoding guard. | Encoding, diff check, lint, build. |
