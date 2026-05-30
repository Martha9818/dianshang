import { prisma } from "../src/lib/prisma";
import { runBatchOperation } from "../src/lib/services/batchOperationService";

async function main() {
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
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
