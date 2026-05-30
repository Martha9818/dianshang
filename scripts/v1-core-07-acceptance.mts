import "dotenv/config";
import { createServer, type IncomingMessage } from "node:http";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "../src/lib/prisma";
import { createAIJob } from "../src/lib/services/ai/aiJobService";
import { validateJsonAIOutput } from "../src/lib/services/ai/aiOutputValidator";
import { logError, logInfo } from "../src/lib/services/logging/loggingService";
import { getLogsFilePath, inspectLocalRuntimeDirectories } from "../src/lib/services/local-paths/localPathsService";
import { getRuntimeModeSummary } from "../src/lib/services/runtime/runtimeService";
import { getDiagnosticsSnapshot } from "../src/lib/services/diagnostics/diagnosticsService";
import { createProduct, softDeleteProduct, updateProduct } from "../src/lib/services/product-mutation-service";
import type { ProductMutationInput } from "../src/lib/modules/products/form";
import {
  COMPETITOR_HEAT_METRIC_VALUES,
  COMPETITOR_PLATFORM_VALUES,
  TARGET_PLATFORM_VALUES,
} from "../src/lib/modules/products/constants";
import { createCompetitor, deleteCompetitor, updateCompetitor } from "../src/lib/services/competitor-service";
import { saveScoreSnapshot } from "../src/lib/services/scoring-service";
import {
  COPYWRITING_PLATFORMS,
  COPYWRITING_VERSIONS,
  type CopywritingPlatform,
  type CopywritingVersionCode,
} from "../src/lib/modules/copywriting/prompts";
import {
  generateMultiPlatformCopywritingPackage,
  markCopywritingAsUsed,
  saveManualCopywriting,
} from "../src/lib/services/copywriting-service";
import { createManualMaterial } from "../src/lib/services/material-service";
import { storeImageFile } from "../src/lib/services/images/imageStorageService";
import { createExcelExport } from "../src/lib/services/export-service";
import { createManualBackup } from "../src/lib/services/backup-service";
import { runManualInspirationScan } from "../src/lib/services/inspirations/inspirationScanService";
import { applyInspirationAiSuggestion, generateInspirationAiSuggestion } from "../src/lib/services/inspirations/inspirationAiService";
import { convertInspirationToProduct, ignoreInspiration } from "../src/lib/services/inspirations/inspirationService";
import { inspirationSuggestionSchema } from "../src/lib/services/inspirations/inspirationTypes";

const PREFIX = "V1_CORE_07_ACCEPTANCE_";
const projectRoot = process.cwd();
const tempRoot = path.join(projectRoot, ".tmp", "v1-core-07-acceptance");
const sourceFolder = path.join(tempRoot, "inspiration-source");
const directUploadDir = path.join("uploads", "v1-core-07-acceptance");

const createdProductIds: number[] = [];
const createdProviderIds: number[] = [];
const createdAiJobIds: number[] = [];
const createdAiRequestLogIds: number[] = [];
const createdInspirationIds: number[] = [];
const createdScanLogIds: number[] = [];
const createdExportLogIds: number[] = [];
const createdBackupLogIds: number[] = [];
const createdPaths = new Set<string>();

let previousInspirationFolderPath: string | null = null;
let hadInspirationFolderSetting = false;
let previousProviderDefaults: Array<{ id: number; isDefault: boolean }> = [];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function pass(label: string) {
  console.log(`PASS ${label}`);
}

function makeFile(buffer: Buffer, name: string, type = "image/png") {
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return new File([arrayBuffer], name, { type });
}

async function makePng(width: number, height: number, color: string) {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: color,
    },
  })
    .png()
    .toBuffer();
}

async function readRequestBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function buildCopywritingPayload() {
  return {
    platforms: COPYWRITING_PLATFORMS.map((platform) => ({
      platform,
      versions: COPYWRITING_VERSIONS.map((versionLabel) => ({
        versionLabel,
        title: `${PREFIX}${platform}-${versionLabel}-title`,
        body: `${PREFIX}${platform}-${versionLabel}-body`,
        sellingPoints: [`${PREFIX}${platform}-${versionLabel}-point`],
        tags: [`${PREFIX}${platform}-${versionLabel}-tag`],
      })),
    })),
  };
}

function buildInspirationPayload() {
  return {
    titleSuggestion: `${PREFIX}inspiration-title`,
    shortDescription: "A plain visual suggestion for acceptance only.",
    possibleCategory: "acceptance-category",
    visibleElements: ["simple object", "solid background"],
    useScenarios: ["manual review"],
    targetAudience: ["local operator"],
    sellingPoints: ["easy to inspect"],
    styleKeywords: ["clean"],
    uncertaintyNotes: ["AI suggestion is not a fact."],
  };
}

async function startAiStub() {
  const server = createServer(async (req, res) => {
    try {
      if (req.method !== "POST" || !req.url?.endsWith("/chat/completions")) {
        res.writeHead(404).end("not found");
        return;
      }

      const rawBody = await readRequestBody(req);
      const request = JSON.parse(rawBody) as {
        response_format?: { json_schema?: { name?: string } };
      };

      const schemaName = request.response_format?.json_schema?.name ?? "";
      const content = req.url.includes("/bad/")
        ? JSON.stringify({ invalid: true })
        : schemaName === "inspiration_suggestion"
          ? JSON.stringify(buildInspirationPayload())
          : JSON.stringify(buildCopywritingPayload());

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          choices: [{ message: { content } }],
          usage: { prompt_tokens: 32, completion_tokens: 48, total_tokens: 80 },
        }),
      );
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(error instanceof Error ? error.message : String(error));
    }
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address === "object", "AI stub did not start");

  return {
    baseUrl: `http://127.0.0.1:${address.port}/v1`,
    badBaseUrl: `http://127.0.0.1:${address.port}/bad/v1`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

function baseProductValues(name: string): ProductMutationInput {
  return {
    name,
    categoryLevel1: "Acceptance",
    categoryLevel2: "Regression",
    tags: ["acceptance", "v1-core"],
    targetUser: "local operator",
    targetPlatforms: [...TARGET_PLATFORM_VALUES],
    estimatedPrice: 39.9,
    estimatedCost: 10,
    estimatedShipping: 4,
    packagingCost: 1,
    sellingPoints: "Small safe regression product.",
    painPoints: "Needs repeatable final checks.",
    usageScenes: "Local Windows acceptance.",
    categoryRisk: "低风险",
    returnRisk: "低",
    explanationCost: "容易解释",
    contentVisualLevel: "高",
    sceneClarityLevel: "高",
    videoFitLevel: "适合",
    comparisonDemoLevel: "明显",
    notes: `${PREFIX}product-notes`,
  };
}

async function createAcceptanceProduct(image: Buffer) {
  const product = await createProduct({
    values: baseProductValues(`${PREFIX}product-${Date.now()}`),
    mainImage: makeFile(image, `${PREFIX}main.png`),
  });
  createdProductIds.push(product.id);

  const withImage = await prisma.product.findUnique({ where: { id: product.id } });
  assert(withImage, "Created product could not be reloaded");
  assert(withImage.mainImagePath?.startsWith("uploads/"), "Product main image was not stored as a relative uploads path");
  const mainImagePath = withImage.mainImagePath;
  assert(mainImagePath, "Product main image path is missing");
  assert(!/[A-Za-z]:\\/.test(mainImagePath), "Product main image exposed an absolute local path");

  await updateProduct(product.id, {
    values: {
      ...baseProductValues(`${PREFIX}product-updated-${Date.now()}`),
      estimatedPrice: 42.5,
    },
  });
  const updated = await prisma.product.findUnique({ where: { id: product.id }, select: { name: true, estimatedPrice: true } });
  assert(updated?.name.startsWith(`${PREFIX}product-updated`), "Product update did not persist");
  assert(updated, "Product update result is missing");
  assert(updated.estimatedPrice === 42.5, "Product cost/price fields did not persist");

  pass("MVP product create/update/main image");
  return product.id;
}

async function verifyCompetitors(productId: number) {
  const created = await createCompetitor({
    productId,
    values: {
      platform: COMPETITOR_PLATFORM_VALUES[0],
      title: `${PREFIX}competitor`,
      price: 29.9,
      heatMetricType: COMPETITOR_HEAT_METRIC_VALUES[0],
      heatMetricValue: 88,
      sellerName: `${PREFIX}seller`,
      link: null,
      sellingPoint: "simple",
      painPoint: "manual",
      imageStyle: "clean",
      dataDate: new Date("2026-05-30T00:00:00+08:00"),
      notes: PREFIX,
    },
  });

  const updated = await updateCompetitor({
    productId,
    competitorId: created.id,
    values: {
      platform: COMPETITOR_PLATFORM_VALUES[1],
      title: `${PREFIX}competitor-updated`,
      price: 31.5,
      heatMetricType: COMPETITOR_HEAT_METRIC_VALUES[1],
      heatMetricValue: 120,
      sellerName: null,
      link: null,
      sellingPoint: "updated",
      painPoint: "manual",
      imageStyle: "clean",
      dataDate: new Date("2026-05-30T00:00:00+08:00"),
      notes: PREFIX,
    },
  });
  assert(updated.title === `${PREFIX}competitor-updated`, "Competitor update did not persist");

  await deleteCompetitor(productId, created.id);
  const deleted = await prisma.competitor.findUnique({ where: { id: created.id } });
  assert(!deleted, "Competitor delete did not remove the row");
  pass("MVP competitor CRUD");
}

async function verifyScoring(productId: number) {
  const result = await saveScoreSnapshot(productId, {
    manualRegulatedRisk: false,
    manualInfringementRisk: false,
    manualRiskNotes: null,
  });

  assert(result.snapshot.id > 0, "ScoreSnapshot was not saved");
  assert(typeof result.evaluation.dimensions.totalScore === "number", "Score total was not calculated");
  assert(result.evaluation.recommendation.trim().length > 0, "Score recommendation is missing");
  pass("MVP scoring and ScoreSnapshot");
}

async function verifyImageSafety(productId: number, image: Buffer) {
  const material = await createManualMaterial({
    productId,
    platform: "xianyu",
    materialType: "main_image",
    file: makeFile(image, `${PREFIX}material.png`),
  });

  assert(material.fileHash && material.fileHash.length === 64, "Material fileHash was not saved");
  assert(material.thumbnailPath?.startsWith("uploads/"), "Material thumbnail was not generated");
  assert(material.sourceType === "own_photo", "Manual material sourceType was not saved");
  assert(material.usagePermission === "usable", "Manual material usagePermission was not saved");
  assert(!/[A-Za-z]:\\/.test(material.filePath), "Material file path exposed an absolute local path");

  const unsupportedResult = await storeImageFile({
    file: new File([Buffer.from("not image")], `${PREFIX}bad.txt`, { type: "text/plain" }),
    label: "unsupported acceptance image",
    relativePath: `${directUploadDir}/${PREFIX}bad.txt`,
  }).then(
    () => "unexpected-success",
    (error) => String(error instanceof Error ? error.message : error),
  );
  assert(unsupportedResult !== "unexpected-success", "Unsupported image format was accepted");

  const oversized = Buffer.alloc(10 * 1024 * 1024 + 1, 1);
  const oversizedResult = await storeImageFile({
    file: makeFile(oversized, `${PREFIX}large.png`),
    label: "oversized acceptance image",
    relativePath: `${directUploadDir}/${PREFIX}large.png`,
  }).then(
    () => "unexpected-success",
    (error) => String(error instanceof Error ? error.message : error),
  );
  assert(oversizedResult !== "unexpected-success", "Oversized image was accepted");
  pass("V1-Core-04 image safety");
}

async function createProvider(input: { name: string; baseUrl: string; isDefault?: boolean }) {
  const provider = await prisma.aIProvider.create({
    data: {
      name: `${PREFIX}${input.name}-${Date.now()}`,
      providerType: "openai-compatible",
      baseUrl: input.baseUrl,
      apiKey: `${PREFIX}stub-key`,
      modelName: "v1-core-07-stub-model",
      purpose: "acceptance",
      enabled: true,
      isDefault: input.isDefault ?? false,
    },
  });
  createdProviderIds.push(provider.id);
  return provider;
}

async function verifyAiAndCopywriting(productId: number, baseUrl: string, badBaseUrl: string) {
  const beforeFailureRows = await prisma.copywriting.count({ where: { productId } });
  const badProvider = await createProvider({ name: "bad-schema-provider", baseUrl: badBaseUrl });
  await generateMultiPlatformCopywritingPackage({ productId, providerId: badProvider.id }).then(
    () => {
      throw new Error("Invalid AI output was accepted");
    },
    () => undefined,
  );

  const afterFailureRows = await prisma.copywriting.count({ where: { productId } });
  assert(afterFailureRows === beforeFailureRows, "AI failure wrote copywriting rows");
  const failedJob = await prisma.aIJob.findFirst({
    where: { relatedProductId: productId, jobType: "copywriting_multi_platform", status: "failed" },
    orderBy: { createdAt: "desc" },
  });
  assert(failedJob, "Failed copywriting AIJob was not recorded");
  createdAiJobIds.push(failedJob.id);

  const provider = await createProvider({ name: "success-provider", baseUrl });
  const generated = await generateMultiPlatformCopywritingPackage({ productId, providerId: provider.id });
  assert(generated.records.length === COPYWRITING_PLATFORMS.length * COPYWRITING_VERSIONS.length, "Multi-platform package did not save all platform drafts");
  assert(COPYWRITING_PLATFORMS.every((platform) => generated.groupedRecords.some((group) => group.platform === platform)), "Missing platform group");
  createdAiJobIds.push(generated.aiJobId);

  const manual = await saveManualCopywriting({
    productId,
    providerId: null,
    platform: COPYWRITING_PLATFORMS[0] as CopywritingPlatform,
    version: "A" as CopywritingVersionCode,
    style: "manual",
    title: `${PREFIX}manual-title`,
    mainCopy: `${PREFIX}manual-body`,
    sellingPointsText: "manual point",
    tagsText: "manual-tag",
  });
  assert(manual.title === `${PREFIX}manual-title`, "Manual copywriting was not saved");

  const used = await markCopywritingAsUsed({
    productId,
    platform: manual.platform as CopywritingPlatform,
    copywritingId: manual.id,
    usageNote: `${PREFIX}used`,
  });
  assert(used.isUsedInListing, "Copywriting used mark was not saved");
  const usedCount = await prisma.copywriting.count({
    where: { productId, platform: manual.platform, isUsedInListing: true },
  });
  assert(usedCount === 1, "More than one used copywriting row exists for a product/platform");

  const promptValidation = validateJsonAIOutput(
    JSON.stringify({ bad: true }),
    {
      name: "acceptance_schema",
      validate(value: unknown): value is { ok: true } {
        return Boolean(value && typeof value === "object" && (value as { ok?: unknown }).ok === true);
      },
    },
  );
  assert(!promptValidation.success, "AI output schema validation did not reject invalid JSON");
  pass("V1-Core-03 and V1-Core-05 AI/copywriting");
}

async function verifyInspirationFlow(baseUrl: string, imageA: Buffer, imageB: Buffer) {
  const setting = await prisma.appSetting.findUnique({ where: { key: "inspirationFolderPath" } });
  hadInspirationFolderSetting = Boolean(setting);
  previousInspirationFolderPath = setting?.value ?? null;
  previousProviderDefaults = await prisma.aIProvider.findMany({ select: { id: true, isDefault: true } });

  await mkdir(sourceFolder, { recursive: true });
  await writeFile(path.join(sourceFolder, `${PREFIX}a.png`), imageA);
  await writeFile(path.join(sourceFolder, `${PREFIX}a-copy.png`), imageA);
  await writeFile(path.join(sourceFolder, `${PREFIX}b.png`), imageB);
  await writeFile(path.join(sourceFolder, `${PREFIX}too-large.png`), Buffer.alloc(10 * 1024 * 1024 + 1, 1));

  await prisma.appSetting.upsert({
    where: { key: "inspirationFolderPath" },
    create: { key: "inspirationFolderPath", value: sourceFolder },
    update: { value: sourceFolder },
  });

  const scan = await runManualInspirationScan();
  createdScanLogIds.push(scan.scanLog.id);
  assert(scan.totalFiles === 4, "Manual inspiration scan did not see the expected files");
  assert(scan.newFiles === 2, "Manual inspiration scan did not import the expected files");
  assert(scan.skippedDuplicates === 1, "Manual inspiration scan did not dedupe by fileHash");
  assert(scan.failedFiles === 1, "Manual inspiration scan did not record oversized image failure");

  const imported = await prisma.inspiration.findMany({
    where: { title: { startsWith: PREFIX } },
    orderBy: { id: "asc" },
  });
  createdInspirationIds.push(...imported.map((item) => item.id));
  assert(imported.length >= 2, "Imported inspiration drafts were not created");
  assert(imported.every((item) => item.usagePermission === "reference_only"), "Scanned inspirations were not reference-only");
  assert(imported.every((item) => item.sourceType === "folder_manual_scan"), "Scanned inspirations did not save sourceType");
  assert(imported.every((item) => item.imagePath.startsWith("uploads/")), "Inspiration image paths are not relative uploads paths");

  await prisma.aIProvider.updateMany({ data: { isDefault: false } });
  const provider = await createProvider({ name: "default-vision-provider", baseUrl, isDefault: true });
  const suggestion = await generateInspirationAiSuggestion(imported[0].id);
  assert(suggestion.titleSuggestion.startsWith(PREFIX), "Inspiration AI suggestion was not saved");
  const aiJob = await prisma.aIJob.findFirst({
    where: { relatedInspirationId: imported[0].id, status: "success" },
    orderBy: { createdAt: "desc" },
  });
  assert(aiJob, "Inspiration AIJob success was not recorded");
  createdAiJobIds.push(aiJob.id);

  await applyInspirationAiSuggestion(imported[0].id);
  const converted = await convertInspirationToProduct({
    inspirationId: imported[0].id,
    name: `${PREFIX}converted-product`,
    categoryLevel1: "Acceptance",
    targetUser: "manual reviewer",
    sellingPointsText: "confirmed by user",
    usageScenesText: "acceptance",
    tagsText: "converted",
    notes: "conversion requires manual confirmation",
  });
  createdProductIds.push(converted.id);

  const convertedInspiration = await prisma.inspiration.findUnique({ where: { id: imported[0].id } });
  assert(convertedInspiration?.status === "converted", "Inspiration was not marked converted");
  assert(convertedInspiration.convertedProductId === converted.id, "Converted product id was not linked");

  await ignoreInspiration(imported[1].id);
  const ignored = await prisma.inspiration.findUnique({ where: { id: imported[1].id } });
  assert(ignored?.status === "rejected", "Inspiration ignore flow did not persist as rejected");

  assert(provider.isDefault, "Default AI provider setup for inspiration acceptance failed");
  pass("V1-Core-06 inspiration scan, AI suggestion, reject, convert");
}

async function verifyDiagnostics() {
  const secret = "sk-V1CORE07SECRET000000";
  const localPath = "E:\\secret\\folder\\private.txt";
  const dbPath = "file:E:/secret/prisma/dev.db";
  const promptText = `${PREFIX}promptText: ${"full prompt ".repeat(20)}`;

  await logInfo(`${PREFIX}diagnostic info`);
  await logError(`apiKey=${secret} path=${localPath} db=${dbPath} ${promptText}\n    at secret (E:\\secret\\x.ts:1:2)`);

  await access(getLogsFilePath("app.log"));
  await access(getLogsFilePath("error.log"));

  const directories = await inspectLocalRuntimeDirectories({ autoCreate: true });
  assert(["uploads", "exports", "backups", "logs"].every((key) => directories.some((item) => item.key === key && item.exists)), "Local runtime directories were not available");

  const snapshot = await getDiagnosticsSnapshot();
  const markdown = snapshot.summaryMarkdown;
  assert(markdown.includes("appVersion"), "Diagnostics summary missing app version");
  assert(markdown.includes("runtimeMode"), "Diagnostics summary missing runtime");
  assert(markdown.includes("canConnect"), "Diagnostics summary missing database status");
  assert(markdown.includes("uploads/"), "Diagnostics summary missing directory status");
  assert(markdown.includes("products:"), "Diagnostics summary missing data counts");
  assert(markdown.includes("Recent Errors"), "Diagnostics summary missing recent errors");
  assert(!markdown.includes(secret), "Diagnostics summary leaked an API key");
  assert(!markdown.includes(localPath), "Diagnostics summary leaked a full local path");
  assert(!markdown.includes(dbPath), "Diagnostics summary leaked a full database path");
  assert(!markdown.includes("full prompt full prompt"), "Diagnostics summary leaked a full prompt");
  assert(!/\bat\s+.+:\d+:\d+/.test(markdown), "Diagnostics summary leaked a stack frame");
  pass("V1-Core-01/V1-Core-02 diagnostics and sanitization");
}

async function verifyVercelSimulation(productId: number, image: Buffer) {
  const previousVercel = process.env.VERCEL;
  const previousVercelEnv = process.env.VERCEL_ENV;
  const before = {
    aiJobs: await prisma.aIJob.count(),
    materials: await prisma.material.count({ where: { productId } }),
    scanLogs: await prisma.scanLog.count(),
    copywritings: await prisma.copywriting.count({ where: { productId } }),
  };

  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "preview";
  try {
    const runtime = getRuntimeModeSummary();
    assert(runtime.mode === "preview" && !runtime.isWritable, "Vercel simulation was not read-only");

    await createAIJob({ jobType: "acceptance_preview", inputSummary: PREFIX }).then(
      () => {
        throw new Error("Vercel simulation allowed AIJob creation");
      },
      () => undefined,
    );
    await createManualMaterial({
      productId,
      platform: "xianyu",
      materialType: "main_image",
      file: makeFile(image, `${PREFIX}preview.png`),
    }).then(
      () => {
        throw new Error("Vercel simulation allowed upload/material write");
      },
      () => undefined,
    );
    await generateMultiPlatformCopywritingPackage({ productId }).then(
      () => {
        throw new Error("Vercel simulation allowed real AI copywriting");
      },
      () => undefined,
    );
    await runManualInspirationScan().then(
      () => {
        throw new Error("Vercel simulation allowed inspiration scan");
      },
      () => undefined,
    );

    const previewSnapshot = await getDiagnosticsSnapshot();
    assert(previewSnapshot.app.runtimeMode === "vercel", "Diagnostics did not show Vercel mode");
    assert(!previewSnapshot.app.isWritableRuntime, "Diagnostics showed Vercel as writable");
    assert(previewSnapshot.database.canConnect === false, "Preview diagnostics connected to local SQLite");
    assert(previewSnapshot.images.uploadsSummary.includes("readonly"), "Preview diagnostics did not keep uploads readonly");
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

  const after = {
    aiJobs: await prisma.aIJob.count(),
    materials: await prisma.material.count({ where: { productId } }),
    scanLogs: await prisma.scanLog.count(),
    copywritings: await prisma.copywriting.count({ where: { productId } }),
  };
  assert(JSON.stringify(before) === JSON.stringify(after), "Vercel simulation changed local data counts");
  pass("Vercel read-only simulation");
}

async function verifyExportBackupAndSoftDelete(productId: number) {
  const exportLog = await createExcelExport();
  createdExportLogIds.push(exportLog.id);
  assert(exportLog.filePath.includes("exports"), "Excel export did not write under exports");
  assert(!/[A-Za-z]:\\/.test(exportLog.fileName), "Excel export fileName exposed an absolute path");

  const backupLog = await createManualBackup();
  createdBackupLogIds.push(backupLog.id);
  assert(backupLog.backupPath.includes("backups"), "Manual backup did not write under backups");

  await softDeleteProduct(productId);
  const deleted = await prisma.product.findUnique({ where: { id: productId }, select: { deletedAt: true } });
  assert(deleted?.deletedAt, "Product soft delete did not set deletedAt");
  pass("MVP export, backup, and soft delete");
}

async function collectCreatedLogIds() {
  const [jobs, logs] = await Promise.all([
    prisma.aIJob.findMany({
      where: {
        OR: [
          { inputSummary: { contains: PREFIX } },
          { resultSummary: { contains: PREFIX } },
          { errorSummary: { contains: PREFIX } },
          { relatedProductId: { in: createdProductIds } },
          { relatedInspirationId: { in: createdInspirationIds } },
        ],
      },
      select: { id: true },
    }),
    prisma.aIRequestLog.findMany({
      where: {
        OR: [
          { inputSummary: { contains: PREFIX } },
          { errorSummary: { contains: PREFIX } },
          { relatedProductId: { in: createdProductIds } },
          { relatedInspirationId: { in: createdInspirationIds } },
        ],
      },
      select: { id: true },
    }),
  ]);

  for (const job of jobs) createdAiJobIds.push(job.id);
  for (const log of logs) createdAiRequestLogIds.push(log.id);
}

async function cleanup() {
  await collectCreatedLogIds().catch(() => undefined);

  const uniqueProductIds = [...new Set(createdProductIds)].reverse();
  const uniqueInspirationIds = [...new Set(createdInspirationIds)].reverse();
  const uniqueAiJobIds = [...new Set(createdAiJobIds)].reverse();
  const uniqueAiRequestLogIds = [...new Set(createdAiRequestLogIds)].reverse();

  for (const id of uniqueAiRequestLogIds) {
    await prisma.aIRequestLog.deleteMany({ where: { id } });
  }

  for (const id of uniqueInspirationIds) {
    const row = await prisma.inspiration.findUnique({ where: { id } });
    if (row?.imagePath) createdPaths.add(row.imagePath);
    if (row?.thumbnailPath) createdPaths.add(row.thumbnailPath);
  }

  for (const id of uniqueInspirationIds) {
    await prisma.inspiration.deleteMany({ where: { id } });
  }

  for (const id of uniqueProductIds) {
    const rows = await prisma.material.findMany({ where: { productId: id }, select: { filePath: true, thumbnailPath: true } });
    for (const row of rows) {
      createdPaths.add(row.filePath);
      if (row.thumbnailPath) createdPaths.add(row.thumbnailPath);
    }
    const product = await prisma.product.findUnique({ where: { id }, select: { mainImagePath: true } });
    if (product?.mainImagePath) createdPaths.add(product.mainImagePath);

    await prisma.operationLog.deleteMany({ where: { productId: id } });
    await prisma.material.deleteMany({ where: { productId: id } });
    await prisma.promptTask.deleteMany({ where: { productId: id } });
    await prisma.copywriting.deleteMany({ where: { productId: id } });
    await prisma.scoreSnapshot.deleteMany({ where: { productId: id } });
    await prisma.competitor.deleteMany({ where: { productId: id } });
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.product.deleteMany({ where: { id, name: { startsWith: PREFIX } } });
  }

  for (const id of uniqueAiJobIds) {
    await prisma.aIJob.deleteMany({ where: { id } });
  }

  for (const id of createdScanLogIds.reverse()) {
    await prisma.scanLog.deleteMany({ where: { id } });
  }

  for (const id of createdExportLogIds.reverse()) {
    const row = await prisma.exportLog.findUnique({ where: { id } });
    if (row?.filePath && row.fileName.includes(PREFIX)) {
      await rm(row.filePath, { force: true }).catch(() => undefined);
    }
    await prisma.exportLog.deleteMany({ where: { id, fileName: { contains: PREFIX } } });
  }

  for (const id of createdBackupLogIds.reverse()) {
    const row = await prisma.backupLog.findUnique({ where: { id } });
    if (row?.backupPath && row.backupPath.includes(PREFIX)) {
      await rm(row.backupPath, { recursive: true, force: true }).catch(() => undefined);
    }
    await prisma.backupLog.deleteMany({ where: { id } });
  }

  for (const id of createdProviderIds.reverse()) {
    await prisma.aIProvider.deleteMany({ where: { id } });
  }

  if (previousProviderDefaults.length > 0) {
    await prisma.aIProvider.updateMany({ data: { isDefault: false } });
    for (const provider of previousProviderDefaults) {
      await prisma.aIProvider.updateMany({ where: { id: provider.id }, data: { isDefault: provider.isDefault } });
    }
  }

  if (hadInspirationFolderSetting) {
    await prisma.appSetting.update({
      where: { key: "inspirationFolderPath" },
      data: { value: previousInspirationFolderPath ?? "" },
    });
  } else {
    await prisma.appSetting.deleteMany({ where: { key: "inspirationFolderPath" } });
  }

  for (const relativePath of createdPaths) {
    if (!relativePath.startsWith("uploads/")) continue;
    const absolutePath = path.join(projectRoot, relativePath);
    await rm(absolutePath, { force: true }).catch(() => undefined);
  }

  if (tempRoot.includes("v1-core-07-acceptance")) {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function main() {
  await cleanup();

  const imageA = await makePng(8, 8, "#f97316");
  const imageB = await makePng(9, 9, "#2563eb");
  const aiStub = await startAiStub();

  try {
    const productId = await createAcceptanceProduct(imageA);
    await verifyCompetitors(productId);
    await verifyScoring(productId);
    await verifyDiagnostics();
    await verifyImageSafety(productId, imageA);
    await verifyAiAndCopywriting(productId, aiStub.baseUrl, aiStub.badBaseUrl);
    await verifyInspirationFlow(aiStub.baseUrl, imageA, imageB);
    await verifyVercelSimulation(productId, imageA);
    await verifyExportBackupAndSoftDelete(productId);

    const suggestionValidation = validateJsonAIOutput(JSON.stringify(buildInspirationPayload()), inspirationSuggestionSchema);
    assert(suggestionValidation.success, "Inspiration suggestion schema did not accept valid output");

    console.log("V1-Core-07 acceptance passed.");
  } finally {
    await aiStub.close();
    await cleanup();
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error("V1-Core-07 acceptance failed:");
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
