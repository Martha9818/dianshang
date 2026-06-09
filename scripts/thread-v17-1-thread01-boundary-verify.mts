import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import {
  confirmScreenshotJobToCompetitor,
  getCompetitorScreenshotDraftCandidates,
} from "@/lib/services/screenshot/screenshotRecognitionService";
import {
  SCREENSHOT_JOB_STATUSES,
  SCREENSHOT_QUALITY_LEVELS,
  SCREENSHOT_SOURCE_TYPES,
  type ScreenshotStructuredDraft,
} from "@/lib/services/screenshot/screenshotTypes";
import type { CompetitorMutationInput } from "@/lib/services/competitor-service";

const VERIFY_PREFIX = "__V171_VERIFY__";
const runKey = `${VERIFY_PREFIX}_${Date.now()}`;

const createdProductIds: number[] = [];
const createdCompetitorIds: number[] = [];
const createdJobIds: number[] = [];
let summary: Record<string, unknown> | null = null;

function buildDraft(input: Partial<ScreenshotStructuredDraft> = {}): ScreenshotStructuredDraft {
  return {
    draftLabel: `${runKey}_draft`,
    possibleTitle: "Verify competitor draft",
    possiblePrice: "899",
    possibleSalesOrHeat: "销量 320",
    possiblePlatformSource: "淘宝",
    sellingPoints: ["卖点一"],
    specInfo: [],
    riskWords: [],
    imageDescription: "verify image",
    copywritingMaterialSummary: "",
    platformCopywritingDirections: [],
    privacyNotes: [],
    uncertaintyNotes: [],
    qualityLevel: SCREENSHOT_QUALITY_LEVELS.HIGH,
    ...input,
  };
}

async function createProduct(spuSuffix: string) {
  const product = await prisma.product.create({
    data: {
      spu: `${runKey}_${spuSuffix}`,
      name: `${runKey}_${spuSuffix}`,
    },
    select: { id: true },
  });
  createdProductIds.push(product.id);
  return product;
}

async function createScreenshotJob(input: {
  productId: number;
  sourceType?: string;
  status?: string;
  qualityLevel?: string;
  structuredDraft?: ScreenshotStructuredDraft | null;
  confirmedDraft?: ScreenshotStructuredDraft | null;
  competitorId?: number | null;
  errorSummary?: string | null;
}) {
  const imagePath = `${runKey}/job-${Math.random().toString(36).slice(2)}.png`;
  const job = await prisma.screenshotRecognitionJob.create({
    data: {
      sourceType: input.sourceType ?? SCREENSHOT_SOURCE_TYPES.COMPETITOR,
      productId: input.productId,
      imagePath,
      status: input.status ?? SCREENSHOT_JOB_STATUSES.SUCCESS,
      qualityLevel: input.qualityLevel ?? SCREENSHOT_QUALITY_LEVELS.HIGH,
      structuredDraft: input.structuredDraft ? JSON.stringify(input.structuredDraft) : null,
      confirmedDraft: input.confirmedDraft ? JSON.stringify(input.confirmedDraft) : null,
      competitorId: input.competitorId ?? null,
      errorSummary: input.errorSummary ?? null,
    },
    select: { id: true, imagePath: true },
  });
  createdJobIds.push(job.id);
  return job;
}

function buildConfirmValues(title: string): CompetitorMutationInput {
  return {
    platform: "淘宝",
    title,
    price: 899,
    heatMetricType: "销量",
    heatMetricValue: 320,
    sellerName: `${runKey}_seller`,
    link: null,
    sellingPoint: "verify selling point",
    painPoint: null,
    imageStyle: null,
    dataDate: new Date("2026-06-02T00:00:00.000Z"),
    notes: `${runKey}_notes`,
  };
}

async function expectReject(
  title: string,
  fn: () => Promise<unknown>,
  messageIncludes: string,
) {
  try {
    await fn();
    assert.fail(`${title}: expected rejection`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert.match(message, new RegExp(messageIncludes), `${title}: unexpected message ${message}`);
  }
}

async function cleanup() {
  if (createdJobIds.length > 0) {
    await prisma.screenshotRecognitionJob.deleteMany({
      where: { id: { in: createdJobIds } },
    });
  }

  if (createdCompetitorIds.length > 0) {
    await prisma.competitor.deleteMany({
      where: { id: { in: createdCompetitorIds } },
    });
  }

  if (createdProductIds.length > 0) {
    await prisma.product.deleteMany({
      where: { id: { in: createdProductIds } },
    });
  }
}

try {
  const draftPanelSource = readFileSync(path.resolve("src/components/products/competitor-screenshot-draft-panel.tsx"), "utf8");
  const productPageSource = readFileSync(path.resolve("src/app/products/[id]/page.tsx"), "utf8");
  const screenshotTypesSource = readFileSync(path.resolve("src/lib/services/screenshot/screenshotTypes.ts"), "utf8");

  assert.match(draftPanelSource, /当前截图识别质量偏低/);
  assert.match(draftPanelSource, /当前包含隐私提醒/);
  assert.match(draftPanelSource, /当前存在不确定项/);
  assert.match(draftPanelSource, /先回截图识别页处理/);
  assert.match(productPageSource, /requestedScreenshotDraftCandidate\?\.canConfirmDirectly/);
  assert.match(productPageSource, /screenshotDraftBlockedForConfirm/);
  assert.match(screenshotTypesSource, /预览环境只读，请在 Windows 本地验收。/);

  const productA = await createProduct("product_a");
  const productB = await createProduct("product_b");

  const successJob = await createScreenshotJob({
    productId: productA.id,
    structuredDraft: buildDraft(),
  });

  const linkedCompetitor = await prisma.competitor.create({
    data: {
      productId: productA.id,
      ...buildConfirmValues(`${runKey}_linked_competitor`),
      screenshotPath: `${runKey}/linked.png`,
    },
    select: { id: true },
  });
  createdCompetitorIds.push(linkedCompetitor.id);

  const linkedJob = await createScreenshotJob({
    productId: productA.id,
    structuredDraft: buildDraft({ possibleTitle: "linked candidate" }),
    competitorId: linkedCompetitor.id,
  });

  const lowQualityJob = await createScreenshotJob({
    productId: productA.id,
    qualityLevel: SCREENSHOT_QUALITY_LEVELS.LOW,
    structuredDraft: buildDraft({ qualityLevel: SCREENSHOT_QUALITY_LEVELS.LOW }),
  });

  const privacyRiskJob = await createScreenshotJob({
    productId: productA.id,
    structuredDraft: buildDraft({ privacyNotes: ["contains face"] }),
  });

  const uncertaintyJob = await createScreenshotJob({
    productId: productA.id,
    structuredDraft: buildDraft({ uncertaintyNotes: ["price not fully visible"] }),
  });

  const processingJob = await createScreenshotJob({
    productId: productA.id,
    status: SCREENSHOT_JOB_STATUSES.PROCESSING,
    structuredDraft: buildDraft(),
  });

  const failedJob = await createScreenshotJob({
    productId: productA.id,
    status: SCREENSHOT_JOB_STATUSES.FAILED,
    qualityLevel: SCREENSHOT_QUALITY_LEVELS.FAILED,
    structuredDraft: buildDraft({ qualityLevel: SCREENSHOT_QUALITY_LEVELS.FAILED }),
    errorSummary: "verify failed",
  });

  const skippedJob = await createScreenshotJob({
    productId: productA.id,
    status: SCREENSHOT_JOB_STATUSES.SKIPPED,
    structuredDraft: buildDraft(),
  });

  const missingDraftJob = await createScreenshotJob({
    productId: productA.id,
    structuredDraft: null,
    confirmedDraft: null,
  });

  const wrongSourceJob = await createScreenshotJob({
    productId: productA.id,
    sourceType: SCREENSHOT_SOURCE_TYPES.PRODUCT,
    structuredDraft: buildDraft(),
  });

  const crossProductJob = await createScreenshotJob({
    productId: productB.id,
    structuredDraft: buildDraft({ possibleTitle: "cross product only" }),
  });

  const productACandidates = await getCompetitorScreenshotDraftCandidates(productA.id);
  const productACandidateIds = new Set(productACandidates.map((candidate) => candidate.id));

  assert.ok(productACandidateIds.has(successJob.id), "success candidate should be visible");
  assert.ok(productACandidateIds.has(linkedJob.id), "linked candidate should be visible");
  assert.ok(productACandidateIds.has(lowQualityJob.id), "low-quality candidate should be visible");
  assert.ok(productACandidateIds.has(privacyRiskJob.id), "privacy-risk candidate should be visible");
  assert.ok(productACandidateIds.has(uncertaintyJob.id), "uncertainty candidate should be visible");
  assert.ok(productACandidateIds.has(processingJob.id), "processing candidate should be visible");
  assert.ok(productACandidateIds.has(failedJob.id), "failed candidate should be visible");
  assert.ok(productACandidateIds.has(skippedJob.id), "skipped candidate should be visible");
  assert.ok(productACandidateIds.has(missingDraftJob.id), "missing-draft candidate should be visible");
  assert.ok(productACandidateIds.has(wrongSourceJob.id) === false, "wrong-source job must not appear in competitor candidates");
  assert.ok(productACandidateIds.has(crossProductJob.id) === false, "cross-product candidate must not leak into product A");

  const successCandidate = productACandidates.find((candidate) => candidate.id === successJob.id);
  assert.ok(successCandidate, "success candidate should resolve");
  assert.equal(successCandidate?.canConfirmDirectly, true);
  assert.equal(successCandidate?.statusLabel, "识别成功");
  assert.equal(successCandidate?.qualityLabel, "high");
  assert.equal(successCandidate?.confirmStateLabel, "待人工确认");

  const linkedCandidate = productACandidates.find((candidate) => candidate.id === linkedJob.id);
  assert.ok(linkedCandidate, "linked candidate should resolve");
  assert.equal(linkedCandidate?.canConfirmDirectly, false);
  assert.equal(linkedCandidate?.confirmStateLabel, "已转正式竞品");
  assert.match(linkedCandidate?.confirmBlockedReason ?? "", /避免重复创建/);

  const lowQualityCandidate = productACandidates.find((candidate) => candidate.id === lowQualityJob.id);
  assert.ok(lowQualityCandidate, "low-quality candidate should resolve");
  assert.equal(lowQualityCandidate?.qualityLabel, "low");

  const privacyRiskCandidate = productACandidates.find((candidate) => candidate.id === privacyRiskJob.id);
  assert.ok(privacyRiskCandidate, "privacy-risk candidate should resolve");
  assert.equal(privacyRiskCandidate?.privacyNotes.length, 1);

  const uncertaintyCandidate = productACandidates.find((candidate) => candidate.id === uncertaintyJob.id);
  assert.ok(uncertaintyCandidate, "uncertainty candidate should resolve");
  assert.equal(uncertaintyCandidate?.uncertaintyNotes.length, 1);

  const processingCandidate = productACandidates.find((candidate) => candidate.id === processingJob.id);
  assert.ok(processingCandidate, "processing candidate should resolve");
  assert.equal(processingCandidate?.canConfirmDirectly, false);
  assert.equal(processingCandidate?.confirmStateLabel, "识别中");

  const failedCandidate = productACandidates.find((candidate) => candidate.id === failedJob.id);
  assert.ok(failedCandidate, "failed candidate should resolve");
  assert.equal(failedCandidate?.canConfirmDirectly, false);
  assert.equal(failedCandidate?.confirmStateLabel, "识别失败");

  const skippedCandidate = productACandidates.find((candidate) => candidate.id === skippedJob.id);
  assert.ok(skippedCandidate, "skipped candidate should resolve");
  assert.equal(skippedCandidate?.canConfirmDirectly, false);
  assert.equal(skippedCandidate?.confirmStateLabel, "已跳过");

  const missingDraftCandidate = productACandidates.find((candidate) => candidate.id === missingDraftJob.id);
  assert.ok(missingDraftCandidate, "missing-draft candidate should resolve");
  assert.equal(missingDraftCandidate?.canConfirmDirectly, false);
  assert.equal(missingDraftCandidate?.confirmStateLabel, "缺少可用草稿");

  const productBCandidates = await getCompetitorScreenshotDraftCandidates(productB.id);
  assert.deepEqual(
    productBCandidates.map((candidate) => candidate.id),
    [crossProductJob.id],
    "product B should only see its own candidate",
  );

  await expectReject(
    "job not found",
    () =>
      confirmScreenshotJobToCompetitor({
        productId: productA.id,
        jobId: 999999999,
        values: buildConfirmValues(`${runKey}_missing_job`),
      }),
    "不存在",
  );

  await expectReject(
    "wrong source type",
    () =>
      confirmScreenshotJobToCompetitor({
        productId: productA.id,
        jobId: wrongSourceJob.id,
        values: buildConfirmValues(`${runKey}_wrong_source`),
      }),
    "只有竞品截图草稿",
  );

  await expectReject(
    "product mismatch",
    () =>
      confirmScreenshotJobToCompetitor({
        productId: productB.id,
        jobId: successJob.id,
        values: buildConfirmValues(`${runKey}_mismatch`),
      }),
    "不属于这个商品",
  );

  await expectReject(
    "status not success",
    () =>
      confirmScreenshotJobToCompetitor({
        productId: productA.id,
        jobId: processingJob.id,
        values: buildConfirmValues(`${runKey}_processing`),
      }),
    "还没有可确认的识别结果",
  );

  await expectReject(
    "missing draft",
    () =>
      confirmScreenshotJobToCompetitor({
        productId: productA.id,
        jobId: missingDraftJob.id,
        values: buildConfirmValues(`${runKey}_missing_draft`),
      }),
    "还没有可确认的识别内容",
  );

  const createdCompetitor = await confirmScreenshotJobToCompetitor({
    productId: productA.id,
    jobId: successJob.id,
    values: buildConfirmValues(`${runKey}_confirmed_success`),
  });
  createdCompetitorIds.push(createdCompetitor.id);
  assert.equal(createdCompetitor.productId, productA.id);
  assert.equal(createdCompetitor.screenshotPath, successJob.imagePath);

  const confirmedJob = await prisma.screenshotRecognitionJob.findUnique({
    where: { id: successJob.id },
    select: {
      competitorId: true,
      needsUserConfirmation: true,
      confirmedDraft: true,
    },
  });
  assert.equal(confirmedJob?.competitorId, createdCompetitor.id);
  assert.equal(confirmedJob?.needsUserConfirmation, false);
  assert.ok(confirmedJob?.confirmedDraft, "confirmed draft should be preserved");

  await expectReject(
    "duplicate confirm blocked",
    () =>
      confirmScreenshotJobToCompetitor({
        productId: productA.id,
        jobId: successJob.id,
        values: buildConfirmValues(`${runKey}_duplicate`),
      }),
    "已经确认过正式竞品",
  );

  const postConfirmCandidates = await getCompetitorScreenshotDraftCandidates(productA.id);
  const postConfirmSuccessCandidate = postConfirmCandidates.find((candidate) => candidate.id === successJob.id);
  assert.ok(postConfirmSuccessCandidate, "confirmed candidate should still resolve");
  assert.equal(postConfirmSuccessCandidate?.canConfirmDirectly, false);
  assert.equal(postConfirmSuccessCandidate?.confirmStateLabel, "已转正式竞品");
  assert.equal(postConfirmSuccessCandidate?.linkedCompetitorId, createdCompetitor.id);

  summary = {
    runKey,
    productIds: createdProductIds,
    createdJobIds,
    createdCompetitorIds,
    checkedScenarios: [
      "readonly message source preserved",
      "confirmDraftJobId gating preserved",
      "draft panel warning copy preserved",
      "success confirmable candidate",
      "already linked candidate blocked",
      "wrong source type excluded",
      "cross-product isolation",
      "processing blocked",
      "failed blocked",
      "skipped blocked",
      "missing draft blocked",
      "low quality warning data",
      "privacy risk warning data",
      "uncertainty warning data",
      "job not found reject",
      "product mismatch reject",
      "duplicate confirm reject",
    ],
  };
} finally {
  await cleanup();
  const cleanupCounts = await Promise.all([
    prisma.product.count({
      where: {
        OR: [{ spu: { startsWith: VERIFY_PREFIX } }, { name: { startsWith: VERIFY_PREFIX } }],
      },
    }),
    prisma.competitor.count({
      where: {
        OR: [
          { title: { startsWith: VERIFY_PREFIX } },
          { sellerName: { startsWith: VERIFY_PREFIX } },
          { notes: { startsWith: VERIFY_PREFIX } },
        ],
      },
    }),
    prisma.screenshotRecognitionJob.count({
      where: {
        imagePath: { startsWith: VERIFY_PREFIX },
      },
    }),
  ]);
  console.log(
    JSON.stringify(
      {
        ...summary,
        cleanupCounts: {
          products: cleanupCounts[0],
          competitors: cleanupCounts[1],
          jobs: cleanupCounts[2],
        },
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}
