export type NeedsRescoreInput = {
  productUpdatedAt: Date | null | undefined;
  latestCompetitorUpdatedAt: Date | null | undefined;
  latestScoreCreatedAt: Date | null | undefined;
};

export function getLatestScoringSourceUpdatedAt(input: {
  productUpdatedAt: Date | null | undefined;
  latestCompetitorUpdatedAt: Date | null | undefined;
}) {
  if (!input.productUpdatedAt) {
    return input.latestCompetitorUpdatedAt ?? null;
  }

  if (!input.latestCompetitorUpdatedAt || input.productUpdatedAt >= input.latestCompetitorUpdatedAt) {
    return input.productUpdatedAt;
  }

  return input.latestCompetitorUpdatedAt;
}

export function shouldNeedsRescore(input: NeedsRescoreInput) {
  if (!input.latestScoreCreatedAt) {
    return true;
  }

  const latestSourceUpdatedAt = getLatestScoringSourceUpdatedAt({
    productUpdatedAt: input.productUpdatedAt,
    latestCompetitorUpdatedAt: input.latestCompetitorUpdatedAt,
  });

  if (!latestSourceUpdatedAt) {
    return true;
  }

  return latestSourceUpdatedAt > input.latestScoreCreatedAt;
}
