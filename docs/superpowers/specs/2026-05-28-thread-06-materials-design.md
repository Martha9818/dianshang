# Thread 06: Materials Library and File Storage

## Summary

Thread 06 turns the placeholder materials surface into a real local-first material library. It covers `/materials`, the product-detail materials tab, image previews, status management, file-path visibility, upload validation cleanup, copywriting entry points, and homepage material stats.

Deletion is implemented as discard only: after confirmation the material status becomes `已弃用`. The database record and physical file remain untouched.

## Scope

In scope:

- Material library page at `/materials`.
- Product detail `tab=materials`.
- Image preview, missing-file fallback, file path display, and dimensions display.
- Filters by product, platform, material type, and status.
- Search across `Product.name`, `Product.spu`, `Material.filePath`, and `PromptTask.taskCode`.
- Status changes for `待审核`, `可使用`, `待修改`, `已采用`, and `已弃用`.
- Manual image upload to create `Material` records.
- Homepage uploaded-material and pending-review material stats.
- Operation log entries for material status changes.

Out of scope:

- Originality review.
- Image similarity.
- Image editing.
- API image generation.
- Image deduplication.
- Material Agent workflows.
- Complex batch material management.

## Data and Behavior

Material types:

- `original`
- `main_image`
- `detail_image`
- `cover_image`
- `prompt_result`
- `competitor_screenshot`

`competitor_screenshot` remains a filterable future material type, but Thread 06 does not migrate historical `Competitor.screenshotPath` values. If no `Material` rows exist for that type, the filtered result shows the normal empty state.

Material statuses:

- `待审核`
- `可使用`
- `待修改`
- `已采用`
- `已弃用`

`/materials` excludes `已弃用` by default. It shows discarded materials only when the status filter is exactly `已弃用`.

Homepage counts:

- `已上传素材数量`: count `Material` rows whose product is not deleted and `status != 已弃用`.
- `待审核素材`: count `Material` rows whose product is not deleted and `status = 待审核`.

## Architecture

`src/lib/services/material-service.ts` owns material business logic:

- `getMaterialLibraryPageData(filters)`
- `getProductMaterials(productId, filters?)`
- `getMaterialById(materialId)`
- `createManualMaterial(input)`
- `createPromptResultMaterial(input)`
- `updateMaterialStatus(input)`
- `getHomeMaterialStats()`

`src/lib/services/prompt-task-service.ts` keeps PromptTask responsibilities and delegates Material creation to `material-service.ts`.

`src/lib/services/file-storage-service.ts` owns file validation and persistence:

- Allowed extensions and MIME types: jpg, jpeg, png, webp.
- Max size: 10MB.
- Safe file/path generation.
- Save to `uploads/products/{productId}/materials/{platform}/{imageType}/{yyyyMMdd_HHmmss}_{version}.{ext}`.

`src/lib/services/image-metadata-service.ts` owns best-effort width/height parsing for PNG, JPEG, and WebP. Metadata failure returns `null` width/height and does not block upload or Material creation.

Manual upload material types are limited to:

- `original`
- `main_image`
- `detail_image`
- `cover_image`
- `prompt_result`

Manual upload storage path image-type mapping:

- `main_image -> main`
- `detail_image -> detail`
- `cover_image -> cover`
- `prompt_result -> manual`
- `original -> original`

## UI

`/materials`:

- Top filters: search, product, platform, material type, status.
- View switch: `view=grid | list`, default `grid`.
- Stats: all active materials, pending review, adopted, needs edit.
- Grid cards show preview, product, platform, type, status, source, created time, and actions.
- List view shows the same fields with file path for faster auditing.
- Detail sidebar opens with `materialId=123` and preserves all current filters.
- Detail sidebar shows large preview, file path, dimensions, created time, source, type, status, platform, related product, and related Task ID.
- Missing image file renders `文件缺失` instead of crashing.
- Copywriting entry links to the existing copywriting surfaces.

Product detail materials tab:

- Shows the current product materials.
- Supports platform/type/status filters.
- Supports manual upload and status changes.
- Status changes refresh `/products/{id}?tab=materials`.
- Link to `/materials?productId={id}`.

## Actions and Logging

`src/app/materials/actions.ts` exposes:

- `updateMaterialStatusAction(materialId, status, sourceUrl)`
- `discardMaterialAction(materialId, sourceUrl)`

Status changes:

- Validate the target status.
- Block preview/cloud writes with `预览环境只读，请在 Windows 本地验收`.
- Write `OperationLog` with `productId = Material.productId`.
- Log detail includes `materialId`, old status, new status, and `filePath`.
- Refresh the source page:
  - `/materials`: refresh current URL with filters and `materialId`.
  - product detail: refresh `/products/{id}?tab=materials`.

Preview mode blocks:

- Manual upload.
- Status changes.
- Discarding materials.
- Material creation.
- OperationLog writes.

## Verification

Required commands:

- `npm.cmd run lint`
- `npm.cmd run build`
- `npx prisma validate`

Manual/local acceptance:

- Prompt returned image appears in `/materials` and product detail materials tab.
- Manual upload appears in `/materials` with `source=manual_upload` and `status=待审核`.
- Image previews render; missing files show `文件缺失`.
- Filters work by product, platform, type, status, and search text.
- `/materials?materialId=123` opens details while preserving filters.
- Status changes update lists, details, product tab, homepage stats, and recent activity.
- Invalid format, file too large, save failure, creation failure, and status update failure show errors.
- Preview write operations show the read-only message.
