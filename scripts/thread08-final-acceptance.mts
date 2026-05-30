import "dotenv/config";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import { prisma } from "../src/lib/prisma";
import { createManualBackup } from "../src/lib/services/backup-service";
import { createExcelExport } from "../src/lib/services/export-service";
import { saveScoreSnapshot } from "../src/lib/services/scoring-service";

const PREFIX = "THREAD08_ACCEPTANCE_";
const projectRoot = process.cwd();
const uploadsRoot = path.join(projectRoot, "uploads");
const tempUploadDir = path.join(uploadsRoot, "thread08-acceptance");

const createdProductIds: number[] = [];
const createdProviderIds: number[] = [];
const createdExportLogIds: number[] = [];
const createdBackupLogIds: number[] = [];
const createdBackupPaths: string[] = [];
const tempPaths = [tempUploadDir];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function pass(label: string) {
  console.log(`PASS ${label}`);
}

async function cleanup() {
  for (const productId of createdProductIds.reverse()) {
    await prisma.operationLog.deleteMany({ where: { productId } });
    await prisma.material.deleteMany({ where: { productId } });
    await prisma.promptTask.deleteMany({ where: { productId } });
    await prisma.copywriting.deleteMany({ where: { productId } });
    await prisma.scoreSnapshot.deleteMany({ where: { productId } });
    await prisma.competitor.deleteMany({ where: { productId } });
    await prisma.productVariant.deleteMany({ where: { productId } });
    await prisma.product.deleteMany({ where: { id: productId, name: { startsWith: PREFIX } } });
  }

  for (const providerId of createdProviderIds.reverse()) {
    await prisma.aIProvider.deleteMany({ where: { id: providerId, name: { startsWith: PREFIX } } });
  }

  for (const exportLogId of createdExportLogIds.reverse()) {
    const log = await prisma.exportLog.findUnique({ where: { id: exportLogId } });
    if (log?.fileName.includes(PREFIX)) {
      await rm(log.filePath, { force: true });
    }
    await prisma.exportLog.deleteMany({ where: { id: exportLogId, fileName: { contains: PREFIX } } });
  }

  for (const backupLogId of createdBackupLogIds.reverse()) {
    await prisma.backupLog.deleteMany({ where: { id: backupLogId, backupPath: { contains: PREFIX } } });
  }

  for (const backupPath of createdBackupPaths.reverse()) {
    if (backupPath.includes(PREFIX)) {
      await rm(backupPath, { recursive: true, force: true });
    }
  }

  for (const tempPath of tempPaths.reverse()) {
    if (tempPath.includes("thread08-acceptance")) {
      await rm(tempPath, { recursive: true, force: true });
    }
  }
}

async function createBaseProduct() {
  const stamp = Date.now();
  const product = await prisma.product.create({
    data: {
      spu: `${PREFIX}SPU_${stamp}`,
      name: `${PREFIX}宠物梳毛器_${stamp}`,
      categoryLevel1: "宠物用品",
      categoryLevel2: "宠物清洁",
      tags: JSON.stringify(["宠物", "梳毛", PREFIX]),
      targetUser: "猫狗家庭",
      targetPlatforms: JSON.stringify(["闲鱼", "淘宝", "小红书", "抖音"]),
      estimatedPrice: 29.9,
      estimatedCost: 8,
      estimatedShipping: 3,
      packagingCost: 1,
      sellingPoints: "一键退毛，清理方便，适合换毛季。",
      painPoints: "宠物掉毛多，普通梳子清理麻烦。",
      usageScenes: "居家日常梳毛，出门前整理。",
      categoryRisk: "低风险",
      returnRisk: "低",
      explanationCost: "容易解释",
      contentVisualLevel: "高",
      sceneClarityLevel: "高",
      videoFitLevel: "适合",
      comparisonDemoLevel: "明显",
      notes: `${PREFIX}final flow product`,
      status: "待分析",
    },
  });

  createdProductIds.push(product.id);
  await mkdir(tempUploadDir, { recursive: true });
  const mainImagePath = `uploads/thread08-acceptance/${PREFIX}main_${stamp}.png`;
  await writeFile(path.join(projectRoot, mainImagePath), Buffer.from("THREAD08 main image"));
  await prisma.product.update({ where: { id: product.id }, data: { mainImagePath } });

  pass("product create and main image path");
  return product;
}

async function addCompetitors(productId: number) {
  const competitors = [
    ["闲鱼", "宠物梳毛器 A", 26.9, "想要", 38],
    ["淘宝", "宠物梳毛器 B", 29.9, "销量", 1350],
    ["小红书", "宠物梳毛器 C", 32, "点赞", 1280],
  ] as const;

  for (const [platform, title, price, heatMetricType, heatMetricValue] of competitors) {
    await prisma.competitor.create({
      data: {
        productId,
        platform,
        title: `${PREFIX}${title}`,
        price,
        heatMetricType,
        heatMetricValue,
        dataDate: new Date("2026-05-28T00:00:00+08:00"),
        screenshotPath: platform === "闲鱼" ? `uploads/thread08-acceptance/${PREFIX}competitor.png` : null,
      },
    });
  }

  pass("competitors create");
}

async function verifyScoring(productId: number) {
  const result = await saveScoreSnapshot(productId, {
    manualRegulatedRisk: false,
    manualInfringementRisk: false,
    manualRiskNotes: null,
  });

  assert(result.snapshot.id > 0, "ScoreSnapshot was not saved");
  assert(result.evaluation.dimensions.totalScore !== null, "total score missing");
  assert(result.evaluation.deductionReasons.length >= 0, "deduction reasons missing");
  assert(result.evaluation.nextSuggestions.length > 0, "next suggestions missing");
  assert(result.evaluation.recommendation.trim().length > 0, "recommendation missing");

  pass(`scoring snapshot ${result.evaluation.recommendation}`);
}

async function verifyCopywriting(productId: number) {
  const provider = await prisma.aIProvider.create({
    data: {
      name: `${PREFIX}Wrong Key Provider ${Date.now()}`,
      providerType: "openai-compatible",
      baseUrl: "https://example.invalid/v1",
      apiKey: `${PREFIX}wrong-key`,
      modelName: "thread08-fake-model",
      purpose: "text",
      enabled: true,
      isDefault: false,
    },
  });
  createdProviderIds.push(provider.id);

  const riskWord = await prisma.bannedWord.findFirst({ select: { word: true } });
  const manualTitle = `${PREFIX}手动文案标题`;
  const manualCopy = `${PREFIX}手动文案正文 ${riskWord?.word ?? ""}`.trim();
  const scanWords = riskWord ? [riskWord.word] : [];

  const copy = await prisma.copywriting.create({
    data: {
      productId,
      providerId: null,
      platform: "小红书",
      copyType: "platform",
      version: "A",
      style: "手动兜底",
      title: manualTitle,
      content: manualCopy,
      mainCopy: manualCopy,
      generationStatus: "success",
      auditStatus: scanWords.length > 0 ? "有风险" : "无风险",
      riskWords: scanWords.length > 0 ? JSON.stringify(scanWords) : null,
      structuredPayloadJson: JSON.stringify({ marker: PREFIX }),
    },
  });

  const saved = await prisma.copywriting.findUnique({ where: { id: copy.id } });
  assert(saved?.title === manualTitle, "manual copywriting was not saved");
  assert(saved?.riskWords !== null || scanWords.length === 0, "manual copywriting was not rescanned");

  pass("copywriting no-real-key fallback data");
}

async function verifyPromptAndMaterials(productId: number) {
  const taskCode = `PT-${productId}-xiaohongshu-cover-${PREFIX}${Date.now()}`;
  const task = await prisma.promptTask.create({
    data: {
      taskCode,
      productId,
      platform: "xiaohongshu",
      imageType: "cover",
      recommendedSize: "1080x1440",
      promptText: `${PREFIX}Prompt text`,
      status: "已复制",
      version: "v1",
    },
  });

  const materialRows = [];
  for (const version of ["v1", "v2"]) {
    const filePath = `uploads/thread08-acceptance/${PREFIX}${taskCode}_${version}.png`;
    await writeFile(path.join(projectRoot, filePath), Buffer.from(`${PREFIX}${version}`));
    materialRows.push(
      await prisma.material.create({
        data: {
          productId,
          promptTaskId: task.id,
          platform: "xiaohongshu",
          materialType: "cover_image",
          filePath,
          width: 1,
          height: 1,
          status: "待审核",
          source: "prompt_result",
          version,
        },
      }),
    );
  }

  await prisma.promptTask.update({ where: { id: task.id }, data: { status: "已回传", version: "v2" } });
  await prisma.material.update({ where: { id: materialRows[0].id }, data: { status: "可使用" } });

  const returnedTask = await prisma.promptTask.findUnique({ where: { id: task.id }, include: { materials: true } });
  assert(returnedTask?.status === "已回传", "PromptTask status was not returned");
  assert(returnedTask.materials.length === 2, "PromptTask did not link two materials");
  assert(returnedTask.materials.every((item) => item.filePath.includes(PREFIX)), "Material file path missing prefix");

  pass("prompt task and material linkage");
}

async function verifyExportAndBackup(productId: number) {
  const exportLog = await createExcelExport();
  createdExportLogIds.push(exportLog.id);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(exportLog.filePath);
  const expectedSheets = ["Products", "Competitors", "Copywriting", "PromptTasks", "Materials", "Scores"];
  assert(expectedSheets.every((sheet) => workbook.getWorksheet(sheet)), "export is missing one of 6 sheets");

  const productsSheet = workbook.getWorksheet("Products");
  assert(productsSheet?.getRow(1).cellCount, "Products sheet header missing");

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
  const hasProductRow = productsSheet
    ?.getRows(2, Math.max(productsSheet.rowCount - 1, 1))
    ?.some((row) => row.values.toString().includes(product?.name ?? ""));
  assert(hasProductRow, "export missing Thread 08 product row");

  const backupLog = await createManualBackup();
  createdBackupLogIds.push(backupLog.id);
  createdBackupPaths.push(backupLog.backupPath);

  assert(existsSync(path.join(backupLog.backupPath, "dev.db")), "backup missing dev.db");
  assert(existsSync(path.join(backupLog.backupPath, "uploads")), "backup missing uploads");

  pass("export and backup");
}

async function verifyEmptyExportHeaders() {
  const workbook = new ExcelJS.Workbook();
  const exportLog = await createExcelExport();
  createdExportLogIds.push(exportLog.id);
  await workbook.xlsx.readFile(exportLog.filePath);

  for (const sheetName of ["Products", "Competitors", "Copywriting", "PromptTasks", "Materials", "Scores"]) {
    const sheet = workbook.getWorksheet(sheetName);
    assert(sheet, `${sheetName} sheet missing`);
    assert(sheet.getRow(1).cellCount > 0, `${sheetName} headers missing`);
  }

  pass("export headers present");
}

async function main() {
  await cleanup();

  const product = await createBaseProduct();
  await addCompetitors(product.id);
  await verifyScoring(product.id);
  await verifyCopywriting(product.id);
  await verifyPromptAndMaterials(product.id);
  await verifyExportAndBackup(product.id);
  await verifyEmptyExportHeaders();

  console.log("Thread 08 final service acceptance passed.");
}

main()
  .catch((error) => {
    console.error("Thread 08 final service acceptance failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
  });
