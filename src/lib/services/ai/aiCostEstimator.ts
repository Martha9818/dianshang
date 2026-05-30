import { getFallbackModelDefinition, getRegisteredAIModel } from "@/lib/services/ai/aiModelRegistry";

export function estimateTokenCount(text: string) {
  const normalized = text.trim();
  if (!normalized) {
    return 0;
  }

  return Math.max(1, Math.ceil(normalized.length / 4));
}

export function estimateAICost(input: {
  provider: string;
  model: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
}) {
  const inputTokens = input.inputTokens ?? null;
  const outputTokens = input.outputTokens ?? null;
  const model =
    getRegisteredAIModel(input.provider, input.model) ?? getFallbackModelDefinition(input.provider, input.model, "text");

  const priceSnapshot = {
    provider: model.provider,
    model: model.model,
    inputPricePerMillionTokens: model.inputPricePerMillionTokens ?? null,
    outputPricePerMillionTokens: model.outputPricePerMillionTokens ?? null,
    currency: model.currency ?? "USD",
    source: "local-estimate-registry",
  };

  if (
    inputTokens === null ||
    outputTokens === null ||
    model.inputPricePerMillionTokens === undefined ||
    model.outputPricePerMillionTokens === undefined
  ) {
    return {
      estimatedCost: null,
      currency: model.currency ?? "USD",
      unitPriceSnapshot: JSON.stringify(priceSnapshot),
    };
  }

  const estimatedCost =
    (inputTokens / 1_000_000) * model.inputPricePerMillionTokens +
    (outputTokens / 1_000_000) * model.outputPricePerMillionTokens;

  return {
    estimatedCost: Number(estimatedCost.toFixed(8)),
    currency: model.currency ?? "USD",
    unitPriceSnapshot: JSON.stringify(priceSnapshot),
  };
}
