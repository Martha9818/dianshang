# Current Status

## Current Progress

- Current stage: V1.5 after Thread 00 baseline freeze.
- V1-Plus status: completed and frozen as the current development baseline.
- Current task: Thread 00 documentation closeout, archive slimming, status confirmation, and V1.5 boundary setup completed locally.
- Next thread: V1.5 Thread 01 - 灵感文件夹定时扫描与自动 AI 识图草稿, if explicitly approved.

## Product Direction

- Keep EcomPilot local-first for Windows local runtime and SQLite-backed work.
- Keep Vercel preview read-only with local write acceptance performed on Windows.
- Reuse the existing Next.js / Prisma / service-layer / diagnostics / logging / notification / local-path foundations.
- Reuse the V1-Core desktop base: RuntimeConfig, LocalPathService, EnvironmentGuard, LogService, OperationLog, local diagnostics, and Vercel read-only degradation.

## V1.5 Boundary

- V1.5 is for lightweight intelligence and technical validation.
- Frozen route: Thread 01 is local inspiration-folder scheduled scanning and automatic AI image-recognition drafts; Thread 02 is screenshot recognition and structured image import. Do not merge them.
- Allowed by explicit thread: local inspiration-folder scheduled scanning, user-uploaded image/screenshot recognition, lightweight API image generation, and Electron technical validation.
- Not in V1.5: formal Electron desktop app, platform crawlers, automatic collection, automatic publishing, automatic private messages, automatic comments, SKU, supplier, inventory, trial-sale review, PDF reports, or real multi-agent scheduling.

## Blockers Or Risks

- No active product blocker is recorded for the V1.5 baseline.
- Vercel remains preview-only and read-only; it is not a formal runtime environment.
- No `test` script exists in the current project scripts.
- V1.5 threads must not reimplement path, environment, logging, or Vercel-readonly foundations.
- Thread 00 verification passed: lint, build, Prisma validation, typecheck, encoding check, and sensitive-pattern scans on changed docs.

## Next Recommended Step

- Start V1.5 Thread 01 only after explicit approval of its narrow scope. Thread 01 must not implement screenshot recognition, screenshot structured import, or product screenshot field extraction.
