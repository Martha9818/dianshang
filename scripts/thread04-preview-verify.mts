import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { saveAIProviderAction, saveBannedWordAction, testAIProviderConnectionWithConfigAction } from "../src/app/settings/actions";
import { generateCopywritingAction, saveManualCopywritingAction } from "../src/app/copywriting/actions";

type Check = {
  name: string;
  status: "PASS" | "FAIL";
  detail?: string;
};

const checks: Check[] = [];
const port = Number(process.env.THREAD04_PREVIEW_PORT ?? "3310");
const baseUrl = `http://127.0.0.1:${port}`;
process.env.ECOMPILOT_RUNTIME_MODE = "preview";

function pass(name: string, detail?: string) {
  checks.push({ name, status: "PASS", detail });
}

function fail(name: string, detail: string) {
  checks.push({ name, status: "FAIL", detail });
}

async function waitForServer(timeoutMs = 30_000) {
  const startedAt = Date.now();
  let lastError = "";

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(baseUrl, { cache: "no-store" });
      if (response.ok) {
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await delay(500);
  }

  throw new Error(`Preview server did not become ready: ${lastError}`);
}

async function verifyPage(path: string) {
  try {
    const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    const text = await response.text();

    if (!response.ok) {
      fail(`preview 页面 ${path}`, `HTTP ${response.status}`);
      return;
    }

    if (text.includes("Failed to fetch") || text.includes("PrismaClient") || text.includes("ENOENT")) {
      fail(`preview 页面 ${path}`, "页面包含原始错误文本");
      return;
    }

    pass(`preview 页面 ${path}`, `HTTP ${response.status}`);
  } catch (error) {
    fail(`preview 页面 ${path}`, error instanceof Error ? error.message : String(error));
  }
}

async function verifyReadonlyActions() {
  const providerForm = new FormData();
  providerForm.set("name", "preview-provider");
  providerForm.set("providerType", "openai-compatible");
  providerForm.set("baseUrl", "http://127.0.0.1:1/v1");
  providerForm.set("apiKey", "preview-key");
  providerForm.set("modelName", "preview-model");
  providerForm.set("purpose", "text");
  providerForm.set("enabled", "on");

  const bannedWordForm = new FormData();
  bannedWordForm.set("word", "preview-risk-word");
  bannedWordForm.set("category", "preview");
  bannedWordForm.set("riskLevel", "high");

  const cases = [
    {
      name: "preview 禁止保存 AI Provider",
      run: () => saveAIProviderAction(providerForm),
      expected: "预览环境只读",
    },
    {
      name: "preview 禁止新增违规词",
      run: () => saveBannedWordAction(bannedWordForm),
      expected: "预览环境只读",
    },
    {
      name: "preview 禁止测试连接",
      run: () =>
        testAIProviderConnectionWithConfigAction({
          baseUrl: "http://127.0.0.1:1/v1",
          apiKey: "preview-key",
          modelName: "preview-model",
          providerType: "openai-compatible",
        }),
      expected: "预览环境只读",
    },
    {
      name: "preview 禁止生成文案",
      run: () => generateCopywritingAction({ productId: 1, platform: "闲鱼", providerId: 1 }),
      expected: "预览环境只读",
    },
    {
      name: "preview 禁止保存文案",
      run: () =>
        saveManualCopywritingAction({
          productId: 1,
          providerId: null,
          platform: "闲鱼",
          version: "A",
          style: "稳妥真实版",
          title: "preview",
          mainCopy: "preview",
          sellingPointsText: "",
          faqText: "",
          riskNotesText: "",
        }),
      expected: "预览环境只读",
    },
  ];

  for (const item of cases) {
    const result = await item.run();
    if (!result.success && result.error.includes(item.expected)) {
      pass(item.name, result.error);
    } else {
      fail(item.name, JSON.stringify(result));
    }
  }
}

async function main() {
  const child = spawn("cmd.exe", ["/d", "/s", "/c", `npx.cmd next start --hostname 127.0.0.1 --port ${port}`], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ECOMPILOT_RUNTIME_MODE: "preview",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  child.stdout?.on("data", (chunk) => {
    output += String(chunk);
  });
  child.stderr?.on("data", (chunk) => {
    output += String(chunk);
  });

  try {
    await waitForServer();
    await verifyPage("/settings/ai");
    await verifyPage("/settings/banned-words");
    await verifyPage("/copywriting");
    await verifyPage("/products/1?tab=%E5%B9%B3%E5%8F%B0%E6%96%87%E6%A1%88");
    await verifyReadonlyActions();
  } catch (error) {
    fail("preview server 启动", error instanceof Error ? error.message : String(error));
  } finally {
    child.kill();
    await Promise.race([once(child, "exit"), delay(5_000)]);
  }

  const failed = checks.filter((item) => item.status === "FAIL");
  for (const check of checks) {
    console.log(`${check.status} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
  }

  if (failed.length > 0) {
    console.error(output.slice(-4000));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
