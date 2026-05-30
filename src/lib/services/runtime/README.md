# Runtime Service

## Responsibility

`src/lib/services/runtime/` is the single source for deciding whether EcomPilot is running in Windows local writable mode, Vercel preview mode, or a reserved cloud mode.

## Not Responsible For

- Database reads or writes.
- Filesystem reads or writes.
- AI calls.
- Page-level UI messages beyond returning safe runtime labels and readonly notices.

## Main Entry Functions

- `getRuntimeMode()`: returns `local`, `preview`, or `cloud`.
- `isVercel()`: detects Vercel preview/production runtime through Vercel environment variables.
- `isLocalWritable()`: true only for local runtime and never true on Vercel.
- `assertLocalWritable()`: throws a user-safe readonly business error when writes are not allowed.
- `getRuntimeModeSummary()`: returns mode, label, Vercel flag, writable flag, and readonly message.

## Side Effects

- Database writes: no.
- File writes: no.
- AI calls: no.

## Local And Vercel Behavior

- Windows local is writable by default.
- Vercel always resolves to preview/read-only even if `ECOMPILOT_RUNTIME_MODE` is set.
- `cloud` remains a reserved non-writable mode.

## Sanitization Rules

This module does not expose paths, secrets, prompts, or stacks. It only returns runtime labels and readonly messages.

## Common Modification Points

- Add a new runtime label.
- Adjust readonly copy.
- Add future deployment detection rules.

## Do Not Change Casually

- Do not allow Vercel to become writable.
- Do not move write checks back into pages.
- Do not add database or filesystem logic here.

