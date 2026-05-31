import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import { prisma } from "../src/lib/prisma";
import {
  archiveCompetitorAnalysisSnapshot,
  generateCompetitorAnalysisSnapshot,
  getCompetitorAnalysisSnapshots,
  markCompetitorAnalysisReference,
} from "../src/lib/services/competitor-analysis/competitorAnalysisService";

type Check = {
  name: string;
  status: "PASS" | "FAIL";
  detail?: string;
};

type EnvSnapshot = {
  ECOMPILOT_RUNTIME_MODE?: string;
  VERCEL?: string;
  VERCEL_ENV?: string;
};

const checks: Check[] = [];
const insufficientDataNeedle = "\u5efa\u8bae\u5148\u8865\u5145\u7ade\u54c1\u6570\u636e";
const rescoreNeedle = "\u5efa\u8bae\u91cd\u65b0\u8bc4\u5206";
const fullLocalPathPattern = new RegExp("[A-Za-z]:\\\\\\\\|E:\\\\\\\\|file://");

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

function restoreEnvValue(key: keyof EnvSnapshot, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

function restoreEnv(snapshot: EnvSnapshot) {
  restoreEnvValue("ECOMPILOT_RUNTIME_MODE", snapshot.ECOMPILOT_RUNTIME_MODE);
  restoreEnvValue("VERCEL", snapshot.VERCEL);
  restoreEnvValue("VERCEL_ENV", snapshot.VERCEL_ENV);
}

async function readRequestJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
}

async function createMockServer() {
  const calls: unknown[] = [];
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "POST" || req.url !== "/v1/chat/completions") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
      return;
    }

    const request = await readRequestJson(req);
    calls.push(request);

    if (String(request.model ?? "") === "thread04-fail-model") {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "mock provider failure at /secret/local/path" } }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: "3 selected local competitors share compact storage, easy cleaning, and rental-home positioning.",
                priceBandSummary: "Prices cluster from 79 to 129, with a practical test anchor around 99.",
                sellingPointSummary: "Common selling points are compact size, durability, and easy setup.",
                imageStyleSummary: "Images lean toward bright home scenes with detail and size-comparison shots.",
                copywritingStyleSummary: "Copy usually opens with storage pain points and then gives a scene-based solution.",
                differentiationAdvice: "Differentiate with small-home routines, replaceable parts, and measured load claims.",
                riskTips: "Do not overstate load bearing or material quality; manually review platform and after-sales risks.",
                nextStepAdvice: "Run a 20-50 unit small batch test and observe clicks, saves, questions, and returns. \u5efa\u8bae\u91cd\u65b0\u8bc4\u5206.",
                dataGapAdvice: "Add negative reviews, local screenshots, recent heat data, and after-sales questions.",
                uncertaintyNotes: "This is AI-assisted advice based only on local records; sample size and heat metrics remain uncertain.",
              }),
            },
          },
        ],
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
    calls,
    close: async () => {
      server.close();
      await once(server, "close");
    },
  };
}

async function cleanupAcceptanceData(input: {
  productId: number | null;
  providerId: number | null;
  previousDefaultProviderIds: number[];
}) {
  const aiJobIds =
    input.productId === null
      ? []
      : (
          await prisma.competitorAnalysisSnapshot.findMany({
            where: { productId: input.productId, aiJobId: { not: null } },
            select: { aiJobId: true },
          })
        )
          .map((snapshot) => snapshot.aiJobId)
          .filter((id): id is number => typeof id === "number");

  if (input.productId !== null) {
    await prisma.aIRequestLog.deleteMany({
      where: {
        OR: [{ relatedProductId: input.productId }, { relatedTaskId: { in: aiJobIds } }],
      },
    });
    await prisma.competitorAnalysisSnapshot.deleteMany({ where: { productId: input.productId } });
    await prisma.screenshotRecognitionJob.deleteMany({ where: { productId: input.productId } });
    await prisma.linkImportDraft.deleteMany({ where: { productId: input.productId } });
    await prisma.operationLog.deleteMany({ where: { productId: input.productId } });
    await prisma.product.delete({ where: { id: input.productId } }).catch(() => undefined);
  }

  if (aiJobIds.length > 0) {
    await prisma.aIJob.deleteMany({ where: { id: { in: aiJobIds } } });
  }

  if (input.providerId !== null) {
    await prisma.aIProvider.delete({ where: { id: input.providerId } }).catch(() => undefined);
  }

  await prisma.aIProvider.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  for (const providerId of input.previousDefaultProviderIds) {
    await prisma.aIProvider.update({ where: { id: providerId }, data: { isDefault: true } }).catch(() => undefined);
  }
}

async function main() {
  const envSnapshot: EnvSnapshot = {
    ECOMPILOT_RUNTIME_MODE: process.env.ECOMPILOT_RUNTIME_MODE,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };
  const mock = await createMockServer();
  const runId = Date.now();
  const previousDefaultProviders = await prisma.aIProvider.findMany({ where: { isDefault: true }, select: { id: true } });
  let providerId: number | null = null;
  let productId: number | null = null;

  try {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    process.env.ECOMPILOT_RUNTIME_MODE = "local";

    await prisma.aIProvider.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    const provider = await prisma.aIProvider.create({
      data: {
        name: `thread04-competitor-mock-${runId}`,
        providerType: "openai-compatible",
        baseUrl: mock.baseUrl,
        apiKey: "thread04-secret-key-should-not-leak",
        modelName: "thread04-ok-model",
        purpose: "text",
        enabled: true,
        isDefault: true,
      },
    });
    providerId = provider.id;

    const product = await prisma.product.create({
      data: {
        spu: `THREAD04-COMP-${runId}`,
        name: `Thread04 competitor analysis acceptance ${runId}`,
        status: "pending-analysis",
        categoryLevel1: "home",
        categoryLevel2: "storage",
        tags: JSON.stringify(["storage", "rental"]),
        targetUser: "rental users",
        targetPlatforms: JSON.stringify(["manual-platform-a", "manual-platform-b"]),
        estimatedPrice: 99,
        sellingPoints: "easy clean\ncompact",
        painPoints: "small home storage shortage",
        usageScenes: "bedroom, entryway, kitchen",
        notes: "local acceptance only; no full local path should be sent",
      },
    });
    productId = product.id;

    const competitors = [] as Array<{ id: number }>;
    for (let index = 0; index < 3; index += 1) {
      const competitor = await prisma.competitor.create({
        data: {
          productId: product.id,
          platform: ["manual-a", "manual-b", "manual-c"][index],
          title: `manual-competitor-${index + 1}`,
          price: [79, 99, 129][index],
          heatMetricType: "favorites",
          heatMetricValue: [120, 200, 160][index],
          sellerName: `local-seller-${index + 1}`,
          sellingPoint: ["compact", "durable", "easy setup"][index],
          painPoint: ["unclear size", "load dispute", "support questions"][index],
          imageStyle: ["bright home", "white detail", "real scene"][index],
          dataDate: new Date("2026-05-31T00:00:00.000Z"),
          notes: "user-confirmed local competitor record",
        },
      });
      competitors.push(competitor);
    }

    await prisma.screenshotRecognitionJob.create({
      data: {
        sourceType: "competitor",
        sourceId: String(competitors[0].id),
        productId: product.id,
        competitorId: competitors[0].id,
        imagePath: "uploads/screenshots/thread04-local-fixture.png",
        status: "confirmed",
        structuredDraft: JSON.stringify({ draftLabel: "screenshot-draft", sellingPoints: ["detail view"] }),
        confirmedDraft: JSON.stringify({
          draftLabel: "confirmed-screenshot-draft",
          imageDescription: "bright home storage image",
          copywritingMaterialSummary: "size and detail emphasis",
        }),
        qualityLevel: "high",
      },
    });

    await prisma.linkImportDraft.create({
      data: {
        url: "https://example.invalid/local-confirmed",
        normalizedUrl: "https://example.invalid/local-confirmed",
        sourcePlatform: "manual",
        purpose: "competitor_reference",
        status: "confirmed",
        qualityLevel: "medium",
        manualText: "local-confirmed-link-draft; no automatic link fetching",
        note: "local acceptance draft",
        metaTitle: "local confirmed title",
        metaDescription: "local confirmed description",
        productId: product.id,
        competitorId: competitors[1].id,
      },
    });

    const beforeProduct = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { status: true, updatedAt: true },
    });
    const beforeScoreCount = await prisma.scoreSnapshot.count({ where: { productId: product.id } });

    try {
      await generateCompetitorAnalysisSnapshot({
        productId: product.id,
        competitorIds: competitors.slice(0, 2).map((competitor) => competitor.id),
      });
      fail("insufficient data guard", "generation unexpectedly succeeded with fewer than 3 competitors");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes(insufficientDataNeedle)) {
        pass("insufficient data guard", message);
      } else {
        fail("insufficient data guard", message);
      }
    }

    const selectedCompetitorIds = competitors.map((competitor) => competitor.id);
    const firstSnapshot = await generateCompetitorAnalysisSnapshot({
      productId: product.id,
      competitorIds: selectedCompetitorIds,
    });
    const secondSnapshot = await generateCompetitorAnalysisSnapshot({
      productId: product.id,
      competitorIds: selectedCompetitorIds,
    });

    try {
      assert(firstSnapshot.id !== secondSnapshot.id, "regeneration overwrote the previous snapshot");
      assert(secondSnapshot.competitorIdList.length === 3, "snapshot should record 3 competitor ids");
      assert(Boolean(secondSnapshot.summary), "summary should be saved");
      assert(Boolean(secondSnapshot.priceBandSummary), "priceBandSummary should be saved");
      assert(Boolean(secondSnapshot.sellingPointSummary), "sellingPointSummary should be saved");
      assert(Boolean(secondSnapshot.imageStyleSummary), "imageStyleSummary should be saved");
      assert(Boolean(secondSnapshot.copywritingStyleSummary), "copywritingStyleSummary should be saved");
      assert(Boolean(secondSnapshot.differentiationAdvice), "differentiationAdvice should be saved");
      assert(Boolean(secondSnapshot.riskTips), "riskTips should be saved");
      assert(Boolean(secondSnapshot.nextStepAdvice), "nextStepAdvice should be saved");
      assert(Boolean(secondSnapshot.dataGapAdvice), "dataGapAdvice should be saved");
      assert(Boolean(secondSnapshot.uncertaintyNotes), "uncertaintyNotes should be saved");
      assert(String(secondSnapshot.nextStepAdvice).includes(rescoreNeedle), "rescore advice should remain advisory");
      assert(typeof secondSnapshot.riskHitCount === "number", "risk scan count should be present");
      pass("analysis snapshot generation", `first=${firstSnapshot.id}, second=${secondSnapshot.id}`);
    } catch (error) {
      fail("analysis snapshot generation", error instanceof Error ? error.message : String(error));
    }

    try {
      await markCompetitorAnalysisReference({ productId: product.id, snapshotId: secondSnapshot.id });
      const afterReference = await getCompetitorAnalysisSnapshots(product.id);
      assert(
        afterReference.snapshots.find((snapshot) => snapshot.id === secondSnapshot.id)?.isReference === true,
        "second snapshot should be reference version",
      );
      pass("reference snapshot marking", `snapshot=${secondSnapshot.id}`);
    } catch (error) {
      fail("reference snapshot marking", error instanceof Error ? error.message : String(error));
    }

    try {
      await archiveCompetitorAnalysisSnapshot({ productId: product.id, snapshotId: firstSnapshot.id });
      const afterArchive = await getCompetitorAnalysisSnapshots(product.id);
      assert(
        afterArchive.snapshots.find((snapshot) => snapshot.id === firstSnapshot.id)?.status === "archived",
        "first snapshot should be archived",
      );
      pass("snapshot archive", `snapshot=${firstSnapshot.id}`);
    } catch (error) {
      fail("snapshot archive", error instanceof Error ? error.message : String(error));
    }

    await prisma.aIProvider.update({ where: { id: provider.id }, data: { modelName: "thread04-fail-model" } });
    try {
      await generateCompetitorAnalysisSnapshot({ productId: product.id, competitorIds: selectedCompetitorIds });
      fail("AI failure isolation", "provider failure unexpectedly succeeded");
    } catch (error) {
      const failedSnapshot = await prisma.competitorAnalysisSnapshot.findFirst({
        where: { productId: product.id, status: "failed" },
        orderBy: { id: "desc" },
      });
      const errorSummary = failedSnapshot?.errorSummary ?? "";
      if (failedSnapshot && errorSummary.includes("[local-path-redacted]") && !errorSummary.includes("/secret/local/path")) {
        pass("AI failure isolation", error instanceof Error ? error.message : String(error));
      } else {
        fail("AI failure isolation", errorSummary || "failed snapshot was not saved");
      }
    }

    const afterProduct = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { status: true, updatedAt: true },
    });
    const afterScoreCount = await prisma.scoreSnapshot.count({ where: { productId: product.id } });
    try {
      assert(afterProduct.status === beforeProduct.status, "product status changed");
      assert(afterProduct.updatedAt.getTime() === beforeProduct.updatedAt.getTime(), "product updatedAt changed");
      assert(afterScoreCount === beforeScoreCount, "score snapshot count changed");
      pass("scoring and product boundary", `scoreSnapshots=${afterScoreCount}`);
    } catch (error) {
      fail("scoring and product boundary", error instanceof Error ? error.message : String(error));
    }

    const promptText = JSON.stringify(mock.calls);
    try {
      assert(!promptText.includes("thread04-secret-key-should-not-leak"), "prompt leaked API key");
      assert(!fullLocalPathPattern.test(promptText), "prompt included a full local path");
      assert(!promptText.includes("example.invalid/local-confirmed"), "prompt included source URL");
      assert(promptText.includes("manual-competitor-1"), "prompt did not include local competitor records");
      assert(promptText.includes("local-confirmed-link-draft"), "prompt did not include confirmed local link draft summary");
      pass("prompt privacy boundary", `aiCalls=${mock.calls.length}`);
    } catch (error) {
      fail("prompt privacy boundary", error instanceof Error ? error.message : String(error));
    }
  } finally {
    restoreEnv(envSnapshot);
    await cleanupAcceptanceData({
      productId,
      providerId,
      previousDefaultProviderIds: previousDefaultProviders.map((provider) => provider.id),
    });
    await mock.close();
    await prisma.$disconnect();
  }

  const failed = checks.filter((check) => check.status === "FAIL");
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
