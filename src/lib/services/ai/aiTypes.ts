export type AIProviderType = "openai-compatible";

export type AIModelPurpose = "text" | "vision" | "image";

export type AIRequestType =
  | "copywriting"
  | "inspiration_vision"
  | "screenshot_recognition"
  | "competitor_analysis"
  | "provider-test"
  | "vision-preview"
  | "image-preview"
  | "general";

export type AIJobStatus = "pending" | "running" | "success" | "failed" | "cancelled";

export type AIModelDefinition = {
  provider: string;
  model: string;
  purpose: AIModelPurpose;
  label: string;
  inputPricePerMillionTokens?: number;
  outputPricePerMillionTokens?: number;
  currency?: string;
  notes?: string;
};

export type AIProviderConfig = {
  providerType: AIProviderType | string;
  providerName?: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
};

export type AIRequestContext = {
  requestType: AIRequestType;
  inputSummary?: string | null;
  relatedProductId?: number | null;
  relatedInspirationId?: number | null;
  relatedTaskId?: number | null;
  jobId?: number | null;
};

export type GenerateTextJsonInput = AIProviderConfig &
  AIRequestContext & {
    prompt: string;
    imageDataUrl?: string | null;
    preferStructuredOutput?: boolean;
    responseSchema?: unknown;
  };

export type AITextResult = {
  rawText: string;
  content: string;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number;
};

export type AIJobCreateInput = {
  jobType: string;
  idempotencyKey?: string | null;
  relatedProductId?: number | null;
  relatedInspirationId?: number | null;
  inputSummary?: string | null;
};

export type AIRequestLogInput = {
  provider: string;
  model: string;
  requestType: AIRequestType | string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  durationMs?: number | null;
  success: boolean;
  errorSummary?: string | null;
  inputSummary?: string | null;
  relatedProductId?: number | null;
  relatedInspirationId?: number | null;
  relatedTaskId?: number | null;
};
