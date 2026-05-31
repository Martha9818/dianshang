import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, Menu, session, shell } from "electron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TARGET_URL = "http://127.0.0.1:3001";
const SMOKE_TIMEOUT_MS = 15000;

function normalizeTargetUrl(rawValue) {
  const value = (rawValue || DEFAULT_TARGET_URL).trim();
  const parsed = new URL(value);
  const allowedHostnames = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

  if (!["http:", "https:"].includes(parsed.protocol) || !allowedHostnames.has(parsed.hostname)) {
    throw new Error("Electron POC only loads a local Next.js URL.");
  }

  return parsed.toString();
}

function isAllowedLocalUrl(rawValue) {
  try {
    normalizeTargetUrl(rawValue);
    return true;
  } catch {
    return false;
  }
}

function buildFallbackHtml(message) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(`
    <!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <title>EcomPilot Electron POC</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            margin: 32px;
            line-height: 1.6;
            color: #1f2937;
          }
          code {
            background: #f3f4f6;
            border-radius: 4px;
            padding: 2px 6px;
          }
        </style>
      </head>
      <body>
        <h1>EcomPilot Electron POC</h1>
        <p>${message}</p>
        <p>Start the managed POC flow with <code>npm run dev</code>, or attach to an existing local server with <code>npm run attach</code>.</p>
      </body>
    </html>
  `)}`;
}

function createWindow() {
  const targetUrl = normalizeTargetUrl(process.env.ECOMPILOT_ELECTRON_POC_URL);
  const isSmoke = process.env.ECOMPILOT_ELECTRON_POC_SMOKE === "1";

  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    show: !isSmoke,
    title: "EcomPilot Electron POC",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedLocalUrl(url)) {
      return { action: "allow" };
    }

    shell.openExternal(url).catch(() => {});
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (isAllowedLocalUrl(url)) {
      return;
    }

    event.preventDefault();
    shell.openExternal(url).catch(() => {});
  });

  window.webContents.once("did-fail-load", (_event, _errorCode, _errorDescription, validatedUrl) => {
    const fallback = buildFallbackHtml(`Local Next.js page is not reachable at ${validatedUrl || targetUrl}.`);

    if (isSmoke) {
      console.error(`electron-poc smoke failed: ${validatedUrl || targetUrl} is not reachable`);
      app.exit(2);
      return;
    }

    window.loadURL(fallback).catch(() => {});
  });

  if (isSmoke) {
    const timer = setTimeout(() => {
      console.error("electron-poc smoke failed: timed out waiting for local page");
      app.exit(3);
    }, SMOKE_TIMEOUT_MS);

    window.webContents.once("did-finish-load", () => {
      clearTimeout(timer);
      console.log(`electron-poc smoke loaded ${targetUrl}`);
      app.quit();
    });
  }

  window.loadURL(targetUrl).catch((error) => {
    if (isSmoke) {
      console.error(`electron-poc smoke failed: ${error.message}`);
      app.exit(2);
      return;
    }

    window.loadURL(buildFallbackHtml("Local Next.js page is not reachable.")).catch(() => {});
  });
}

app.disableHardwareAcceleration();

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  createWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});
