import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defaultPort, ensureBuildReady, findAvailablePort, startManagedLocalWeb } from "./local-web-runtime.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function runNodeScript(scriptName, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(scriptDir, scriptName)], {
      cwd: path.resolve(scriptDir, ".."),
      env: {
        ...process.env,
        ...env,
      },
      stdio: "inherit",
    });

    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${scriptName} exited with code ${code ?? "unknown"}.`));
    });

    child.once("error", (error) => {
      reject(error);
    });
  });
}

async function main() {
  await ensureBuildReady();

  const port = await findAvailablePort(defaultPort);
  const localWeb = await startManagedLocalWeb(port);

  try {
    await runNodeScript("smoke-check.mjs", {
      ECOMPILOT_ELECTRON_POC_URL: localWeb.targetUrl,
    });

    await runNodeScript("electron-smoke.mjs", {
      ECOMPILOT_ELECTRON_POC_URL: localWeb.targetUrl,
    });
  } finally {
    localWeb.stop();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
