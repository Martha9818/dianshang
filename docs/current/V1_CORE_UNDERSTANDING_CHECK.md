# V1-Core Capability Index

This file is now a short index, not the long walkthrough. Use it to recall the stable V1-Core baseline before opening a new thread.

## Core Capability Areas

| Area | What V1-Core Established |
| --- | --- |
| Runtime | Windows local writable runtime, Vercel read-only degradation, runtime labels, and readonly notices |
| Diagnostics | Sanitized diagnostics center, local directory checks, SQLite status, AI summaries, and exportable markdown summary |
| AI Base | Local AI provider settings, AIJob, AIRequestLog, structured output validation, and sanitized error handling |
| Images | Safe uploads, hashes, thumbnails, size/type validation, and relative-path storage |
| Copywriting | Multi-platform copywriting package, manual editing, history, and banned-word scanning |
| Inspirations | Manual inspiration inbox, manual scan, review states, AI suggestion drafts, and confirm-then-convert flow |
| Logging | Sanitized log writes in local runtime and safe console fallback in preview |
| Operations | Shared operation logs and service-layer boundaries for write flows |

## Route Reminders

- `/settings/ai`: provider configuration
- `/copywriting`: multi-platform copywriting workspace
- `/inspirations`: manual inbox and scan flow
- `/system/diagnostics`: first stop for troubleshooting
- `/export` and `/backup`: local-only write acceptance

## Acceptance Reminders

- Vercel preview is not valid for product writes, uploads, export file creation, backup creation, real AI calls, or inspiration scanning.
- AI suggestions are advisory and must not be treated as confirmed business facts without human review.
- Diagnostics, logs, exports, and docs must stay free of API keys, full local absolute paths, raw prompts, and full stacks.

## Archive Pointer

The longer user-facing V1-Core walkthrough was moved to `agent-memory/archive/V1_CORE_UNDERSTANDING_CHECK_DETAIL_ARCHIVE_2026-05-31.md`.
