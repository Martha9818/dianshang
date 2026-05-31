import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { createLinkImportDraft } from "../src/lib/services/link-import/linkImportService";
import { getImageGenerationPanelData, generateImageForPromptTask } from "../src/lib/services/image-generation/imageGenerationService";
import { runManualInspirationScan, runScheduledInspirationScanIfDue } from "../src/lib/services/inspirations/inspirationScanService";
import { buildReadonlyRuntimeMessage } from "../src/lib/services/runtime/runtimeService";
import { createScreenshotRecognitionJob } from "../src/lib/services/screenshot/screenshotRecognitionService";

const projectRoot = process.cwd();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function pass(label: string, detail?: string) {
  console.log(`PASS ${label}${detail ? ` - ${detail}` : ""}`);
}

async function runCommand(command: string, args: string[], options?: { cwd?: string }) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd ?? projectRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed: ${command} ${args.join(" ")} (exit ${code ?? "unknown"})`));
    });
  });
}

async function expectReadonly(label: string, action: () => Promise<unknown>, expected: string) {
  try {
    await action();
    throw new Error(`${label} unexpectedly succeeded`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert(message.includes(expected), `${label} returned unexpected message: ${message}`);
    pass(label, message);
  }
}

async function withPreviewRuntime(task: () => Promise<void>) {
  const previousVercel = process.env.VERCEL;
  const previousVercelEnv = process.env.VERCEL_ENV;

  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "preview";

  try {
    await task();
  } finally {
    if (previousVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = previousVercel;
    }

    if (previousVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = previousVercelEnv;
    }
  }
}

async function listFilesRecursively(root: string) {
  const results: string[] = [];

  async function walk(current: string) {
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }

      results.push(absolute);
    }
  }

  await walk(root);
  return results;
}

async function verifyNoFsInPagesAndComponents() {
  const roots = [path.join(projectRoot, "src", "app"), path.join(projectRoot, "src", "components")];
  const offenders: string[] = [];

  for (const root of roots) {
    const files = await listFilesRecursively(root);
    for (const absolutePath of files) {
      if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(absolutePath)) {
        continue;
      }

      if (absolutePath.includes(`${path.sep}src${path.sep}app${path.sep}api${path.sep}`)) {
        continue;
      }

      const content = await readFile(absolutePath, "utf8");
      if (/(node:fs|node:fs\/promises|from\s+["']fs["']|from\s+["']fs\/promises["']|require\(["']fs)/.test(content)) {
        offenders.push(path.relative(projectRoot, absolutePath));
      }
    }
  }

  assert(offenders.length === 0, `Page/component files import fs directly: ${offenders.join(", ")}`);
  pass("no direct fs in pages/components");
}

async function verifyCentralizedRuntimeAndPaths() {
  const srcFiles = await listFilesRecursively(path.join(projectRoot, "src"));
  const cwdOffenders: string[] = [];
  const vercelOffenders: string[] = [];

  const allowedCwd = new Set([
    path.join("src", "lib", "services", "local-paths", "localPathsService.ts"),
    path.join("src", "lib", "services", "backup-service.ts"),
  ]);
  const allowedVercel = new Set([
    path.join("src", "lib", "services", "runtime", "runtimeService.ts"),
  ]);

  for (const absolutePath of srcFiles) {
    if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(absolutePath)) {
      continue;
    }

    const relativePath = path.relative(projectRoot, absolutePath);
    const content = await readFile(absolutePath, "utf8");

    if (content.includes("process.cwd(") && !allowedCwd.has(relativePath)) {
      cwdOffenders.push(relativePath);
    }

    if ((content.includes("process.env.VERCEL") || content.includes("process.env.VERCEL_ENV")) && !allowedVercel.has(relativePath)) {
      vercelOffenders.push(relativePath);
    }
  }

  assert(cwdOffenders.length === 0, `Found process.cwd() outside approved path-root ownership: ${cwdOffenders.join(", ")}`);
  assert(vercelOffenders.length === 0, `Found Vercel env checks outside runtime service: ${vercelOffenders.join(", ")}`);
  pass("centralized runtime and path roots");
}

async function verifyPreviewGuardsForThread01To06() {
  await withPreviewRuntime(async () => {
    const readonly = buildReadonlyRuntimeMessage("preview");

    await expectReadonly("thread01 manual scan preview guard", () => runManualInspirationScan(), readonly);
    await expectReadonly("thread01 scheduled scan preview guard", () => runScheduledInspirationScanIfDue(), readonly);
    await expectReadonly(
      "thread02 screenshot preview guard",
      () => createScreenshotRecognitionJob({ sourceType: "manual", sourceId: null, productId: null, file: null }),
      "预览环境只读，请在 Windows 本地验收截图识别。",
    );
    await expectReadonly(
      "thread03 link import preview guard",
      () => createLinkImportDraft({ url: "https://example.com/demo", purpose: "inspiration" }),
      "预览环境只读，请在 Windows 本地验收链接导入。",
    );

    const panel = await getImageGenerationPanelData(null);
    assert(panel.previewMessage === "预览环境只读，请在 Windows 本地验收 API 生图。", "image generation panel preview message mismatch");
    pass("thread06 image panel preview notice");

    await expectReadonly(
      "thread06 image generation preview guard",
      () => generateImageForPromptTask({ taskCode: "THREAD09-PREVIEW" }),
      "预览环境只读，请在 Windows 本地验收 API 生图。",
    );
  });
}

async function verifyRegressionScripts() {
  const checks: Array<{ label: string; command: string; args: string[]; cwd?: string }> = [
    { label: "v1-core final acceptance", command: npxCommand, args: ["tsx", "scripts/v1-core-07-acceptance.mts"] },
    { label: "thread04 local acceptance", command: npmCommand, args: ["run", "thread04:verify"] },
    { label: "thread04 preview guard", command: npmCommand, args: ["run", "thread04:preview"] },
    { label: "thread05 batch acceptance", command: npxCommand, args: ["tsx", "scripts/thread05-batch-acceptance.mts"] },
    { label: "thread05 preview guard", command: npxCommand, args: ["tsx", "scripts/thread05-preview-guard.mts"] },
    { label: "thread06 cleanup acceptance", command: npxCommand, args: ["tsx", "scripts/thread06-file-cleanup-acceptance.mts"] },
    { label: "thread06 preview guard", command: npxCommand, args: ["tsx", "scripts/thread06-preview-guard.mts"] },
    { label: "thread07 export backup acceptance", command: npxCommand, args: ["tsx", "scripts/thread07-final-acceptance.mts"] },
    { label: "thread08 assistant acceptance", command: npmCommand, args: ["run", "thread08:verify"] },
    { label: "electron poc smoke", command: npmCommand, args: ["run", "smoke"], cwd: path.join(projectRoot, "experiments", "electron-poc") },
  ];

  for (const check of checks) {
    await runCommand(check.command, check.args, { cwd: check.cwd });
    pass(check.label);
  }
}

async function main() {
  await verifyNoFsInPagesAndComponents();
  await verifyCentralizedRuntimeAndPaths();
  await verifyPreviewGuardsForThread01To06();
  await verifyRegressionScripts();
  console.log("Thread 09 final acceptance passed.");
}

main().catch((error) => {
  console.error("Thread 09 final acceptance failed:");
  console.error(error);
  process.exitCode = 1;
});
