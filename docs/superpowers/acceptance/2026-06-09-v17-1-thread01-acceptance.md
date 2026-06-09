# V1.7.1 Thread 01 Acceptance

## Scope

- Thread line: `V1.7.1 Thread 01: 受控样本补齐与边界回归验证`
- Entry basis:
  - `V1.7.1 Thread 00` has already completed state-consistency hardening
  - web ChatGPT suggested a next stabilization slice, but this thread deliberately narrows that suggestion to verification assets only
- This thread does **not** add new business capability
- This thread only adds:
  - controlled boundary verification
  - cleanup-proof temporary sample validation
  - acceptance documentation
  - memory updates

## Conclusion

- Result: `Pass`
- Judgment: The current V1.7.1 stabilization coverage is stronger and safer after adding controlled-sample boundary verification without changing schema, service behavior, or UI logic.
- Challenge judgment against the web suggestion:
  - Accepted: continue with a boundary-verification thread before any further feature work
  - Rejected: any unnecessary production-code expansion inside this thread
  - Tightened: verification must prove temporary sample cleanup, not just claim it

## What Changed

### New Verification Script

- Added:
  - `scripts/thread-v17-1-thread01-boundary-verify.mts`

### Coverage Added

- Source-level guard checks:
  - exact preview readonly message remains `预览环境只读，请在 Windows 本地验收。`
  - product page still gates `confirmDraftJobId` by `candidate.canConfirmDirectly`
  - draft-panel warning copy still exists for:
    - low quality
    - privacy risk
    - uncertainty
    - fallback CTA `先回截图识别页处理`

- Controlled local SQLite sample checks:
  - success + draft + no `competitorId` => confirmable
  - already linked candidate => blocked
  - wrong `sourceType` => excluded from competitor candidates and rejected by confirm service
  - cross-product candidate => not leaked into another product
  - `processing` => blocked
  - `failed` => blocked
  - `skipped` => blocked
  - missing draft payload => blocked
  - low-quality candidate => warning data preserved
  - privacy-risk candidate => warning data preserved
  - uncertainty candidate => warning data preserved
  - job missing => rejected
  - product mismatch => rejected
  - duplicate confirm after success => rejected

### Controlled Sample Safety

- Temporary verification data uses the explicit prefix:
  - `__V171_VERIFY__`
- Verification script cleans only the records it creates itself
- Script prints cleanup counts after execution
- Final cleanup result on this thread:
  - `products: 0`
  - `competitors: 0`
  - `jobs: 0`

## Files In This Thread

- `scripts/thread-v17-1-thread01-boundary-verify.mts`
- `docs/superpowers/acceptance/2026-06-09-v17-1-thread01-acceptance.md`
- `agent-memory/CURRENT_STATUS.md`
- `agent-memory/SESSION_LOG.md`

## Verification Commands

1. `npx tsx scripts/thread-v17-1-thread01-boundary-verify.mts`
2. `npx tsx scripts/thread-v17-1-thread00-stabilization-verify.mts`
3. `npm run encoding:check`
4. `npm run typecheck`
5. `npm run lint`
6. `npm run build`

All passed on Windows local runtime on `2026-06-09`.

## Thread 01 Output Evidence

The controlled verification script prints:

- created temporary product ids
- created temporary screenshot job ids
- created temporary competitor ids
- checked scenario list
- cleanup counts after the script finishes

For the passing run in this thread, cleanup counts were:

- `products: 0`
- `competitors: 0`
- `jobs: 0`

## Boundary Check

- No Prisma schema change
- No migration
- No dependency change
- No new production feature
- No `CompetitorDraft`
- No screenshot-path migration
- No cleanup / trash logic rewrite
- No V1.8 content workflow
- No AI trigger expansion
- No OCR expansion
- No platform automation
- No background queue

## Skeptical Review Notes

- The external web proposal was directionally useful, but incomplete.
- It did not explicitly require proof that temporary verification data is fully cleaned after the script runs.
- It also did not explicitly lock the existing page-level warning copy and direct-reopen gating behavior.
- This thread fills those gaps without broadening scope.

## Allowed Next Step

- Open only the next web-reviewed `V1.7.1` stabilization or closeout thread.
- Before implementing any new behavior, re-check whether the next proposal is actually required by the current real sample set and current repo facts.
