# Link Import Service

`src/lib/services/link-import/` owns V1.5 Thread 03 link-import drafts.

## Scope

- Users paste one link at a time and may add a purpose, note, page text, and one auxiliary screenshot.
- The service saves `LinkImportDraft` records, normalizes public `http` / `https` URLs, classifies likely platform, and attempts only public OpenGraph / title / description metadata.
- All conversion actions are explicit user-confirmed actions. The service can convert a screenshot-backed link draft to an `Inspiration`, or associate the draft with an existing `Product` / `Competitor`.

## Non-Goals

- No platform crawler, batch import, browser automation, login, cookie storage, private API, captcha bypass, anti-crawler bypass, automatic image collection, comment/sales/shop scraping, automatic product creation, or automatic competitor fact creation.
- Vercel preview is read-only: write/upload/external-request attempts return `预览环境只读，请在 Windows 本地验收链接导入。`

## Safety

- URL handling blocks localhost, private IP ranges, local hostnames, non-HTTP(S) protocols, and unsafe redirect targets.
- Public metadata requests use Node HTTP(S), no browser automation, no cookies, a small byte cap, timeout, and sanitized error summaries.
- Screenshots reuse the shared image storage service under managed `uploads/link-imports/...` relative paths.
