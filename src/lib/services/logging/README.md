# Logging Service

## Responsibility

`src/lib/services/logging/` provides the basic application log API for local diagnostics.

## Not Responsible For

- User activity timelines.
- Database operation logs.
- AI request accounting.
- Full stack trace storage.

## Main Entry Functions

- `logInfo(message)`: appends a sanitized info line to `logs/app.log` in local runtime.
- `logWarn(message)`: appends a sanitized warning line to `logs/app.log` in local runtime.
- `logError(message)`: appends a sanitized error line to `logs/app.log` and `logs/error.log` in local runtime.
- `sanitizeLogMessage(message)`: removes secrets, local paths, SQLite paths, stack frames, and long prompt payloads.

## Side Effects

- Database writes: no.
- File writes: yes, local `logs/app.log` and `logs/error.log` only.
- AI calls: no.

## Local And Vercel Behavior

- Windows local writes sanitized log lines under `logs/`.
- Vercel does not write real local log files; it falls back to sanitized console output.

## Sanitization Rules

- API keys are redacted.
- Full Windows paths are replaced with `[local-path-redacted]`.
- SQLite `file:` paths are replaced with `file:[database-path-redacted]`.
- Stack trace frames are omitted.
- Long prompt-like fields are replaced with `[prompt-redacted]`.

## Common Modification Points

- Add structured log metadata.
- Adjust retention later, if a future cleanup thread explicitly allows it.
- Add more secret patterns when new providers are introduced.

## Do Not Change Casually

- Do not log raw API keys, `.env` values, full local paths, full database paths, full prompts, or full stacks.
- Do not write logs on Vercel.
- Do not implement log cleanup in V1-Core-02.

