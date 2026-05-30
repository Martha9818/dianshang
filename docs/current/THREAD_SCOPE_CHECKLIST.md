# Thread Scope Checklist

Copy this checklist into working notes for every development thread before coding. Fill it with concrete answers, then use it for the final boundary check.

## Thread Identification

- Thread name:
- Date:
- Current version scope: V1-Core / other approved scope:
- Product direction confirmed:
- Thread type: standard feature / Patch Thread / docs-only / other:
- Existing working-tree changes belong to:

## Pre-Thread Safety Check

- Was `git status --short` checked before work started? yes/no
- If the tree was dirty, was the existing scope explained? yes/no
- Does this thread touch database structure, filesystem writes, batch writes, or AI batch generation? yes/no
- If yes, was backup need evaluated first? yes/no
- Any destructive operation planned? yes/no
- If yes, were the risks stated before execution? yes/no
- Any database reset planned? yes/no
- If yes, did the user explicitly confirm it is a disposable test database? yes/no

## Goal

- This thread goal:
- User-visible acceptance result:
- Non-goals:

## Patch Classification

- Is this a standard feature thread or a Patch Thread?
- If Patch:
  - Origin version:
  - Discovered in version:
  - Severity: P0 / P1 / P2 / P3 / P4
  - Historical data affected? yes/no
  - New migration required? yes/no
  - Data repair script required? yes/no
  - Manual confirmation required for old data? yes/no
  - `PATCH_LOG.md` updated? yes/no
  - `KNOWN_ISSUES.md` updated? yes/no
  - `DATABASE_CHANGELOG.md` updated? yes/no
- If not Patch:
  - Did this thread accidentally repair a historical issue? yes/no
  - If yes, was it recorded in `CHANGELOG_DEV.md` or `PATCH_LOG.md`? yes/no

## Allowed Modification Range

- Pages allowed:
- Components allowed:
- Actions allowed:
- Services/modules allowed:
- Prisma/schema allowed:
- Documentation allowed:
- Scripts/tests allowed:

## Documentation And README Check

- Does this thread need to read a module README? yes/no
- Which module README files were read:
- Does this thread add or substantially change a large module? yes/no
- If yes, README added or updated:
- If yes, `PROJECT_MAP.md` README link updated:

## Forbidden Content

Confirm this thread does not implement:

- [ ] login/register
- [ ] cloud accounts
- [ ] payments
- [ ] platform crawlers
- [ ] automatic collection/listing/messaging/commenting
- [ ] OCR
- [ ] link parsing
- [ ] API image generation
- [ ] Electron
- [ ] notification center
- [ ] search center
- [ ] scheduled tasks
- [ ] multi-agent systems
- [ ] AIJob or AIRequestLog cost statistics
- [ ] out-of-thread AI, material, cleanup, or export features

## Side Effects

- Involves database? yes/no
  - If yes, schema change? yes/no
  - New migration required? yes/no
  - Old migrations untouched? yes/no
  - Backup recommended before migration? yes/no
  - `prisma validate` run first? yes/no
  - `prisma generate` run before `migrate dev`? yes/no
  - `DATABASE_CHANGELOG.md` update required? yes/no
  - Migration failure stop-plan prepared instead of reset? yes/no
  - Legacy / nullable / unknown / repair-script strategy for incomplete old data:
- Involves filesystem? yes/no
  - Reads:
  - Writes:
  - Cleanup:
  - Path sanitization plan:
- Involves AI? yes/no
  - Provider touched:
  - Fallback plan:
- Affects Vercel read-only behavior? yes/no
  - Preview-safe behavior:
  - Write-block message:
- Cache invalidation plan after writes:
  - Paths/tags:
  - Why these paths/tags:
  - If none, stale-data risk:

## Acceptance Criteria

- Local Windows acceptance:
- Vercel preview acceptance:
- Security/privacy acceptance:
- Failure-mode acceptance:

## Verification Plan

- Commands to run:
- Browser routes to check:
- Data setup needed:
- Cleanup needed:

## Data Repair Script Check

- Does this thread need a data-repair script? yes/no
- If yes:
  - Dry-run supported? yes/no
  - Affected-row count reported? yes/no
  - No automatic deletion? yes/no
  - Safe to rerun? yes/no
  - Backup required before execution? yes/no
  - Post-run repair summary required? yes/no
  - `PATCH_LOG.md` update required? yes/no
  - `DATABASE_CHANGELOG.md` update required? yes/no

## Patch Severity Rules

- `P0`: Causes data loss, API key leakage, wrong file deletion, database startup failure, backup/restore danger, or Vercel writing real data. Pause current development and fix immediately.
- `P1`: Breaks a core flow such as product save, scoring, copywriting save, image upload, export, or backup. Open a high-priority Patch Thread.
- `P2`: Meaningful impact with a workaround. Schedule it into the current version's Patch Thread.
- `P3`: Minor UX, display, or non-core error. Record it in `KNOWN_ISSUES.md` and handle it near version closeout.
- `P4`: Not a bug. Treat it as an enhancement request for a later roadmap thread, not a Patch Thread.

## Boundary Check

- [ ] Page components only display/interact/call actions.
- [ ] Business logic remains in services/modules.
- [ ] No full local paths exposed.
- [ ] No API keys or `.env` values exposed.
- [ ] No full stack traces exposed.
- [ ] No raw AI prompts exported unintentionally.
- [ ] Vercel preview stays read-only.
- [ ] No unrelated module refactor.
- [ ] No future-version feature added.
- [ ] Patch Threads fix the approved issue only and do not expand scope.
- [ ] Historical fixes stay on the current latest mainline.
- [ ] Old migrations remain untouched and no database reset was used.
- [ ] Backup need was checked before risky writes, migrations, or repair scripts.
- [ ] Cache invalidation strategy was defined or its risk was documented.
- [ ] Core dependencies were not upgraded without explicit thread scope.
- [ ] Secret exposure handling is stop-and-rotate, not delete-and-ignore.
- [ ] Only one active development thread was in progress for this work.
- [ ] This thread checked whether a module README is needed.
- [ ] If this thread adds or substantially changes a large module, its module README was added or updated.
- [ ] If a module README was added or updated, `docs/current/PROJECT_MAP.md` links to it.
- [ ] Module-level details were not copied into `AGENTS.md` or `agent-memory/`.
- [ ] `CURRENT_STATUS.md` and `SESSION_LOG.md` remain short.
- [ ] Agent memory and dev changelog will be updated before final response.
