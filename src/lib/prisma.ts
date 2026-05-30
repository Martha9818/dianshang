import { PrismaClient } from "@prisma/client";
import { isLocalWritable } from "@/lib/services/runtime";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  sqliteStabilityReady?: Promise<void>;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function ensureSqliteStabilityPragmas() {
  if (!isLocalWritable()) {
    return {
      attempted: false,
      walEnabled: false,
      busyTimeoutSet: false,
      message: "预览环境不连接本地 SQLite。",
    };
  }

  globalForPrisma.sqliteStabilityReady ??= (async () => {
    await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL");
    await prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000");
  })();

  try {
    await globalForPrisma.sqliteStabilityReady;

    return {
      attempted: true,
      walEnabled: true,
      busyTimeoutSet: true,
      message: "SQLite WAL 与 busy_timeout 已尝试启用。",
    };
  } catch (error) {
    globalForPrisma.sqliteStabilityReady = undefined;
    const { logWarn } = await import(
      /* turbopackIgnore: true */
      "@/lib/services/logging"
    );
    await logWarn(error instanceof Error ? `SQLite stability PRAGMA failed: ${error.message}` : "SQLite stability PRAGMA failed");

    return {
      attempted: true,
      walEnabled: false,
      busyTimeoutSet: false,
      message: "SQLite WAL / busy_timeout 设置失败，已记录脱敏日志。",
    };
  }
}
