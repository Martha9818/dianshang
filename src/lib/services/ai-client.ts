import { getAIProviderById } from "@/lib/services/ai-provider-service";
import {
  createAIClient,
  sanitizeProviderErrorMessage,
  testConnectionWithConfig as testConnectionWithAIConfig,
  type GenerateTextJsonInput,
} from "@/lib/services/ai";

type TestConnectionConfig = {
  baseUrl: string;
  apiKey: string;
  modelName: string;
  providerType: string;
};

type LegacyGenerateRequestInput = TestConnectionConfig & {
  prompt: string;
  imageDataUrl?: string | null;
  preferStructuredOutput?: boolean;
  responseSchema?: unknown;
  requestType?: GenerateTextJsonInput["requestType"];
  inputSummary?: string | null;
  relatedProductId?: number | null;
  relatedInspirationId?: number | null;
  relatedTaskId?: number | null;
  jobId?: number | null;
};

export async function testConnection(providerId: number) {
  const provider = await getAIProviderById(providerId);
  return testConnectionWithConfig({
    baseUrl: provider.baseUrl ?? "",
    apiKey: provider.apiKey ?? "",
    modelName: provider.modelName ?? "",
    providerType: provider.providerType,
  });
}

export async function testConnectionWithConfig(config: TestConnectionConfig) {
  return testConnectionWithAIConfig(config);
}

export async function generateTextJson(input: LegacyGenerateRequestInput) {
  const client = createAIClient({
    baseUrl: input.baseUrl,
    apiKey: input.apiKey,
    modelName: input.modelName,
    providerType: input.providerType,
  });

  return client.generateTextJson({
    prompt: input.prompt,
    imageDataUrl: input.imageDataUrl,
    preferStructuredOutput: input.preferStructuredOutput,
    responseSchema: input.responseSchema,
    requestType: input.requestType ?? "general",
    inputSummary: input.inputSummary,
    relatedProductId: input.relatedProductId,
    relatedInspirationId: input.relatedInspirationId,
    relatedTaskId: input.relatedTaskId,
    jobId: input.jobId,
  });
}

export { sanitizeProviderErrorMessage };
