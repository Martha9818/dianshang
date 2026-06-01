# Current Status

## Current Progress

- Current stage: V1.5 Stabilization after V1.5 Thread 09 closeout.
- Current task state: V1.5 API image Provider adaptation for Nova and AtlasCloud is complete locally, verified, and ready for review.
- Next stage: Continue with the next approved Stabilization follow-up thread before any V2 planning thread.

## Product Direction

- Keep EcomPilot Windows local-first with SQLite and local runtime folders as the source of truth.
- Keep Vercel preview read-only; all real write acceptance belongs to Windows local runtime.
- Reuse the existing runtime, local-path, logging, diagnostics, AI, image, export, backup, notification, and cleanup foundations.

## V1.5 Freeze Summary

- Thread 01-08 are implemented on the current mainline and covered by Thread 09 regression plus archived thread detail.
- Thread 09 adds a unified final acceptance entry: `npm run thread09:verify`.
- No new business feature, schema, migration, dependency, or second cleanup system was added in Thread 09.

## Open Risks Or Limits

- Vercel remains preview-only and read-only.
- Root `npm test` does not exist in the current scripts.
- Provider-side rotation or revocation is still required for the historical Vercel recovery-code exposure; this must be completed outside the repository.
- Manual backup exists, but in-app restore remains V2 scope.
- Electron remains POC-only and is not a formal desktop runtime.
- Recent UI stabilization adjusted copywriting, Prompt tasks, materials, inspirations, link imports, file cleanup affordances, AI settings, header status menu, and stat deltas without schema, migration, dependency, or V2 scope changes.
- Copywriting history filtering now relies on the route-filtered server result without the stale client-side platform re-filter, and copywriting records can be selected, batch deleted, or one-click deleted for the current filtered result.
- The latest UI/AI follow-up removed the extra copywriting note strip, moved Prompt API image generation above long Prompt text, treats empty API image model names as Provider defaults, improved link-import feedback and auto filters, and added lightweight scene default Provider settings for copywriting, AI vision, and API image generation through existing `AppSetting` rows.
- Link-import auto filters now preserve the filter controls as a viewport anchor, keep the draft workspace height stable for sparse/empty filter results, and clamp oversized current-draft detail text so status/purpose switching no longer jumps.
- API image generation retries `/v1/images/generations` when a provider root URL returns an HTML page instead of JSON.
- API image generation now supports approved lightweight Provider modes for OpenAI-compatible Images, Nova chat/SSE image generation, and AtlasCloud async prediction image generation; AI settings offers model presets while continuing to use the existing `AIProvider.modelName` field.
- Build/acceptance fixture inspirations from local verification were hidden from the default inspiration view and related scan/draft jobs were cleared; uploaded files were not deleted.

## Next Recommended Step

- Review the V1.5 Stabilization UI/UX follow-up locally, then open the next approved stabilization thread if more cleanup is desired. Do not enter V2 until explicitly approved.
