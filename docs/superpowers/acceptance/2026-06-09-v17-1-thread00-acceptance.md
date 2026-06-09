# V1.7.1 Thread 00 Acceptance

## Scope

- Thread line: `V1.7.1 Thread 00: 多样本回归与状态一致性稳定化`
- Entry basis:
  - `V1.7 MVP Thread 01` minimum confirm-write loop already landed
  - `V1.7 MVP Thread 02` MVP closeout already passed
  - web ChatGPT allowed entry into `V1.7.1` only as a narrow stabilization slice, not as new feature expansion
- This thread only hardens:
  - candidate status expression
  - direct-confirm eligibility rules
  - duplicate / blocked / already-linked state consistency
  - lightweight regression locking

## Conclusion

- Result: `Pass`
- Judgment: The current competitor screenshot confirm flow is stable enough to continue into the next approved `V1.7.1` stabilization thread.
- Boundary judgment: This thread stayed inside the approved narrow stabilization scope and did not expand schema, AI behavior, or product-domain logic.

## What Changed

### State Expression

- Competitor screenshot draft candidates now expose:
  - `statusLabel`
  - `qualityLabel`
  - `canConfirmDirectly`
  - `confirmStateLabel`
  - `confirmStateTone`
  - `confirmBlockedReason`
- Candidate cards now surface these states directly so the user can distinguish:
  - `识别成功`
  - `识别失败`
  - `识别中`
  - `已跳过`
  - `缺少可用草稿`
  - `已转正式竞品`
  - `待人工确认`

### Confirm Bridge Hardening

- `confirmScreenshotJobToCompetitor(...)` now rejects confirm requests when:
  - the job does not exist
  - the job does not belong to the current product
  - the job is not `sourceType=competitor`
  - the job already has `competitorId`
  - the job status is not `success`
  - the job has neither `confirmedDraft` nor `structuredDraft`

### Page And Card Consistency

- Product detail `confirmDraftJobId` now opens the confirm form only when `candidate.canConfirmDirectly`.
- Already-linked or blocked candidates now show the exact reason note instead of a stale confirm form.
- Candidate cards no longer show `确认转正式竞品` for non-confirmable states; they now route the user back to the screenshot-recognition page when further processing is needed.

### Regression Lock

- Added verify script:
  - `scripts/thread-v17-1-thread00-stabilization-verify.mts`

## Files In This Thread

- `src/lib/services/screenshot/screenshotRecognitionService.ts`
- `src/components/products/competitor-screenshot-draft-panel.tsx`
- `src/app/products/[id]/page.tsx`
- `scripts/thread-v17-1-thread00-stabilization-verify.mts`
- `agent-memory/CURRENT_STATUS.md`
- `agent-memory/SESSION_LOG.md`

## Verification Commands

1. `npx tsx scripts/thread-v17-1-thread00-stabilization-verify.mts`
2. `npm run encoding:check`
3. `npm run typecheck`
4. `npm run lint`
5. `npm run build`

All passed on Windows local runtime on `2026-06-09`.

## Local Browser Regression

### Direct Reopen Regression

1. Open `http://localhost:3000/products/146?tab=competitors&confirmDraftJobId=14`
2. Confirm the page does not render the screenshot confirm form
3. Confirm the top note explains that the draft has already been converted into a formal competitor
4. Confirm the candidate card still shows:
   - `识别成功`
   - `high`
   - `已转正式竞品`
   - duplicate-prevention note
   - CTA `查看已确认竞品`

### Normal Competitor Tab Regression

1. Open `http://localhost:3000/products/146?tab=competitors`
2. Confirm the normal competitor page state still shows the existing formal competitor list entry
3. Confirm the same screenshot draft candidate card appears in the draft panel
4. Confirm the card CTA remains `查看已确认竞品`, not `确认转正式竞品`
5. Confirm the blocked reason is visible on the card without requiring the direct URL reopen path

## Current Local Data Limit

- Current local Windows runtime only has one real `sourceType=competitor` screenshot-recognition sample:
  - `productId=146`
  - `jobId=14`
  - `competitorId=93`
- Because of that limited real sample set, this thread combines:
  - one real browser regression sample
  - one code-level verify script
- A later stabilization thread may still need broader multi-sample acceptance once more real local competitor screenshot jobs exist.

## Boundary Check

- No Prisma schema change
- No migration
- No dependency change
- No `CompetitorDraft`
- No screenshot-path migration
- No cleanup / trash logic change
- No V1.8 content workflow
- No AI trigger expansion
- No OCR expansion
- No platform automation
- No background queue

## Allowed Next Step

- Open only the next web-approved `V1.7.1` stabilization thread.
- Do not reopen feature expansion, schema work, or V1.8 workflow mixing inside this acceptance slice.
