# V1-Core Understanding Check

This page explains V1-Core in non-developer language. Use it before opening the next thread.

## 1. What Did V1-Core Add?

V1-Core turned EcomPilot from an MVP workspace into a safer local-first tool. It added a diagnostics center, local runtime checks, AI job/request logging, safer image uploads, multi-platform copywriting packages, and a manual inspiration inbox.

In plain words: the app can now tell you what is wrong, protect local paths and API keys, handle AI failure more calmly, check image safety, generate/edit copywriting for four platforms, and turn manually reviewed inspiration images into products.

## 2. How Do I Use It Every Day?

Start the app on Windows local, then work from these pages:

- Use `/products` to create and manage products.
- Use product detail pages for competitors, scoring, materials, and copywriting context.
- Use `/materials` for uploaded images and prompt result images.
- Use `/copywriting` to generate or edit platform copywriting.
- Use `/inspirations` to scan a local inspiration folder and review image ideas.
- Use `/export` and `/backup` before sharing or changing important data.
- Use `/system/diagnostics` when anything feels broken.

## 3. If Something Breaks, Which Page First?

Open `/system/diagnostics` first. It shows whether the app is local or Vercel, whether SQLite works, whether `uploads/`, `exports/`, `backups/`, and `logs/` are available, whether recent AI jobs failed, and whether image or inspiration summaries look suspicious.

## 4. How Do I Export a Diagnostic Package?

Open `/system/diagnostics`, then use:

- `复制诊断摘要` to copy text.
- `导出诊断摘要` to download markdown.

The summary is meant to be pasted into ChatGPT or Claude for troubleshooting.

## 5. What Cannot Be Accepted On Vercel?

Vercel is read-only preview. Do not use it to accept:

- SQLite writes.
- Product creation or edits.
- Image uploads.
- Excel export file creation.
- Manual backups.
- Local log writes.
- Real AI calls.
- Inspiration folder scanning.
- Turning inspirations into products.

Use Windows local for those checks.

## 6. What If AI Fails?

AI failure should not destroy product data. Check `/system/diagnostics` for recent AIJob and AIRequestLog summaries, then check `/settings/ai` for provider settings.

You can keep working manually: save copywriting by hand, edit drafts, rescan违规词, and continue product review.

## 7. What If Inspiration Scanning Fails?

Open `/inspirations` and check the recent ScanLog table. Common causes are:

- No folder path set.
- Folder does not exist.
- Image is larger than 10MB.
- Unsupported file type.
- Duplicate image already imported by fileHash.

The scan can partially succeed: good files can import even if one file fails.

## 8. What If Image Upload Fails?

Check the image file first:

- Supported formats are `jpg`, `jpeg`, `png`, and `webp`.
- Single image limit is 10MB.
- The app stores safe relative paths, not full Windows paths.

If the upload still fails, open `/system/diagnostics` and check image storage plus `uploads/` status.

## 9. What If Multi-Platform Copywriting Fails?

Open `/copywriting` and read the visible error. If AI failed, the product should remain intact. You can manually create or edit copywriting and mark the actual used version.

Use `/system/diagnostics` to see recent copywriting AI failures without exposing API keys or full prompts.

## 10. Which Data Is AI Advice, Not Fact?

AI-generated copywriting and inspiration AI suggestions are suggestions only.

Especially in `/inspirations`, AI output must not be treated as confirmed product facts. Category, audience, selling points, style words, and usage scenarios still need human review before they are used in a formal product.

## 11. What Is Still Not Done?

Move these to V1-Plus or V1.5 instead of adding them to V1-Core:

- Full search center.
- Notification center.
- Scheduled scanning.
- OCR.
- Link parsing.
- API image generation.
- Image content similarity or originality scoring.
- Restore from backup.
- Electron desktop app.
- Agents or multi-agent workflows.

## 12. What Should Be Backed Up Before The Next Thread?

Before the next development thread, create or confirm a recent local backup of:

- `prisma/dev.db`
- `prisma/dev.db-wal` and `prisma/dev.db-shm` if present
- `uploads/`

Use `/backup` locally before schema changes, batch writes, data repair scripts, or risky filesystem work.
