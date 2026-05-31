import { spawn } from "node:child_process";
import electronBinary from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defaultPort, ensureBuildReady, findAvailablePort, startManagedLocalWeb } from "./local-web-runtime.mjs";

const pocRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  await ensureBuildReady();

  const port = await findAvailablePort(defaultPort);
  const localWeb = await startManagedLocalWeb(port);

  const electron = spawn(electronBinary, ["."], {
    cwd: pocRoot,
    env: {
      ...process.env,
      ECOMPILOT_ELECTRON_POC_URL: localWeb.targetUrl,
    },
    stdio: "inherit",
  });

  const shutdown = () => {
    localWeb.stop();
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  electron.once("exit", (code) => {
    shutdown();
    process.exitCode = code ?? 0;
  });

  electron.once("error", (error) => {
    shutdown();
    throw error;
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
