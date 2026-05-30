# EcomPilot MVP Thread 08: Final Integration Acceptance, Bug Fixes, and README Closeout

## Summary

Thread 08 is the MVP closeout thread. Its job is to turn the already implemented Thread 00-07 surfaces into one coherent local-first acceptance flow: install, migrate, seed, create a product, enter competitors and cost data, score the product, generate or manually save copywriting, create Prompt tasks, upload returned images, manage materials, export Excel, create a manual backup, verify the homepage, and finish the README.

This is not a feature-expansion thread. It may fix obvious bugs, improve small broken interactions, clean unreadable copy, add missing TODO comments for intentionally static data, add focused acceptance scripts, and update documentation. It must not add MVP-out-of-scope product areas.

## Product Boundary

Formal MVP runtime remains:

- Windows local machine.
- `Next.js + Prisma + SQLite`.
- Local `uploads/` file storage.
- Local `exports/` and `backups/` runtime artifact folders.

Vercel is preview-only. Vercel can be used to check that pages render and read-only degradation is friendly, but it is not the formal writable MVP environment.

## Explicitly Out Of Scope

Thread 08 must not implement:

- Login, registration, cloud accounts, payment, membership, or permissions.
- Platform crawlers, automatic collection, automatic listing, automatic direct messages, automatic comments, link parsing, or screenshot OCR.
- API image generation or ChatGPT automation.
- Inspiration inbox.
- Inventory, supplier management, purchase batches, shared stock, or trial-sale review.
- Natural-language search or full global search.
- Full notification center.
- PDF reports.
- Electron desktop app.
- Real multi-agent scheduling or agent workflow execution.

Search, notification, and multi-agent ideas may only appear as static UI placeholders or roadmap items.

## MVP Pass Standard

Thread 08 must grade every finding as P0, P1, or P2.

P0 means MVP-completion blocker. Every P0 item must pass before the MVP can be called complete:

- Local install, migration, seed, lint, and build pass after closing Node/Next/Prisma processes.
- `start.bat` can start the local app, keep the window open on failure, and provide understandable setup or port-conflict messages.
- Core local data loop works: product, competitor/profit, scoring, copywriting fallback/manual save, PromptTask image return, material library, Excel export, and manual backup.
- Uploaded files remain local, preview writes degrade safely, and no write operation depends on Vercel.
- README is readable and accurately explains MVP scope, local runtime, Vercel preview limits, storage, backup, export, AI Provider setup, unsupported features, and roadmap.
- No active out-of-scope feature is implemented.

P1 means known issue that does not block declaring the MVP complete if it has a clear workaround and does not risk user data:

- A non-critical edge-case UI defect.
- A browser-permission-dependent behavior that has service-level coverage and a manual fallback.
- A preview-only limitation where the local MVP remains correct.
- A real external AI-provider test that cannot be completed without user credentials, as long as wrong-key behavior and manual fallback are verified.

Each P1 must state whether it blocks entering V1. A P1 may remain open only if the final report explains the impact and owner recommendation.

P2 means experience polish or later repair:

- Copy, spacing, density, or minor visual polish.
- Optional automation around already-manual checks.
- Static placeholder data that is clearly marked with a code-level `TODO`.
- Roadmap feature reminders.

P2 items never block MVP completion or V1 entry unless they hide a P0 or P1 defect.

## Recommended Execution Strategy

Use a three-layer acceptance approach:

1. Command-level verification for install, Prisma, seed, lint, build, folders, and `start.bat` behavior.
2. Service-level acceptance script for repeatable database/file checks that are tedious in the browser, including scoring examples, Excel Sheet headers, backup contents, PromptTask uniqueness, and Material linkage.
3. Browser-level walkthrough for end-to-end user experience, including forms, uploads, refresh persistence, copy buttons, filters, previews, homepage shortcuts, and friendly error states.

If a defect is found, fix the smallest surface that restores the intended MVP behavior. Do not introduce a new subsystem to solve a local acceptance issue.

## Startup And Environment Acceptance

Required checks:

- `npm install` succeeds.
- `npx prisma migrate dev` succeeds.
- `npx prisma generate` succeeds.
- `npm run prisma:seed` succeeds and imports default banned words idempotently.
- `npm run lint` succeeds.
- `npm run build` succeeds with the guarded build and no Turbopack output-file-tracing warning.
- Double-clicking `start.bat` initializes local prerequisites, starts the system, and opens `http://localhost:3000`.
- `start.bat` gives clear messages when `node_modules`, `.env`, or the SQLite database are missing and need setup.
- `start.bat` gives a clear message when port `3000` is already occupied.
- `start.bat` failure does not immediately close the window.
- `uploads/` exists.
- `backups/` exists or is created automatically by manual backup.
- README states clearly that Vercel is preview-only and the official MVP runtime is local Windows + SQLite + local uploads.

Implementation notes:

- Keep PowerShell-compatible commands. Do not use Bash-only `&&` in project instructions.
- Before running final `npm install`, `npx prisma migrate dev`, or `npx prisma generate`, close Node, Next, and Prisma processes in the workspace to avoid Windows Prisma Client file-lock issues.
- If `npx prisma migrate dev` or `npx prisma generate` hits `EPERM` because a Prisma Client engine file is locked, stop the holding process and rerun. Do not change business code to work around a Windows file lock unless investigation proves a real code defect.

## Product Flow Acceptance

Required checks:

- Create a product.
- Fill product name, category, tags, target platforms, estimated sale price, estimated cost, selling points, pain points, and usage scenes.
- Upload a product main image.
- Refresh the page and confirm product data persists.
- Product pool displays the product.
- Product detail page opens.
- Product status changes remain reasonable as competitor/profit/scoring data is added.

Bug-fix guidance:

- Fix broken validation, persistence, redirects, image previews, or status labels.
- Do not add authentication, publishing, inventory, supplier, or cloud sync behavior.

## Competitor And Profit Acceptance

Required checks:

- Add 3 competitors for a product.
- Each competitor stores platform, title, price, heat metric type, heat metric value, and data date.
- Upload at least 1 competitor screenshot when the current UI supports the screenshot field.
- Competitor stats show count, price range, median price, and platform count.
- Enter sale price, purchase cost, shipping cost, and packaging cost.
- System calculates single-item net profit and profit margin.
- Missing cost data shows a clear prompt instead of misleading numbers.

Bug-fix guidance:

- Repair calculations, validation, stats, screenshot persistence, and missing-data messaging.
- Do not add crawlers, link import, OCR, competitor commonality summary, or differentiation advice.

## Scoring Acceptance

Required checks:

- Generate six-dimensional score.
- Generate total score.
- Generate deduction reasons.
- Generate next-step suggestions.
- Generate recommendation conclusion.
- Save `ScoreSnapshot`.
- View scoring history.
- Update product status from scoring outcome.
- Verify three sample products:
  - Sample A: pet grooming brush, sale price `29.9`, purchase cost `8`, shipping `3`, packaging `1`, 5 valid competitors, low after-sales risk. Expected conclusion: recommend testing.
  - Sample B: niche pet decorative ornament, sale price `39.9`, purchase cost `18`, shipping `5`, 1 valid competitor. Expected conclusion: temporary evaluation or postpone.
  - Sample C: pet nutrition powder, sale price `59`, purchase cost `20`, 6 valid competitors, high category risk. Expected conclusion: eliminate or not recommended for beginners.

Bug-fix guidance:

- Keep existing scoring model boundaries.
- Tune only obvious mismatch bugs in rules, thresholds, mapping, snapshot persistence, or status updates.
- Do not add PDF reports, trial-sale review, supplier intelligence, or extra scoring dimensions.

## Copywriting Acceptance

Required checks:

- Configure an AI Provider.
- Test provider connection.
- Wrong AI key shows a readable error.
- Select product and platform to generate copywriting.
- Xianyu, Taobao, Xiaohongshu, and Douyin each generate 3 versions.
- Copywriting can be saved.
- Copywriting can be edited.
- Copywriting can be copied.
- Default banned words are highlighted or clearly warned.
- If AI fails, manual copywriting entry is still available.
- AI failure does not block product save, scoring, export, Prompt tasks, or material upload.
- Product detail copywriting tab displays the saved copywriting.

No-real-AI-key fallback standard:

- Provider configuration can be saved without requiring a successful external call.
- Wrong or fake key produces a readable error instead of a crash, blank page, runtime overlay, or raw stack trace.
- After AI failure, the user can manually fill copywriting and save it.
- Manually saved copywriting is scanned again against default banned words.
- Manual copywriting can be edited and copied.
- Manual copywriting appears in the product detail copywriting tab.

Bug-fix guidance:

- Repair provider-state recovery, error handling, copy button behavior, save/edit flow, banned-word highlighting, and manual fallback.
- Do not add AI call logs, notification agent, search agent, or new provider-specific features beyond the current OpenAI-compatible provider shape.

## Prompt Task And Image Return Acceptance

Required checks:

- Create a Prompt task for a product.
- Task ID is unique.
- Copy Prompt with one click.
- Successful copy changes status to copied.
- Upload 2 images generated manually outside the app.
- Uploaded images link to product and Task ID.
- PromptTask status changes to returned.
- `Material` table receives records.
- Image storage path follows the local upload rule.

Bug-fix guidance:

- Repair task-code uniqueness, copy status, upload validation, path generation, Material linkage, and status transition defects.
- Do not add API image generation, ChatGPT automation, originality review, or image deduplication.

## Material Library Acceptance

Required checks:

- Material library shows uploaded images.
- Images can be previewed.
- Filter by product.
- Filter by platform.
- Filter by material type.
- Filter by status.
- Material status can be changed.
- Product detail material tab shows current product materials.
- Manual material upload saves correctly.

Bug-fix guidance:

- Repair filters, previews, missing-file fallback, status actions, manual upload, and product-detail linkage.
- Do not add batch management, AI image review, deduplication, or material agents.

## Export And Backup Acceptance

Required checks:

- Excel downloads successfully.
- Excel contains exactly 6 Sheets.
- Sheet column names and order match the export contract.
- Product, competitor, copywriting, Prompt, material, and score data export correctly.
- Empty database still exports headers.
- Manual backup creates a backup folder containing database files and an `uploads/` folder.
- Backup page shows recent backup records.
- Export page shows recent export records.

Bug-fix guidance:

- Repair export headers, missing data rows, download route safety, backup sidecar copy, logs, and friendly read-only preview behavior.
- Do not add cloud backup, automatic backup schedules, restore implementation, or PDF export.

## Homepage Acceptance

Required checks:

- Homepage no longer displays local acceptance checklist or system explanation cards.
- Homepage shows core data cards.
- Homepage shows recent products.
- Homepage shows recent Prompt tasks.
- Homepage shows pending items.
- Homepage shows quick entries.
- Homepage shows recent activity.
- Quick entries navigate correctly.
- Homepage data uses real statistics where practical.
- Any intentionally static statistic must have a code-level `TODO` comment explaining the future source.

Bug-fix guidance:

- Restore missing quick entries if they were removed during earlier visual cleanup.
- Replace checklist/explanation content with product-workbench content.
- Do not turn homepage search, notifications, or agents into real feature systems.

## Search, Notification, And Settings Acceptance

Required checks:

- Top search box may remain as placeholder UI only.
- Do not implement full global search.
- Notification icon may remain with static badge UI only.
- Do not implement full notification center.
- Settings page scope remains AI settings and banned-word settings.
- README explains search, notifications, and multi-agent workflows are later-version work.

Bug-fix guidance:

- Fix broken navigation, unreadable labels, or settings persistence.
- Do not add new settings categories beyond AI Provider and banned words.

## Range Check

Before final delivery, search the repository and UI for MVP-out-of-scope features. If a future feature is mentioned, it must be in README roadmap, a disabled placeholder, or an explicit TODO/future note. It must not be implemented as active behavior.

Check especially for:

- auth, login, register, account, payment, member, subscription
- crawler, scraping, auto collect, auto listing, auto message, auto comment
- OCR, link parser, API image generation
- inventory, supplier, purchase batch, trial-sale review
- PDF report, Electron
- multi-agent scheduler or agent orchestration

## Vercel Preview Acceptance

Vercel preview acceptance must cover all core pages:

- `/`
- `/products`
- `/copywriting`
- `/prompt-tasks`
- `/materials`
- `/settings/ai`
- `/settings/banned-words`
- `/export`
- `/backup`

For each page, confirm:

- The page does not return HTTP 500.
- The page does not white-screen.
- The page does not show `Failed to fetch`.
- The page does not show a Next.js runtime overlay.
- Write operations degrade to read-only preview messaging.
- No real AI call is made from preview acceptance.
- No files are written from preview acceptance.

Preview acceptance is not a replacement for local writable acceptance. It only proves the public preview remains readable and safe.

## README Closeout

Rewrite or repair README so it is readable UTF-8 Chinese and contains:

- Project introduction.
- MVP function scope.
- Explicitly unsupported features.
- Dependency installation.
- Database initialization.
- Default banned-word import.
- Startup method.
- `start.bat` usage.
- Local runtime instructions.
- Vercel preview instructions.
- Excel export instructions.
- Backup instructions.
- AI Provider configuration instructions.
- File storage instructions.
- Later-version roadmap.

The roadmap section must be clearly labeled `后续版本规划`. It must state that V1, V1.5, and V2 items are not implemented in the current MVP unless already listed in the MVP scope. The wording must not let users infer that future roadmap features are available now.

Roadmap must include:

V1:

- Inspiration inbox.
- Manual scan-folder trigger.
- API image generation.
- AI call logs.
- Site search.
- Local notification center.
- Enhanced image-size settings.

V1.5:

- Screenshot recognition.
- Link import attempt.
- Import quality grading.
- Competitor commonality summary.
- Differentiation suggestions.
- Image-content deduplication.
- Lightweight originality review.
- Search Agent.
- Notification Agent.

V2:

- Multi-SKU management.
- Supplier management and sorting.
- Purchase-batch inventory.
- Shared inventory across platforms.
- Trial-sale review.
- Return/refund workflow.
- PDF reports.
- Electron desktop app.
- Data restore.
- Multi-agent workflow.

## Acceptance Artifacts

Preferred artifacts to add during implementation:

- `scripts/thread08-final-acceptance.mts`: repeatable service-level acceptance for database, scoring, export, backup, PromptTask, Material, and scope checks.
- `docs/superpowers/acceptance/2026-05-28-thread-08-final-acceptance.md`: final human-readable acceptance report with passed items, fixed bugs, known limitations, command outputs, commit SHA, and deployment or preview status.

The script must use a `THREAD08_ACCEPTANCE_` prefix for every temporary product name, SPU-like marker, Provider name, copywriting text marker, PromptTask marker, uploaded fixture filename marker, export marker, backup marker, and OperationLog detail marker it creates.

The script may clean only rows and temporary files it created and can identify by the `THREAD08_ACCEPTANCE_` prefix or its own generated IDs captured during that run. It must not delete user-created data, unrelated uploads, unrelated exports, unrelated backups, `.env`, source files, project documentation, or configuration.

## Final Verification

Required final commands:

```powershell
npm install
npx prisma migrate dev
npm run prisma:seed
npm run lint
npm run build
```

Before running final `npm install`, `npx prisma migrate dev`, or `npx prisma generate`, stop workspace Node/Next/Prisma processes so Windows does not hold Prisma Client engine files open.

Also run any focused verification scripts that exist after implementation, including:

```powershell
npm run score:verify
npm run thread04:verify
npx tsx scripts/thread07-final-acceptance.mts
```

If `scripts/thread08-final-acceptance.mts` is added, run:

```powershell
npx tsx scripts/thread08-final-acceptance.mts
```

Browser acceptance should cover the local app at `http://localhost:3000` and should include screenshots or notes for any UI issue fixed during Thread 08.

## Final Acceptance Report

The final report must state a clear conclusion:

- Whether the MVP is accepted as complete.
- Whether the project can enter V1.
- Whether any P0 blocker remains.
- Whether any P1 issue remains, with impact and whether it blocks V1.
- P2 polish or later repairs, if any.
- The current formal runtime environment.
- The Vercel preview status.
- The commit SHA.
- The live preview URL if deployment is refreshed.

## End Of Task Requirements

After implementation:

- Update `agent-memory/CURRENT_STATUS.md`.
- Append to `agent-memory/SESSION_LOG.md`.
- Run verification.
- Clean only safe temporary files created by the task.
- Check `git status`.
- Commit with a concise Thread 08 message.
- Push to `origin main`.
- Confirm Vercel preview/live alias status if applicable, while stating that local Windows remains the formal writable MVP environment.
- Report commit SHA and live preview URL if deployment is refreshed.

## Open Risks

- README currently contains historical mojibake text and must be rewritten cleanly.
- Existing Prisma defaults in schema may still contain mojibake status strings; Thread 08 should fix them if they affect acceptance, with a migration if needed.
- Browser clipboard behavior may depend on browser permissions; service-level status checks can cover copy transition, while browser walkthrough confirms the normal success path.
- External AI Provider acceptance depends on real credentials. The local mock and error handling should still be verified, and README should explain provider configuration.
