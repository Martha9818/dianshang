import { prisma } from "../src/lib/prisma";
import { runBatchOperation } from "../src/lib/services/batchOperationService";

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

async function expectBlocked(name: string, input: Parameters<typeof runBatchOperation>[0], expected: string) {
  try {
    await runBatchOperation(input);
    fail(name, "操作未被阻止。");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes(expected)) {
      pass(name, message);
    } else {
      fail(name, message);
    }
  }
}

async function main() {
  const runId = Date.now();
  const cleanup = {
    productIds: [] as number[],
    inspirationIds: [] as number[],
    notificationIds: [] as number[],
  };

  try {
    const products = await Promise.all(
      [1, 2, 3].map((index) =>
        prisma.product.create({
          data: {
            spu: `SPU-THREAD05-${runId}-${index}`,
            name: `Thread05 批量商品 ${runId}-${index}`,
            status: "待分析",
          },
        }),
      ),
    );
    cleanup.productIds.push(...products.map((product) => product.id));

    const materials = await Promise.all(
      products.slice(0, 2).map((product, index) =>
        prisma.material.create({
          data: {
            productId: product.id,
            platform: "xianyu",
            materialType: "main_image",
            filePath: `uploads/thread05/material-${runId}-${index}.png`,
            fileHash: `thread05-material-${runId}-${index}`,
            status: "待审核",
            sourceType: "own_photo",
            usagePermission: "usable",
            source: "manual_upload",
            version: `v${index + 1}`,
          },
        }),
      ),
    );

    const inspirations = await Promise.all(
      [1, 2, 3].map((index) =>
        prisma.inspiration.create({
          data: {
            title: `Thread05 灵感 ${runId}-${index}`,
            imagePath: `uploads/thread05/inspiration-${runId}-${index}.png`,
            fileHash: `thread05-inspiration-${runId}-${index}`,
            sourceType: "folder_manual_scan",
            usagePermission: "reference_only",
            status: "pending",
          },
        }),
      ),
    );
    cleanup.inspirationIds.push(...inspirations.map((inspiration) => inspiration.id));

    const notifications = await Promise.all(
      [1, 2].map((index) =>
        prisma.appNotification.create({
          data: {
            type: "SYSTEM",
            level: "info",
            title: `Thread05 通知 ${runId}-${index}`,
            message: "批量验收通知",
            status: "unread",
          },
        }),
      ),
    );
    cleanup.notificationIds.push(...notifications.map((notification) => notification.id));

    const productStatus = await runBatchOperation({
      entity: "PRODUCT",
      action: "UPDATE_STATUS",
      ids: products.slice(0, 2).map((product) => product.id),
      value: "暂缓",
    });
    const updatedProducts = await prisma.product.findMany({
      where: { id: { in: products.slice(0, 2).map((product) => product.id) } },
      select: { status: true },
    });
    assert(productStatus.successCount === 2 && productStatus.failedCount === 0, "商品状态批量结果不正确。");
    assert(updatedProducts.every((product) => product.status === "暂缓"), "商品状态未修改。");
    pass("商品批量修改状态", `success=${productStatus.successCount}`);

    await expectBlocked(
      "商品软删除缺少二次确认会阻止",
      { entity: "PRODUCT", action: "SOFT_DELETE", ids: [products[2].id] },
      "危险批量操作需要输入",
    );

    const productDelete = await runBatchOperation({
      entity: "PRODUCT",
      action: "SOFT_DELETE",
      ids: [products[2].id],
      confirmText: "确认批量操作",
    });
    const deletedProduct = await prisma.product.findUnique({ where: { id: products[2].id }, select: { deletedAt: true } });
    assert(productDelete.successCount === 1 && productDelete.failedCount === 0, "商品软删除批量结果不正确。");
    assert(Boolean(deletedProduct?.deletedAt), "商品未软删除。");
    pass("商品批量软删除", `success=${productDelete.successCount}`);

    const inspirationReview = await runBatchOperation({
      entity: "INSPIRATION",
      action: "MARK_REVIEWED",
      ids: [inspirations[0].id],
    });
    const reviewed = await prisma.inspiration.findUnique({ where: { id: inspirations[0].id }, select: { status: true } });
    assert(inspirationReview.successCount === 1 && reviewed?.status === "reviewed", "灵感未标记已查看。");
    pass("灵感批量标记已查看", `success=${inspirationReview.successCount}`);

    const inspirationArchive = await runBatchOperation({
      entity: "INSPIRATION",
      action: "ARCHIVE",
      ids: [inspirations[1].id],
      confirmText: "确认批量操作",
    });
    const archived = await prisma.inspiration.findUnique({ where: { id: inspirations[1].id }, select: { status: true } });
    assert(inspirationArchive.successCount === 1 && archived?.status === "archived", "灵感未归档。");
    pass("灵感批量归档", `success=${inspirationArchive.successCount}`);

    const inspirationReject = await runBatchOperation({
      entity: "INSPIRATION",
      action: "REJECT",
      ids: [inspirations[2].id],
      confirmText: "确认批量操作",
    });
    const rejected = await prisma.inspiration.findUnique({ where: { id: inspirations[2].id }, select: { status: true } });
    assert(inspirationReject.successCount === 1 && rejected?.status === "rejected", "灵感未放弃。");
    pass("灵感批量放弃", `success=${inspirationReject.successCount}`);

    await expectBlocked(
      "灵感不允许批量转商品",
      { entity: "INSPIRATION", action: "CONVERT_TO_PRODUCT", ids: [inspirations[0].id] },
      "该批量操作未开放",
    );

    const materialStatus = await runBatchOperation({
      entity: "MATERIAL",
      action: "UPDATE_STATUS",
      ids: [materials[0].id],
      value: "可使用",
    });
    const usableMaterial = await prisma.material.findUnique({ where: { id: materials[0].id }, select: { status: true, filePath: true } });
    assert(materialStatus.successCount === 1 && usableMaterial?.status === "可使用", "素材状态未修改。");
    assert(usableMaterial?.filePath.includes(`thread05/material-${runId}-0.png`), "素材文件路径不应被改动。");
    pass("素材批量修改状态", `success=${materialStatus.successCount}`);

    const materialArchive = await runBatchOperation({
      entity: "MATERIAL",
      action: "ARCHIVE",
      ids: [materials[1].id],
      confirmText: "确认批量操作",
    });
    const archivedMaterial = await prisma.material.findUnique({ where: { id: materials[1].id }, select: { status: true } });
    assert(materialArchive.successCount === 1 && archivedMaterial?.status === "已弃用", "素材未归档为已弃用。");
    pass("素材批量归档不删除文件", `success=${materialArchive.successCount}`);

    await expectBlocked(
      "素材不允许批量永久删除文件",
      { entity: "MATERIAL", action: "PERMANENT_DELETE", ids: [materials[0].id], confirmText: "确认批量操作" },
      "该批量操作未开放",
    );

    const notificationRead = await runBatchOperation({
      entity: "NOTIFICATION",
      action: "MARK_READ",
      ids: notifications.map((notification) => notification.id),
    });
    const readCount = await prisma.appNotification.count({
      where: { id: { in: notifications.map((notification) => notification.id) }, status: "read" },
    });
    assert(notificationRead.successCount === 2 && readCount === 2, "通知未批量标记已读。");
    pass("通知批量标记已读", `success=${notificationRead.successCount}`);

    await expectBlocked(
      "通知批量删除缺少二次确认会阻止",
      { entity: "NOTIFICATION", action: "DELETE", ids: [notifications[0].id] },
      "危险批量操作需要输入",
    );

    const notificationDelete = await runBatchOperation({
      entity: "NOTIFICATION",
      action: "DELETE",
      ids: [notifications[0].id],
      confirmText: "确认批量操作",
    });
    cleanup.notificationIds = cleanup.notificationIds.filter((id) => id !== notifications[0].id);
    const deletedNotification = await prisma.appNotification.findUnique({ where: { id: notifications[0].id } });
    assert(notificationDelete.successCount === 1 && deletedNotification === null, "通知未批量删除。");
    pass("通知批量删除二次确认", `success=${notificationDelete.successCount}`);

    await expectBlocked(
      "批量 AI 识图未开放",
      { entity: "INSPIRATION", action: "GENERATE_AI_SUGGESTION", ids: [inspirations[0].id] },
      "该批量操作未开放",
    );
    await expectBlocked(
      "批量生成文案未开放",
      { entity: "PRODUCT", action: "GENERATE_COPYWRITING", ids: [products[0].id] },
      "该批量操作未开放",
    );
    await expectBlocked(
      "批量 API 生图未开放",
      { entity: "MATERIAL", action: "GENERATE_IMAGE", ids: [materials[0].id] },
      "该批量操作未开放",
    );

    const logs = await prisma.operationLog.findMany({
      where: {
        action: "BATCH_OPERATION",
        detail: { contains: "成功=" },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { detail: true },
    });
    assert(logs.length > 0, "未记录批量 OperationLog。");
    assert(logs.every((log) => !/[A-Za-z]:\\/.test(String(log.detail ?? "")) && !String(log.detail ?? "").includes("sk-")), "批量日志不应包含本地完整路径或 API Key。");
    pass("批量操作日志脱敏", `logs=${logs.length}`);
  } finally {
    await prisma.operationLog.deleteMany({
      where: {
        OR: [
          { productId: { in: cleanup.productIds } },
          { relatedInspirationId: { in: cleanup.inspirationIds } },
          { detail: { contains: "Thread05" } },
          { detail: { contains: "对象=" } },
        ],
      },
    }).catch(() => {});
    await prisma.appNotification.deleteMany({
      where: {
        OR: [
          { id: { in: cleanup.notificationIds } },
          { message: { contains: `Thread05 批量商品 ${runId}` } },
          {
            relatedType: "Product",
            relatedId: { in: cleanup.productIds.map(String) },
          },
        ],
      },
    }).catch(() => {});
    await prisma.material.deleteMany({ where: { productId: { in: cleanup.productIds } } }).catch(() => {});
    await prisma.inspiration.deleteMany({ where: { id: { in: cleanup.inspirationIds } } }).catch(() => {});
    await prisma.product.deleteMany({ where: { id: { in: cleanup.productIds } } }).catch(() => {});
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
