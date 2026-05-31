import "dotenv/config";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { prisma } from "../src/lib/prisma";
import { createManualBackup } from "../src/lib/services/backup-service";
import { createExcelExport, getExportDirectory } from "../src/lib/services/export-service";

const projectRoot = process.cwd();
const uploadsDir = path.join(projectRoot, "uploads", "thread07-acceptance");
const sqlitePath = path.join(projectRoot, "prisma", "dev.db");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function rowValues(row: ExcelJS.Row) {
  return Array.isArray(row.values) ? row.values : Object.values(row.values);
}

function readRowObject(worksheet: ExcelJS.Worksheet, rowNumber: number) {
  const headers = rowValues(worksheet.getRow(1)).slice(1).map(String);
  const values = rowValues(worksheet.getRow(rowNumber)).slice(1);
  return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
}

async function cleanupByProductName(productName: string) {
  const products = await prisma.product.findMany({
    where: { name: productName },
    select: { id: true },
  });

  for (const product of products) {
    await prisma.operationLog.deleteMany({ where: { productId: product.id } });
    await prisma.material.deleteMany({ where: { productId: product.id } });
    await prisma.promptTask.deleteMany({ where: { productId: product.id } });
    await prisma.copywriting.deleteMany({ where: { productId: product.id } });
    await prisma.scoreSnapshot.deleteMany({ where: { productId: product.id } });
    await prisma.competitor.deleteMany({ where: { productId: product.id } });
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
  }
}

async function main() {
  const productName = "Thread07 验收商品";
  const taskCode = `T07-${Date.now()}`;
  const materialPath = "uploads/thread07-acceptance/material.png";
  const screenshotPath = "uploads/thread07-acceptance/competitor.png";

  await cleanupByProductName(productName);
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, "material.png"), "thread07-material");
  await writeFile(path.join(uploadsDir, "competitor.png"), "thread07-competitor");

  const product = await prisma.product.create({
    data: {
      spu: `T07-${Date.now()}`,
      name: productName,
      categoryLevel1: "家居",
      categoryLevel2: "收纳",
      tags: JSON.stringify(["轻便", "测试"]),
      targetUser: "租房人群",
      targetPlatforms: JSON.stringify(["淘宝", "小红书"]),
      estimatedPrice: 199,
      estimatedCost: 80,
      estimatedShipping: 12,
      packagingCost: 3,
      notes: "Thread 07 Excel 内容验收",
      status: "建议测试",
    },
  });

  await prisma.competitor.create({
    data: {
      productId: product.id,
      platform: "淘宝",
      title: "竞品标题 T07",
      price: 188,
      heatMetricType: "销量",
      heatMetricValue: 4567,
      sellingPoint: "可折叠",
      painPoint: "尺寸偏小",
      dataDate: new Date("2026-05-20T00:00:00+08:00"),
      link: "https://example.com/thread07-competitor",
      screenshotPath,
      notes: "竞品备注 T07",
    },
  });

  await prisma.copywriting.create({
    data: {
      productId: product.id,
      platform: "小红书",
      copyType: "种草文案",
      version: "A",
      style: "轻松",
      title: "文案标题 T07",
      content: "文案正文 T07",
      auditStatus: "通过",
      riskWords: "无",
    },
  });

  const promptTask = await prisma.promptTask.create({
    data: {
      taskCode,
      productId: product.id,
      platform: "小红书",
      imageType: "主图",
      recommendedSize: "3:4",
      promptText: "Prompt 内容 T07",
      status: "已回传",
      version: "v1",
    },
  });

  await prisma.material.create({
    data: {
      productId: product.id,
      promptTaskId: promptTask.id,
      platform: "小红书",
      materialType: "主图",
      filePath: materialPath,
      width: 1200,
      height: 1600,
      status: "可使用",
      source: "prompt_result",
      version: "v1",
    },
  });

  await prisma.scoreSnapshot.create({
    data: {
      productId: product.id,
      totalScore: 86,
      demandScore: 18,
      profitScore: 17,
      afterSalesScore: 16,
      competitionScore: 15,
      supplierScore: 10,
      contentScore: 10,
      recommendation: "建议测试",
      deductionReasons: "竞争略强",
      nextSuggestions: "先小批量测试",
    },
  });

  const exportLog = await createExcelExport();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(exportLog.filePath);

  const productsSheet = workbook.getWorksheet("Products");
  const competitorsSheet = workbook.getWorksheet("Competitors");
  const copywritingSheet = workbook.getWorksheet("Copywriting");
  const promptTasksSheet = workbook.getWorksheet("PromptTasks");
  const materialsSheet = workbook.getWorksheet("Materials");
  const scoresSheet = workbook.getWorksheet("Scores");

  assert(productsSheet, "Products Sheet missing");
  assert(competitorsSheet, "Competitors Sheet missing");
  assert(copywritingSheet, "Copywriting Sheet missing");
  assert(promptTasksSheet, "PromptTasks Sheet missing");
  assert(materialsSheet, "Materials Sheet missing");
  assert(scoresSheet, "Scores Sheet missing");

  const productRows = productsSheet.getRows(2, productsSheet.rowCount - 1) ?? [];
  const productRowNumber = productRows.find((row) => row.getCell(2).value === productName)?.number;
  assert(productRowNumber, "Product row missing");
  const productRow = readRowObject(productsSheet, productRowNumber);
  assert(productRow["商品名称"] === productName, "Product name mismatch");
  assert(productRow["一级类目"] === "家居", "Product category mismatch");
  assert(productRow["商品标签"] === "轻便, 测试", "Product tags mismatch");
  assert(productRow["预估净利润"] === 104, "Product net profit mismatch");
  assert(productRow["利润率"] === "52.26%", "Product profit rate mismatch");
  assert(productRow["商品总分"] === 86, "Product score mismatch");

  const competitorRows = competitorsSheet.getRows(2, competitorsSheet.rowCount - 1) ?? [];
  const competitorRowNumber = competitorRows.find((row) => row.getCell(3).value === productName)?.number;
  assert(competitorRowNumber, "Competitor row missing");
  const competitorRow = readRowObject(competitorsSheet, competitorRowNumber);
  assert(competitorRow["竞品标题"] === "竞品标题 T07", "Competitor title mismatch");
  assert(competitorRow["热度指标数值"] === 4567, "Competitor heat mismatch");
  assert(competitorRow["截图路径"] === screenshotPath, "Competitor screenshot path mismatch");

  const copyRows = copywritingSheet.getRows(2, copywritingSheet.rowCount - 1) ?? [];
  const copyRowNumber = copyRows.find((row) => row.getCell(3).value === productName)?.number;
  assert(copyRowNumber, "Copywriting row missing");
  const copyRow = readRowObject(copywritingSheet, copyRowNumber);
  assert(copyRow["标题"] === "文案标题 T07", "Copywriting title mismatch");
  assert(copyRow["正文"] === "文案正文 T07", "Copywriting content mismatch");

  const taskRows = promptTasksSheet.getRows(2, promptTasksSheet.rowCount - 1) ?? [];
  const taskRowNumber = taskRows.find((row) => row.getCell(1).value === taskCode)?.number;
  assert(taskRowNumber, "PromptTask row missing");
  const taskRow = readRowObject(promptTasksSheet, taskRowNumber);
  assert(taskRow["Prompt 摘要"] === "已生成 Prompt（完整内容请在本地 Prompt 任务页查看）", "Prompt summary mismatch");
  assert(taskRow["推荐尺寸"] === "3:4", "Prompt size mismatch");

  const materialRows = materialsSheet.getRows(2, materialsSheet.rowCount - 1) ?? [];
  const materialRowNumber = materialRows.find((row) => row.getCell(3).value === productName)?.number;
  assert(materialRowNumber, "Material row missing");
  const materialRow = readRowObject(materialsSheet, materialRowNumber);
  assert(materialRow["关联 Task ID"] === taskCode, "Material task code mismatch");
  assert(materialRow["文件路径"] === materialPath, "Material path mismatch");
  assert(materialRow["宽度"] === 1200, "Material width mismatch");
  assert(materialRow["高度"] === 1600, "Material height mismatch");

  const scoreRows = scoresSheet.getRows(2, scoresSheet.rowCount - 1) ?? [];
  const scoreRowNumber = scoreRows.find((row) => row.getCell(3).value === productName)?.number;
  assert(scoreRowNumber, "Score row missing");
  const scoreRow = readRowObject(scoresSheet, scoreRowNumber);
  assert(scoreRow["商品总分"] === 86, "Score total mismatch");
  assert(scoreRow["扣分原因"] === "竞争略强", "Score deduction mismatch");
  assert(scoreRow["下一步建议"] === "先小批量测试", "Score suggestion mismatch");

  const hadWalBeforeBackup = existsSync(`${sqlitePath}-wal`);
  const hadShmBeforeBackup = existsSync(`${sqlitePath}-shm`);
  const backupLog = await createManualBackup();

  assert(existsSync(path.join(backupLog.backupPath, "dev.db")), "Backup database missing");
  if (hadWalBeforeBackup) {
    assert(existsSync(path.join(backupLog.backupPath, "dev.db-wal")), "Backup WAL missing");
  }
  if (hadShmBeforeBackup) {
    assert(existsSync(path.join(backupLog.backupPath, "dev.db-shm")), "Backup SHM missing");
  }
  assert(existsSync(path.join(backupLog.backupPath, "uploads")), "Backup uploads missing");

  const failedLog = await prisma.exportLog.create({
    data: {
      fileName: "EcomPilot_Export_20260528_0000.xlsx",
      filePath: path.join(getExportDirectory(), "EcomPilot_Export_20260528_0000.xlsx"),
      includedSheets: "Products",
      status: "失败",
      errorMessage: "Thread 07 failed download test",
    },
  });

  const traversalLog = await prisma.exportLog.create({
    data: {
      fileName: "EcomPilot_Export_20260528_0001.xlsx",
      filePath: path.join(projectRoot, "package.json"),
      includedSheets: "Products",
      status: "成功",
    },
  });

  const missingFileLog = await prisma.exportLog.create({
    data: {
      fileName: "EcomPilot_Export_20260528_0002.xlsx",
      filePath: path.join(getExportDirectory(), "EcomPilot_Export_20260528_0002.xlsx"),
      includedSheets: "Products",
      status: "成功",
    },
  });

  const unsafeNameLog = await prisma.exportLog.create({
    data: {
      fileName: "../unsafe.xlsx",
      filePath: path.join(getExportDirectory(), "../unsafe.xlsx"),
      includedSheets: "Products",
      status: "成功",
    },
  });

  await rm(uploadsDir, { recursive: true, force: true });
  await cleanupByProductName(productName);

  console.log(
    JSON.stringify(
      {
        exportLogId: exportLog.id,
        exportFileName: exportLog.fileName,
        exportFilePath: exportLog.filePath,
        backupLogId: backupLog.id,
        backupPath: backupLog.backupPath,
        backupSidecars: {
          walExistedBeforeBackup: hadWalBeforeBackup,
          walCopied: existsSync(path.join(backupLog.backupPath, "dev.db-wal")),
          shmExistedBeforeBackup: hadShmBeforeBackup,
          shmCopied: existsSync(path.join(backupLog.backupPath, "dev.db-shm")),
        },
        downloadTestIds: {
          success: exportLog.id,
          failed: failedLog.id,
          traversal: traversalLog.id,
          missing: missingFileLog.id,
          unsafeName: unsafeNameLog.id,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
