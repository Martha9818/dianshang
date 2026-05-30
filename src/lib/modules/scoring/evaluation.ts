import { buildDeductionReasons, buildNextSuggestions } from "@/lib/modules/scoring/feedback";
import { deriveRecommendation } from "@/lib/modules/scoring/recommendation";
import { buildScoreComponents, buildScoreDimensions, getVetoReasons } from "@/lib/modules/scoring/rules";
import type {
  ManualRiskValues,
  ScoreEvaluation,
  ScoringSourceCompetitor,
  ScoringSourceProduct,
} from "@/lib/modules/scoring/types";

function buildManualRiskValues(input: {
  manualRegulatedRisk: boolean;
  manualInfringementRisk: boolean;
  manualRiskNotes: string | null;
}): ManualRiskValues {
  return {
    manualRegulatedRisk: input.manualRegulatedRisk,
    manualInfringementRisk: input.manualInfringementRisk,
    manualRiskNotes: input.manualRiskNotes,
  };
}

export function evaluateScore(
  product: ScoringSourceProduct,
  competitors: ScoringSourceCompetitor[],
  now = new Date(),
): ScoreEvaluation {
  const { components, flags } = buildScoreComponents(product, competitors, now);
  const dimensions = buildScoreDimensions(components);
  const vetoReasons = getVetoReasons(product, flags, dimensions);
  const recommendation = deriveRecommendation({
    product,
    flags,
    dimensions,
    vetoReasons,
  });

  return {
    manualRisk: buildManualRiskValues(product),
    components,
    dimensions,
    flags: {
      ...flags,
      vetoReasons,
    },
    recommendation: recommendation.recommendation,
    recommendationNote: recommendation.recommendationNote,
    productStatus: recommendation.productStatus,
    deductionReasons: buildDeductionReasons({
      product,
      flags: {
        ...flags,
        vetoReasons,
      },
      dimensions,
      vetoReasons,
    }),
    nextSuggestions: buildNextSuggestions({
      product,
      flags: {
        ...flags,
        vetoReasons,
      },
      dimensions,
      recommendation: recommendation.recommendation,
    }),
  };
}
