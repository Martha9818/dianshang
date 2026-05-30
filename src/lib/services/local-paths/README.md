# Local Paths Service

## Responsibility

`src/lib/services/local-paths/` centralizes local runtime folder paths and path safety helpers for `uploads/`, `exports/`, `backups/`, `logs/`, and the application-managed `trash/` folder.

## Not Responsible For

- Product, export, backup, or material business rules.
- Database writes.
- AI calls.
- User-facing page rendering.

## Main Entry Functions

- `getLocalDirectoryPath(key)`: returns the server-only absolute path for a known local folder.
- `getLocalDirectoryDisplayPath(key)`: returns a safe relative label such as `logs/`.
- `ensureLocalDirectory(key)`: creates a local folder only when `assertLocalWritable()` passes.
- `inspectLocalRuntimeDirectories()`: checks existence/writability without exposing absolute paths.
- `sanitizeFileName()`: removes dangerous filename characters.
- `createShortFileName()`: creates bounded timestamped names with a random suffix.
- `toSafeRelativePath()`: stores relative paths with forward slashes.
- `assertPathLength()`: fails with a friendly message before writing overly long paths.

## Side Effects

- Database writes: no.
- File writes: yes, only when ensuring local directories or running non-persistent writability probes.
- AI calls: no.

## Local And Vercel Behavior

- Local runtime may create missing `uploads/`, `exports/`, `backups/`, `logs/`, and `trash/`.
- Vercel returns read-only directory status and never creates real local folders.

## Sanitization Rules

- Frontend-facing callers must use `displayPath`, not `absolutePath`.
- Diagnostics strips `absolutePath` before returning data to the page.
- Store application file references as relative paths whenever possible.

## Common Modification Points

- Add a new local runtime folder.
- Adjust filename length limits.
- Add a new path safety check before a file-writing service uses it.

## Do Not Change Casually

- Do not expose `absolutePath` to client components.
- Do not create folders on Vercel.
- Do not broaden path traversal rules.
