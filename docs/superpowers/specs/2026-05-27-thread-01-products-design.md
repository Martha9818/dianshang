# Thread 01 Design: Product Pool And Product Detail MVP

## Summary

This spec defines `EcomPilot MVP` Thread 01 for the first real Prisma-backed product workflow.

The thread delivers:

- product pool list at `/products`
- product create flow
- product edit flow
- soft delete flow
- product detail page at `/products/[id]`
- detail tabs shell
- working `基础信息` tab
- working `操作记录` tab
- main image upload
- homepage linkage for product count and recent products

This thread does not deliver competitor entry, profit calculation, scoring logic, copywriting generation, prompt task generation, material library workflows, export workflows, backup workflows, or any multi-agent execution features.

## Product Scope

### In Scope

- `/products` real list page with search and filters
- `/products/new` create page
- `/products/[id]` detail page
- `/products/[id]/edit` edit page
- product table as the only working view mode
- card or table toggle UI with card mode placeholder only
- product main image upload with local file storage
- operation logs for create, edit, delete, upload, and status change
- homepage real data for:
  - total product count
  - pending-analysis product count
  - recent products

### Out Of Scope

- competitor CRUD
- profit calculation logic
- scoring logic and score recommendation rules
- copywriting generation
- prompt task generation
- material library workflows
- supplier, inventory, or trial review workflows
- real global search logic
- real notification center logic
- export and backup feature work

## Route Design

### `/products`

The product pool page shows:

- search box with placeholder `搜索商品名称 / SPU / 类目`
- status filter
- target platform filter
- category filter
- sort selector:
  - `按更新时间排序`
  - `按创建时间排序`
- create button

The main content is a real table with these columns:

1. 商品信息
2. 类目
3. 目标平台
4. 预估售价
5. 预估净利润
6. 当前状态
7. 综合评分
8. 更新时间
9. 操作

Actions:

- 查看详情
- 编辑
- 删除

The table row shows:

- main image
- name
- SPU
- category level 1
- category level 2
- status
- target platforms
- estimated price
- estimated net profit
- updated time

Only non-deleted products are shown by default.

### `/products/new`

The create page is a dedicated form page. It supports:

- entering all base product fields from this thread
- optional main image upload
- save
- cancel and go back
- lightweight unsaved-change warning when navigating away inside the app
- best-effort `beforeunload` warning on refresh or browser close

### `/products/[id]`

The detail page is read-only by default and acts as the product information hub.

Tabs:

1. 基础信息
2. 竞品数据
3. 利润测算
4. 商品评分
5. 平台文案
6. Prompt 任务
7. 素材
8. 操作记录

Only `基础信息` and `操作记录` are implemented in this thread.
All other tabs show `将在后续线程实现`.

### `/products/[id]/edit`

The edit page reuses the same form module as create, but starts from current product data and supports:

- updating all base fields
- replacing or adding the main image
- lightweight unsaved-change warning
- save and cancel

## Data Model

### Product Changes

The `Product` model will be extended with:

- `spu String @unique`
- `deletedAt DateTime?`
- `categoryRisk String?`
- `returnRisk String?`
- `explanationCost String?`
- `contentVisualLevel String?`
- `sceneClarityLevel String?`
- `videoFitLevel String?`
- `comparisonDemoLevel String?`

Existing fields remain and are reused.

### Storage Rules

- `tags` is stored as a JSON string array in one text field
- `targetPlatforms` is stored as a JSON string array in one text field
- helper functions are the only allowed path for parsing and serializing these fields
- no comma-separated string storage is allowed
- `mainImagePath` stores only a relative path, never a Windows absolute path

### Soft Delete

Delete is soft delete first.

- deleting a product sets `deletedAt`
- product list queries exclude records where `deletedAt` is not null
- detail, edit, and list queries should treat soft-deleted products as unavailable for standard navigation
- delete action requires a second confirmation before execution

This keeps room for future recovery or audit features without broadening Thread 01 scope.

## SPU Generation

`spu` is system-generated on create.

Format:

- `SPU-YYYYMMDD-XXX`

Rules:

- date uses local product creation date
- sequence starts at `001` each day
- if a candidate SPU conflicts, increment `XXX` until a unique value is found
- the generator lives outside page code, inside product domain helpers or service logic

Example:

- `SPU-20260527-001`
- `SPU-20260527-002`

## Product Status Rules

Allowed displayed statuses:

- `待分析`
- `分析中`
- `建议测试`
- `暂缓`
- `淘汰`

Rules in this thread:

- new product defaults to `待分析`
- if the product is still `待分析`, and the user saves data that includes either:
  - any cost information
  - target platforms
  - selling points
  then the service may update status to `分析中`
- `建议测试`, `暂缓`, and `淘汰` are display states only in this thread
- no scoring engine or auto recommendation logic is introduced here

Status changes triggered by service rules must also create an operation log entry.

## Product Form

### Fields

The form includes:

1. `name` required
2. `categoryLevel1`
3. `categoryLevel2`
4. `tags`
5. `targetUser`
6. `targetPlatforms` multi-select:
   - `闲鱼`
   - `淘宝`
   - `小红书`
   - `抖音`
7. `estimatedPrice`
8. `estimatedCost`
9. `estimatedShipping`
10. `packagingCost`
11. `sellingPoints`
12. `painPoints`
13. `usageScenes`
14. `categoryRisk`:
   - `高风险`
   - `中风险`
   - `低风险`
   - `未知`
15. `returnRisk`:
   - `低`
   - `中`
   - `高`
   - `未知`
16. `explanationCost`:
   - `容易解释`
   - `一般`
   - `难解释`
   - `未知`
17. `contentVisualLevel`:
   - `低`
   - `中`
   - `高`
18. `sceneClarityLevel`:
   - `低`
   - `中`
   - `高`
19. `videoFitLevel`:
   - `不适合`
   - `一般`
   - `适合`
20. `comparisonDemoLevel`:
   - `无`
   - `一般`
   - `明显`
21. `notes`
22. `mainImagePath`

`sellingPoints`, `painPoints`, and `usageScenes` stay in the form even if they are not required by schema validation, because they are important to later copywriting and agent workflows.

### Validation

- `name` must be non-empty
- image type must be `jpg`, `jpeg`, `png`, or `webp`
- image size must be `<= 10MB`
- save failures surface the actual service error reason

## Image Upload Flow

Image storage rules:

- one main image per product in this thread
- accepted formats: `jpg`, `jpeg`, `png`, `webp`
- max size: `10MB`
- disk path: `uploads/products/{productId}/original/`
- database stores relative path only

Create flow with image:

1. create product record first
2. obtain `productId`
3. save image file into `uploads/products/{productId}/original/`
4. update `mainImagePath` on the product
5. write upload log

Edit flow with image:

1. validate file
2. save into the same product image directory
3. update `mainImagePath`
4. write upload log

Upload failure returns a clear reason and must not write base64 into the database.

## Operation Log Design

Operation logs are recorded for:

- create product
- edit product
- soft delete product
- upload main image
- status change

Suggested fields remain:

- `productId`
- `action`
- `detail`
- `createdAt`

Suggested action values:

- `CREATE_PRODUCT`
- `UPDATE_PRODUCT`
- `DELETE_PRODUCT`
- `UPLOAD_MAIN_IMAGE`
- `CHANGE_STATUS`

The detail string should be concise and human-readable so the operation tab can render it directly in MVP.

## Homepage Linkage

Homepage real data changes are intentionally narrow.

This thread updates only:

- `商品总数`
- `待分析商品数`
- `最近商品`

All other homepage metrics remain placeholder values from Thread 00.

Quick entry behavior should point to real routes:

- `新增商品` -> `/products/new`
- `商品池` -> `/products`

No other homepage system blocks should be made real in this thread.

## Module Boundaries

Business logic must not live inside page components.

### `lib/services/product-service.ts`

Responsibilities:

- list query
- detail query
- create product
- update product
- soft delete product
- homepage product stats
- homepage recent product query
- derived status transitions
- net profit calculation for display

### `lib/services/file-storage-service.ts`

Responsibilities:

- validate file type
- validate file size
- create product upload directories
- write file to disk
- return relative path

### `lib/services/operation-log-service.ts`

Responsibilities:

- create operation logs
- fetch product operation logs for detail page

### `lib/modules/products/`

Responsibilities:

- product enums and label maps
- form defaults
- form data normalization
- JSON array parse and stringify helpers
- SPU generator helper
- status derivation helper
- product presentation helpers

### Page Layer

Pages and page-level components should only do:

- fetch data from services
- render UI
- submit actions
- surface loading, error, and success states

They should not implement core business rules directly.

## Query And Persistence Flow

### List Page

- read search params
- pass normalized filters to `product-service`
- service queries non-deleted products only
- service returns rows already shaped for display where practical

### Create

- page collects form data
- page passes normalized payload to create action
- service generates SPU
- service creates product
- service optionally stores image and updates path
- service writes create log
- service writes status-change log only if status changed from default

### Update

- page submits normalized payload
- service loads current product
- service updates fields
- service applies status derivation if needed
- service stores replacement image if present
- service writes edit log
- service writes upload log if image changed
- service writes status-change log if status changed

### Delete

- page requires second confirmation
- service sets `deletedAt`
- service writes delete log
- list and homepage queries no longer show that product

## UI Behavior

### Product List

- keep current dashboard shell and table language
- wire search and filters to real query params
- keep card mode button visible but non-functional with a lightweight placeholder state
- delete action should be visually secondary but obvious

### Product Detail

- summary header includes image, name, SPU, categories, status, target platforms, and updated time
- `基础信息` tab is read-only
- edit button navigates to `/products/[id]/edit`
- `操作记录` tab renders newest-first activity rows

### Empty States

- empty list should show a clear no-product state with CTA to create the first product
- empty logs should show a calm placeholder like `暂无操作记录`

## Error Handling

- saving without `name` is blocked
- deleting requires second confirmation
- unsupported image format shows explicit error
- oversized image shows explicit error
- unsaved changes trigger a lightweight leave confirmation
- service failures are surfaced as readable page messages

## Testing And Verification

Required verification after implementation:

- `npm.cmd run lint`
- `npm.cmd run build`

Functional verification:

- create product succeeds
- edit product succeeds
- delete performs soft delete and product no longer appears in default list
- image upload succeeds and survives refresh
- image validation errors render correctly
- list table shows real persisted products
- detail page shows base info
- operation logs include create, edit, upload, delete, and status change when applicable
- homepage shows real product total, pending-analysis count, and recent products
- no competitor, scoring, copywriting, prompt, materials, export, or backup features are implemented as part of this thread

## Risks And Guardrails

- The existing schema contains historical mojibake defaults, so this thread should normalize any affected product status defaults during migration work instead of reusing broken literals.
- SQLite plus local `uploads/` remains the source of truth for MVP, so all file path logic must be local-first and Windows-safe.
- Because future threads will add scoring, copywriting, and agent workflows, this thread should keep product domain logic centralized and avoid coupling page components to persistence details.

## Recommended Implementation Order

1. extend Prisma schema and generate migration
2. add product module helpers
3. add product, file storage, and operation log services
4. replace `/products` skeleton with real list page
5. implement create page
6. implement detail page and tabs
7. implement edit page
8. wire homepage real product data
9. run lint, build, and browser verification
