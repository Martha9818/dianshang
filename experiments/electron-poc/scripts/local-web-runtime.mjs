import { execFileSync, spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { access } from "node:fs/promises";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const pocRoot = path.resolve(scriptDir, "..");
export const repoRoot = path.resolve(pocRoot, "..", "..");
export const host = "127.0.0.1";
export const defaultPort = Number(process.env.ECOMPILOT_ELECTRON_POC_PORT || 3001);

function quoteWindowsArg(value) {
  if (/[\s"]/u.test(value)) {
    return `"${value.replaceAll('"', '\\"')}"`;
  }

  return value;
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => {
      resolve(false);
    });
  });
}

export async function findAvailablePort(startPort = defaultPort, maxAttempts = 10) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidate = startPort + offset;
    const open = await isPortOpen(candidate);
    if (!open) {
      return candidate;
    }
  }

  throw new Error(`No local port available in range ${startPort}-${startPort + maxAttempts - 1}.`);
}

export function buildTargetUrl(port) {
  return `http://${host}:${port}`;
}

export function waitForUrl(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get(url, (response) => {
        response.resume();

        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }

        if (Date.now() >= deadline) {
          reject(new Error(`Local web server did not become reachable at ${url}.`));
          return;
        }

        setTimeout(attempt, 500);
      });

      request.on("error", () => {
        if (Date.now() >= deadline) {
          reject(new Error(`Local web server did not become reachable at ${url}.`));
          return;
        }

        setTimeout(attempt, 500);
      });
    };

    attempt();
  });
}

export function runRootNpm(args, options = {}) {
  const env = { ...process.env, ...options.env };
  const stdio = options.stdio ?? "inherit";

  if (process.platform === "win32") {
    const commandLine = ["npm", ...args].map(quoteWindowsArg).join(" ");

    return spawn("cmd.exe", ["/d", "/s", "/c", commandLine], {
      cwd: repoRoot,
      env,
      stdio,
    });
  }

  return spawn("npm", args, {
    cwd: repoRoot,
    env,
    stdio,
  });
}

export function waitForExit(child, description) {
  return new Promise((resolve, reject) => {
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${description} exited with code ${code ?? "unknown"}.`));
    });

    child.once("error", (error) => {
      reject(new Error(`${description} failed to start: ${error.message}`));
    });
  });
}

export async function ensureBuildReady() {
  const buildIdPath = path.join(repoRoot, ".next", "BUILD_ID");
  const buildExists = await access(buildIdPath).then(() => true).catch(() => false);

  if (process.env.ECOMPILOT_ELECTRON_POC_SKIP_BUILD === "1" && buildExists) {
    return;
  }

  const build = runRootNpm(["run", "build"]);
  await waitForExit(build, "Root build");
}

export async function startManagedLocalWeb(port) {
  const child = runRootNpm(["run", "start", "--", "--hostname", host, "--port", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
    process.stdout.write(chunk);
  });

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
    process.stderr.write(chunk);
  });

  const targetUrl = buildTargetUrl(port);

  try {
    await waitForUrl(targetUrl);
  } catch (error) {
    child.kill();
    throw new Error(`${error.message}\nstdout:\n${stdout}\nstderr:\n${stderr}`.trim());
  }

  return {
    child,
    targetUrl,
    stop() {
      stopProcessTree(child);
    },
  };
}

export function stopProcessTree(child) {
  if (!child?.pid) {
    return;
  }

  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      // Ignore cleanup failures for already-exited processes.
    }

    return;
  }

  if (!child.killed) {
    child.kill("SIGTERM");
  }
}
