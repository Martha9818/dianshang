# Diagnostics Service

## Responsibility

`src/lib/services/diagnostics/` builds the sanitized `/system/diagnostics` snapshot for runtime, SQLite, local folders, recent logs, AI status, image storage, inspiration counts, scan summaries, and diagnostic markdown.

## Not Responsible For

- Fixing data problems automatically.
- Cleaning files.
- Running backups or exports.
- Calling AI.
- Returning raw server paths or raw stack traces.

## Main Entry Functions

- `getDiagnosticsSnapshot()`: reads runtime, database, directory, log, AI, image, and inspiration status.
- `buildDiagnosticsMarkdown(snapshot)`: creates a sanitized markdown summary.
- `sanitizeDiagnosticText(value)`: redacts secrets, local paths, SQLite paths, and stack frames.
- `getPreviewWriteMessage()`: shared Vercel readonly message for diagnostics-adjacent callers.

## Side Effects

- Database writes: no.
- File writes: local diagnostics may create missing runtime folders and use temporary writability probes through `local-paths`.
- AI calls: no.

## Local And Vercel Behavior

- Windows local checks SQLite connectivity, attempts SQLite WAL / `busy_timeout`, inspects `uploads/`, `exports/`, `backups/`, `logs/`, reads recent sanitized log summaries, and summarizes recent inspiration scan / AI failures without exposing the real folder path.
- Vercel returns readonly status, does not create folders, does not read local logs, and does not connect to the local SQLite file.

## Sanitization Rules

- Frontend output uses relative folder labels only.
- Diagnostics strips internal absolute paths before returning the snapshot.
- Recent log lines are sanitized again before display.
- The markdown summary must not include API keys, full paths, full prompts, full stacks, or database file paths.

## Common Modification Points

- Add a new readonly health check.
- Add a new count or status field sourced from a service.
- Adjust summary markdown wording.

## Do Not Change Casually

- Do not make diagnostics destructive.
- Do not expose absolute paths.
- Do not add cleanup, restore, or scheduled checks here.
- Do not call AI from diagnostics.
