import ExcelJS from "exceljs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { computeEstimatedNetProfit, formatDateTime } from "@/lib/modules/products";
import { getRuntimeModeSummary, normalizeProductReadError, normalizeProductWriteError } from "@/lib/services/product-runtime-service";
import { ExportReadonlyError } from "@/lib/services/thread07-errors";

const EXPORT_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "exports");
const SHEET_NAMES = ["Products", "Competitors", "Copywriting", "PromptTasks", "Materials", "Scores"] as const;

export type ExportSettings = {
  includeCopywritingContent?: boolean;
  includeImagePaths?: boolean;
};

type SheetColumn<T> = {
  header: string;
  key: keyof T;
  width?: number;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function buildTimestamp(date = new Date()) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function formatNullableDate(value: Date | null | undefined) {
  return value ? formatDateTime(value) : "";
}

function formatJsonArrayText(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join(", ") : value;
  } catch {
    return value;
  }
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "";
  }

  return `${(value * 100).toFixed(2)}%`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message.trim() ? error.message : "未知错误";
}

function addSheet<T extends Record<string, unknown>>(workbook: ExcelJS.Workbook, name: string, columns: SheetColumn<T>[], rows: T[]) {
  const worksheet = workbook.addWorksheet(name);
  worksheet.columns = columns.map((column) => ({
    header: column.header,
    key: String(column.key),
    width: column.width ?? Math.max(column.header.length + 6, 14),
  }));

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: "middle" };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  rows.forEach((row) => worksheet.addRow(row));
}

export function getExportDirectory() {
  return EXPORT_DIR;
}

export function isSafeExportFileName(fileName: string) {
  return /^EcomPilot_Export_\d{8}_\d{4}\.xlsx$/.test(fileName);
}

export async function getRecentExportLogs(limit = 8) {
  try {
    return await prisma.exportLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function getExportLogById(id: number) {
  try {
    return await prisma.exportLog.findUnique({ where: { id } });
  } catch (error) {
    throw normalizeProductReadError(error);
  }
}

export async function createExcelExport(settings: ExportSettings = {}) {
  const runtime = getRuntimeModeSummary();

  if (!runtime.isWritable) {
    throw new ExportReadonlyError();
  }

  const includeCopywritingContent = settings.includeCopywritingContent !== false;
  const includeImagePaths = settings.includeImagePaths !== false;
  const fileName = `EcomPilot_Export_${buildTimestamp()}.xlsx`;
  const filePath = path.join(EXPORT_DIR, fileName);
  const includedSheets = SHEET_NAMES.join(",");
  let logId: number | null = null;

  try {
    const log = await prisma.exportLog.create({
      data: {
        fileName,
        filePath,
        includedSheets,
        status: "进行中",
      },
    });
    logId = log.id;

    await mkdir(EXPORT_DIR, { recursive: true });

    const [products, competitors, copywritings, promptTasks, materials, scores] = await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          scoreSnapshots: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.competitor.findMany({
        orderBy: { createdAt: "asc" },
        include: { product: { select: { name: true } } },
      }),
      prisma.copywriting.findMany({
        orderBy: { createdAt: "asc" },
        include: { product: { select: { name: true } } },
      }),
      prisma.promptTask.findMany({
        orderBy: { createdAt: "asc" },
        include: { product: { select: { name: true } } },
      }),
      prisma.material.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          product: { select: { name: true } },
          promptTask: { select: { taskCode: true } },
        },
      }),
      prisma.scoreSnapshot.findMany({
        orderBy: { createdAt: "asc" },
        include: { product: { select: { name: true } } },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "EcomPilot";
    workbook.created = new Date();

    addSheet(
      workbook,
      "Products",
      [
        { header: "商品ID", key: "id", width: 12 },
        { header: "商品名称", key: "name", width: 26 },
        { header: "一级类目", key: "categoryLevel1", width: 16 },
        { header: "二级类目", key: "categoryLevel2", width: 16 },
        { header: "商品标签", key: "tags", width: 24 },
        { header: "目标人群", key: "targetUser", width: 18 },
        { header: "目标平台", key: "targetPlatforms", width: 20 },
        { header: "预估售价", key: "estimatedPrice", width: 14 },
        { header: "预估进货价", key: "estimatedCost", width: 14 },
        { header: "预估运费", key: "estimatedShipping", width: 14 },
        { header: "包装成本", key: "packagingCost", width: 14 },
        { header: "预估净利润", key: "estimatedNetProfit", width: 14 },
        { header: "利润率", key: "profitRate", width: 14 },
        { header: "商品总分", key: "totalScore", width: 14 },
        { header: "推荐结论", key: "recommendation", width: 16 },
        { header: "当前状态", key: "status", width: 14 },
        { header: "创建时间", key: "createdAt", width: 20 },
        { header: "更新时间", key: "updatedAt", width: 20 },
        { header: "备注", key: "notes", width: 28 },
      ],
      products.map((product) => {
        const latestScore = product.scoreSnapshots[0];
        const estimatedNetProfit = computeEstimatedNetProfit(product);
        const profitRate = product.estimatedPrice && estimatedNetProfit !== null ? estimatedNetProfit / product.estimatedPrice : null;

        return {
          id: product.id,
          name: product.name,
          categoryLevel1: product.categoryLevel1 ?? "",
          categoryLevel2: product.categoryLevel2 ?? "",
          tags: formatJsonArrayText(product.tags),
          targetUser: product.targetUser ?? "",
          targetPlatforms: formatJsonArrayText(product.targetPlatforms),
          estimatedPrice: product.estimatedPrice ?? "",
          estimatedCost: product.estimatedCost ?? "",
          estimatedShipping: product.estimatedShipping ?? "",
          packagingCost: product.packagingCost ?? "",
          estimatedNetProfit: estimatedNetProfit ?? "",
          profitRate: formatPercent(profitRate),
          totalScore: latestScore?.totalScore ?? "",
          recommendation: latestScore?.recommendation ?? "",
          status: product.status,
          createdAt: formatDateTime(product.createdAt),
          updatedAt: formatDateTime(product.updatedAt),
          notes: product.notes ?? "",
        };
      }),
    );

    addSheet(
      workbook,
      "Competitors",
      [
        { header: "竞品ID", key: "id", width: 12 },
        { header: "商品ID", key: "productId", width: 12 },
        { header: "商品名称", key: "productName", width: 26 },
        { header: "平台", key: "platform", width: 14 },
        { header: "竞品标题", key: "title", width: 30 },
        { header: "价格", key: "price", width: 12 },
        { header: "热度指标类型", key: "heatMetricType", width: 16 },
        { header: "热度指标数值", key: "heatMetricValue", width: 16 },
        { header: "卖点", key: "sellingPoint", width: 28 },
        { header: "痛点/差评", key: "painPoint", width: 28 },
        { header: "数据日期", key: "dataDate", width: 16 },
        { header: "链接", key: "link", width: 30 },
        { header: "截图路径", key: "screenshotPath", width: 28 },
        { header: "备注", key: "notes", width: 28 },
      ],
      competitors.map((competitor) => ({
        id: competitor.id,
        productId: competitor.productId,
        productName: competitor.product.name,
        platform: competitor.platform,
        title: competitor.title,
        price: competitor.price,
        heatMetricType: competitor.heatMetricType,
        heatMetricValue: competitor.heatMetricValue,
        sellingPoint: competitor.sellingPoint ?? "",
        painPoint: competitor.painPoint ?? "",
        dataDate: formatNullableDate(competitor.dataDate),
        link: competitor.link ?? "",
        screenshotPath: includeImagePaths ? competitor.screenshotPath ?? "" : "",
        notes: competitor.notes ?? "",
      })),
    );

    addSheet(
      workbook,
      "Copywriting",
      [
        { header: "文案ID", key: "id", width: 12 },
        { header: "商品ID", key: "productId", width: 12 },
        { header: "商品名称", key: "productName", width: 26 },
        { header: "平台", key: "platform", width: 14 },
        { header: "文案类型", key: "copyType", width: 16 },
        { header: "版本", key: "version", width: 12 },
        { header: "风格", key: "style", width: 16 },
        { header: "标题", key: "title", width: 30 },
        { header: "正文", key: "content", width: 42 },
        { header: "审核状态", key: "auditStatus", width: 16 },
        { header: "风险词", key: "riskWords", width: 24 },
        { header: "创建时间", key: "createdAt", width: 20 },
      ],
      copywritings.map((copywriting) => ({
        id: copywriting.id,
        productId: copywriting.productId,
        productName: copywriting.product.name,
        platform: copywriting.platform ?? "",
        copyType: copywriting.copyType ?? "",
        version: copywriting.version ?? "",
        style: copywriting.style ?? "",
        title: copywriting.title ?? "",
        content: includeCopywritingContent ? copywriting.content ?? copywriting.mainCopy ?? "" : "",
        auditStatus: copywriting.auditStatus ?? "",
        riskWords: copywriting.riskWords ?? "",
        createdAt: formatDateTime(copywriting.createdAt),
      })),
    );

    addSheet(
      workbook,
      "PromptTasks",
      [
        { header: "Task ID", key: "taskCode", width: 20 },
        { header: "商品ID", key: "productId", width: 12 },
        { header: "商品名称", key: "productName", width: 26 },
        { header: "平台", key: "platform", width: 14 },
        { header: "图片类型", key: "imageType", width: 16 },
        { header: "推荐尺寸", key: "recommendedSize", width: 16 },
        { header: "Prompt 内容", key: "promptText", width: 52 },
        { header: "任务状态", key: "status", width: 16 },
        { header: "版本", key: "version", width: 12 },
        { header: "创建时间", key: "createdAt", width: 20 },
      ],
      promptTasks.map((task) => ({
        taskCode: task.taskCode,
        productId: task.productId,
        productName: task.product.name,
        platform: task.platform ?? "",
        imageType: task.imageType ?? "",
        recommendedSize: task.recommendedSize ?? "",
        promptText: task.promptText ?? "",
        status: task.status,
        version: task.version ?? "",
        createdAt: formatDateTime(task.createdAt),
      })),
    );

    addSheet(
      workbook,
      "Materials",
      [
        { header: "素材ID", key: "id", width: 12 },
        { header: "商品ID", key: "productId", width: 12 },
        { header: "商品名称", key: "productName", width: 26 },
        { header: "关联 Task ID", key: "taskCode", width: 20 },
        { header: "平台", key: "platform", width: 14 },
        { header: "素材类型", key: "materialType", width: 16 },
        { header: "文件路径", key: "filePath", width: 34 },
        { header: "宽度", key: "width", width: 12 },
        { header: "高度", key: "height", width: 12 },
        { header: "状态", key: "status", width: 14 },
        { header: "来源", key: "source", width: 16 },
        { header: "创建时间", key: "createdAt", width: 20 },
      ],
      materials.map((material) => ({
        id: material.id,
        productId: material.productId,
        productName: material.product.name,
        taskCode: material.promptTask?.taskCode ?? "",
        platform: material.platform ?? "",
        materialType: material.materialType ?? "",
        filePath: includeImagePaths ? material.filePath : "",
        width: material.width ?? "",
        height: material.height ?? "",
        status: material.status,
        source: material.source ?? "",
        createdAt: formatDateTime(material.createdAt),
      })),
    );

    addSheet(
      workbook,
      "Scores",
      [
        { header: "评分ID", key: "id", width: 12 },
        { header: "商品ID", key: "productId", width: 12 },
        { header: "商品名称", key: "productName", width: 26 },
        { header: "商品总分", key: "totalScore", width: 14 },
        { header: "卖得出去概率分", key: "demandScore", width: 18 },
        { header: "利润空间分", key: "profitScore", width: 16 },
        { header: "售后风险分", key: "afterSalesScore", width: 16 },
        { header: "竞争强度分", key: "competitionScore", width: 16 },
        { header: "供应商稳定性分", key: "supplierScore", width: 18 },
        { header: "内容表现力分", key: "contentScore", width: 16 },
        { header: "推荐结论", key: "recommendation", width: 16 },
        { header: "扣分原因", key: "deductionReasons", width: 34 },
        { header: "下一步建议", key: "nextSuggestions", width: 34 },
        { header: "评分时间", key: "createdAt", width: 20 },
      ],
      scores.map((score) => ({
        id: score.id,
        productId: score.productId,
        productName: score.product.name,
        totalScore: score.totalScore ?? "",
        demandScore: score.demandScore ?? "",
        profitScore: score.profitScore ?? "",
        afterSalesScore: score.afterSalesScore ?? "",
        competitionScore: score.competitionScore ?? "",
        supplierScore: score.supplierScore ?? "",
        contentScore: score.contentScore ?? "",
        recommendation: score.recommendation ?? "",
        deductionReasons: score.deductionReasons ?? score.recommendationNote ?? "",
        nextSuggestions: score.nextSuggestions ?? "",
        createdAt: formatDateTime(score.createdAt),
      })),
    );

    await workbook.xlsx.writeFile(filePath);

    return await prisma.exportLog.update({
      where: { id: logId },
      data: {
        status: "成功",
        errorMessage: null,
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);

    if (logId) {
      await prisma.exportLog.update({
        where: { id: logId },
        data: {
          status: "失败",
          errorMessage: message,
        },
      });
    } else {
      await prisma.exportLog.create({
        data: {
          fileName,
          filePath,
          includedSheets,
          status: "失败",
          errorMessage: message,
        },
      });
    }

    throw normalizeProductWriteError(error);
  }
}
