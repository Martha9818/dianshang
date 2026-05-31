# V1-Core Understanding Check Detail Archive

This archive preserves the longer explanatory walkthrough that was removed from the active `docs/current/V1_CORE_UNDERSTANDING_CHECK.md`.

## What V1-Core Added

V1-Core turned EcomPilot from an MVP workspace into a safer local-first tool. It added:

- diagnostics center
- runtime and directory checks
- AI provider and AI log base
- safer image uploads and image metadata
- multi-platform copywriting package
- manual inspiration inbox and scan log

## Daily Usage Path

- `/products`: product pool and detail entry
- `/materials`: material library
- `/copywriting`: copywriting generation and editing
- `/inspirations`: inspiration inbox and scan flow
- `/export`: Excel export
- `/backup`: manual backup
- `/system/diagnostics`: troubleshooting entry

## First Troubleshooting Page

Open `/system/diagnostics` first when something feels broken. It summarizes runtime mode, SQLite connectivity, runtime folders, AI failures, image state, and inspiration scan state without exposing secrets.

## Vercel Acceptance Boundary

Do not use Vercel preview to accept:

- SQLite writes
- product create or edit
- image upload
- export creation
- backup creation
- real AI calls
- inspiration scan

Those checks belong to Windows local runtime only.

## AI Failure Rule

AI failure must not destroy product data. If AI fails, users should still be able to:

- edit data manually
- continue scoring
- keep using materials
- export
- back up data
- run file maintenance

## Inspiration Rule

AI suggestions in inspiration flows are advisory only. They are not confirmed business facts until a human reviews and uses them intentionally.
