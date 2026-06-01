# AI Service

## Responsibility

`src/lib/services/ai/` is the shared AI base for EcomPilot V1-Core. It centralizes model metadata, provider client creation, prompt sanitization, output validation, request logging, job status tracking, and rough token-cost estimation.

## Not Responsible For

- Multi-platform copywriting product logic.
- Business-specific inspiration vision prompts, OCR, link parsing, inspiration scanning, or image generation.
- Background queues, scheduled jobs, agents, or automatic model routing.
- Exact billing reconciliation or cost reports.

## Main Entry Functions

- `createAIClient(config)`: creates a server-side AI client for OpenAI-compatible chat completions, including the minimal V1-Core single-image vision request shape and the approved V1.5 API image Provider modes.
- `listRegisteredAIModels()` / `getRegisteredAIModel()`: reads centralized text, vision, and future image model metadata.
- `createAIJob()`, `markAIJobRunning()`, `markAIJobSuccess()`, `markAIJobFailed()`, `retryAIJob()`: record lightweight AI task status.
- `createAIRequestLog()`: stores sanitized request outcome, token counts, duration, and cost estimate.
- `validateJsonAIOutput()` / `validateAIOutput()`: validates structured AI output before business services write formal records.
- `sanitizePromptForAI()` / `summarizePrompt()` / `sanitizeAIErrorSummary()`: redact secrets, local paths, and long prompt-like content.
- `estimateAICost()`: estimates cost from provider, model, and token counts using the local model registry.

## AIJob And AIRequestLog

`AIJob` tracks task lifecycle: pending, running, success, failed, or cancelled. It stores only short input/result/error summaries and relation ids.

`AIRequestLog` tracks one AI provider request attempt. It stores provider, model, request type, token counts when available, estimated cost, duration, success flag, and sanitized error/input summaries.

A job may have zero, one, or multiple request logs through `relatedTaskId`. The service does not implement a real queue; server actions and services create jobs and update status synchronously.

## Prompt And Error Sanitization

- Do not send API keys in prompts.
- Do not send full local paths.
- Do not log full prompts.
- Do not log full supplier details or complete cost formulas.
- For profit context, upstream business services should pass coarse summaries such as high, medium, or low profit space.
- Error summaries are first-line, short, and sanitized.

## Vercel Degradation

Vercel is preview-only. Real AI jobs and high-cost AI calls are blocked with:

`预览环境只读，请在 Windows 本地验收 AI 调用。`

`AIRequestLog` writes are also skipped outside local writable runtime.

## Data That Must Not Be Stored

- API keys.
- Complete prompts.
- Complete local paths.
- Full stack traces.
- Raw `.env` values.

## Reuse Guidance

Future copywriting, vision, and inspiration features should use this module for provider calls, job state, logging, validation, and cost estimates. Their business-specific prompts, schemas, image selection, and persistence rules should stay in their own service or module.

## Do Not Change Casually

- Do not allow Vercel to perform real AI calls.
- Do not move API key reads to client components.
- Do not store raw prompts in `AIJob` or `AIRequestLog`.
- Do not turn this lightweight status layer into a background queue without an approved future thread.
- Do not expand API image generation into a generic provider adapter framework without an approved future thread; V1.5 only carries the explicitly approved image modes.
