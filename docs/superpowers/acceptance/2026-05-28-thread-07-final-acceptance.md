# Thread 07 Final Acceptance

Date: 2026-05-28

## Scope

Thread 07 implements local Excel export and manual backup for EcomPilot MVP.

This closeout pass validates the extra checks requested before Thread 08:

1. Windows local Prisma process/file-lock verification
2. Vercel production read-only write behavior
3. Excel content verification with complete test data
4. Backup completeness, including SQLite WAL/SHM sidecar handling
5. `/api/exports/[id]` download safety
6. Export-setting UI clarity for future-version options

## Windows Local

Status: passed.

- Stopped workspace-related Node / Next / Prisma processes before retrying Prisma commands.
- `npx prisma generate` completed successfully and regenerated Prisma Client without `EPERM`.
- `npx prisma migrate dev` reported the schema already in sync and regenerated Prisma Client without `EPERM`.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed. A non-blocking Turbopack NFT warning remains on the backup server-action import trace, but the build completed successfully.

## Vercel Production Read-Only Behavior

Status: passed after deploy-package cleanup.

- Added `.vercelignore` so local `.env`, SQLite database files, `exports/`, `backups/`, and runtime `uploads/` are not uploaded by Vercel CLI.
- Redeployed production after the ignore fix.
- Final production deployment tested: `dpl_impMNwCJAg6rzsdnN9rYxkgbynqB`.
- Live URL tested: `https://ecompilot-mvp.vercel.app`.
- `/export` loads with a friendly preview read fallback instead of local data.
- Clicking `一键导出 Excel` returns a friendly message: `当前环境为只读预览，Excel 导出请在 Windows 本地运行。`
- `/backup` loads with a friendly preview read fallback instead of local data.
- Clicking `立即备份` returns a friendly message: `当前环境为只读预览，手动备份请在 Windows 本地运行。`
- Browser network checks showed POST `/export` and POST `/backup` both returned `200`.
- Browser console checks showed no console errors, no runtime overlay, and no `Failed to fetch`.
- After `.vercelignore`, production pages no longer showed local acceptance export/backup records.

## Excel Content

Status: passed.

Verification command:

```powershell
npx tsx scripts/thread07-final-acceptance.mts
```

The script created a complete linked dataset covering:

- `Product`
- `Competitor`
- `Copywriting`
- `PromptTask`
- `Material`
- `ScoreSnapshot`

Generated export:

- Export log id: `12`
- File: `EcomPilot_Export_20260528_2107.xlsx`
- Path: `E:\电商\exports\EcomPilot_Export_20260528_2107.xlsx`

The script opened the workbook with ExcelJS and verified:

- all 6 Sheet names exist: `Products`, `Competitors`, `Copywriting`, `PromptTasks`, `Materials`, `Scores`
- representative row values exist for every covered table
- Product name, categories, tags, net profit, profit rate, total score
- Competitor title, heat value, screenshot path
- Copywriting title and body
- Prompt task code, prompt text, recommended size
- Material linked task code, file path, width, height
- Score total, deduction reason, next suggestion

## Backup Completeness

Status: passed.

The final acceptance script ran `createManualBackup()` and verified:

- Backup log id: `4`
- Backup path: `E:\电商\backups\20260528_210749`
- `dev.db` exists in the backup folder
- `uploads/` exists in the backup folder
- `.env.example` is included when present

At the time of the backup run, live `dev.db-wal` and `dev.db-shm` sidecars did not exist. A separate sidecar utility verification created temporary database sidecar files and confirmed:

```json
{ "hasDb": true, "hasWal": true, "hasShm": true }
```

Implementation now copies `dev.db-wal` and `dev.db-shm` when present through `copySqliteDatabaseFiles(...)`.

README also documents that important backups should still be run after stopping local `node` / `next` / `prisma` processes.

## Export Download Security

Status: passed.

Local production server tested at `http://localhost:3107` against the records created by the acceptance script:

- success id `12`: `200`, Excel MIME type, safe attachment `Content-Disposition`, `X-Content-Type-Options: nosniff`
- failed id `13`: `404`, JSON `{"error":"导出文件尚不可下载。"}`
- traversal id `14`: `400`, JSON `{"error":"导出路径无效。"}`
- missing id `15`: `404`, JSON `{"error":"导出文件不存在或暂时不可读取。"}`
- unsafe filename id `16`: `400`, JSON `{"error":"导出文件名无效。"}`

The error responses did not expose absolute local file paths.

## UI Clarity

Status: passed.

- `/export` still clearly shows implemented settings:
  - `包含文案正文`
  - `包含图片路径`
- Unimplemented settings are visually disabled and marked `后续版本`:
  - `按当前筛选导出`
  - `包含已软删除数据`

## Final Result

Thread 07 closeout acceptance passed for:

- Windows local Prisma / file-lock verification
- Vercel production read-only degradation
- Excel data content correctness
- backup database/uploads completeness and WAL/SHM sidecar handling
- `/api/exports/[id]` download safety
- export-settings UI clarity

Thread 07 can move into Thread 08 after this closeout is committed, pushed, and the final deployment is confirmed.
