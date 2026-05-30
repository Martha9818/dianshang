import process from "node:process";
import { pathToFileURL } from "node:url";
import type {
  AcceptanceFixtureInputCompetitor,
  AcceptanceFixtureInputProduct,
} from "@/lib/modules/scoring/fixtures";
import { THREAD03_ACCEPTANCE_FIXTURES } from "@/lib/modules/scoring/fixtures";
import { evaluateScore } from "@/lib/modules/scoring/evaluation";
import type { ManualRiskValues, ScoringSourceCompetitor, ScoringSourceProduct } from "@/lib/modules/scoring/types";

function buildProduct(input: AcceptanceFixtureInputProduct, manualRisk: ManualRiskValues): ScoringSourceProduct {
  return {
    ...input,
    ...manualRisk,
    updatedAt: new Date(input.updatedAt),
  };
}

function buildCompetitors(items: AcceptanceFixtureInputCompetitor[]): ScoringSourceCompetitor[] {
  return items.map((item) => ({
    ...item,
    dataDate: new Date(item.dataDate),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
  }));
}

function verifyFixtures() {
  const failures: string[] = [];

  for (const fixture of THREAD03_ACCEPTANCE_FIXTURES) {
    const evaluation = evaluateScore(
      buildProduct(fixture.product, fixture.manualRisk),
      buildCompetitors(fixture.competitors),
      new Date(fixture.now),
    );

    if (evaluation.recommendation !== fixture.expectedRecommendation) {
      failures.push(
        `[${fixture.id}] ${fixture.title}: expected "${fixture.expectedRecommendation}" but got "${evaluation.recommendation}"`,
      );
    }
  }

  if (failures.length > 0) {
    console.error("Thread 03 score verification failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Thread 03 score verification passed (${THREAD03_ACCEPTANCE_FIXTURES.length} cases).`);
  process.exit(0);
}

void pathToFileURL(import.meta.url);
verifyFixtures();
