import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import electronBin from "electron";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const timeoutMs = Number(process.env.ECOMPILOT_ELECTRON_POC_SMOKE_TIMEOUT_MS || 20000);

const child = spawn(electronBin, [root], {
  cwd: root,
  env: {
    ...process.env,
    ECOMPILOT_ELECTRON_POC_SMOKE: "1",
    ELECTRON_ENABLE_LOGGING: "1",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";

const timer = setTimeout(() => {
  child.kill();
  console.error("electron-poc smoke timed out before Electron exited");
  process.exitCode = 1;
}, timeoutMs);

child.stdout.on("data", (chunk) => {
  stdout += chunk.toString();
});

child.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

child.on("close", (code) => {
  clearTimeout(timer);

  if (stdout.trim()) {
    console.log(stdout.trim());
  }

  if (stderr.trim()) {
    console.error(stderr.trim());
  }

  process.exitCode = code ?? 1;
});
