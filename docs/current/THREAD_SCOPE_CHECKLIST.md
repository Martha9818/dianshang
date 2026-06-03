# Thread Scope Checklist

Use this file as the active scope boundary and acceptance checklist for the current line.

## Thread

- Name: `V1.6-00 Direction Freeze And Documentation Baseline`
- Date: `2026-06-03`
- Status: `COMPLETE`
- Type: docs-only planning / scope freeze / version-baseline sync
- Approved scope: update README, current status docs, current planning docs, Vercel read-only wording, safety boundaries, and acceptance wording so V1.6 has a clear execution baseline
- Existing working-tree changes belong to: pre-existing local follow-up work outside this docs-only thread; untracked `tmp/` remains outside product scope

## Safety

- `git status --short` checked before work: yes
- New schema, migration, dependency, or business-code change: no
- Page or service implementation change: no
- Vercel remains preview-only and read-only: yes
- Windows local runtime remains the writable source of truth: yes

## V1.6 Frozen Boundary

### V1.6 Is

- a real-use validation line
- a docs-first and scope-freeze-first line
- a main-flow repositioning line

### V1.6 Is Not

- a large new-system delivery line
- a competitor screenshot inbox delivery line
- an automatic content workflow delivery line
- an API image generation expansion line

## Explicit V1.6 Baseline

V1.6 must clearly state:

1. `灵感箱` is the future main entry direction and is positioned as an AI inspiration inbox.
2. `链接导入` is downgraded to an auxiliary source record.
3. inspiration draft triage and formal product scoring are two separate systems.
4. product detail is re-expressed around “whether the product deserves small-batch testing”.
5. V1.7 is the first planning target for the competitor screenshot inbox.
6. V1.8 is the first planning target for post-confirmation content automation.
7. API image generation is not a V1.6 thread target and is not default-planned for V1.8.
8. Vercel stays read-only and does not perform real acceptance.

## Deferred Versions

| Version | Position | Not In Current Thread |
| --- | --- | --- |
| `V1.6` | Real-use validation, flow correction, docs baseline | No competitor screenshot inbox, no automation workflow, no API image generation expansion |
| `V1.7` | Competitor screenshot inbox planning target | Not implemented in V1.6-00 |
| `V1.8` | Post-confirmation content workflow planning target | Not implemented in V1.6-00 |

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

Thread V1.6-00 required:

- run docs-safe checks using the existing commands
- confirm no schema / migration / dependency changes
- confirm no business code changes were made by this thread

## Archive Pointer

- Detailed V1.5 implementation and stabilization history remains in the current docs plus archive pointers.
- V1.6-00 establishes the new planning baseline; later V1.6 execution threads should reference it instead of re-deriving scope.
