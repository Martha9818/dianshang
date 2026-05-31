# Thread Scope Checklist

Use this as a short boundary/status record for development threads. Do not paste full instructions or long plans here.

## Thread

- Name: V1.5 Thread 00 - V1-Plus Closeout And Baseline Freeze
- Date: 2026-05-31
- Type: closeout / regression / docs
- Approved version scope: V1.5 Thread 00 only
- Existing working-tree changes belong to: this thread

## Safety

- `git status --short` checked before work: yes
- Touches schema, migration, new dependencies, new business feature, or destructive production operation: no
- Touches local filesystem behavior: no business/runtime filesystem behavior change; docs archive files only
- Backup need evaluated when risky writes are involved: no schema/data-repair/runtime write change
- Database reset planned: no
- Vercel remains read-only: yes

## V1-Plus Completion

| Thread | Status | Baseline Note |
| --- | --- | --- |
| Thread 01 Search/filter normalization | COMPLETE | Frozen in V1-Plus baseline. |
| Thread 02 Inspiration management | COMPLETE | Frozen in V1-Plus baseline. |
| Thread 03 Homepage todo summary | COMPLETE | Frozen in V1-Plus baseline. |
| Thread 04 Notification center | COMPLETE | Frozen in V1-Plus baseline. |
| Thread 05 Batch operation safety | COMPLETE | Frozen in V1-Plus baseline. |
| Thread 06 File cleanup/trash | COMPLETE | Frozen in V1-Plus baseline. |
| Thread 07 Final acceptance/README/path closeout | COMPLETE | Frozen in V1-Plus baseline. |

## V1.5 Frozen Thread Range

| Thread | Frozen Name | Status | Boundary |
| --- | --- | --- |
| V1.5 Thread 00 | V1-Plus closeout and V1.5 baseline freeze | COMPLETE | Docs/status/archive only. |
| V1.5 Thread 01 | 灵感文件夹定时扫描与自动 AI 识图草稿 | NOT STARTED | Do not implement screenshot recognition, screenshot structured import, or product screenshot field extraction here. |
| V1.5 Thread 02 | 截图识别与图片导入结构化 | NOT STARTED | Separate from Thread 01; do not backfill Thread 01 scope here unless explicitly approved. |
| V1.5 Thread 03 | API 生图轻量版技术验证 | NOT STARTED | Lightweight validation only; no Vercel high-cost AI calls or automated publishing. |
| V1.5 Thread 04 | Electron 技术验证 | NOT STARTED | Technical validation only; no formal Electron desktop app, installer, tray, auto-update, or system notifications. |
| V1.5 Thread 05 | V1.5 AI 结果人工复核与降级验收 | NOT STARTED | Verify suggestions remain drafts/reference-only and Vercel stays read-only. |
| V1.5 Thread 06 | V1.5 本地运行与桌面底座复用验收 | NOT STARTED | Confirm RuntimeConfig, LocalPathService, EnvironmentGuard, LogService, OperationLog, diagnostics, and Vercel guards are reused. |
| V1.5 Thread 07 | V1.5 集成回归与安全扫描 | NOT STARTED | Regression/security only; no new product capability. |
| V1.5 Thread 08 | V1.5 文档、风险与已知问题收口 | NOT STARTED | Documentation closeout only. |
| V1.5 Thread 09 | V1.5 最终验收与 V2 前基线冻结 | NOT STARTED | Final acceptance and freeze only; no V2 implementation. |

## Scope

- Goal: mark V1-Plus complete, set V1.5 as current stage, freeze baseline, shorten active docs, archive old summaries, and record V1.5 boundaries.
- Non-goals: new business features, OCR, link import, API image generation, Electron implementation, crawlers, automated collection, automated publishing, private messages, comments, SKU, supplier, inventory, trial-sale review, PDF reports, or multi-agent scheduling.
- Frozen next-step rule: V1.5 Thread 01 and Thread 02 are separate; Thread 01 must not implement screenshot recognition, screenshot structured import, or product screenshot field extraction.
- Allowed files/systems: AGENTS, agent memory, docs/current, and archive indexes.
- Forbidden files/systems: schema changes, migration changes, dependency changes, app behavior, AI behavior, runtime/filesystem write behavior, Vercel policy changes, and module implementation files.
- Module README needed: no.

## Patch Fields

- Patch Thread: no
- Origin version: V1.5 baseline
- Discovered in: user-approved Thread 00 closeout scope
- Severity: docs-only
- Historical data affected: no
- Migration required: no
- Data repair required: no

## Boundary Check

- Business logic, schema, runtime services, and UI behavior remain unchanged.
- V1.5 future threads must reuse the V1-Core desktop base instead of duplicating path, environment, logging, diagnostic, or Vercel-readonly logic.
- Vercel remains preview-only and read-only; docs must not imply it is the formal runtime.
- Docs must not include API keys, `.env` values, full local paths, database paths, full stack traces, or raw prompts.
- `CURRENT_STATUS.md`, `SESSION_LOG.md`, `PATCH_LOG.md`, `CHANGELOG_DEV.md`, `RISK_REGISTER.md`, and `KNOWN_ISSUES.md` remain short.

## Verification

- Required commands: `npm run lint`, `npm run build`, `npx prisma validate`, and `npm run typecheck` passed.
- Optional commands: `npm test` was not run because no test script exists.
- Extra check: `npm run encoding:check` passed.
- Security scans: changed docs were checked for API-key-like strings, full local path strings, database path strings, and full stack-trace markers; no new matches found.
- Commit/push/deploy status: local commit expected after verification; no push or Vercel live refresh requested.
