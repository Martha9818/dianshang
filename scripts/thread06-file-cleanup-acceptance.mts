import { access, mkdir, utimes, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import {
  MOVE_TO_TRASH_CONFIRM_TEXT,
  PERMANENT_DELETE_CONFIRM_TEXT,
} from "../src/lib/modules/cleanup/fileMaintenanceTypes";
import {
  clearAcceptanceFiles,
  moveFilesToTrash,
  permanentlyDeleteTrashFiles,
  scanFileMaintenance,
} from "../src/lib/services/fileMaintenanceService";
import { getLocalDirectoryPath } from "../src/lib/services/local-paths/localPathsService";

type Check = {
  name: string;
  status: "PASS" | "FAIL";
  detail?: string;
};

const checks: Check[] = [];

function pass(name: string, detail?: string) {
  checks.push({ name, status: "PASS", detail });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function writeScopedFile(scope: "uploads" | "exports" | "backups", relativePath: string, content: string, old = false) {
  const root = getLocalDirectoryPath(scope);
  const scopeRelativePath = relativePath.replace(new RegExp(`^${scope}/`), "");
  const absolutePath = path.join(root, scopeRelativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content, "utf8");

  if (old) {
    const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    await utimes(absolutePath, oldDate, oldDate);
  }

  return absolutePath;
}

async function main() {
  const runId = Date.now();
  const productIds: number[] = [];
  const cleanupRelativePaths = [
    `uploads/thread06-acceptance/${runId}`,
    `exports/thread06-acceptance-${runId}.xlsx`,
    `backups/thread06-acceptance-${runId}`,
  ];

  try {
    const orphanPath = `uploads/thread06-acceptance/${runId}/orphan.txt`;
    const activePath = `uploads/thread06-acceptance/${runId}/active-main.txt`;
    const softDeletedPath = `uploads/thread06-acceptance/${runId}/soft-deleted-main.txt`;
    const missingPath = `uploads/thread06-acceptance/${runId}/missing-main.txt`;
    const oldExportPath = `exports/thread06-acceptance-${runId}.xlsx`;
    const oldBackupPath = `backups/thread06-acceptance-${runId}/dev.db`;

    await writeScopedFile("uploads", orphanPath, "orphan");
    await writeScopedFile("uploads", activePath, "active");
    await writeScopedFile("uploads", softDeletedPath, "soft-deleted");
    await writeScopedFile("exports", oldExportPath, "old-export", true);
    await writeScopedFile("backups", oldBackupPath, "old-backup", true);

    const activeProduct = await prisma.product.create({
      data: {
        spu: `THREAD06-ACTIVE-${runId}`,
        name: `Thread06 active ${runId}`,
        status: "待分析",
        mainImagePath: activePath,
      },
    });
    const softDeletedProduct = await prisma.product.create({
      data: {
        spu: `THREAD06-SOFT-${runId}`,
        name: `Thread06 soft deleted ${runId}`,
        status: "待分析",
        deletedAt: new Date(),
        mainImagePath: softDeletedPath,
      },
    });
    const missingProduct = await prisma.product.create({
      data: {
        spu: `THREAD06-MISSING-${runId}`,
        name: `Thread06 missing ${runId}`,
        status: "待分析",
        mainImagePath: missingPath,
      },
    });
    productIds.push(activeProduct.id, softDeletedProduct.id, missingProduct.id);

    const scan = await scanFileMaintenance();
    const orphan = scan.items.find((item) => item.relativePath === orphanPath);
    const active = scan.items.find((item) => item.relativePath === activePath);
    const softDeleted = scan.items.find((item) => item.relativePath === softDeletedPath);
    const missing = scan.items.find((item) => item.relativePath === missingPath);
    const oldExport = scan.items.find((item) => item.relativePath === oldExportPath);
    const oldBackup = scan.items.find((item) => item.relativePath === oldBackupPath);

    assert(orphan?.recommendation === "move_to_trash" && orphan.canMoveToTrash, "orphan upload was not movable");
    pass("孤儿 uploads 文件可识别", orphan.relativePath);
    assert(active?.recommendation === "keep" && !active.canMoveToTrash, "active main image was movable");
    pass("正在使用的商品主图不会建议清理", active.relativePath);
    assert(softDeleted?.recommendation === "review_before_trash" && softDeleted.canMoveToTrash, "soft-deleted product file was not review-movable");
    pass("已软删除商品关联文件可识别", softDeleted.relativePath);
    assert(missing?.recommendation === "missing_file" && !missing.exists, "missing DB file was not reported");
    pass("数据库有记录但文件缺失会显示", missing.relativePath);
    assert(oldExport?.recommendation === "move_to_trash" && oldExport.canMoveToTrash, "old export was not movable");
    pass("旧导出文件可识别", oldExport.relativePath);
    assert(oldBackup?.recommendation === "backup_warning" && oldBackup.canMoveToTrash, "old backup was not warning-movable");
    pass("旧备份文件可识别并提示风险", oldBackup.relativePath);

    const moveResult = await moveFilesToTrash({
      confirmText: MOVE_TO_TRASH_CONFIRM_TEXT,
      selections: [
        { scope: "uploads", relativePath: orphanPath },
        { scope: "exports", relativePath: oldExportPath },
        { scope: "backups", relativePath: oldBackupPath },
      ],
    });
    assert(moveResult.successCount === 3 && moveResult.failedCount === 0, "move to trash did not succeed");
    pass("文件可移入应用内回收站", `success=${moveResult.successCount}`);

    const afterMove = await scanFileMaintenance();
    const trashItems = afterMove.trashItems.filter((item) =>
      [orphanPath, oldExportPath, oldBackupPath].includes(item.originalRelativePath ?? ""),
    );
    assert(trashItems.length === 3, "trash items were not recorded with original paths");
    assert(trashItems.every((item) => item.trashRelativePath.startsWith("trash/")), "trash path was not relative");
    pass("回收站保留原相对路径和回收站相对路径", `trash=${trashItems.length}`);

    const deleteResult = await permanentlyDeleteTrashFiles({
      confirmText: PERMANENT_DELETE_CONFIRM_TEXT,
      selections: trashItems.map((item) => ({ trashRelativePath: item.trashRelativePath })),
    });
    assert(deleteResult.successCount === 3 && deleteResult.failedCount === 0, "permanent delete did not succeed");
    pass("回收站文件可二次确认后永久删除", `success=${deleteResult.successCount}`);

    for (const item of trashItems) {
      const trashAbsolutePath = path.join(getLocalDirectoryPath("trash"), item.trashRelativePath.replace(/^trash\//, ""));
      const stillExists = await access(trashAbsolutePath).then(() => true).catch(() => false);
      assert(!stillExists, `trash file still exists: ${item.trashRelativePath}`);
    }

    const logs = await prisma.cleanupLog.findMany({
      where: {
        OR: [
          { originalRelativePath: { contains: `thread06-acceptance/${runId}` } },
          { originalRelativePath: oldExportPath },
          { originalRelativePath: oldBackupPath },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    assert(logs.some((log) => log.action === "move_to_trash" && log.status === "success"), "move cleanup log missing");
    assert(logs.some((log) => log.action === "permanent_delete" && log.status === "success"), "delete cleanup log missing");
    assert(logs.every((log) => !/[A-Za-z]:\\/.test(`${log.originalRelativePath ?? ""}${log.trashRelativePath ?? ""}${log.reason ?? ""}`)), "cleanup log exposed absolute path");
    pass("CleanupLog 正常记录且不暴露完整本地路径", `logs=${logs.length}`);
  } finally {
    await prisma.product.deleteMany({ where: { id: { in: productIds } } }).catch(() => {});
    await prisma.cleanupLog.deleteMany({
      where: {
        OR: [
          { originalRelativePath: { contains: `thread06-acceptance/${runId}` } },
          { trashRelativePath: { contains: `thread06-acceptance-${runId}` } },
        ],
      },
    }).catch(() => {});
    await clearAcceptanceFiles(cleanupRelativePaths).catch(() => {});
    await prisma.$disconnect();
  }

  for (const check of checks) {
    console.log(`${check.status} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
