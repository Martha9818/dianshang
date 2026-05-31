# Screenshot Recognition Service

## Responsibility

`src/lib/services/screenshot/` owns V1.5 Thread 02 screenshot recognition and structured image-import drafts. It supports user-initiated uploads or explicit selection from inspiration, product, competitor, material, or manual sources.

## Boundaries

- It does not auto-capture screens, open webpages, use browser automation, parse links, crawl platforms, auto-collect, auto-publish, send messages, comment, generate images, ship Electron, or run agent scheduling.
- It does not reuse `InspirationAiDraftJob`; Thread 01 and Thread 02 task models remain separate.
- AI output is always draft data and never a formal product, competitor, material, score, status, or recommendation fact.

## Data Flow

1. A page/server action calls the screenshot service.
2. The service checks local writable runtime.
3. Uploads are stored through the shared image service under managed `uploads/screenshots/...` relative paths, or an existing source image is referenced.
4. `ScreenshotRecognitionJob` records task state, source metadata, image path, quality level, structured draft, and optional confirmed draft.
5. AI recognition uses the shared AI provider, AIJob, AIRequestLog, prompt sanitizer, and JSON validation.
6. Users can edit, ignore, or confirm the draft. Confirmation stays in `confirmedDraft` and is recorded in `OperationLog`.

## Vercel Behavior

Vercel can render the page only. Upload, AI calls, SQLite writes, and filesystem writes are blocked with:

`预览环境只读，请在 Windows 本地验收截图识别。`

## Safety

- Do not expose full local absolute paths.
- Do not store API keys, full prompts, full stacks, or provider-sensitive raw responses.
- Do not automatically save personal/private screenshot content as formal business fields.
- Quality levels mean recognition quality only: `high`, `medium`, `low`, or `failed`.
