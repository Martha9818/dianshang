# V1.7 MVP Thread 02 Acceptance

## Scope

- Thread line: `V1.7 MVP Thread 02: Confirm-Write 回归与 V1.7 MVP 收口验收`
- Based on completed Thread 01 minimum loop:
  - screenshot draft candidate -> confirm form
  - user manual completion
  - formal `Competitor` creation through existing competitor-service
  - write-back `job.competitorId`
  - duplicate confirm prevention

## Conclusion

- Result: `Pass`
- Judgment: The current V1.7 MVP confirm-write loop is locally usable and stays inside the approved boundary.
- Next allowed step: evaluate entry into `V1.7.1` stabilization only; do not open new schema / AI / path-migration work inside V1.7 MVP.

## Files Changed In This Slice

- `src/app/products/[id]/page.tsx`
- `src/app/products/actions.ts`
- `src/components/products/competitor-screenshot-confirm-form.tsx`
- `src/components/products/competitor-screenshot-draft-panel.tsx`
- `src/lib/services/competitor-service.ts`
- `src/lib/services/screenshot/screenshotRecognitionService.ts`
- `src/lib/services/screenshot/screenshotTypes.ts`
- `docs/superpowers/specs/2026-06-09-v17-confirm-to-competitor-design-gate.md`
- `agent-memory/CURRENT_STATUS.md`
- `agent-memory/SESSION_LOG.md`

## Verification Commands

1. `npm run encoding:check`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`

All passed on Windows local runtime on 2026-06-09.

## Local Acceptance Path

### Real Local Write Check

1. Open `http://localhost:3000/products/146?tab=competitors`
2. Open screenshot draft candidate `jobId=14`
3. Enter confirm form and manually complete formal competitor required fields
4. Submit confirm action
5. Verify formal competitor `id=93` is created and appears in the existing competitor list
6. Verify candidate CTA switches from `确认转正式竞品` to `查看已确认竞品`
7. Verify reopening `confirmDraftJobId=14` no longer shows the confirm form and only shows the duplicate-prevention note

### Regression Checks Completed

- Unconfirmed candidate can open confirm form
- Draft prefill values remain editable
- Confirm flow reuses existing competitor-service logic
- `ScreenshotRecognitionJob.competitorId` is written back
- `needsUserConfirmation` is cleared after success
- Formal competitor screenshot reuses the current screenshot `imagePath`
- Candidate does not remain repeat-confirmable after success
- Formal competitor appears only after explicit user confirm
- No auto-rescore or formal analysis trigger was added

## Vercel Read-Only Boundary

- Required message remains:
  - `预览环境只读，请在 Windows 本地验收。`
- Current code path still keeps preview confirm-write blocked by runtime write guard.
- This acceptance did not perform real preview writes and did not relax any Vercel boundary.

## Boundary Check

- No Prisma schema change
- No migration
- No dependency change
- No new `CompetitorDraft`
- No new AI trigger
- No screenshot-path migration
- No cleanup / trash logic change
- No V1.8 content workflow behavior
- No platform automation
- No OCR expansion
- No background queue

## Known Notes

- Local acceptance used existing sample data and produced one real local record:
  - screenshot draft job `14`
  - formal competitor `93`
- Candidate status copy was tightened during Thread 02 so `草稿已确认` and `已转正式竞品` are visually distinguished.
