import { prisma } from "../src/lib/prisma";
import { runBatchOperation } from "../src/lib/services/batchOperationService";

const previousVercel = process.env.VERCEL;
const previousVercelEnv = process.env.VERCEL_ENV;

async function main() {
  process.env.VERCEL = "1";
  process.env.VERCEL_ENV = "preview";

  try {
    await runBatchOperation({
      entity: "PRODUCT",
      action: "UPDATE_STATUS",
      ids: [1],
      value: "暂缓",
    });
    console.log("FAIL preview allowed write");
    process.exitCode = 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(message);
    if (message !== "预览环境只读，请在 Windows 本地验收。") {
      process.exitCode = 1;
    }
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

    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
