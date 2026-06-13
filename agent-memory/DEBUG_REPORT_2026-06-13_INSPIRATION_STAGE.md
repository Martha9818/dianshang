# DEBUG REPORT

- Symptom: On `/inspirations`, the center original-image stage turned blank even though the left queue thumbnail still rendered. Because the visible stage content effectively disappeared, users also lost the practical entry to the fullscreen original preview.
- Root cause: The recent refactor replaced the center-stage `ProductImage` with raw `next/image` using `fill`, but wrapped it in a container that no longer guaranteed a stable intrinsic height. The image therefore rendered inside an effectively collapsed box, producing an empty-looking stage while still leaving the surrounding panel intact.
- Fix: Updated [product-image.tsx](/E:/电商/src/components/products/product-image.tsx) to support `fit="contain"`, then switched the center-stage original image in [inspiration-manager.tsx](/E:/电商/src/components/inspirations/inspiration-manager.tsx) back onto the proven `ProductImage` aspect-ratio container while keeping the fullscreen original preview modal path.
- Evidence: `npx.cmd tsx scripts/inspiration-original-stage-verify.mts` passed. `npx.cmd tsc --noEmit --incremental false`, `npm.cmd run lint`, and `npm.cmd run build` passed. Local HTTP verification against `http://127.0.0.1:3003/inspirations` returned `stage-ok`.
- Regression test: [inspiration-original-stage-verify.mts](/E:/电商/scripts/inspiration-original-stage-verify.mts)
- Related: This is a follow-up regression in the same center-stage area that was previously changed from `displayPath` to `imagePath` for original-image rendering.
- Status: DONE_WITH_CONCERNS

Concern: Browser-plugin verification could not complete in this session because the local Codex browser runtime crashed on startup with the machine-level config error `model_providers contains reserved built-in provider IDs: openai`.
