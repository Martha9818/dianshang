# Current Status

## Current Progress

- Current stage: `V1.6-08 final acceptance and closeout`
- Current task state: `V1.7 Design Gate` has now started only as a low-risk read-only prep layer. Product detail `绔炲搧鍙傝€僠` now includes a `绔炲搧鎴浘鑽夌鍊欓€?` panel backed by existing `ScreenshotRecognitionJob` rows for the current product.
- Current task state: The new competitor screenshot draft panel reuses existing screenshot-recognition draft data only. It shows candidate title / price / platform / sales-or-heat clues, selling points, uncertainty notes, privacy notes, task status, and quality level without triggering AI or writing formal competitor records.
- Current task state: `getProductDetailPageData` now assembles read-only competitor screenshot draft candidates through the existing screenshot service boundary, keeping the current desktop/runtime foundation and avoiding schema, migration, dependency, or write-path changes.
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
- Current acceptance state: Local browser checks confirm `/inspirations` still reads as the AI inbox / buyer desk main entry, and `/products/[id]` still reads as the formal evaluation workflow with `补竞品 -> 看机会 -> 算利润 -> 得结论`.
- Current acceptance state: `docs/superpowers/acceptance/2026-06-09-v16-final-acceptance.md` records the final closeout judgment for V1.6.
- Current planning baseline: `docs/superpowers/specs/2026-06-02-v16-direction-sync-report.md`
- Next stage: Continue `V1.7 Design Gate` only. The current mainline may keep adding read-only prep pieces such as draft mapping, service queries, placeholder panels, and design docs, but still must not start direct schema / write-flow / AI-execution `V1.7` implementation before the competitor screenshot inbox design is frozen.

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

- Use `docs/superpowers/acceptance/2026-06-09-v16-final-acceptance.md` together with the V1.6 direction-sync report as the handoff baseline, and open only `V1.7 Design Gate` planning work next.
