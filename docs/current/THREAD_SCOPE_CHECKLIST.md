# Thread Scope Checklist

Use this file as the active scope boundary and acceptance checklist for the current line.

## Thread

- Name: `V1.7.1 Phase Closeout And Status Sync`
- Date: `2026-06-14`
- Status: `COMPLETE`
- Type: closeout / status-sync / acceptance-preservation
- Approved scope: sync active current-line wording to the accepted `V1.7.1` closeout state, preserve the accepted V1.7 and V1.7.1 baseline, ignore local agent-artifact directories that are outside product scope, rerun the closeout verification set, and preserve the result with a clean local commit plus milestone push when approved
- Existing working-tree changes belong to: accepted V1.7 MVP and V1.7.1 stabilization work already present on the current mainline; local `.impeccable/`, `.superpowers/`, and `tmp/` helper artifacts remain outside product scope

## Safety

- `git status --short` checked before work: yes
- New schema, migration, dependency, or business-code change: no
- Page or service implementation change: no
- Vercel remains preview-only and read-only: yes
- Windows local runtime remains the writable source of truth: yes

## Current Closeout Boundary

### This Closeout Is

- a closeout and acceptance-preservation line
- a current-doc sync line
- a local verification and milestone-hygiene line

### This Closeout Is Not

- a new feature-delivery line
- a schema, migration, or dependency thread
- a new V1.7.1 implementation thread
- a V1.8 content-workflow thread

## Accepted Baseline

The active mainline must preserve:

1. the accepted V1.6 inbox and product-evaluation flow baseline
2. the accepted V1.7 confirm-to-competitor MVP loop
3. the accepted V1.7.1 candidate-state hardening and boundary-verification baseline
4. the split between inspiration draft triage and formal product scoring
5. Vercel read-only behavior with the exact preview-write warning `预览环境只读，请在 Windows 本地验收。`
6. Windows local runtime as the only writable acceptance source of truth
7. no reopening of schema, migration, dependency, screenshot-path migration, AI expansion, or workflow-expansion work inside this closeout thread

## Deferred Versions

| Version | Position | Not In Current Thread |
| --- | --- | --- |
| `V1.7.1 closeout` | Acceptance preservation and current-doc sync | No new feature delivery inside the closeout thread |
| `V1.8` | Post-confirmation content workflow planning target | Not opened here |
| `V2` | Desktop/runtime and larger system planning only | Not opened here |

## Vercel Boundary

- Preview remains read-only.
- Preview must not write SQLite data, uploads, exports, backups, logs, or trash.
- Preview must not run high-cost AI, API image generation, real file cleanup, or Electron POC execution.
- Preview write attempts should show `预览环境只读，请在 Windows 本地验收。`

## Prohibited Signals

Current docs must not imply:

- platform crawlers
- automatic collection
- automatic listing
- automatic direct messages
- automatic comments
- browser automation
- writable Vercel acceptance

## Verification

Available project-level verification commands from `package.json`:

- `npm run encoding:check`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npx prisma validate`
- `npm run thread09:verify`

Thread V1.7.1 phase closeout required:

- run `npx tsx scripts/thread-v17-1-thread00-stabilization-verify.mts`
- run `npx tsx scripts/thread-v17-1-thread01-boundary-verify.mts`
- run project-level checks using the existing commands
- confirm no schema / migration / dependency / product-behavior changes were introduced by closeout sync
- confirm the next step is real local usage observation, not another synthetic `V1.7.1` implementation thread

## Archive Pointer

- Detailed V1.5 implementation and stabilization history remains in the current docs plus archive pointers.
- `docs/superpowers/acceptance/2026-06-09-v16-final-acceptance.md`, `docs/superpowers/acceptance/2026-06-09-v17-mvp-thread02-acceptance.md`, `docs/superpowers/acceptance/2026-06-09-v17-1-thread00-acceptance.md`, and `docs/superpowers/acceptance/2026-06-09-v17-1-thread01-acceptance.md` now form the active acceptance baseline for this closeout.
