# File Cleanup Service

## Responsibility

`src/lib/services/fileMaintenanceService.ts` owns V1-Plus Thread 06 local file maintenance: manual scans for `uploads/`, `exports/`, and `backups/`, application-managed `trash/`, `CleanupLog`, and safe move/permanent-delete operations.

## Safety Rules

- No background jobs, schedules, OCR, AI image judgment, compression, cloud sync, Windows recycle bin integration, or database-record deletion.
- Filesystem operations run only in the service layer and only when the runtime guard reports local writable mode.
- Displayed and logged paths are application-relative, such as `uploads/...` or `trash/...`; absolute local paths are not returned to the frontend or stored in `CleanupLog`.
- Permanent delete only accepts files already under the application `trash/` folder.
- Active product main images, competitor screenshots, materials, and active inspiration images are not movable by the cleanup UI.

## Vercel Behavior

Preview/runtime read-only mode returns the file-cleanup read-only message and does not scan, move, delete, or write SQLite records.
