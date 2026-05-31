# EcomPilot Database Changelog

This file now keeps migration purpose summaries only. Field-level detail moved to archive so the active current-doc set stays short.

## Migration Safety

- Read `ARCHITECTURE_RULES.md` and `THREAD_SCOPE_CHECKLIST.md` before migration work.
- Add new migrations only; never edit old migration folders.
- Do not reset a real database.
- Evaluate SQLite backup needs before schema work or risky data repair.
- Thread 09 added no new migration.

## Active Migration Summary

| Date | Migration Folder | Purpose | Notes |
| --- | --- | --- | --- |
| 2026-05-26 | `20260526133520_init` | Initial product, competitor, copywriting, prompt-task, material, export, backup, settings baseline | Foundation migration |
| 2026-05-27 | `20260527033006_unify_thread00_status_defaults` | Unified early status defaults | Early baseline normalization |
| 2026-05-27 | `20260527070126_thread01_product_pool_detail` | Product-pool and detail support | MVP product baseline |
| 2026-05-27 | `20260527103043_thread02_competitor_profit` | Competitor and profit-calculation support | MVP competitor/profit baseline |
| 2026-05-28 | `20260528011232_thread03_scoring` | Six-dimension scoring and recommendation storage | MVP scoring baseline |
| 2026-05-28 | `20260528034024_thread04_copywriting_ai` | Early copywriting AI fields | Later extended by V1-Core |
| 2026-05-28 | `20260528120616_thread07_export_backup` | Export and backup log support | MVP export/backup baseline |
| 2026-05-29 | `20260529090000_v1_core_03_ai_base` | AIJob and AIRequestLog base | Sanitized AI status/log foundation |
| 2026-05-29 | `20260529093455_v1_core_05_multi_platform_copywriting` | Multi-platform copywriting history-friendly schema | Preserves version history |
| 2026-05-29 | `20260529103936_v1_core_06_inspiration_inbox` | AppSetting, Inspiration, ScanLog, and inspiration relations | Manual inspiration inbox baseline |
| 2026-05-29 | `20260529130000_v1_core_04_image_safety` | Material image metadata and safety fields | Hash/thumbnail/image metadata |
| 2026-05-30 | `20260530033400_v1_plus_thread_02_inspiration_management` | Inspiration review/archive/reject workflow | Reused existing table |
| 2026-05-30 | `20260530081700_v1_plus_thread_06_file_cleanup` | `CleanupLog` for file maintenance and app trash auditing | Existing cleanup owner |
| 2026-05-30 | `20260530141322_v1_plus_thread_04_notification_center` | `AppNotification` for in-app notifications | Read-only preview still blocks writes |
| 2026-05-31 | `20260531010807_v15_thread01_inspiration_scan_ai_draft` | Scheduled scan jobs and inspiration AI draft jobs | Additive; local backup created before apply |
| 2026-05-31 | `20260531030346_v15_thread02_screenshot_recognition` | `ScreenshotRecognitionJob` | Draft-only recognition storage |
| 2026-05-31 | `20260531034342_v15_thread03_link_import_drafts` | `LinkImportDraft` | Single-link manual import drafts |
| 2026-05-31 | `20260531042549_v15_thread04_competitor_analysis` | `CompetitorAnalysisSnapshot` | AI-assisted local analysis history |
| 2026-05-31 | `20260531063406_v15_thread05_image_dedup` | `ImageFingerprint` and `ImageReviewLog` | Detection only; no cleanup ownership |
| 2026-05-31 | `20260531071423_v15_thread06_image_generation` | `ImageGenerationJob` | Optional user-triggered API image generation |

## Archive Pointer

Field-level migration detail, including per-model field breakdowns and backup notes, moved to `agent-memory/archive/V1_5_DATABASE_CHANGELOG_DETAIL_ARCHIVE_2026-05-31.md`.
