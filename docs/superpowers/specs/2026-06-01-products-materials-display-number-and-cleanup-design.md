# Products, Materials Display Number, And Empty Directory Cleanup Design

## Summary

This follow-up resolves three user-facing problems without changing real database primary keys:

- The product pool currently exposes `product.id` as a standalone table column, which makes the row spacing feel unbalanced and mixes internal IDs with user-facing ordering.
- The materials library currently exposes `material.id` as the main visible badge and still shows duplicate copywriting shortcuts in the detail panel.
- The existing file-cleanup surface can scan files and app-trash records, but it does not surface empty directory shells under runtime folders such as `uploads/products/*`.

The approved direction is to keep real `product.id` and `material.id` unchanged, add computed display numbers for products and materials, fold product numbering into the existing product-info cell, keep real IDs as secondary detail-only information, remove duplicate material actions, and extend the existing file-cleanup system so it can identify and clean clearly empty directories through the same guarded workflow.

## Scope

In scope:

- `/products` list layout refinement.
- `/materials` grid/list/detail display refinement.
- Computed display numbers for active products and active materials.
- Empty-directory detection inside the existing file-cleanup flow.
- Existing cleanup page UI updates required to show directory entries distinctly from file entries.

Out of scope:

- Reassigning or resetting real `Product.id` or `Material.id`.
- Manual drag-sort or persistent custom ordering.
- Schema changes, migrations, or new dependencies.
- A second cleanup system or any background cleanup worker.
- Automatic deletion outside existing manual confirmation flows.

## Problems To Solve

### 1. Real IDs are solving the wrong problem

The user wants sequential, visually stable numbering. Real database IDs are not designed for that:

- `product.id` and `material.id` are autoincrement primary keys.
- Soft-deleted rows and historical records consume numbers permanently.
- Screenshot-recognition, material linkage, and operation logs rely on those real IDs.

Reindexing real IDs would create high-risk maintenance behavior with broad relationship fallout. The safer solution is to compute display numbers strictly for presentation.

### 2. The product pool layout is visually uneven

After adding a dedicated `Product ID` column, the product table now has a sparse middle column that breaks visual rhythm. The product row should prioritize the information the user actually scans first:

- Product name
- Product display number
- SPU

Real `product.id` should remain available, but not as a primary table column.

### 3. The materials page has redundant actions and mixed ID semantics

The materials detail panel currently shows two copywriting buttons that resolve to the same route. At the same time, the card-level badge uses the real `material.id` as if it were the primary user-facing number. This should be separated into:

- Display number for browsing and ordering.
- Real ID as a secondary detail/debug value.

### 4. Cleanup cannot currently handle empty directory shells

The current cleanup service only emits file entries. Empty directories therefore never show up in `/maintenance/files`, even when they are the real clutter the user wants to remove.

## Approved Numbering Rules

### Product display number

- Computed fresh on read.
- Scope: active products only.
- Exclude soft-deleted products.
- Ordering basis: creation order.
- Display starts at `1`.
- If an active product disappears from the active list, later products automatically shift forward on next render.

### Material display number

- Computed fresh on read.
- Scope: active materials within each product only.
- Exclude discarded, deleted-equivalent, or otherwise inactive materials already excluded from the active library.
- Ordering basis: creation order within the same product.
- Display starts at `1` for each product separately.
- If one material disappears from a product's active list, later materials for that same product automatically shift forward on next render.

### Real IDs

- Keep `product.id` and `material.id` unchanged.
- Keep them visible only as secondary information in detail surfaces.
- Continue using them for routing, linkage, screenshot source records, and logs.

## UI Design

### `/products`

Approved layout direction: Option A.

Changes:

- Remove the dedicated `Product ID` column from the table.
- Keep the existing product-info column as the main hierarchy anchor.
- Render the product-info cell in this order:
  - Product name
  - `商品 {displayNumber}`
  - `SPU-...`
- Rebalance column widths after removing the standalone ID column so the table no longer has a visually empty center band.

Detail behavior:

- Real `Product ID` remains visible in product detail, not in the main list.

### `/materials`

Changes:

- Replace the card badge text from real-ID display to display-number display, for example `素材 1`.
- In the right-side detail panel, show both:
  - `商品内素材序号: 1`
  - `素材ID: 68`
- Keep related product information visible, and also expose real `Product ID` there as secondary information if needed for screenshot/debug workflows.
- Remove one of the duplicate copywriting links in the material detail action row.
- Keep the clearer action label `查看文案素材`.

Product detail materials tab:

- Align the same action cleanup there if duplicate copywriting links are present in the product detail materials surface.
- Reuse the same display-number language when showing material order for the current product.

## Cleanup Design

### Reuse the existing cleanup foundation

The empty-directory capability must extend the existing cleanup service and page. It must not create a parallel maintenance tool.

### Directory scan behavior

Add directory candidates only when they are clearly safe and empty:

- The directory contains no files.
- All child directories are also empty.
- The directory itself is inside existing managed scopes only.
- Unsafe or path-traversal-like segments remain rejected by existing path guards.

Initial target:

- Runtime folders currently covered by the cleanup experience, especially `uploads`.

### Directory item behavior

Directory entries should be represented separately from file entries:

- Distinct item type such as `empty_directory`.
- UI label clearly says the entry is an empty folder, not a file.
- Recommendation can reuse the current guarded move-to-trash semantics when supported by the scope.

### Deletion and trash rules

- Empty-directory cleanup remains manual and explicit.
- It must go through the same existing confirmation model as file cleanup.
- It must not delete or rewrite any database rows.
- It must not infer business deletion from filesystem deletion.

If moving a directory to the app trash is not practical within the current trash structure, the service may instead remove only directories that are confirmed empty at action time. That fallback must still preserve the same read-only guards, path validation, logging, and browser confirmation expectations.

## Architecture Notes

### Product display numbers

Compute product display numbers in the server-side product list pipeline so the page receives a ready-to-render value instead of recomputing in the component.

Preferred home:

- `src/lib/services/product-service.ts`

Expected shape change:

- Extend each product list item with `displayNumber`.

### Material display numbers

Compute material display numbers in the server-side material mapping pipeline.

Preferred home:

- `src/lib/services/material-service.ts`

Expected shape change:

- Extend mapped material records with `displayNumberWithinProduct`.

The numbering should be assigned after querying the visible material set so it reflects the active filtered data model, while still preserving the approved "active per product" semantics.

### Cleanup extension

Preferred home:

- `src/lib/services/fileMaintenanceService.ts`

Expected changes:

- Extend scope traversal so it can detect empty directories in addition to files.
- Add a directory-aware item shape and action handling path.
- Keep existing runtime guards, relative-path normalization, and logging style.

## Error Handling

- Preview/cloud mode remains read-only and must continue showing the current read-only message instead of performing cleanup writes.
- If a directory stops being empty between scan and action, the cleanup action should skip it with a clear message instead of forcing deletion.
- If a product or material list is empty after filters, numbering simply does not render; there is no placeholder numbering.
- If related detail data is missing, the page should still render the display number and degrade secondary real-ID fields to `--`.

## Verification

Required commands after implementation:

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `npx prisma validate`

Manual/local acceptance:

- `/products` shows no standalone `Product ID` column.
- `/products` shows `商品 1`, `商品 2`, ... inside the product-info cell.
- Soft-deleted products do not consume visible display numbers.
- `/products/[id]` still shows the real `Product ID`.
- `/materials` cards show `素材 1`, `素材 2`, ... relative to each product.
- The materials detail panel shows both the display number and the real `素材ID`.
- The duplicate copywriting action is removed from materials detail and any mirrored product-material action row.
- Deleting or discarding one material causes later active materials of the same product to shift display numbers on next render.
- `/maintenance/files` can surface empty directory entries distinctly from files.
- Empty non-leaf directory shells are detected only when truly empty.
- Cleanup actions do not touch database product/material records.

## Boundary Reminder

This follow-up stays within the current V1.5 line by improving display semantics and extending the existing cleanup capability only. It does not introduce schema changes, real-ID resets, background cleanup, or V2 behavior.
