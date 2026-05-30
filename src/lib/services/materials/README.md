# Materials Service

## Responsibility

`src/lib/services/material-service.ts` owns Material records, material list data, status changes, and the bridge between uploaded image metadata and Prisma `Material` rows.

## Image Metadata

Material image uploads must use `src/lib/services/images/` through the compatibility file-storage facade. New uploads store:

- `filePath`
- `thumbnailPath`
- `fileHash`
- `mimeType`
- `originalSizeBytes`
- `thumbnailSizeBytes`
- `width`
- `height`
- `sourceType`
- `usagePermission`

The material library and product material tab prefer `thumbnailPath` for display and fall back to `filePath` when needed.

## Not Responsible For

- Reading raw image bytes directly in page components.
- AI image generation or image quality judgment.
- Inspiration scanning.
- File cleanup or historical bulk migration.
- Search, notification, Electron, or Agent behavior.

## Source And Permission Rules

- Manual uploads default to `sourceType=own_photo` and `usagePermission=usable`.
- Prompt result uploads default to `sourceType=ai_generated` and `usagePermission=needs_review`.
- `reference_only` must show: `该图片仅作为灵感和分析参考，不建议直接用于商品发布。`

## Vercel Behavior

Material writes remain blocked in preview/read-only runtime. Vercel must not write SQLite rows or upload files.

## Path Rules

Frontend views show relative paths only. Full Windows paths are server-only and must not be rendered in material cards, detail panels, diagnostics, exports, or logs.

