# EcomPilot Development Changelog

This file keeps version-level summaries only. Detailed thread-by-thread history is archived.

## V1.5 Final Summary

- V1.5 is complete and frozen after Thread 09 closeout.
- Thread 01 shipped local inspiration-folder scheduled scanning and AI draft jobs with manual confirmation.
- Thread 02 shipped screenshot recognition and structured draft import without formal fact overwrite.
- Thread 03 shipped single-link import drafts, public metadata attempts, and quality grading without crawler behavior.
- Thread 04 shipped local AI competitor-analysis snapshots and differentiation advice without scoring or status overwrite.
- Thread 05 shipped local image dedupe/originality-risk hints without delete or trash execution.
- Thread 06 shipped optional manual API image generation with cost warnings, confirmation, managed upload storage, and preview blocking.
- Thread 07 shipped an isolated Electron POC only, not a formal desktop app.
- Thread 08 shipped the lightweight `/assistant` page with site-search suggestions and notification summaries, rules-first and read-only.
- Thread 09 shipped final integrated acceptance, README closeout, archive slimming, risk closeout, and V2 prerequisite notes.

## Current Baseline

- MVP, V1-Core, V1-Plus, and V1.5 are complete on the current mainline.
- Windows local runtime remains the writable source of truth.
- Vercel remains preview-only and read-only.
- File cleanup and app trash remain the single existing V1-Plus Thread 06 implementation.
- V1.5 threads reuse the established runtime, local-path, logging, diagnostics, AI, image, export, backup, notification, and cleanup foundations.

## V1.6 Planning Entry

- Current planning has shifted from V1.5 stabilization into V1.6 real-use validation and main-flow adjustment.
- V1.6 is a docs-first and scope-freeze-first line; it is not the place to land large new systems.
- The next main direction is an image-driven product and competitor draft workbench.
- `灵感箱` is elevated as the future main entry direction and is positioned as an AI inspiration inbox.
- `截图识别` is being re-expressed as a supplementary recognition entry rather than a parallel mainline intake page.
- `链接导入` is downgraded to an auxiliary source record rather than a mainline intake route.
- `/link-imports` remains route-compatible for old drafts, but it should no longer read like a platform auto-parsing entry.
- inspiration draft triage and formal product scoring are explicitly separated.
- V1.6-03 now lands a display-layer inspiration draft triage score based on existing AI draft fields only; it does not persist, does not write `ScoreSnapshot`, and does not replace formal product scoring.
- V1.6-04 now hardens inspiration conversion into a confirm-then-convert workflow so AI-prefilled product drafts remain editable reference data until the user explicitly confirms creation.
- V1.6-05 now re-expresses product detail as a formal evaluation workflow with `竞品参考`、`AI 机会分析`、`成本利润`、`测试结论`, a top-level formal conclusion panel, and source inspiration triage carried forward only as read-only reference context.
- V1.6-06 now improves the three middle evaluation tabs with in-tab purpose/output/decision-impact guidance, explicit `当前有效竞品 x / 3` progress, and explicit missing-cost reminders so users can understand blockers without inferring them from scattered backend fields.
- V1.6-07 now reorders the product-detail top action hierarchy around formal evaluation work, weakens `链接导入` into an auxiliary source-record action, and adds quick-action explanation cards so the page no longer reads like a mixed intake toolbar.
- product detail is being re-expressed around whether a product deserves small-batch testing.
- V1.7 is the first planning target for the competitor screenshot inbox.
- V1.8 is the first planning target for post-confirmation content automation.
- V1.6 does not authorize competitor screenshot inbox implementation, automation workflow implementation, crawler behavior, browser automation, or API image generation expansion.

## V1.6 Closeout

- `V1.6-00` through `V1.6-07` now form the accepted V1.6 mainline.
- `V1.6-08` final acceptance confirms the current line can close on Windows local runtime after the completed verification-script pass, project-level checks, and local browser review.
- The V1.6 closeout record lives at `docs/superpowers/acceptance/2026-06-09-v16-final-acceptance.md`.
- The next approved step after V1.6 is `V1.7 Design Gate`, not direct `V1.7` implementation.

## V2 Entry

V2 may discuss only planning for:

- formal Windows desktop runtime
- restore workflow
- multi-SKU
- supplier management
- procurement batches
- inventory
- trial-sale review
- PDF reporting
- formal agent mode
