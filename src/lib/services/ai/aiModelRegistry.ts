import type { AIModelDefinition, AIModelPurpose } from "@/lib/services/ai/aiTypes";

const MODEL_REGISTRY: AIModelDefinition[] = [
  {
    provider: "openai-compatible",
    model: "gpt-4o-mini",
    purpose: "text",
    label: "GPT-4o mini text",
    inputPricePerMillionTokens: 0.15,
    outputPricePerMillionTokens: 0.6,
    currency: "USD",
  },
  {
    provider: "openai-compatible",
    model: "gpt-4o",
    purpose: "vision",
    label: "GPT-4o vision",
    inputPricePerMillionTokens: 5,
    outputPricePerMillionTokens: 15,
    currency: "USD",
  },
  {
    provider: "openai-compatible",
    model: "image-model-placeholder",
    purpose: "image",
    label: "Future image model placeholder",
    notes: "Reserved for future V1.5/V2 image generation. V1-Core does not call it.",
  },
];

export function listRegisteredAIModels(purpose?: AIModelPurpose) {
  return MODEL_REGISTRY.filter((model) => (purpose ? model.purpose === purpose : true));
}

export function getRegisteredAIModel(provider: string, modelName: string) {
  return MODEL_REGISTRY.find(
    (item) => item.provider === provider && item.model.toLowerCase() === modelName.trim().toLowerCase(),
  );
}

export function getFallbackModelDefinition(provider: string, modelName: string, purpose: AIModelPurpose = "text"): AIModelDefinition {
  return {
    provider,
    model: modelName,
    purpose,
    label: modelName,
    currency: "USD",
    notes: "No local price preset; cost estimate may be unavailable.",
  };
}
