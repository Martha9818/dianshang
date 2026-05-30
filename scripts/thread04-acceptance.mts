import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import { prisma } from "../src/lib/prisma";
import { OPERATION_LOG_ACTIONS } from "../src/lib/modules/products/constants";
import { testAIProviderConnectionWithConfigAction } from "../src/app/settings/actions";
import { createAIProvider, deleteAIProvider, disableAIProvider, enableAIProvider, updateAIProvider } from "../src/lib/services/ai-provider-service";
import { createBannedWord, deleteBannedWord, updateBannedWord } from "../src/lib/services/banned-word-service";
import { generatePlatformCopywriting, saveManualCopywriting } from "../src/lib/services/copywriting-service";

type Check = {
  name: string;
  status: "PASS" | "FAIL";
  detail?: string;
};

const checks: Check[] = [];

function pass(name: string, detail?: string) {
  checks.push({ name, status: "PASS", detail });
}

function fail(name: string, detail: string) {
  checks.push({ name, status: "FAIL", detail });
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readRequestJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
}

function buildThreeVersionResponse() {
  return {
    platform: "闲鱼",
    versions: [
      {
        version: "A",
        style: "稳妥真实版",
        title: "A 版标题",
        main_copy: "A 版正文",
        selling_points: ["真实描述", "适合自用"],
        faq: ["可以议价吗？可以小刀。"],
        risk_notes: ["按实际库存发货。"],
      },
      {
        version: "B",
        style: "强卖点转化版",
        title: "B 版标题",
        main_copy: "B 版正文",
        selling_points: ["重点卖点"],
        faq: ["什么时候发货？当天可安排。"],
        risk_notes: ["避免夸大承诺。"],
      },
      {
        version: "C",
        style: "种草内容版",
        title: "C 版标题",
        main_copy: "C 版正文",
        selling_points: ["生活化场景"],
        faq: ["适合谁？适合日常使用。"],
        risk_notes: ["不虚构效果。"],
      },
    ],
  };
}

function buildPartialResponse() {
  return {
    platform: "闲鱼",
    versions: [
      {
        version: "A",
        style: "稳妥真实版",
        title: "只有 A",
        main_copy: "只有 A 的正文",
        selling_points: ["A 卖点"],
        faq: [],
        risk_notes: [],
      },
      {
        version: "B",
        style: "强卖点转化版",
        title: "只有 B",
        main_copy: "只有 B 的正文",
        selling_points: ["B 卖点"],
        faq: [],
        risk_notes: [],
      },
    ],
  };
}

async function createMockServer() {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "POST" || req.url !== "/v1/chat/completions") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
      return;
    }

    const authorization = req.headers.authorization ?? "";
    const request = await readRequestJson(req);
    const model = String(request.model ?? "");
    const prompt = String(request.messages?.[0]?.content ?? "");
    const wantsStructured = Boolean(request.response_format);

    if (authorization === "Bearer bad-key") {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "Invalid API key bad-key" } }));
      return;
    }

    if (model === "bad-model") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "model not found" } }));
      return;
    }

    if (model === "rate-limited") {
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "rate limit exceeded" } }));
      return;
    }

    if (model === "quota-model") {
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "insufficient quota balance" } }));
      return;
    }

    if (wantsStructured && model === "no-schema") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "response_format json_schema unsupported" } }));
      return;
    }

    let content = JSON.stringify({ ok: true });
    if (prompt.includes("生成 3 个版本")) {
      content = JSON.stringify(buildThreeVersionResponse());
    }

    if (model === "non-json") {
      content = "这不是 JSON";
    }

    if (model === "missing-version") {
      content = JSON.stringify(buildPartialResponse());
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        choices: [{ message: { content } }],
      }),
    );
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Mock server did not expose a TCP address.");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}/v1`,
    close: async () => {
      server.close();
      await once(server, "close");
    },
  };
}

async function main() {
  const mock = await createMockServer();
  const runId = Date.now();
  const cleanup = {
    productIds: [] as number[],
    providerIds: [] as number[],
    bannedWordIds: [] as number[],
  };

  try {
    const product = await prisma.product.create({
      data: {
        spu: `SPU-THREAD04-${runId}`,
        name: `Thread04 验收商品 ${runId}`,
        status: "待分析",
        categoryLevel1: "家居",
        categoryLevel2: "收纳",
        tags: JSON.stringify(["收纳", "日常"]),
        targetUser: "租房用户",
        targetPlatforms: JSON.stringify(["闲鱼", "淘宝", "小红书", "抖音"]),
        estimatedPrice: 99,
        sellingPoints: "好清理\n耐用",
        painPoints: "怕脏难清理",
        usageScenes: "日常使用场景",
      },
    });
    cleanup.productIds.push(product.id);

    const provider = await createAIProvider({
      name: `thread04-mock-${runId}`,
      providerType: "openai-compatible",
      baseUrl: mock.baseUrl,
      apiKey: "ok-key",
      modelName: "ok-model",
      purpose: "text",
      enabled: true,
      isDefault: true,
    });
    cleanup.providerIds.push(provider.id);

    const riskyWord = await createBannedWord({
      word: `验收风险词${runId}`,
      category: "验收分类",
      riskLevel: "high",
    });
    cleanup.bannedWordIds.push(riskyWord.id);

    await updateBannedWord(riskyWord.id, {
      word: riskyWord.word,
      category: "验收分类更新",
      riskLevel: "high",
    });

    await updateAIProvider(provider.id, {
      id: String(provider.id),
      name: provider.name,
      providerType: "openai-compatible",
      baseUrl: mock.baseUrl,
      apiKey: "",
      modelName: "ok-model",
      purpose: "text",
      enabled: true,
      isDefault: true,
    });

    try {
      const disabled = await disableAIProvider(provider.id);
      assert(disabled.enabled === false, "禁用后 enabled 应为 false");
      assert(disabled.isDefault === false, "禁用后 isDefault 应为 false");
      const enabled = await enableAIProvider(provider.id);
      assert(enabled.enabled === true, "启用后 enabled 应为 true");
      pass("AI Provider 禁用后可重新启用", `provider=${enabled.name}`);
    } catch (error) {
      fail("AI Provider 禁用后可重新启用", error instanceof Error ? error.message : String(error));
    }

    try {
      const result = await testAIProviderConnectionWithConfigAction({
        baseUrl: mock.baseUrl,
        apiKey: "ok-key",
        modelName: `ok-model-${runId}`,
        providerType: "openai-compatible",
      });
      if (!result.success || !result.data) {
        throw new Error(result.success ? "测试连接未返回数据" : result.error);
      }
      assert(result.data.latencyMs >= 0, "测试连接应返回耗时");
      pass("未保存表单测试连接", `model=${result.data.modelName}`);
    } catch (error) {
      fail("未保存表单测试连接", error instanceof Error ? error.message : String(error));
    }

    const errorCases = [
      {
        name: "API Key 错误提示",
        apiKey: "bad-key",
        modelName: "ok-model",
        expected: "认证失败，请检查 API Key",
      },
      {
        name: "模型名错误提示",
        apiKey: "ok-key",
        modelName: "bad-model",
        expected: "模型不可用，请检查模型名",
      },
      {
        name: "限流错误提示",
        apiKey: "ok-key",
        modelName: "rate-limited",
        expected: "请求过于频繁",
      },
      {
        name: "余额不足错误提示",
        apiKey: "ok-key",
        modelName: "quota-model",
        expected: "余额不足",
      },
    ];

    for (const item of errorCases) {
      const result = await testAIProviderConnectionWithConfigAction({
        baseUrl: mock.baseUrl,
        apiKey: item.apiKey,
        modelName: item.modelName,
        providerType: "openai-compatible",
      });

      if (!result.success && result.error.includes(item.expected) && !result.error.includes(item.apiKey)) {
        pass(item.name, result.error);
      } else {
        fail(item.name, JSON.stringify(result));
      }
    }

    try {
      const saved = await generatePlatformCopywriting({ productId: product.id, platform: "闲鱼", providerId: provider.id });
      assert(saved.length === 3, "生成应保存 A/B/C 三版");
      assert(saved.every((record) => record.generationStatus === "success"), "A/B/C 均应 success");
      const count = await prisma.copywriting.count({ where: { productId: product.id, platform: "闲鱼" } });
      assert(count === 3, "生成后应只有三条平台文案");
      pass("真实 mock AI 文案生成与 A/B/C 保存", `records=${count}`);
    } catch (error) {
      fail("真实 mock AI 文案生成与 A/B/C 保存", error instanceof Error ? error.message : String(error));
    }

    try {
      await generatePlatformCopywriting({ productId: product.id, platform: "闲鱼", providerId: provider.id });
      fail("重复生成保护", "重复生成未被阻止");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const count = await prisma.copywriting.count({ where: { productId: product.id, platform: "闲鱼" } });
      if (message.includes("短时间内已有相同 AI 任务") && count === 3) {
        pass("重复生成保护", `records=${count}`);
      } else {
        fail("重复生成保护", message);
      }
    }

    const noSchemaProvider = await createAIProvider({
      name: `thread04-no-schema-${runId}`,
      providerType: "openai-compatible",
      baseUrl: mock.baseUrl,
      apiKey: "ok-key",
      modelName: "no-schema",
      purpose: "text",
      enabled: true,
      isDefault: false,
    });
    cleanup.providerIds.push(noSchemaProvider.id);

    try {
      const saved = await generatePlatformCopywriting({ productId: product.id, platform: "淘宝", providerId: noSchemaProvider.id });
      assert(saved.length === 3, "结构化输出降级后也应保存三版");
      pass("结构化输出失败后普通 JSON Prompt 降级", `records=${saved.length}`);
    } catch (error) {
      fail("结构化输出失败后普通 JSON Prompt 降级", error instanceof Error ? error.message : String(error));
    }

    const nonJsonProvider = await createAIProvider({
      name: `thread04-non-json-${runId}`,
      providerType: "openai-compatible",
      baseUrl: mock.baseUrl,
      apiKey: "ok-key",
      modelName: "non-json",
      purpose: "text",
      enabled: true,
      isDefault: false,
    });
    cleanup.providerIds.push(nonJsonProvider.id);

    try {
      await generatePlatformCopywriting({ productId: product.id, platform: "小红书", providerId: nonJsonProvider.id });
      fail("非 JSON 返回阻止保存", "非 JSON 返回未被阻止");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const count = await prisma.copywriting.count({ where: { productId: product.id, platform: "小红书" } });
      if (message.includes("AI 返回格式不是有效 JSON") && count === 0) {
        pass("非 JSON 返回阻止保存", `records=${count}`);
      } else {
        fail("非 JSON 返回阻止保存", message);
      }
    }

    const missingVersionProvider = await createAIProvider({
      name: `thread04-missing-version-${runId}`,
      providerType: "openai-compatible",
      baseUrl: mock.baseUrl,
      apiKey: "ok-key",
      modelName: "missing-version",
      purpose: "text",
      enabled: true,
      isDefault: false,
    });
    cleanup.providerIds.push(missingVersionProvider.id);

    try {
      await generatePlatformCopywriting({ productId: product.id, platform: "抖音", providerId: missingVersionProvider.id });
      fail("JSON 缺版阻止保存", "缺版 JSON 未被阻止");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const count = await prisma.copywriting.count({ where: { productId: product.id, platform: "抖音" } });
      if (message.includes("AI 输出不符合 copywriting_response 结构要求") && count === 0) {
        pass("JSON 缺版阻止保存", `records=${count}`);
      } else {
        fail("JSON 缺版阻止保存", message);
      }
    }

    try {
      const saved = await saveManualCopywriting({
        productId: product.id,
        providerId: null,
        platform: "闲鱼",
        version: "A",
        style: "稳妥真实版",
        title: `手动标题 ${riskyWord.word}`,
        mainCopy: "手动正文",
        sellingPointsText: "手动卖点",
        faqText: "手动 FAQ",
        riskNotesText: "手动风险提示",
      });
      assert(saved.providerId === null, "手动保存 providerId 应为 null");
      assert(saved.generationStatus === "success", "手动保存应 success");
      assert(saved.auditStatus === "待修改", "高风险命中应待修改");
      pass("手动填写保存与重新审核", `auditStatus=${saved.auditStatus}`);
    } catch (error) {
      fail("手动填写保存与重新审核", error instanceof Error ? error.message : String(error));
    }

    await deleteBannedWord(riskyWord.id);
    cleanup.bannedWordIds = cleanup.bannedWordIds.filter((id) => id !== riskyWord.id);

    const throwawayProvider = await createAIProvider({
      name: `thread04-delete-log-${runId}`,
      providerType: "openai-compatible",
      baseUrl: mock.baseUrl,
      apiKey: "ok-key",
      modelName: "ok-model",
      purpose: "text",
      enabled: true,
      isDefault: false,
    });
    cleanup.providerIds.push(throwawayProvider.id);
    await deleteAIProvider(throwawayProvider.id);
    cleanup.providerIds = cleanup.providerIds.filter((id) => id !== throwawayProvider.id);

    const logActions = await prisma.operationLog.findMany({
      where: {
        detail: {
          contains: String(runId),
        },
        action: {
          in: [
            OPERATION_LOG_ACTIONS.CREATE_AI_PROVIDER,
            OPERATION_LOG_ACTIONS.UPDATE_AI_PROVIDER,
            OPERATION_LOG_ACTIONS.DELETE_AI_PROVIDER,
            OPERATION_LOG_ACTIONS.TEST_AI_PROVIDER,
            OPERATION_LOG_ACTIONS.CREATE_BANNED_WORD,
            OPERATION_LOG_ACTIONS.UPDATE_BANNED_WORD,
            OPERATION_LOG_ACTIONS.DELETE_BANNED_WORD,
            OPERATION_LOG_ACTIONS.GENERATE_COPYWRITING,
            OPERATION_LOG_ACTIONS.UPDATE_COPYWRITING,
          ],
        },
      },
      select: { action: true, detail: true },
    });
    const actionSet = new Set(logActions.map((item) => item.action));

    try {
      assert(actionSet.has(OPERATION_LOG_ACTIONS.CREATE_AI_PROVIDER), "缺少 CREATE_AI_PROVIDER 日志");
      assert(actionSet.has(OPERATION_LOG_ACTIONS.UPDATE_AI_PROVIDER), "缺少 UPDATE_AI_PROVIDER 日志");
      assert(actionSet.has(OPERATION_LOG_ACTIONS.DELETE_AI_PROVIDER), "缺少 DELETE_AI_PROVIDER 日志");
      assert(actionSet.has(OPERATION_LOG_ACTIONS.TEST_AI_PROVIDER), "缺少 TEST_AI_PROVIDER 日志");
      assert(actionSet.has(OPERATION_LOG_ACTIONS.CREATE_BANNED_WORD), "缺少 CREATE_BANNED_WORD 日志");
      assert(actionSet.has(OPERATION_LOG_ACTIONS.UPDATE_BANNED_WORD), "缺少 UPDATE_BANNED_WORD 日志");
      assert(actionSet.has(OPERATION_LOG_ACTIONS.DELETE_BANNED_WORD), "缺少 DELETE_BANNED_WORD 日志");
      assert(actionSet.has(OPERATION_LOG_ACTIONS.GENERATE_COPYWRITING), "缺少 GENERATE_COPYWRITING 日志");
      assert(actionSet.has(OPERATION_LOG_ACTIONS.UPDATE_COPYWRITING), "缺少 UPDATE_COPYWRITING 日志");
      assert(logActions.every((item) => !String(item.detail ?? "").includes("ok-key")), "日志不得包含 API Key");
      pass("Thread 04 操作日志", Array.from(actionSet).join(", "));
    } catch (error) {
      fail("Thread 04 操作日志", error instanceof Error ? error.message : String(error));
    }
  } finally {
    for (const id of cleanup.bannedWordIds.reverse()) {
      await deleteBannedWord(id).catch(() => prisma.bannedWord.delete({ where: { id } }).catch(() => {}));
    }

    await prisma.operationLog.deleteMany({ where: { productId: { in: cleanup.productIds } } }).catch(() => {});
    await prisma.copywriting.deleteMany({ where: { productId: { in: cleanup.productIds } } }).catch(() => {});

    for (const id of cleanup.providerIds.reverse()) {
      await deleteAIProvider(id).catch(() => prisma.aIProvider.delete({ where: { id } }).catch(() => {}));
    }

    for (const id of cleanup.productIds.reverse()) {
      await prisma.product.delete({ where: { id } }).catch(() => {});
    }

    await mock.close();
    await prisma.$disconnect();
  }

  const failed = checks.filter((item) => item.status === "FAIL");
  for (const check of checks) {
    console.log(`${check.status} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
