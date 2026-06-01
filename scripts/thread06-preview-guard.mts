import { prisma } from "../src/lib/prisma";
import {
  moveFilesToTrash,
  permanentlyDeleteTrashFiles,
  scanFileMaintenance,
} from "../src/lib/services/fileMaintenanceService";

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

async function expectBlocked(name: string, action: () => Promise<unknown>) {
  try {
    await action();
    throw new Error("operation was not blocked");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert(message.includes("预览环境只读") || message.includes("Preview") || message.includes("只读"), message);
    pass(name, message);
  }
}

async function main() {
  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "preview";

  const beforeCount = await prisma.cleanupLog.count();
  const scan = await scanFileMaintenance();
  const afterScanCount = await prisma.cleanupLog.count();

  assert(scan.readonlyMessage?.includes("预览环境只读"), "preview scan did not return readonly message");
  assert(scan.items.length === 0 && scan.trashItems.length === 0, "preview scan returned real file data");
  assert(beforeCount === afterScanCount, "preview scan wrote CleanupLog");
  pass("Vercel 预览不会真实扫描或写 CleanupLog", scan.readonlyMessage ?? undefined);

  await expectBlocked("Vercel 预览阻止移入回收站", () =>
    moveFilesToTrash({
      selections: [{ scope: "uploads", relativePath: "uploads/example.png" }],
    }),
  );
  await expectBlocked("Vercel 预览阻止永久删除", () =>
    permanentlyDeleteTrashFiles({
      selections: [{ trashRelativePath: "trash/uploads/example.png" }],
    }),
  );

  const afterWriteAttempts = await prisma.cleanupLog.count();
  assert(beforeCount === afterWriteAttempts, "preview write attempts changed CleanupLog count");
  pass("Vercel 预览写操作没有改变 CleanupLog", `count=${afterWriteAttempts}`);

  for (const check of checks) {
    console.log(`${check.status} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
