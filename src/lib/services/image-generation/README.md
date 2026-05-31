# Image Generation Service

V1.5 Thread 06 owns lightweight, user-triggered API image generation from an existing Prompt Task.

- Runs only after a manual click and confirmation from the Prompt Task detail UI.
- Uses `AIProvider` entries with `purpose=image`; API keys stay server-side.
- Reads image generation enablement, default size, quality, and cost hint from `AppSetting`.
- Blocks in preview/read-only runtime with `预览环境只读，请在 Windows 本地验收 API 生图。`
- Scans Prompt text with the existing banned-word service before calling the provider.
- Calls the OpenAI-compatible `/images/generations` endpoint through the AI service layer.
- Saves successful results through managed uploads/local-path image services, then creates a `Material` marked `sourceType=ai_generated`.
- Records `ImageGenerationJob`, `AIJob`, `AIRequestLog`, operation log, and sanitized notifications.
- Does not batch generate, retry in the background, publish, open browsers, crawl platforms, or bypass model safety limits.
