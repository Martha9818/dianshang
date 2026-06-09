# EcomPilot V1.7 Confirm-To-Competitor Design Gate

- Date: `2026-06-09`
- Thread: `V1.7 Design Gate Next`
- Status: `frozen for MVP write-thread entry review`
- Type: design freeze / write-boundary freeze / no-implementation

## 1. Goal

Freeze the minimum safe design for:

`ScreenshotRecognitionJob -> human confirmation -> formal Competitor`

This thread does **not** implement the write loop. It freezes the rules that must be true before the later MVP write thread is allowed to start.

## 2. Confirmed Baseline

1. V1.6 closeout is complete on the current mainline.
2. V1.7 is currently limited to `Design Gate` work only.
3. The current read-only prep slice is already landed:
   - product detail competitor tab now shows read-only competitor screenshot draft candidates
   - draft candidates are read from existing `ScreenshotRecognitionJob`
   - no formal `Competitor` write bridge exists yet
4. The current screenshot reality remains:
   - `uploads/products/{productId}/competitors/...`
5. V1.7 MVP continues to reuse `ScreenshotRecognitionJob` as the competitor screenshot draft container.
6. V1.7 MVP does **not** add `CompetitorDraft` in this phase.
7. Vercel remains preview-only and read-only. Any future confirm-write action attempted in preview must show:
   - `预览环境只读，请在 Windows 本地验收。`

## 3. Frozen Non-Goals

This thread does **not** allow:

1. Prisma schema changes
2. migrations
3. dependency changes
4. path migration
5. cleanup / trash behavior changes
6. AI prompt / provider / execution changes
7. automatic competitor creation
8. automatic scoring
9. automatic competitor analysis
10. V1.8 content workflow
11. OCR expansion
12. platform automation
13. default high-cost image generation

## 4. Draft Container Freeze

The draft container is frozen as:

1. Draft source of truth for this phase: `ScreenshotRecognitionJob`
2. Draft candidate scope in this phase: `sourceType=competitor`
3. Product ownership in this phase: `job.productId`
4. Confirmed formal competitor link in this phase: `job.competitorId`
5. No separate `CompetitorDraft` table or model is introduced

Interpretation:

- `ScreenshotRecognitionJob` is still a draft/task record, not a formal competitor.
- A formal `Competitor` exists only after explicit user confirmation succeeds.

## 5. Candidate Eligibility Freeze

A `ScreenshotRecognitionJob` may be shown as a competitor draft candidate when all of the following are true:

1. `sourceType = competitor`
2. `productId` matches the current product
3. the job is not deleted or otherwise unavailable
4. the page can read either:
   - `confirmedDraft`, or
   - `structuredDraft`, or
   - the job image/task record for a visible placeholder state

A candidate may enter the future **confirm flow** only when all of the following are true:

1. `sourceType = competitor`
2. `productId` matches the current product
3. `competitorId` is empty
4. a usable draft exists, or the confirmation form can be manually completed from the job context
5. the runtime is writable

A candidate must **not** be confirmable when any of the following is true:

1. `productId` is missing or does not match the current product
2. `competitorId` is already filled
3. the runtime is preview/read-only
4. the job record cannot be read

## 6. Candidate State Freeze

Future UI and server behavior must treat these states distinctly:

1. `confirmed candidate`
   - already linked to a formal `Competitor`
   - cannot be confirmed again
2. `failed candidate`
   - may be visible for audit/history
   - cannot use a one-click confirm path
   - requires explicit manual review before any later reuse
3. `low-quality candidate`
   - may be shown
   - confirmation must show a warning that recognition quality is weak
4. `privacy-risk candidate`
   - may be shown
   - confirmation must show a warning to manually inspect sensitive content
5. `draft-missing-fields candidate`
   - may still enter confirmation if the user can manually complete required formal fields

## 7. Field Mapping Freeze

The future confirm form must treat all AI-derived values as editable draft inputs, not formal facts.

### 7.1 Formal Competitor fields that must be user-confirmable

The minimum formal fields that still belong to the existing competitor workflow are:

1. `platform`
2. `title`
3. `price`
4. `heatMetricType`
5. `heatMetricValue`
6. `dataDate`

These remain subject to the existing `competitor-service` validation rules.

### 7.2 Draft-to-form mapping

Future MVP write-thread mapping is frozen as:

1. `possiblePlatformSource`
   - maps into the editable `platform` form field
   - never auto-bypasses formal validation
2. `possibleTitle`
   - maps into the editable `title` form field
3. `possiblePrice`
   - maps into the editable `price` form field
   - if the value is not safely parseable, leave formal `price` incomplete and require manual completion
4. `possibleSalesOrHeat`
   - maps into editable heat/market-reference input
   - it does **not** directly become guaranteed `heatMetricType` + `heatMetricValue`
   - the user must choose or correct the final formal heat metric expression
5. `sellingPoints[]`
   - maps into a draft helper for formal `sellingPoint` or `notes`
   - exact final text remains user-editable
6. `uncertaintyNotes[]`
   - maps into review warnings and optional notes context
   - does not become trusted formal market fact by itself
7. `privacyNotes[]`
   - maps into review warnings and optional notes context
   - must not silently write sensitive content as formal competitor fact
8. `qualityLevel`
   - controls warning severity and confirm guidance only
   - does not directly change formal scoring

### 7.3 Required manual completion rules

The future confirmation form must require manual completion or confirmation for any formal field that is missing, ambiguous, or invalid after prefill.

At minimum, the design freezes that:

1. missing `platform` cannot be auto-assumed
2. missing or invalid `price` cannot be auto-assumed
3. missing `heatMetricType` or `heatMetricValue` cannot be auto-assumed
4. missing `dataDate` cannot be auto-assumed

## 8. Confirm Flow Freeze

The future minimum write loop is frozen as:

1. user opens a candidate from the product competitor tab
2. system opens a confirmation form prefilled from draft values where possible
3. user edits or completes fields
4. system shows warnings before final confirm
5. user explicitly confirms
6. server validates that the job still belongs to the product and is still unconfirmed
7. server creates formal `Competitor` through the existing competitor service boundary
8. server writes back the formal link marker to the job
9. UI shows the candidate as already confirmed
10. the new formal `Competitor` appears in the existing competitor module

The following are also frozen:

1. cancel creates nothing
2. closing the form creates nothing
3. preview mode creates nothing
4. confirm must be explicit and user-triggered

## 9. Duplicate Prevention Freeze

The duplicate-prevention strategy for the future MVP write thread is frozen as:

1. `job.competitorId` is the canonical sign that the candidate has already been confirmed into a formal competitor
2. before formal creation, the server must re-check that `job.competitorId` is still empty
3. once creation succeeds, the server must write back the linked `competitorId`
4. a candidate with existing `job.competitorId` must not offer a second confirm action
5. refreshes, retries, or repeated clicks must not create duplicate formal competitors from the same job

This freeze does **not** attempt to solve broader semantic dedupe across different jobs or different screenshots in V1.7 MVP.

## 10. Existing Service Boundary Freeze

Future formal competitor creation in this flow must reuse the existing service boundary:

1. do not create a second business logic path in the page layer
2. do not duplicate competitor validation rules in UI-only code
3. the future bridge action may orchestrate:
   - job lookup
   - product ownership check
   - confirmable-state check
   - call into existing competitor creation service
   - job link writeback

But the future bridge action must **not** become a parallel competitor domain implementation.

## 11. Formal Data Boundary Freeze

Competitor screenshot draft candidates remain outside the formal evaluation pipeline until a formal `Competitor` exists.

Before confirmation, a candidate must **not**:

1. enter the formal competitor list
2. count as a formal valid competitor for scoring
3. enter formal competitor analysis inputs
4. affect profit logic
5. affect formal recommendation/scoring

After formal creation succeeds:

1. the created `Competitor` may enter the existing competitor module
2. the product may then rely on that formal competitor through the normal existing flow
3. V1.7 MVP still must not auto-trigger formal scoring or auto-run analysis without an explicitly approved later thread

## 12. Path Strategy Freeze

For V1.7 MVP, the current competitor screenshot path remains frozen as:

`uploads/products/{productId}/competitors/...`

This thread explicitly freezes:

1. no path migration
2. no file move
3. no new `uploads/competitors/{productId}/` switch
4. no cleanup reinterpretation based on this design gate

## 13. Vercel Behavior Freeze

All future confirm-write entry points in preview must respect:

1. no SQLite writes
2. no upload writes
3. no job link writeback
4. no AI execution
5. no filesystem mutations

The user-facing preview response must be:

`预览环境只读，请在 Windows 本地验收。`

## 14. Error Handling Freeze

The future MVP write thread must handle these cases safely:

1. job not found
2. product/job mismatch
3. already-confirmed job
4. invalid required formal fields
5. formal competitor creation failure
6. post-create job link writeback failure

Error presentation must not expose:

1. API keys
2. `.env` values
3. full local absolute paths
4. database paths
5. raw prompts
6. full stack traces

The product detail page must keep rendering even if candidate confirmation fails.

## 15. Minimum Allowed MVP Write Thread

Only after this design gate is accepted may the next thread open:

`V1.7 MVP Minimum Confirm-Write Loop`

Its minimum allowed outcome is:

1. user opens draft candidate
2. user edits/completes draft-backed form
3. user explicitly confirms
4. system creates formal `Competitor`
5. system writes back `job.competitorId`
6. candidate cannot be confirmed again
7. formal `Competitor` appears in the existing competitor module

## 16. Explicit Out-Of-Scope For The Next Write Thread

Even the later MVP write thread still must not include:

1. `CompetitorDraft`
2. schema changes
3. migrations
4. dependency changes
5. path migration
6. cleanup/trash redesign
7. automatic AI reruns
8. automatic scoring
9. automatic competitor analysis
10. V1.8 content workflow
11. OCR expansion
12. platform automation
13. background queueing

## 17. Thread Outcome

This design gate is complete when reviewers agree that:

1. confirmable candidate rules are frozen
2. field mapping is frozen
3. duplicate prevention is frozen
4. `job.competitorId` is accepted as the canonical already-confirmed link
5. preview read-only behavior is frozen
6. draft-vs-formal evaluation boundary is frozen
7. the next thread may focus only on the minimum confirm-write loop
