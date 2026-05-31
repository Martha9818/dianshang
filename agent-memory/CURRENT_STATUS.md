# Current Status

## Current Progress

- Current stage: V1.5 after Thread 00 baseline freeze.
- V1-Plus status: completed and frozen as the current development baseline.
- Current task: V1.5 baseline documentation route correction completed locally; no feature work started.
- Next thread: V1.5 Thread 01 - 灵感文件夹定时扫描与自动 AI 识图草稿, if explicitly approved.

## Product Direction

- Keep EcomPilot local-first for Windows local runtime and SQLite-backed work.
- Keep Vercel preview read-only with local write acceptance performed on Windows.
- Reuse the existing Next.js / Prisma / service-layer / diagnostics / logging / notification / local-path foundations.
- Reuse the V1-Core desktop base: RuntimeConfig, LocalPathService, EnvironmentGuard, LogService, OperationLog, local diagnostics, and Vercel read-only degradation.

## V1.5 Boundary

- V1.5 is for lightweight intelligence and technical validation.
- Frozen route: Thread 01 is local inspiration-folder scheduled scanning and automatic AI image-recognition drafts; Thread 02 is screenshot recognition and structured image import. Do not merge them. Thread 03-09 route is frozen in `docs/current/THREAD_SCOPE_CHECKLIST.md`.
- Not in V1.5: formal Electron desktop app, platform crawlers, automatic collection, automatic publishing, automatic private messages, automatic comments, SKU, supplier, inventory, trial-sale review, PDF reports, or real multi-agent scheduling.
- File cleanup and app trash are already V1-Plus Thread 06 capabilities; V1.5 must not create a second cleanup system.

## Blockers Or Risks

- No active product blocker is recorded for the V1.5 baseline.
- Vercel remains preview-only and read-only; it is not a formal runtime environment.
- No `test` script exists in the current project scripts.
- V1.5 threads must not reimplement path, environment, logging, or Vercel-readonly foundations.
- Latest docs-only verification passed: encoding check, lint, diff whitespace check, and sensitive-pattern scans on changed docs.
- Follow-up doc slimming for long files is deferred to a later documentation slimming pass or V1.5 Thread 09 closeout.

## Next Recommended Step

- Start V1.5 Thread 01 only after explicit approval of its narrow scope. Thread 01 must not implement screenshot recognition, screenshot structured import, or product screenshot field extraction.
