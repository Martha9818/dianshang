# V1.5 Thread 07 Electron Technical Validation Report

## Conclusion

Overall conclusion: passed as a POC.

This thread validates that an isolated Electron shell can load the existing local Next.js EcomPilot app from a local port. It is not a formal Windows desktop app and does not introduce packaging, auto-update, tray, Windows notifications, crash recovery, background residency, or a replacement for the current Windows local web startup flow.

Formal Windows desktop productization remains V2 scope.

## Completed

- Added an isolated POC under `experiments/electron-poc/`.
- Kept Electron dependencies in the POC package only; the root app does not depend on Electron.
- Added a main-process shell that loads only localhost, `127.0.0.1`, or `::1` targets.
- Added a minimal preload marker with no filesystem, shell, database, path, or IPC write capabilities exposed to the page.
- Denied Electron permission requests in the POC.
- Added static/local-port smoke validation and Electron smoke validation scripts.
- Added `.vercelignore` exclusion so Vercel preview does not upload or execute the POC directory.
- Documented path, runtime, environment, security, and V2 productization risks.

## Not Completed

- No formal Electron desktop app.
- No packaged installer.
- No auto-update.
- No tray or Windows system notifications.
- No crash recovery.
- No background resident process.
- No replacement for `start.bat`.
- No production desktop deployment flow.

## Not Applicable

- Database schema and migration changes.
- Runtime folder migration.
- Production release signing.
- Desktop auto-start or file association.
- Platform crawlers, automated collection, publishing, messaging, comments, SKU, supplier, inventory, PDF reports, or multi-agent orchestration.

## POC Directory

`experiments/electron-poc/` contains:

- `package.json`: POC-only Electron dependency and scripts.
- `main.mjs`: Electron main process, local URL validation, security defaults, smoke exit behavior.
- `preload.cjs`: marker-only context bridge.
- `scripts/smoke-check.mjs`: static safety and local target reachability check.
- `scripts/electron-smoke.mjs`: short Electron launch check.
- `README.md`: local validation steps and non-goals.

The directory is intentionally removable. Deleting it should not affect the root Next.js app, Prisma schema, Vercel preview, `start.bat`, or local runtime folders.

## Startup Validation

Validated flow:

1. Keep the existing root app startup unchanged.
2. Start or reuse the existing local Next.js server on `http://127.0.0.1:3000`.
3. Install POC dependencies inside `experiments/electron-poc/`.
4. Run POC smoke checks.
5. Launch Electron in smoke mode and confirm the local page loads.

Observed POC results:

- `npm install` in the POC directory initially failed through the default Electron binary download path because of network reset/timeout.
- Retrying with a POC-scoped `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/` succeeded.
- `npm run smoke` passed and confirmed the local target returned HTTP 200.
- `npm run electron:smoke` passed and loaded `http://127.0.0.1:3000/`.
- Electron printed a development CSP warning because Next.js dev mode uses development-time script behavior. This is acceptable for the POC but must be solved before any V2 production desktop release.

## Command Verification

- `npm run encoding:check`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npx prisma validate`: passed.
- `npm run typecheck`: passed.
- `npm test`: not available; root `package.json` has no `test` script.
- `cd experiments/electron-poc; npm run smoke`: passed.
- `cd experiments/electron-poc; npm run electron:smoke`: passed and loaded `http://127.0.0.1:3000/`.

## Path Validation

Current local path services resolve runtime folders from `process.cwd()`:

- `uploads/`
- `exports/`
- `backups/`
- `logs/`
- `trash/`

POC result:

- The Electron shell does not access these folders directly.
- The page continues to use the existing Next.js server and existing service layer.
- No Electron-only path reads or writes were added.

Risk:

- In a formal packaged desktop app, `process.cwd()` may differ from the project root or packaged resource directory.
- V2 must define the writable data root explicitly and map `RuntimeConfig` / `LocalPathService` to that root.
- V2 must preserve display-safe relative paths and avoid exposing absolute Windows paths to renderer pages, logs, exports, diagnostics, or notifications.

## Environment Validation

Current environment behavior remains unchanged:

- Local web remains the normal writable Windows runtime.
- Vercel remains preview-only and read-only.
- Electron POC is only a wrapper around the local web URL.

POC marker:

- `window.ecompilotElectronPoc.getContext()` returns a marker object with `isElectronPoc: true`.
- It exposes no filesystem, database, local path, prompt, key, or IPC write capability.

V2 requirement:

- Formal desktop work must add an explicit runtime identity to the shared runtime layer instead of duplicating environment logic in Electron.
- Vercel read-only logic must remain authoritative and unchanged.

## Vercel Impact

Vercel impact: none expected.

- The POC directory is excluded by `.vercelignore`.
- The root app does not import Electron code.
- The root app does not depend on the POC package.
- Vercel does not execute Electron scripts.
- Vercel write guards remain unchanged.

## Security Check

POC security result:

- Loads only local trusted targets.
- Uses `contextIsolation: true`.
- Uses `nodeIntegration: false`.
- Uses `sandbox: true`.
- Denies permission requests.
- Does not expose dangerous `fs` or IPC capabilities through preload.
- Does not load untrusted remote pages in the Electron window.
- Does not store or show API keys, `.env` values, local absolute paths, database paths, raw prompts, or stack traces.

Known security risk before V2:

- Next.js development mode triggers Electron's insecure CSP warning. A formal V2 desktop release must serve a production build with a strict CSP and no development-only unsafe script behavior.

## V2 Must Resolve

- Production desktop data root and migration strategy for local runtime folders.
- Runtime identity model for local web vs Vercel vs formal desktop.
- Strict production CSP for Electron.
- Clear preload/API contract with no broad filesystem access.
- Window navigation and external link policy.
- App lifecycle ownership, shutdown, logging, diagnostics, and error handling.
- Installer/signing strategy, only when V2 formally opens that scope.
- Upgrade/migration strategy, only when V2 formally opens that scope.
- How `start.bat` coexists with a future desktop app without breaking current local use.

## Boundary Statement

V1.5 Thread 07 is complete only as Electron technical validation. It does not ship a desktop product. V2 is the first appropriate stage for a formal Windows desktop app.
