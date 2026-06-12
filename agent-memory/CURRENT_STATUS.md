# Current Status

## Current Progress

- Current stage: `V1.6-08 final acceptance and closeout`
- Current task state: The repository encoding guard is now confirmed to be valid UTF-8 based for current tracked text files. The recent mojibake confusion was traced mainly to terminal/display-layer encoding mismatch plus git-quoted non-ASCII paths, not to a fresh wave of corrupted source files.
- Current task state: `scripts/check-encoding.mjs` now reads tracked files through `git -c core.quotepath=false ls-files -z`, so project-local encoding verification no longer breaks on tracked Chinese paths such as `重装恢复/*.md`.
- Current task state: The inspiration inbox now has a compatibility redirect layer for legacy or mistyped subpaths. Requests like `/inspirations/14` or `/inspirations/legacy-path?status=pending` now canonicalize back to the query-based inbox route instead of falling into a misleading shell-with-404 state.
- Current task state: A shared inspiration route helper now centralizes canonical inbox URL building for selected-record links and filtered inbox links, reducing the chance that future code paths hand-build unsupported `/inspirations/...` detail paths.
- Current task state: A reinstall-resume package now exists under `重装恢复/` with `README.md`, `HANDOFF.md`, and `RECOVERY_PROMPT.txt` so a fresh Codex session can resume from repo facts even if sidebar chat history is lost after reinstall.
- Current task state: `V1.7 Design Gate` now also includes a formal confirm-to-competitor design freeze doc at `docs/superpowers/specs/2026-06-09-v17-confirm-to-competitor-design-gate.md`, and the approved `V1.7 MVP Thread 01` minimum confirm-write loop has now been implemented on the local mainline.
- Current task state: `V1.7 Design Gate` has now started only as a low-risk read-only prep layer. The product detail competitor tab now includes a read-only competitor screenshot draft panel backed by existing `ScreenshotRecognitionJob` rows for the current product.
- Current task state: The new competitor screenshot draft panel reuses existing screenshot-recognition draft data only. It shows candidate title / price / platform / sales-or-heat clues, selling points, uncertainty notes, privacy notes, task status, and quality level without triggering AI or writing formal competitor records.
- Current task state: `getProductDetailPageData` now assembles read-only competitor screenshot draft candidates through the existing screenshot service boundary, keeping the current desktop/runtime foundation and avoiding schema, migration, dependency, or write-path changes.
- Current task state: The confirm-to-competitor design freeze now explicitly locks these V1.7 MVP decisions: keep reusing `ScreenshotRecognitionJob`, do not add `CompetitorDraft`, keep the current path reality `uploads/products/{productId}/competitors/...`, use `job.competitorId` as the canonical already-confirmed link, require manual completion for missing formal competitor fields, and keep draft candidates out of formal competitor analysis/scoring until a formal `Competitor` is created.
- Current task state: The approved `V1.7 MVP Thread 01` now lets a user open a competitor screenshot draft candidate, enter a dedicated confirm form with AI-prefilled reference values, manually complete the required formal competitor fields, and create a formal `Competitor` through the existing competitor-service rules without schema, migration, or dependency changes.
- Current task state: The new confirm flow writes back `ScreenshotRecognitionJob.competitorId`, reuses the current screenshot `imagePath` as the formal competitor screenshot, clears `needsUserConfirmation`, preserves the draft payload for audit, and records `CONFIRM_SCREENSHOT_JOB_TO_COMPETITOR` in operation logs.
- Current task state: Duplicate confirm is now blocked in both places: the service rejects any job that already has `job.competitorId`, and the product detail page no longer renders the confirm form when a confirmed draft is reopened through `confirmDraftJobId`.
- Current task state: `V1.7 MVP Thread 02` closeout checks are now complete. The candidate status copy distinguishes `草稿已确认` from `已转正式竞品`, and the MVP acceptance result is recorded at `docs/superpowers/acceptance/2026-06-09-v17-mvp-thread02-acceptance.md`.
- Current task state: `V1.7.1 Thread 00` stabilization is now complete as a narrow state-consistency hardening pass. Competitor screenshot draft candidates now expose explicit status labels, quality labels, confirmability state, and blocked reasons without expanding schema or product logic.
- Current task state: The confirm bridge is now stricter on the server side. `confirmScreenshotJobToCompetitor(...)` only allows confirmation when the screenshot job is still `success`, still belongs to the current product, still has no linked `competitorId`, and still contains a usable `confirmedDraft` or `structuredDraft`.
- Current task state: The product competitor tab now hides the confirm form whenever a screenshot draft candidate is not directly confirmable, and instead surfaces the exact blocked reason for already-linked, failed, processing, skipped, or draft-missing cases.
- Current task state: `V1.7.1 Thread 01` boundary verification is now complete as a verification-only slice. This thread deliberately adds no new product behavior and instead strengthens the acceptance baseline with controlled temporary-sample checks and cleanup-proof evidence.
- Current task state: The new `scripts/thread-v17-1-thread01-boundary-verify.mts` script now verifies wrong-source rejection, cross-product isolation, status-based blocking, missing-draft blocking, duplicate confirm rejection, low-quality/privacy/uncertainty warning data, readonly-message preservation, and `confirmDraftJobId` gating, while also proving that its own `__V171_VERIFY__` temporary SQLite samples are fully cleaned after execution.
- Current acceptance state: `V1.7.1 Thread 00` passes `npx tsx scripts/thread-v17-1-thread00-stabilization-verify.mts`, `npm run encoding:check`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- Current acceptance state: Local browser regression on `http://localhost:3000/products/146?tab=competitors` and `http://localhost:3000/products/146?tab=competitors&confirmDraftJobId=14` confirms that the already-confirmed sample now consistently shows `识别成功 / high / 已转正式竞品`, surfaces the duplicate-prevention note, keeps the normal candidate-card CTA as `查看已确认竞品`, and no longer reopens the confirm form through direct URL access.
- Current acceptance state: `docs/superpowers/acceptance/2026-06-09-v17-1-thread00-acceptance.md` records the stabilization result and also notes the current local limitation that only one real `sourceType=competitor` screenshot sample exists (`jobId=14 -> competitorId=93`).
- Current acceptance state: `V1.7.1 Thread 01` now passes `npx tsx scripts/thread-v17-1-thread01-boundary-verify.mts`, `npx tsx scripts/thread-v17-1-thread00-stabilization-verify.mts`, `npm run encoding:check`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- Current acceptance state: `docs/superpowers/acceptance/2026-06-09-v17-1-thread01-acceptance.md` records the controlled-sample result, including proof that temporary verification records are cleaned to zero residual `Product` / `Competitor` / `ScreenshotRecognitionJob` rows after the script completes.
- Current acceptance state: Local verification for `V1.7 MVP Thread 01` now passes with `npm run typecheck`, `npm run lint`, and `npm run build`, and local browser acceptance on `http://localhost:3000/products/146?tab=competitors` confirmed the full loop `draft candidate -> confirm form -> create formal competitor -> candidate switches to 查看已确认竞品`.
- Current acceptance state: Thread 02 regression/closeout also passes with `npm run encoding:check`, `npm run typecheck`, `npm run lint`, and `npm run build`, and the local acceptance document explicitly records real local write verification for `jobId=14 -> competitorId=93`.
- Current task state: The `/inspirations` buyer desk now computes a lightweight draft triage score from existing AI draft fields without changing schema or writing into formal score history.
- Current task state: The right-side AI draft rail now shows six triage dimensions, a total draft triage score, a conservative conclusion, and next-step guidance with the explicit note `仅用于线索初筛，不代表正式商品评估。`
- Current task state: Inspiration queue cards and top summary metrics now surface draft triage status so users can quickly distinguish `优先保留 / 可以保留 / 暂存观察 / 建议放弃` from incomplete clues.
- Current task state: Inspiration-to-product conversion now stays inside an explicit confirm-then-convert flow. The buyer desk convert CTA enters a human confirmation form first, AI-prefilled draft values are clearly marked as reference-only, cancel no longer creates a product, and only the explicit confirmed submit can create the formal product.
- Current task state: The product detail page now reads as a formal evaluation workflow instead of a flat backend tab set. Top-level cards now show `当前正式结论`、missing formal-evaluation prerequisites, and a four-step `补竞品 -> 看机会 -> 算利润 -> 得结论` progress rail.
- Current task state: The scoring page now reads as the formal `测试结论` page, not a generic score tab. It explicitly explains that formal scoring is a rule-based test decision, surfaces the current missing conditions, and brings the source inspiration triage result forward only as a read-only reference card.
- Current task state: The `竞品参考`、`AI 机会分析`、`成本利润` three tabs now each open with a lightweight purpose/output/decision-impact guide so users can immediately understand why this step exists, what it has already produced, and what is still blocking the formal `测试结论`.
- Current task state: The `竞品参考` tab now explicitly surfaces `当前有效竞品 x / 3` progress, while the `成本利润` tab now explicitly lists missing cost fields such as `售价 / 进货价 / 运费`, reducing the need to infer blockers from scattered form state.
- Current task state: The product-detail top action area now emphasizes formal evaluation work such as `补竞品`、`算利润`、`重新评分`, and moves `链接导入` into an auxiliary source-record block so old intake paths no longer dominate the main next-step surface.
- Current task state: The bottom `收件箱设置与扫描记录` fold now has extra bottom safe space so it is not covered by the viewport edge or recording/browser overlays when scrolled into view.
- Current task state: The global wide-screen shell gutter regression is fixed. The app shell no longer caps the whole application at `1780px`, and the main workspace removes the right gutter/right rounding so it fills to the viewport edge.
- Current task state: The `/inspirations` main screen now behaves like a buyer-style AI inbox workbench: a left queue for inspiration cards, a center image stage for the selected sample, a right AI insight and decision rail, and a folded maintenance section for scan settings.
- Current task state: The latest V1.6-02B follow-up tightened the buyer-desk layout to more closely match the approved B-version composition: a flatter KPI strip, a clearer queue-first left rail, a cleaner image-stage center column, a compact row-style AI draft panel on the right, and a less repetitive top section.
- Current thread outcome: The current mainline now has a clean split between inspiration draft triage and product formal scoring, with explicit manual confirmation before product creation, a clearer product-detail evaluation flow, in-tab guidance for each module, and a top action hierarchy that better matches the formal test-decision workflow.
- Current acceptance state: `scripts/thread-v16-02` through `thread-v16-07` verification all pass, and `npm run typecheck`, `npm run lint`, `npm run encoding:check`, `npm run build`, plus `npx prisma validate` all pass on the current mainline.
- Current acceptance state: The new route-compat regression check `npx tsx scripts/inspiration-route-compat-verify.mts` now passes together with `npm run typecheck`, `npm run lint`, and `npm run build`, and local HTTP verification confirms `http://localhost:3000/inspirations/14` now returns `308 -> /inspirations?selectedId=14` while `http://localhost:3000/inspirations/legacy-path?status=pending` now returns `308 -> /inspirations?status=pending`.
- Current acceptance state: Local browser checks confirm `/inspirations` still reads as the AI inbox / buyer desk main entry, and `/products/[id]` still reads as the formal evaluation workflow with `补竞品 -> 看机会 -> 算利润 -> 得结论`.
- Current acceptance state: `docs/superpowers/acceptance/2026-06-09-v16-final-acceptance.md` records the final closeout judgment for V1.6.
- Current planning baseline: `docs/superpowers/specs/2026-06-02-v16-direction-sync-report.md`
- Next stage: Treat the current `V1.7.1` line as phase-closeout first. Use `docs/superpowers/acceptance/2026-06-09-v17-mvp-thread02-acceptance.md`, `docs/superpowers/acceptance/2026-06-09-v17-1-thread00-acceptance.md`, and `docs/superpowers/acceptance/2026-06-09-v17-1-thread01-acceptance.md` as the acceptance baseline, commit and push this bundle cleanly, then wait for real local usage to reveal any next narrow thread instead of opening a synthetic follow-up immediately.

## Product Direction

- Keep EcomPilot Windows local-first with SQLite and local runtime folders as the source of truth.
- Keep Vercel preview read-only; all real write acceptance belongs to Windows local runtime.
- Reuse the existing runtime, local-path, logging, diagnostics, AI, image, export, backup, notification, and cleanup foundations.
- Planned next flow: `图片/截图 -> 灵感箱扫描 -> AI 草稿 -> 草稿初筛分 -> 用户保留/放弃/转商品 -> 正式商品 -> 正式评估 -> 条件式内容生产`
- Direction split: inspiration draft triage answers whether a clue deserves more attention; formal product scoring answers whether the product deserves small-batch testing.
- Entry positioning: inspirations move toward the future main entry direction as an AI inspiration inbox.
- UI entry positioning: new users should naturally understand `先看灵感箱`; screenshots are a supplementary recognition entry; `/link-imports` is a retained auxiliary route for old data and manual source notes.
- Inbox-workbench positioning: the inspiration detail view should prioritize image, AI draft status, candidate product clues, next-step guidance, and explicit keep / reject / convert actions over logs or scan-management detail.
- Buyer-desk positioning: the current V1.6-02B mainline should read as a buyer-style three-column workbench with an inbox queue, a central image stage, and a right-side insight plus decision rail rather than a settings-led admin page.
- B-version fidelity positioning: the latest layout pass should visually read closer to the approved B-version reference by reducing dashboard repetition, compressing the KPI/header treatment, and making the right-side AI draft card feel like a single compact screening panel rather than stacked backend blocks.
- Inbox-layout positioning: advanced records such as file info, similarity, AI task history, and ScanLog should stay available but share the right-side rail so the left detail area remains focused on review and decision flow.
- Link import positioning: link import is downgraded to an auxiliary source record rather than a core intake path.
- Product-detail positioning: product detail should be understood around whether a product deserves small-batch testing.
- Product-detail flow positioning: product detail should read as an evaluation workflow where `竞品参考` supplies market evidence, `AI 机会分析` supplies explanation and opportunity framing, `成本利润` supplies profitability signal, and `测试结论` supplies the final rule-based decision.
- Inspiration handoff positioning: source inspiration triage may be shown on the product side only as reference context; formal product scoring must still be recomputed from confirmed product, competitor, profit, and risk data.
- Product deletion remains a soft business delete by default; real `Product.id` / `Material.id` should stay stable in normal workflows, and future competitor records should keep stable real IDs as well.

## V1.6 Frozen Boundary

- V1.6 is a real-use validation line.
- V1.6 is not a large new-system delivery line.
- V1.6 does not land the competitor screenshot inbox.
- V1.6 does not land the automatic content workflow.
- V1.6 does not expand API image generation or make it the default path.
- V1.7 is the first planning target for the competitor screenshot inbox.
- V1.8 is the first planning target for the post-confirmation content workflow.
- V1.8 does not assume default API image generation; that still requires separate evaluation.

## Open Risks Or Limits

- Vercel remains preview-only and read-only.
- Root `npm test` does not exist in the current scripts.
- Provider-side rotation or revocation is still required for the historical Vercel recovery-code exposure; this must be completed outside the repository.
- Manual backup exists, but in-app restore remains future scope.
- Electron remains POC-only and is not a formal desktop runtime.
- Inspiration source folders can grow until full rescans and re-hashing become noticeably slower; this is a future governance topic, not an auto-delete shortcut.
- Existing optional API image generation remains legacy/manual V1.5 capability and should not be mistaken for the V1.6 mainline.
- If screenshots or link drafts are still expressed like parallel main entrances elsewhere, users may continue to miss the intended `先看灵感箱` flow.
- The current AI inbox still does not create new OCR fields, candidate-price extraction, recognition-quality scoring, or persistent draft pre-screen scoring; missing fields are intentionally shown as placeholders rather than fabricated facts.
- Draft triage remains a display-layer helper based on existing draft fields only; it does not persist, does not write `ScoreSnapshot`, and does not replace the formal product scoring workflow.
- The formal scoring engine itself still uses the existing rule set; the current V1.6-05 / 06 threads change presentation, guidance, and reference handoff only, not the six-dimension scoring math.

## Next Recommended Step

- Use `docs/superpowers/acceptance/2026-06-09-v16-final-acceptance.md`, `docs/superpowers/specs/2026-06-09-v17-confirm-to-competitor-design-gate.md`, `docs/superpowers/acceptance/2026-06-09-v17-mvp-thread02-acceptance.md`, `docs/superpowers/acceptance/2026-06-09-v17-1-thread00-acceptance.md`, and `docs/superpowers/acceptance/2026-06-09-v17-1-thread01-acceptance.md` as the handoff baseline, but do not open a new `V1.7.1` implementation thread until real local usage exposes a concrete gap that survives repo-fact review.
