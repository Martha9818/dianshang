# EcomPilot Electron POC

This directory is a V1.5 Thread 07 technical validation only. It is not the formal Windows desktop app, does not build an installer, and does not replace the existing Windows local Next.js workflow or `start.bat`.

## Scope

- Loads a local Next.js app through a managed local production server on `http://127.0.0.1:3001` by default.
- Keeps Electron files and dependencies inside `experiments/electron-poc/`.
- Uses a minimal preload marker only: no filesystem, shell, database, path, or IPC write capability is exposed to the page.
- Allows only localhost, `127.0.0.1`, or `::1` targets.
- Denies permission requests and opens non-local navigation outside the Electron shell.

## Non-Goals

- No installer or packaged release.
- No auto-update.
- No system tray.
- No Windows system notifications.
- No crash recovery or background resident process.
- No replacement for `start.bat`, `npm run dev`, or the Vercel preview flow.

## Local Validation

From the repository root, an optional manual build is still fine if you want to warm the production output ahead of time:

```powershell
npm run build
```

The managed POC scripts will build the root app automatically, so in another PowerShell window you can run:

```powershell
cd experiments/electron-poc
npm install
npm run smoke
npm run dev
```

`npm run smoke` starts a managed local `next start` server, verifies the target URL, runs the Electron smoke check, and shuts the local web server down. `npm run dev` starts that same managed local production server and opens the Electron shell without the Next.js dev-mode CSP warning.

If you explicitly want to attach to an already running local server:

```powershell
$env:ECOMPILOT_ELECTRON_POC_URL="http://127.0.0.1:3000"
npm run smoke:static
npm run electron:smoke
npm run attach
```

To test another local port:

```powershell
$env:ECOMPILOT_ELECTRON_POC_URL="http://127.0.0.1:3001"
npm run smoke:static
npm run electron:smoke
```

## Path And Runtime Notes

The POC does not read or write `uploads/`, `exports/`, `backups/`, `logs/`, or `trash/` directly. Future V2 desktop work must reuse the existing `RuntimeConfig`, `LocalPathService`, `EnvironmentGuard`, diagnostics, logging, image, export, backup, and cleanup services instead of adding Electron-only path access.
