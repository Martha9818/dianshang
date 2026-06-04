# Current Status

## Current Progress

- Current stage: `V1.6-02B inspiration inbox buyer-desk rework`
- Current task state: Paused the B-version inspiration layout iteration to fix the global wide-screen right-side whitespace regression first. The app shell no longer caps the whole application at `1780px`, and the main workspace now removes the right gutter/right rounding so it fills to the viewport edge.
- Current task state: The `/inspirations` main screen now behaves like a buyer-style AI inbox workbench: a left queue for inspiration cards, a center image stage for the selected sample, a right AI insight and decision rail, and a folded maintenance section for scan settings.
- Current task state: The latest V1.6-02B follow-up tightened the buyer-desk layout to more closely match the approved B-version composition: a flatter KPI strip, a clearer queue-first left rail, a cleaner image-stage center column, a compact row-style AI draft panel on the right, and a less repetitive top section.
- Current thread outcome: The inspiration main view no longer leads with scan logs or setup panels. The current V1.6-02B buyer-desk layout keeps users on one screen for `看图 -> 看 AI 草稿 -> 做初筛 -> 保留 / 放弃 / 转商品`, while ScanLog, task history, similarity hints, file info, and scan settings remain available in collapsed secondary sections.
- Current planning baseline: `docs/superpowers/specs/2026-06-02-v16-direction-sync-report.md`
- Next stage: Start only the next explicitly approved V1.6 execution thread after validating it against the V1.6-00 baseline and the V1.6-01 entry-expression cleanup.

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
- The current AI inbox still does not create new OCR fields, candidate-price extraction, recognition-quality scoring, or draft pre-screen scoring; missing fields are intentionally shown as placeholders rather than fabricated facts.

## Next Recommended Step

- Use the V1.6 direction-sync report, V1.6-00 scope checklist, V1.6-01 entry-expression cleanup, and V1.6-02 inbox main-view rework as the baseline, then open only the next explicitly approved V1.6 execution thread.
