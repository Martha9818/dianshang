# EcomPilot Project Map

EcomPilot is a Windows local-first Next.js App Router app for ecommerce product evaluation, copywriting, inspirations, materials, export, backup, diagnostics, and local AI-assisted workflows. This file is a module map only; implementation details stay in source and module READMEs.

## Runtime

| Area | Current Choice |
| --- | --- |
| Web app | Next.js App Router, React, TypeScript |
| Data | Prisma with local SQLite |
| Local runtime | `uploads/`, `exports/`, `backups/`, `logs/` |
| Preview | Vercel read-only preview |

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Dashboard and read-only todo reminders. |
| `/products`, `/products/new`, `/products/[id]`, `/products/[id]/edit` | Product pool, creation, detail, and editing. |
| `/copywriting` | Multi-platform copywriting workspace. |
| `/prompt-tasks`, `/prompt-tasks/[taskCode]/upload` | Prompt task management and material upload. |
| `/materials` | Material library. |
| `/inspirations` | Manual inspiration inbox, review states, and confirm-then-convert flow. |
| `/notifications` | Lightweight in-app notification center for important operation results. |
| `/settings/ai`, `/settings/banned-words` | Local settings. |
| `/export`, `/backup` | Local export and manual backup. |
| `/system/diagnostics` | Sanitized local diagnostics. |

## Service Modules

| Module | Responsibility | README |
| --- | --- | --- |
| Runtime | Local/preview mode and write guards. | `src/lib/services/runtime/README.md` |
| Local paths | Runtime folders, display-safe labels, filename/path safety. | `src/lib/services/local-paths/README.md` |
| Logging | Sanitized local logs and Vercel console fallback. | `src/lib/services/logging/README.md` |
| Diagnostics | Runtime/database/folder/log/AI/image/inspiration summaries. | `src/lib/services/diagnostics/README.md` |
| AI base | Provider calls, prompt/output safety, AIJob, AIRequestLog, cost estimates. | `src/lib/services/ai/README.md` |
| Images/uploads | Upload validation, hashes, thumbnails, safe serving. | `src/lib/services/images/README.md` |
| Materials | Material records, image metadata, status display. | `src/lib/services/materials/README.md` |
| Copywriting | Generation, drafts/history, manual edits, usage marking. | `src/lib/services/copywriting/README.md` |
| Inspirations | Folder setting, manual scan, dedupe, review states, optional AI suggestion, conversion. | `src/lib/services/inspirations/README.md` |
| Notifications | Sanitized in-app operation notifications, read state, filtering, safe action URLs, and local-only writes. | `src/lib/services/notifications/README.md` |
| Products/scoring | Product CRUD, formatting, scoring, and status summaries. | Source modules under `src/lib/services/` and `src/lib/modules/` |
| Prompt tasks | Prompt templates, task persistence, upload linkage. | Source modules under `src/lib/services/` and `src/lib/modules/` |
| Export/backup | Local Excel export, safe download, manual backup, display-safe paths. | Source services under `src/lib/services/` |
| Query/dashboard | List filter normalization and read-only homepage todos. | Source services under `src/lib/services/` |

## Data Models

Main Prisma model groups: products, variants, competitors, scoring, copywriting, prompt tasks, materials, inspirations, scan logs, AI providers/logs/jobs, app notifications, banned words, operation logs, export logs, backup logs, and app settings. Schema changes require a new migration and `DATABASE_CHANGELOG.md` update.

## Side-Effect Ownership

| Side Effect | Owner |
| --- | --- |
| Database writes | Service layer behind server actions, local writable runtime only. |
| File writes | Upload/export/backup/logging services, local writable runtime only. |
| AI calls | AI services only; failures are sanitized and user-safe. |
| Diagnostics | Diagnostics services/actions; sanitized output only. |
| Pages/components | Display, interaction, action calls, and user-safe messages. |

Do not move business logic into pages or client components.
