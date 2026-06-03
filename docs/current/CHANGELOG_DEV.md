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
- product detail is being re-expressed around whether a product deserves small-batch testing.
- V1.7 is the first planning target for the competitor screenshot inbox.
- V1.8 is the first planning target for post-confirmation content automation.
- V1.6 does not authorize competitor screenshot inbox implementation, automation workflow implementation, crawler behavior, browser automation, or API image generation expansion.

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
