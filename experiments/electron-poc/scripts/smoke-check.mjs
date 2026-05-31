import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetUrl = process.env.ECOMPILOT_ELECTRON_POC_URL || "http://127.0.0.1:3000";
const forbiddenPatterns = [
  /\bautoUpdater\b/i,
  /\bTray\b/,
  /\bNotification\b/,
  /\belectron-builder\b/i,
  /\belectron-updater\b/i,
  /\bcrashReporter\b/,
];

function assertLocalTarget(rawValue) {
  const parsed = new URL(rawValue);
  const allowedHostnames = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

  if (!["http:", "https:"].includes(parsed.protocol) || !allowedHostnames.has(parsed.hostname)) {
    throw new Error("POC target must be localhost, 127.0.0.1, or ::1.");
  }

  return parsed;
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertNoForbiddenDesktopFeatures() {
  const checkedFiles = ["main.mjs", "preload.cjs", "package.json"];

  for (const file of checkedFiles) {
    const content = read(file);
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        throw new Error(`Forbidden desktop-production feature found in ${file}: ${pattern}`);
      }
    }
  }
}

function assertMinimalPreload() {
  const preload = read("preload.cjs");
  const forbiddenPreloadTokens = ["node:fs", "ipcRenderer", "shell", "process.env"];

  for (const token of forbiddenPreloadTokens) {
    if (preload.includes(token)) {
      throw new Error(`Preload exposes or imports a forbidden capability: ${token}`);
    }
  }
}

function probeLocalPage(url) {
  return new Promise((resolve) => {
    const client = url.protocol === "https:" ? https : http;
    const request = client.request(
      {
        method: "GET",
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        timeout: 5000,
      },
      (response) => {
        response.resume();
        resolve({ ok: response.statusCode >= 200 && response.statusCode < 500, statusCode: response.statusCode });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("timeout"));
    });
    request.on("error", (error) => {
      resolve({ ok: false, error: error.message });
    });
    request.end();
  });
}

async function main() {
  const parsedTarget = assertLocalTarget(targetUrl);
  assertNoForbiddenDesktopFeatures();
  assertMinimalPreload();

  const probe = await probeLocalPage(parsedTarget);
  if (!probe.ok) {
    const reason = probe.statusCode ? `HTTP ${probe.statusCode}` : probe.error;
    throw new Error(`Local Next.js target is not reachable: ${reason}`);
  }

  console.log("electron-poc static checks passed");
  console.log(`electron-poc local target reachable: ${parsedTarget.toString()} (${probe.statusCode})`);
  console.log("electron-poc preload capability surface: marker only, no fs/ipc exposure");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
