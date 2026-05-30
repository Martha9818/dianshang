# EcomPilot MVP Thread 05: Prompt 生图任务与图片回传

## Summary

Thread 05 implements the local Prompt image workflow. EcomPilot generates a copyable image prompt for a product, the user manually uses ChatGPT web to generate the image, then uploads the result back into the local app. The app stores the file under `uploads/`, creates a `Material`, and links it to the `Product` and `PromptTask` when a task exists.

This thread does not implement API image generation, ChatGPT automation, browser automation, originality review, image deduplication, or full material-library management.

## Scope

- `/prompt-tasks` real task page with filters, task creation, task table, copy flow, cancel flow, and upload entry.
- `/prompt-tasks/[taskCode]/upload` result upload page; `[taskCode]` is `PromptTask.taskCode`, not the database id.
- Product detail tabs using stable English query keys:
  - `tab=prompt-tasks`
  - `tab=materials`
- PromptTask generation with deterministic template and recommended size presets.
- Task ID generation, uniqueness, copy status, upload result persistence, Material creation, and homepage linkage.
- Manual no-task upload creates only a `Material` with `promptTaskId = null`.

## Data Model

Existing tables are reused:

- `PromptTask.taskCode String @unique` is the user-visible Task ID.
- `PromptTask.status` values:
  - `待生成`
  - `已复制`
  - `已回传`
  - `已取消`
- `Material.status` defaults to `待审核`.
- `Material.source` values used here:
  - `prompt_result`
  - `manual_upload`

Schema defaults for `PromptTask.status` and `Material.status` should be corrected by a Thread 05 Prisma migration if they still contain historical mojibake.

## Task Code

Base rule:

```text
PT-{productId}-{platform}-{imageType}-{yyyyMMddHHmmss}
```

Example:

```text
PT-23-xiaohongshu-cover-20260526203000
```

`taskCode` has a unique constraint. If the base code collides, append a short random suffix:

```text
PT-23-xiaohongshu-cover-20260526203000-a1b2
```

Do not rely only on current-second uniqueness.

## Platform And Image Type

Internal platform codes:

- `xianyu` -> `闲鱼`
- `taobao` -> `淘宝`
- `xiaohongshu` -> `小红书`
- `douyin` -> `抖音`

Image types:

- `main`
- `detail`
- `cover`
- `scene`
- `selling_point`

Material type mapping:

- `main` -> `main_image`
- `detail` -> `detail_image`
- `cover` -> `cover_image`
- `scene` -> `prompt_result`
- `selling_point` -> `prompt_result`

## Recommended Size Presets

- `taobao/main` -> `800x800`
- `taobao/detail` -> `750xauto`
- `taobao/selling_point` -> `750x1000`
- `xiaohongshu/cover` -> `1080x1440`
- `xiaohongshu/main` -> `1080x1080`
- `xiaohongshu/scene` -> `1080x1440`
- `douyin/cover` -> `1080x1440`
- `douyin/main` -> `1080x1080`
- `douyin/detail` -> `750x1200`
- `xianyu/main` -> `1080x1080`
- `xianyu/scene` -> `1080x1440`
- fallback -> `original`

The user can manually edit `recommendedSize` before creating the task.

## Prompt Template

The prompt template lives in `src/lib/modules/prompt-task/prompt-template.ts`.

Variables:

- `platform`: display label from platform code.
- `image_type`: image type code.
- `recommended_size`: selected or edited size string.
- `platform_style`: style text for the selected platform.
- Product fields:
  - `product_name` -> `Product.name`
  - `category_level1` -> `Product.categoryLevel1`
  - `category_level2` -> `Product.categoryLevel2`
  - `selling_points` -> `Product.sellingPoints`
  - `pain_points` -> `Product.painPoints`
  - `usage_scenes` -> `Product.usageScenes`
  - `target_user` -> `Product.targetUser`

Fallbacks:

- Missing text fields use `未填写`.
- Missing selling points, pain points, scenes, or target user add a conservative note that the image should be based on the real uploaded product image and avoid inventing product functions.

## Upload Rules

Prompt task upload path:

```text
uploads/products/{productId}/materials/{platform}/{imageType}/{yyyyMMdd_HHmmss}_{version}_{random}.{ext}
```

Version rule:

- First upload for a task is `v1`.
- Later uploads for the same task increment by existing linked Material count: `v2`, `v3`, and so on.
- A short random suffix is always included to avoid same-second filename conflicts.

Validation:

- Supported formats: `jpg`, `jpeg`, `png`, `webp`.
- Max size: `10MB`.
- Upload failure must not create `Material` and must not update `PromptTask`.

On successful PromptTask upload:

- Save the image file.
- Try to read `width` / `height`; if reading fails, keep them null and continue.
- Create `Material`:
  - `promptTaskId` linked to the task
  - `source = prompt_result`
  - `status = 待审核`
  - mapped `materialType`
- Update PromptTask status to `已回传`.
- Write an operation log.

Manual no-task upload:

- Select only `deletedAt = null` products.
- Create only `Material`.
- `promptTaskId = null`
- `source = manual_upload`
- `status = 待审核`
- Do not create a PromptTask.

Cancelled tasks:

- `已取消` PromptTasks cannot receive uploads.
- The upload page must show that the task has been cancelled and cannot be returned.

## Copy Flow

- The client copies `promptText` with the browser Clipboard API.
- Only after the copy succeeds does it call the server action to update status to `已复制`.
- If browser copy fails, display a textarea containing `promptText` as a manual-copy fallback and do not mark the task copied.
- Copy status changes write an operation log.

## Runtime Safety

Preview/cloud mode is read-only:

- New task
- Copy status mark
- Cancel task
- PromptTask image upload
- Manual material upload

All must show a friendly read-only message and must not write the database or file system. The UI should not surface a generic `Failed to fetch`.

`/api/uploads/[...path]` must keep path traversal protection and only read files inside the local `uploads` directory.

## Homepage Linkage

- `Prompt 任务数量` is the real PromptTask count.
- `最近 Prompt 任务` uses the latest real PromptTasks.
- `待回传任务` is `status in ["待生成", "已复制"]`.
- `待处理事项` includes a lightweight `待回传图片` count.

## Verification

Required commands:

```powershell
npx prisma migrate dev --name thread05_prompt_tasks
npm.cmd run lint
npm.cmd run build
```

Local acceptance:

- `/prompt-tasks` creates PromptTasks for undeleted products.
- Task ID format and uniqueness work.
- Recommended size is auto-filled and user-editable.
- Prompt text contains all mapped variables with fallbacks.
- Copy success updates status to `已复制`; copy failure leaves status unchanged and shows manual fallback.
- `/prompt-tasks/[taskCode]/upload` saves a valid image, creates Material, and updates the task to `已回传`.
- Invalid format or over-10MB upload shows an error and creates no Material.
- Cancelled tasks cannot upload.
- Manual upload without Task ID creates only a `manual_upload` Material.
- Product detail PromptTask and Material tabs show real data.
- Homepage PromptTask metrics are real.

## Assumptions

- Vercel remains preview/read-only; formal write acceptance happens in Windows local mode with SQLite and local `uploads/`.
- `recommendedSize` is stored as a string such as `800x800`, `750xauto`, or `original`.
- Thread 05 creates `待审核` Material records but does not implement material approval workflow.
- Existing mojibake in unrelated historical Thread 01-04 labels is not repaired by this thread unless it blocks PromptTask behavior.
