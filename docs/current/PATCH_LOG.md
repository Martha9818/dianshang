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
| V1.5 Thread 08 query-link reuse patch | P4 | Switched assistant product/material/copywriting/prompt/inspiration filter links from hand-built query strings to shared `query-service.ts` normalization and serialization helpers. | Encoding check, lint, build, Prisma validate, typecheck, and `npm run thread08:verify` passed; no `npm test` script exists. |
| V1.5 Thread 08 feature patch | P4 | Added `/assistant` with lightweight site-search suggestions, notification summaries, rules-first safe links, optional local AI intent parsing, cleanup reminders without execution, and Vercel read-only degradation. | Encoding check, lint, build, Prisma validate, typecheck, and `npm run thread08:verify` passed; no `npm test` script exists. |
| V1.5 Thread 07 managed-shell patch | P2 | Switched the default Electron POC path to a managed local production shell, added production CSP headers, and resolved the Electron CSP warning in the default validation flow. | Encoding check, lint, build, Prisma validate, typecheck, and managed POC smoke passed; no root `test` script exists. |
| V1.5 Thread 07 feature patch | P4 | Added an isolated Electron POC, localhost-only shell, marker-only preload, POC smoke scripts, technical validation report, and Vercel exclusion without changing root app runtime. | Encoding check, lint, build, Prisma validate, typecheck, POC smoke, and Electron smoke passed; no root `test` script exists. |
| V1.5 Thread 06 feature patch | P4 | Added optional user-triggered API image generation, image-purpose AI Provider settings, `ImageGenerationJob`, generated-result material storage, Prompt task trigger, confirmations, AI logs, operation logs, notifications, and Vercel read-only guard. | Encoding check, lint, build, Prisma validate, typecheck, local panel smoke, Vercel read-only simulation, and browser page smoke passed; no `test` script exists. |
| V1.5 Thread 05 feature patch | P4 | Added local-only image fingerprinting, exact duplicate/high-similarity review logs, source-risk hints, manual ignore, archive-suggestion marking, material/inspiration UI badges, and links to existing file cleanup/trash. | Encoding check, lint, build, Prisma validate, typecheck, local image-dedupe service smoke, Vercel read-only simulation, and HTTP page smoke passed; no `test` script exists. |
| V1.5 Thread 04 verification script patch | P4 | Replaced legacy Thread 04 copywriting/provider scripts with competitor-analysis-specific local and preview verification scripts. | `npm run thread04:verify` and `npm run thread04:preview` passed. |
| V1.5 Thread 04 feature patch | P4 | Added local-only AI-assisted competitor analysis snapshots, selection, history, regeneration without overwrite, reference marking, archive confirmation, risk scan hints, and Vercel read-only guard. | Encoding check, lint, build, Prisma validate, typecheck, mock-provider local acceptance, Vercel read-only simulation, and HTTP page smoke checks passed. |
| V1.5 Thread 04 AI error sanitization patch | P4 | Redacted local-path-like provider error details before AI failure summaries are saved to failed snapshots, AI jobs, or AI request logs. | Encoding check, lint, build, Prisma validate, typecheck, and local mock-provider failure isolation passed. |
| V1.5 Thread 03 feature patch | P4 | Added local-only single-link import drafts, SSRF-guarded public meta attempts, auxiliary screenshot/text/note input, quality grading, manual conversion links, and Vercel read-only guard. | Encoding check, lint, build, Prisma validate, typecheck, local service acceptance, Vercel read-only simulation, and browser smoke test passed. |
| V1.5 Thread 02 feature patch | P4 | Added local-only screenshot recognition and structured draft import with separate task model, manual confirmation, quality grading, Vercel read-only guard, and no formal field overwrite. | Encoding check, lint, build, Prisma validate, typecheck, local screenshot upload/AI/confirm acceptance, Vercel read-only simulation, and browser smoke test passed. |
| V1.5 Thread 01 provider compatibility patch | P2 | Added a full JSON fallback prompt for providers that do not support `json_schema` and extended image AI request timeout while keeping text calls at 20s. | Real local inspiration image generated an `AI 草稿 / 待用户确认` draft with Doubao provider; encoding check, lint, typecheck, and build passed. |
| V1.5 Thread 01 feature patch | P4 | Added local-only inspiration folder scheduled scanning and AI drafts with manual confirmation, retry, and Vercel read-only guards. | Encoding check, lint, build, Prisma validate, typecheck, local fixture acceptance, Vercel read-only simulation, and browser smoke test passed. |
| V1-Plus baseline patch set | MITIGATED | Current mainline includes provider-default selection, compact diagnostics layout, and product-detail encoding cleanup. No separate active patch thread is open at V1.5 baseline freeze. | Historical verification is archived; V1.5 Thread 00 reruns lint, build, Prisma validation, and typecheck. |

## Template

Record: name, discovered/origin version, severity, module, root cause, data impact, fix summary, migration, data repair, verification, remaining risk.
