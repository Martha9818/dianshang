import { prisma } from "../src/lib/prisma";
import {
  archiveCompetitorAnalysisSnapshot,
  generateCompetitorAnalysisSnapshot,
  getCompetitorAnalysisSnapshots,
  markCompetitorAnalysisReference,
} from "../src/lib/services/competitor-analysis/competitorAnalysisService";
import { COMPETITOR_ANALYSIS_READONLY_MESSAGE } from "../src/lib/services/competitor-analysis/competitorAnalysisTypes";

type Check = {
  name: string;
  status: "PASS" | "FAIL";
  detail?: string;
};

type EnvSnapshot = {
  ECOMPILOT_RUNTIME_MODE?: string;
  VERCEL?: string;
  VERCEL_ENV?: string;
};

const checks: Check[] = [];

function pass(name: string, detail?: string) {
  checks.push({ name, status: "PASS", detail });
}

function fail(name: string, detail: string) {
  checks.push({ name, status: "FAIL", detail });
}

function restoreEnvValue(key: keyof EnvSnapshot, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

function restoreEnv(snapshot: EnvSnapshot) {
  restoreEnvValue("ECOMPILOT_RUNTIME_MODE", snapshot.ECOMPILOT_RUNTIME_MODE);
  restoreEnvValue("VERCEL", snapshot.VERCEL);
  restoreEnvValue("VERCEL_ENV", snapshot.VERCEL_ENV);
}

async function expectReadonly(name: string, run: () => Promise<unknown>) {
  try {
    await run();
    fail(name, "write unexpectedly succeeded in preview runtime");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes(COMPETITOR_ANALYSIS_READONLY_MESSAGE)) {
      pass(name, message);
    } else {
      fail(name, message);
    }
  }
}

async function main() {
  const envSnapshot: EnvSnapshot = {
    ECOMPILOT_RUNTIME_MODE: process.env.ECOMPILOT_RUNTIME_MODE,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };

  try {
    process.env.ECOMPILOT_RUNTIME_MODE = "preview";
    process.env.VERCEL = "1";

    const beforeSnapshotCount = await prisma.competitorAnalysisSnapshot.count();
    const beforeRequestLogCount = await prisma.aIRequestLog.count();

    const readResult = await getCompetitorAnalysisSnapshots(1);
    if (readResult.readonlyNotice === COMPETITOR_ANALYSIS_READONLY_MESSAGE) {
      pass("preview can read existing analysis list", `snapshots=${readResult.snapshots.length}`);
    } else {
      fail("preview can read existing analysis list", `readonlyNotice=${readResult.readonlyNotice ?? "null"}`);
    }

    await expectReadonly("preview blocks analysis generation", () =>
      generateCompetitorAnalysisSnapshot({ productId: 1, competitorIds: [1, 2, 3] }),
    );
    await expectReadonly("preview blocks reference marking", () =>
      markCompetitorAnalysisReference({ productId: 1, snapshotId: 1 }),
    );
    await expectReadonly("preview blocks archive", () => archiveCompetitorAnalysisSnapshot({ productId: 1, snapshotId: 1 }));

    const afterSnapshotCount = await prisma.competitorAnalysisSnapshot.count();
    const afterRequestLogCount = await prisma.aIRequestLog.count();

    if (afterSnapshotCount === beforeSnapshotCount) {
      pass("preview does not save analysis snapshots", `snapshots=${afterSnapshotCount}`);
    } else {
      fail("preview does not save analysis snapshots", `${beforeSnapshotCount} -> ${afterSnapshotCount}`);
    }

    if (afterRequestLogCount === beforeRequestLogCount) {
      pass("preview does not call AI", `aiRequestLogs=${afterRequestLogCount}`);
    } else {
      fail("preview does not call AI", `${beforeRequestLogCount} -> ${afterRequestLogCount}`);
    }
  } finally {
    restoreEnv(envSnapshot);
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
