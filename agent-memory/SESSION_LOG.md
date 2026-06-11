# Session Log

Only the latest summary stays here. Older detailed history is archived or retained in current docs.

## 2026-06-11

### Reinstall Resume Package

- Changed: Added a project-local reinstall resume bundle under `重装恢复/` so a fresh Codex install can recover the current EcomPilot working context without depending on sidebar chat history.
- Changed: Added `重装恢复/README.md` as the operator-facing recovery guide, `重装恢复/HANDOFF.md` as the compact current-state summary, and `重装恢复/RECOVERY_PROMPT.txt` as the exact startup prompt for a new Codex session.
- Changed: Anchored the recovery package to the repo-fact startup order `AGENTS.md -> CURRENT_STATUS.md -> SESSION_LOG.md -> DOC_INDEX.md` and explicitly reminded future sessions to preserve the current boundary instead of inferring missing chat history.
- Verification: Checked current branch and git context with `git rev-parse --abbrev-ref HEAD`, `git status --short`, `git log --oneline -5`, and re-read `docs/current/THREAD_SCOPE_CHECKLIST.md` before writing the bundle.
- Boundary: Docs-only handoff packaging only. No schema, migration, dependency, runtime write-path, AI behavior, UI behavior, or product logic change was introduced.

## 2026-06-09

### V1.7.1 Phase Closeout Review

- Changed: Re-checked the latest external web proposal skeptically instead of treating it as authority. The repo-fact review concluded that another immediate `V1.7.1` code thread would mostly duplicate synthetic verification rather than address a newly proven local gap.
- Changed: Updated active memory guidance so the current `V1.7.1` bundle is treated as phase-closeout first: finish clean commit/push, preserve the current acceptance baseline, and wait for real local usage to surface the next narrow issue before opening a new thread.
- Boundary: No product behavior, schema, migration, dependency, AI-trigger, screenshot-path, cleanup, or V1.8 content-workflow change was introduced during this closeout judgment.

### V1.7.1 Thread 01 Controlled Sample Coverage And Boundary Regression

- Changed: Added `scripts/thread-v17-1-thread01-boundary-verify.mts` as a verification-only thread artifact instead of extending product capability. The script uses temporary `__V171_VERIFY__` SQLite samples to validate confirm-blocking and candidate-state boundaries without adding schema or new feature paths.
- Changed: Tightened the verification design beyond the external web suggestion by also locking source-level UI boundaries: readonly-copy preservation, low-quality/privacy/uncertainty warning copy, fallback CTA copy, and `confirmDraftJobId` gating in the product page.
- Verification: The new script now covers success confirmability, already-linked blocking, wrong-source rejection, cross-product isolation, `processing` / `failed` / `skipped` / missing-draft blocking, low-quality/privacy/uncertainty warning data, missing-job rejection, product-mismatch rejection, and duplicate confirm rejection.
- Verification: The script also prints cleanup counts after execution and this thread confirms zero residual temporary rows remain: `products=0`, `competitors=0`, `jobs=0`.
- Verification: Re-ran `npx tsx scripts/thread-v17-1-thread01-boundary-verify.mts`, `npx tsx scripts/thread-v17-1-thread00-stabilization-verify.mts`, `npm run encoding:check`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- Boundary: No schema, migration, dependency, AI-trigger expansion, screenshot-path migration, cleanup/trash logic change, or V1.8 content-workflow behavior was introduced. This thread intentionally adds verification assets only.

### V1.7.1 Thread 00 Multi-Sample Regression And State-Consistency Stabilization

- Changed: Added explicit competitor screenshot draft candidate confirmability states so the product page can distinguish `已转正式竞品`、`识别失败`、`识别中`、`已跳过`、`缺少可用草稿` and `待人工确认` instead of relying on a single generic CTA.
- Changed: Hardened `confirmScreenshotJobToCompetitor(...)` so the server now rejects confirm writes unless the screenshot job is still `success`, still belongs to the current product, still has no linked `competitorId`, and still contains a usable draft payload.
- Changed: Reworked the competitor draft panel and product detail page so blocked or already-linked candidates surface their reason directly and no longer reopen the confirm form through `confirmDraftJobId`.
- Changed: Added `scripts/thread-v17-1-thread00-stabilization-verify.mts` and `docs/superpowers/acceptance/2026-06-09-v17-1-thread00-acceptance.md` to lock the new state rules and record the local stabilization result.
- Verification: Ran `npx tsx scripts/thread-v17-1-thread00-stabilization-verify.mts`, `npm run encoding:check`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- Verification: Browser-checked local `http://localhost:3000/products/146?tab=competitors` and `http://localhost:3000/products/146?tab=competitors&confirmDraftJobId=14`; confirmed the already-linked sample `jobId=14 -> competitorId=93` now consistently shows `识别成功 / high / 已转正式竞品`, exposes the duplicate-prevention reason, keeps the normal CTA as `查看已确认竞品`, and never re-renders the confirm form.
- Boundary: No schema, migration, dependency, AI-trigger expansion, screenshot-path migration, cleanup/trash change, or V1.8 content-workflow behavior was introduced.

### V1.7 MVP Thread 02 Confirm-Write Regression And MVP Closeout

- Changed: Tightened the competitor screenshot candidate status wording so the panel now clearly distinguishes `草稿已确认` from `已转正式竞品`, reducing the risk that a pre-formal draft is mistaken for a completed formal write.
- Changed: Added `docs/superpowers/acceptance/2026-06-09-v17-mvp-thread02-acceptance.md` as the MVP closeout record for the current confirm-write slice.
- Verification: Re-ran `npm run encoding:check`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- Verification: Re-checked local `http://localhost:3000/products/146?tab=competitors&confirmDraftJobId=14` after the real local write and confirmed the page no longer renders the confirm form for an already linked draft and instead shows the duplicate-prevention note plus `查看已确认竞品`.
- Boundary: No schema, migration, dependency, AI-trigger, screenshot-path migration, cleanup/trash change, or V1.8 content-workflow behavior was introduced.

### V1.7 MVP Thread 01 Confirm-Write Loop

- Changed: Implemented the approved `V1.7 MVP Thread 01` path that turns a competitor screenshot draft candidate into a formal competitor through the existing product detail competitor tab instead of adding a new schema or a new draft table.
- Changed: Added a dedicated competitor screenshot confirm form, draft-to-form prefill mapping, and a new product server action so users can open `confirmDraftJobId`, review AI-prefilled reference values, manually complete the formal required fields, and submit a formal `Competitor` create from the current product page.
- Changed: Added `confirmScreenshotJobToCompetitor(...)` in the screenshot service, reusing the existing competitor-service rules inside a transaction to create the formal record, write back `job.competitorId`, clear `needsUserConfirmation`, preserve the confirmed draft payload, and record `CONFIRM_SCREENSHOT_JOB_TO_COMPETITOR`.
- Changed: Extended the competitor screenshot draft candidate view with `linkedCompetitorId`, updated the draft panel CTA to switch from `确认转正式竞品` to `查看已确认竞品` after confirmation, and added a UI guard so reopening the same `confirmDraftJobId` no longer renders the confirm form after the job is already linked.
- Changed: Unified the screenshot preview read-only message to the exact required text `预览环境只读，请在 Windows 本地验收。`
- Verification: Ran `npm run typecheck`, `npm run lint`, and `npm run build`.
- Verification: Browser-checked local `http://localhost:3000/products/146?tab=competitors`, opened existing draft job `14`, verified the confirm form appears with AI-prefilled selling points, submitted a real local confirm write, confirmed formal competitor `93` was created and shown in the existing competitor list, and confirmed the draft candidate now switches to `查看已确认竞品` while direct `confirmDraftJobId=14` access shows only a duplicate-prevention notice.
- Boundary: No schema, migration, dependency, AI-trigger, screenshot-path migration, cleanup/trash change, or V1.8 content-workflow behavior was introduced.

### V1.7 Design Gate Confirm-To-Competitor Freeze

- Changed: Added `docs/superpowers/specs/2026-06-09-v17-confirm-to-competitor-design-gate.md` as the formal design-freeze document for the next V1.7 thread after the read-only prep slice.
- Changed: Froze that V1.7 MVP continues reusing `ScreenshotRecognitionJob` as the competitor screenshot draft container, does not add `CompetitorDraft`, and keeps the current screenshot path reality `uploads/products/{productId}/competitors/...` for this phase.
- Changed: Froze the candidate eligibility, confirmable conditions, field-mapping rules, manual-completion rules, duplicate-prevention strategy, preview read-only behavior, and the rule that draft candidates must not enter formal competitor analysis or scoring until a formal `Competitor` is explicitly created.
- Changed: Froze `job.competitorId` as the canonical already-confirmed link for the later MVP write thread and defined the minimum next-thread write loop as `candidate -> user edit/confirm -> create formal Competitor -> write back job.competitorId -> show in existing competitor module`.
- Boundary: This thread remained design-only. No schema, migration, dependency, AI trigger, formal competitor write action, path migration, or cleanup/trash behavior change was introduced.

### V1.7 Design Gate Read-Only Competitor Screenshot Draft Prep

- Changed: Continued the already-agreed `V1.7 Design Gate` direction by keeping work strictly inside a low-risk read-only prep layer instead of starting formal `V1.7` implementation.
- Changed: Added a new read-only competitor screenshot draft panel under the product-detail competitor tab so the current product page can surface competitor screenshot draft candidates without mixing them into formal competitor writes.
- Changed: Added a read-only `getCompetitorScreenshotDraftCandidates(productId)` query in the screenshot recognition service that reuses existing `ScreenshotRecognitionJob` data for `sourceType=competitor`, maps the current effective draft fields, and keeps the result bounded to recent records only.
- Changed: Extended `getProductDetailPageData` to assemble `competitorScreenshotDraftCandidates` through the existing service boundary and wired the result into the product detail page without changing schema, migration, dependency, AI execution, or competitor write behavior.
- Verification: Ran `npm run typecheck`, `npm run lint`, and `npm run build`; browser-checked local `http://localhost:3000/products/6?tab=competitors` and confirmed the new read-only panel renders with the expected title, notice, and screenshot-page entry link.
- Boundary: No schema, migration, dependency, AI trigger, screenshot-path migration, cleanup logic change, or formal competitor confirm/write flow was introduced. This remains `V1.7 Design Gate` prep only.

### V1.6-08 Final Acceptance And Closeout

- Changed: Confirmed the current mainline should now be treated as `V1.6-08 final acceptance and closeout`, not as `V1.5` or as an unfinished `V1.6-07` thread.
- Changed: Updated `AGENTS.md` so the current line no longer claims `V1.5 after V1-Plus completion and baseline freeze`, and instead points to the V1.6 closeout state and the V1.7 / V1.8 deferral boundary.
- Changed: Added `docs/superpowers/acceptance/2026-06-09-v16-final-acceptance.md` as the formal V1.6 closeout report with scope summary, verification result, accepted limits, and the explicit conclusion that the next approved step is `V1.7 Design Gate`.
- Changed: Updated active status memory so `CURRENT_STATUS.md` now records the current line as `V1.6-08 final acceptance and closeout` and points the next step to design-only V1.7 planning.
- Verification: Ran `npx tsx scripts/thread-v16-02-inspiration-inbox-verify.mts`, `npx tsx scripts/thread-v16-03-inspiration-triage-verify.mts`, `npx tsx scripts/thread-v16-04-convert-confirm-verify.mts`, `npx tsx scripts/thread-v16-05-product-evaluation-flow-verify.mts`, `npx tsx scripts/thread-v16-06-evaluation-tab-guidance-verify.mts`, `npx tsx scripts/thread-v16-07-product-detail-action-hierarchy-verify.mts`, `npm run typecheck`, `npm run lint`, `npm run encoding:check`, `npm run build`, and `npx prisma validate`.
- Verification: Browser-checked local `/inspirations`, `/products`, `/products/146`, and `/products/6?tab=scoring`; confirmed the AI inbox main-entry expression, confirm-then-convert handoff, formal evaluation flow, action hierarchy, and scoring-page wording still match the V1.6 boundary.
- Boundary: No schema, migration, dependency, business-logic rewrite, V1.7 feature implementation, V1.8 content workflow, V1.9 stabilization feature, or V2 desktop implementation was introduced during V1.6-08 closeout.

## 2026-06-08

### V1.6-07 Product Detail Action Hierarchy Refinement

- Changed: Reworked the product-detail top action area so the primary actions now follow the formal evaluation flow: `补竞品`、`算利润`、`重新评分`, with `截图识别` retained as a secondary helper and `编辑商品` / `返回商品池` kept as utility actions.
- Changed: Added a new top-of-page quick-action explanation block that explicitly tells the user to move through `补竞品 -> 看机会 -> 算利润 -> 得结论` instead of treating product detail as a mixed intake surface.
- Changed: Moved `链接导入` down into an auxiliary source-record block with explicit copy that it remains available only for old links, manual source notes, and historical draft context, not as the main product-evaluation entry.
- Added: `scripts/thread-v16-07-product-detail-action-hierarchy-verify.mts` to lock the new action hierarchy, the quick-action explanation block, and the de-emphasized link-import wording.
- Verification: Run `npx tsx scripts/thread-v16-07-product-detail-action-hierarchy-verify.mts`, the completed V1.6-06 / 05 / 04 / 03 / 02 verification scripts, plus `npm run typecheck`, `npm run lint`, `npm run encoding:check`, and `npm run build`; browser-check the affected local product detail header before continuing.
- Boundary: No schema, migration, dependency, write-path change, routing rewrite, scoring-engine rewrite, or automation expansion was introduced.

### V1.6-06 Evaluation Tab Guidance Refinement

- Changed: Added lightweight top-of-tab guidance cards to `竞品参考`、`AI 机会分析`、`成本利润` so each module now clearly explains why the step exists, what it produces, and how it affects the final `测试结论`.
- Changed: The `竞品参考` tab now explicitly shows the formal progress signal `当前有效竞品 x / 3` and reminds the user that insufficient competitor coverage keeps the final rule-based conclusion conservative.
- Changed: The `AI 机会分析` tab now makes the boundary clearer: it summarizes opportunity/risk interpretation only, does not auto-overwrite formal scoring, and exists to support the later test decision rather than replace it.
- Changed: The `成本利润` tab now explicitly surfaces which cost fields are still missing and makes it obvious that a missing `售价 / 进货价 / 运费` set blocks a complete formal conclusion.
- Added: `scripts/thread-v16-06-evaluation-tab-guidance-verify.mts` to lock the new purpose/output/decision-impact guidance and the explicit competitor-progress / missing-cost wording.
- Verification: Run `npx tsx scripts/thread-v16-06-evaluation-tab-guidance-verify.mts`, the completed V1.6-05 / 04 / 03 / 02 verification scripts, plus `npm run typecheck`, `npm run lint`, `npm run encoding:check`, and `npm run build`; browser-check the affected local product tabs before continuing.
- Boundary: No schema, migration, dependency, scoring-engine rewrite, AI auto-write, tab routing change, or automation expansion was introduced.

### V1.6-05 Product Formal Evaluation Flow Alignment

- Changed: Reworked the product detail navigation labels from backend-style tabs into a clearer evaluation flow vocabulary: `竞品参考`、`AI 机会分析`、`成本利润`、`测试结论`, while keeping the original route keys and no schema change.
- Changed: Added a top-level formal-evaluation summary area on product detail that now shows `当前正式结论`、formal score visibility, missing prerequisites, next-step guidance, and a four-step `补竞品 -> 看机会 -> 算利润 -> 得结论` process rail so users can see where the product is blocked without guessing across tabs.
- Changed: Extended the product-detail data assembly to look up the source inspiration record for converted products, recompute its draft triage in memory, and surface it only as a read-only reference context together with active competitor-analysis snapshot count.
- Changed: Reworked the scoring tab into a formal `测试结论` page with an explicit rule-based decision explanation, a clearer current-missing-conditions card, stronger rescore guidance, and a source-inspiration reference card that makes the split between draft triage and formal scoring visible.
- Added: `scripts/thread-v16-05-product-evaluation-flow-verify.mts` to lock the evaluation-flow labels, formal conclusion panel, source inspiration reference handoff, and service-layer wiring.
- Verification: Ran `npx tsx scripts/thread-v16-05-product-evaluation-flow-verify.mts`, `npx tsx scripts/thread-v16-04-convert-confirm-verify.mts`, `npx tsx scripts/thread-v16-03-inspiration-triage-verify.mts`, `npx tsx scripts/thread-v16-02-inspiration-inbox-verify.mts`, `npm run typecheck`, `npm run lint`, and `npm run encoding:check`; browser-checked local `/products/146?tab=scoring` and `/products/6?tab=scoring` to confirm both missing-data and partial-score scenarios render the new formal-evaluation guidance correctly.
- Boundary: No schema, migration, dependency, scoring-engine rewrite, auto-score overwrite, auto-content workflow, or automation expansion was introduced.

### V1.6-04 Inspiration Confirm-Then-Convert Alignment

- Changed: Added a shared inspiration-conversion constant module so the confirm-field contract and AI-prefill reference note stay centralized across the convert flow.
- Changed: Hardened the inspiration server action so product creation is blocked unless the explicit hidden confirmation field is posted; simple form opening or cancel actions no longer create a product.
- Changed: Reworked the inspiration buyer-desk convert CTA into a two-step confirm-then-convert flow, with `先进入人工确认` as the entry point and a dedicated human confirmation form before product creation.
- Changed: Marked AI-prefilled values as reference-only and kept `/products/new` unchanged so inspiration conversion remains manual, editable, and separate from normal product creation.
- Added: `scripts/thread-v16-04-convert-confirm-verify.mts` to lock the confirm-gate contract, button copy, hidden confirm field, and no-`window.confirm` requirement.
- Verification: Ran `npx tsx scripts/thread-v16-04-convert-confirm-verify.mts`, `npx tsx scripts/thread-v16-03-inspiration-triage-verify.mts`, `npx tsx scripts/thread-v16-02-inspiration-inbox-verify.mts`, `npm run typecheck`, `npm run lint`, `npm run encoding:check`, and `npm run build`.
- Boundary: No schema, migration, dependency, automatic product creation, automatic formal score write, or `/products/new` workflow change was introduced.

## 2026-06-04

### V1.6-03 Inspiration Draft Triage Scoring

- Changed: Added a lightweight draft-triage helper under `src/lib/modules/inspirations/triage.ts` that computes six review dimensions, a conservative total score, a conclusion band, and next-step guidance from existing inspiration AI draft fields only.
- Changed: Wired the inspiration inbox mapping layer to surface draft-triage score, conclusion, rationale, and disclaimer text without changing schema, migration, or dependencies and without writing into `ScoreSnapshot`.
- Changed: Updated the `/inspirations` buyer-desk queue cards, KPI strip, and right-side AI draft rail so users can quickly distinguish `优先保留 / 可以保留 / 暂存观察 / 建议放弃`, inspect the six triage dimensions, and see the explicit note `仅用于线索初筛，不代表正式商品评估。`
- Added: `scripts/thread-v16-03-inspiration-triage-verify.mts` and refreshed `scripts/thread-v16-02-inspiration-inbox-verify.mts` so the inbox baseline and the new triage layer are both locked by lightweight script checks.
- Verification: Run `npx tsx scripts/thread-v16-03-inspiration-triage-verify.mts`, `npx tsx scripts/thread-v16-02-inspiration-inbox-verify.mts`, `npm run typecheck`, `npm run lint`, `npm run encoding:check`, and `npm run build`.
- Boundary: No schema, migration, dependency, formal scoring-engine rewrite, `ScoreSnapshot` write, auto-product creation, or Vercel write-behavior change was introduced.

### V1.6-02B Buyer Desk Real-Workspace Relayout

- Changed: Reworked the active `/inspirations` B-version layout against the actual right-side workspace width after the shell gutter fix, removing the page-level `1600px` cap and shifting the desk into a full-width three-column composition.
- Changed: Rebalanced the desk into an AI inbox queue, a center original-image stage, and a right AI draft plus decision rail; the center stage now explicitly presents the imported/scanned inspiration image and does not imply AI-generated product imagery.
- Changed: Compressed the KPI strip, made the selected queue card more deliberate, moved long notes and auxiliary actions into a folded secondary section, and kept conversion form, advanced records, and scan settings folded by default.
- Changed: Added bottom safe space to the folded `收件箱设置与扫描记录` section so its title and helper text are not covered when the page is scrolled to the bottom.
- Verification: Ran `npm run typecheck`, `npm run lint`, `npm run encoding:check`, and `npm run build`; browser-checked `/inspirations` and confirmed the main workspace right gap is `0`, the active three-column widths are approximately `352 / 560 / 391`, and the original-image notice, AI draft, decision card, advanced records, and scan settings are all present.
- Boundary: No schema, migration, dependency, scan mechanism, AI generation logic, similarity logic, auto-product creation, or source-image deletion was introduced.

### Global Shell Width Regression Fix

- Changed: Removed the global `AppShell` `max-w-[1780px] mx-auto` cap, removed the desktop right gutter/right rounding, and added `min-w-0` to the main workspace area, fixing the wide-screen right-side blank area across routes without changing page business logic.
- Verification: Ran `npm run typecheck`, `npm run lint`, and `npm run build`; browser-checked `/inspirations`, `/products`, `/copywriting`, and `/prompt-tasks` on the local dev server and confirmed the main workspace fills to the viewport edge.
- Boundary: No schema, migration, dependency, scan, AI, similarity, product-conversion, or Vercel read-only logic changes were introduced.

## 2026-06-03

### V1.6-02 Inspiration Inbox Main View Rework

- Changed: Reworked `/inspirations` from a scan-log-leaning management page into an AI inbox workbench with image-first cards, AI draft priority, and a clearer `保留 / 放弃 / 转商品` decision flow.
- Changed: Rebuilt the inspiration list cards and detail view so candidate name, product type, target audience, next-step guidance, and AI draft status appear before file/debug detail.
- Changed: Follow-up acceptance patch moved the inbox list ahead of scan settings on wide screens so the first desktop visual focus is the workbench rather than the setup panel.
- Changed: Final V1.6-02B implementation rebuilt `/inspirations` into a buyer-style three-column desk with a left inbox queue, a center image stage, and a right AI insight plus decision rail, so the page reads like a daily selection workbench instead of a management backend.
- Changed: Follow-up layout patch grouped `文件信息与相似度`、`AI 任务与处理记录`、`扫描与任务历史` into a single right-side advanced-record rail below `转商品入口`, reducing empty whitespace on the right while keeping the left side focused on image, AI draft, and keep/reject decisions.
- Changed: Final B-version fidelity pass tightened `/inspirations` toward the approved buyer-desk reference by flattening the KPI strip, simplifying the top hierarchy, moving manual notes under the center image stage, turning the right AI draft into a compact row-style screening card, and making the left queue read more like a professional candidate list than a backend control stack.
- Changed: Adjusted the preview read-only notice to the exact required wording: `预览环境只读，请在 Windows 本地验收。`
- Changed: Added explicit placeholder handling for missing fields such as candidate price, visible-text summary, spec clues, recognition quality, and draft pre-screen score so the UI does not fabricate deterministic facts.
- Changed: Folded ScanLog, task history, similarity hints, and file information into collapsed advanced sections, while keeping them available for debugging and audit.
- Changed: Tightened preview safety on the inbox workbench by disabling task retry/delete controls alongside the existing write actions when runtime is read-only.
- Added: `scripts/thread-v16-02-inspiration-inbox-verify.mts` plus a pure inbox-view mapping module to lock the field order, placeholder wording, and no-draft guidance without adding a new test dependency.
- Verification: Run `npx tsx scripts/thread-v16-02-inspiration-inbox-verify.mts`, `npm run typecheck`, `npm run lint`, `npm run build`, and browser-check the local `/inspirations` page on Windows local runtime to confirm the three-column buyer-desk layout, collapsed scan-settings section, and right-side advanced-record rail.
- Boundary: No schema, migration, dependency, scan-mechanism rewrite, AI-generation rewrite, similarity-logic rewrite, auto-product creation, or source-image deletion was introduced.

### V1.6-01 Entry And Navigation Reordering

- Changed: Reordered the main navigation so `灵感箱` is the clearest primary entry and removed `/link-imports` from the main navigation while keeping the route itself available for old drafts.
- Changed: Rewrote the `/inspirations`, `/screenshots`, and `/link-imports` page headings, helper copy, empty states, and shortcut labels so the daily flow reads as `先把图片/截图进入灵感箱，再看 AI 草稿和初筛结果`.
- Changed: Re-expressed `/screenshots` as a supplementary recognition entry, and rewrote `/link-imports` as an auxiliary source-record page with an explicit warning that links alone cannot reliably identify title, price, or selling points.
- Changed: Updated README, `docs/current/PROJECT_MAP.md`, `docs/current/CHANGELOG_DEV.md`, and current status docs so the V1.6 entry hierarchy matches the implemented page copy.
- Verification: Run `npm run encoding:check`, `npm run lint`, `npm run typecheck`, `npm run build`, `npx prisma validate`, and `npm run thread09:verify`.
- Boundary: No schema, migration, dependency, link-parsing logic, crawler behavior, cookie storage, login state, or route deletion was introduced. `/link-imports` and existing link-import data remain intact.

### V1.6-00 Direction Freeze And Documentation Baseline

- Changed: Updated README, current planning docs, and current status docs so V1.6 is explicitly defined as a real-use validation line rather than a large feature-delivery line.
- Changed: Frozen the V1.6 scope around documentation baseline, flow-expression cleanup, and later execution guidance.
- Changed: Explicitly documented that V1.6 does not land the competitor screenshot inbox, does not land the automatic content workflow, and does not expand API image generation.
- Changed: Explicitly documented that inspirations are the future main entry direction as an AI inspiration inbox, link import is downgraded to an auxiliary source record, draft triage and formal scoring are separate systems, product detail should center on whether a product deserves small-batch testing, V1.7 owns the competitor screenshot inbox planning target, V1.8 owns the post-confirmation content workflow planning target, and Vercel stays read-only.
- Verification: `npm run encoding:check`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npx prisma validate` should be used according to the current thread allowance and package scripts.
- Boundary: Docs-only thread. No business code, page code, Prisma schema, migration, dependency, or runtime data file was changed by this thread.

## 2026-06-02

### V1.6 Planning - Direction Sync Report

- Changed: Added `docs/superpowers/specs/2026-06-02-v16-direction-sync-report.md` as the current direction-sync baseline for the post-V1.5 stage.
- Changed: Frozen the next product direction as an image-driven product and competitor draft workbench. The report repositions inspirations as an AI inbox, separates inspiration draft triage from formal product scoring, downgrades link import to an auxiliary source record, and stages competitor screenshot inbox and conditional content automation into later versions instead of mixing them into the current round.
- Changed: Recorded additional guidance from review discussion: current product delete remains soft-delete only, normal workflows should not auto-compact real `Product.id` / `Material.id`, future competitor entities should keep stable real IDs, and growing inspiration source folders will eventually need a processed-source governance plan rather than an unsafe auto-delete shortcut.
- Verification: Docs-only follow-up; use `npm run encoding:check` after the report/status updates.
- Boundary: Docs-only sync. No business code, schema, migration, dependency, crawler, browser automation, auto-write, or cleanup-behavior change was implemented in this step.
