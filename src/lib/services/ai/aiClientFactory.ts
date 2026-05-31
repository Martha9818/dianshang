import { BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products";
import { estimateTokenCount } from "@/lib/services/ai/aiCostEstimator";
import { createAIRequestLog } from "@/lib/services/ai/aiRequestLogService";
import { sanitizeAIErrorSummary, sanitizePromptForAI, summarizePrompt } from "@/lib/services/ai/aiPromptSanitizer";
import type { AIProviderConfig, AITextResult, GenerateTextJsonInput } from "@/lib/services/ai/aiTypes";
import { getRuntimeModeSummary } from "@/lib/services/runtime";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

const PREVIEW_AI_MESSAGE = "预览环境只读，请在 Windows 本地验收 AI 调用。";

function createBusinessError(code: string, message: string) {
  return new ProductBusinessError(code as never, message);
}

function ensureAICallsAllowed() {
  const runtime = getRuntimeModeSummary();
  if (!runtime.isWritable) {
    throw createBusinessError(BUSINESS_ERROR_CODES.AI_CALL_DISABLED, PREVIEW_AI_MESSAGE);
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function extractTextContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (item && typeof item === "object" && "text" in item ? String(item.text ?? "") : ""))
      .join("");
  }

  return "";
}

function buildHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

export function sanitizeProviderErrorMessage(message: string) {
  return sanitizeAIErrorSummary(message);
}

function translateAIError(status: number, message: string) {
  const normalizedMessage = sanitizeProviderErrorMessage(message);

  if (status === 401 || status === 403) {
    return createBusinessError(BUSINESS_ERROR_CODES.AI_AUTH_FAILED, "认证失败，请检查 API Key。");
  }

  if (status === 404 || /model/i.test(normalizedMessage)) {
    return createBusinessError(BUSINESS_ERROR_CODES.AI_MODEL_UNAVAILABLE, "模型不可用，请检查模型名。");
  }

  if (status === 429 && /insufficient|balance|quota/i.test(normalizedMessage)) {
    return createBusinessError(BUSINESS_ERROR_CODES.AI_INSUFFICIENT_BALANCE, `余额不足或额度受限：${normalizedMessage}`);
  }

  if (status === 429) {
    return createBusinessError(BUSINESS_ERROR_CODES.AI_RATE_LIMITED, `请求过于频繁：${normalizedMessage}`);
  }

  return createBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, normalizedMessage || "AI 请求失败，请稍后重试。");
}

function validateProviderConfig(config: AIProviderConfig) {
  if (config.providerType !== "openai-compatible") {
    throw createBusinessError(BUSINESS_ERROR_CODES.AI_CONFIG_INVALID, "V1-Core 当前仅支持 openai-compatible。");
  }

  if (!config.baseUrl.trim() || !config.apiKey.trim() || !config.modelName.trim()) {
    throw createBusinessError(BUSINESS_ERROR_CODES.AI_CONFIG_INVALID, "请完整填写 Base URL、API Key 和模型名。");
  }
}

async function postChatCompletion(input: GenerateTextJsonInput & { structuredOutput: boolean }): Promise<AITextResult> {
  ensureAICallsAllowed();
  validateProviderConfig(input);

  const startedAt = Date.now();
  const sanitizedPrompt = sanitizePromptForAI(input.prompt);
  const inputTokenEstimate = estimateTokenCount(sanitizedPrompt);
  const controller = new AbortController();
  const timeoutMs = input.imageDataUrl ? 45000 : 20000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const provider = input.providerType || "openai-compatible";

  try {
    const endpoint = `${normalizeBaseUrl(input.baseUrl)}/chat/completions`;
    const promptContent = input.imageDataUrl
      ? [
          {
            type: "text",
            text: sanitizedPrompt,
          },
          {
            type: "image_url",
            image_url: {
              url: input.imageDataUrl,
            },
          },
        ]
      : sanitizedPrompt;
    const body = {
      model: input.modelName,
      messages: [
        {
          role: "user",
          content: promptContent,
        },
      ],
      temperature: 0.7,
      ...(input.structuredOutput && input.responseSchema
        ? {
            response_format: {
              type: "json_schema",
              json_schema: input.responseSchema,
            },
          }
        : {}),
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: buildHeaders(input.apiKey),
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw translateAIError(response.status, rawText);
    }

    let parsed: ChatCompletionResponse | null = null;
    try {
      parsed = JSON.parse(rawText) as ChatCompletionResponse;
    } catch {
      throw createBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, "AI 返回格式异常，无法解析响应。");
    }

    const content = extractTextContent(parsed.choices?.[0]?.message?.content);
    if (!content.trim()) {
      throw createBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, "AI 返回为空，请稍后重试。");
    }

    const durationMs = Date.now() - startedAt;
    const result = {
      rawText,
      content,
      inputTokens: parsed.usage?.prompt_tokens ?? inputTokenEstimate,
      outputTokens: parsed.usage?.completion_tokens ?? estimateTokenCount(content),
      durationMs,
    };

    await createAIRequestLog({
      provider,
      model: input.modelName,
      requestType: input.requestType,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs,
      success: true,
      inputSummary: input.inputSummary ?? summarizePrompt(sanitizedPrompt),
      relatedProductId: input.relatedProductId,
      relatedInspirationId: input.relatedInspirationId,
      relatedTaskId: input.relatedTaskId ?? input.jobId,
    });

    return result;
  } catch (error) {
    const safeError = error instanceof ProductBusinessError ? error : normalizeUnknownAIError(error);
    await createAIRequestLog({
      provider,
      model: input.modelName || "unknown",
      requestType: input.requestType,
      inputTokens: inputTokenEstimate,
      outputTokens: null,
      durationMs: Date.now() - startedAt,
      success: false,
      errorSummary: safeError.message,
      inputSummary: input.inputSummary ?? summarizePrompt(sanitizedPrompt),
      relatedProductId: input.relatedProductId,
      relatedInspirationId: input.relatedInspirationId,
      relatedTaskId: input.relatedTaskId ?? input.jobId,
    });
    throw safeError;
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeUnknownAIError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return createBusinessError(BUSINESS_ERROR_CODES.AI_TIMEOUT, "网络超时，请重试。");
  }

  if (error instanceof Error) {
    if (error instanceof TypeError && /fetch failed|failed to fetch|network|econnrefused|enotfound|eai_again/i.test(error.message)) {
      return createBusinessError(
        BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID,
        "连接 AI 服务失败，请检查 Base URL、网络连接或稍后重试。",
      );
    }

    return createBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, sanitizeAIErrorSummary(error.message));
  }

  return createBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, "AI 请求失败，请稍后重试。");
}

export function createAIClient(config: AIProviderConfig) {
  return {
    async generateTextJson(input: Omit<GenerateTextJsonInput, keyof AIProviderConfig>) {
      if (input.preferStructuredOutput) {
        try {
          return await postChatCompletion({
            ...config,
            ...input,
            structuredOutput: true,
          });
        } catch (error) {
          if (
            error instanceof ProductBusinessError &&
            (error.code === BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID || error.code === BUSINESS_ERROR_CODES.AI_MODEL_UNAVAILABLE)
          ) {
            return postChatCompletion({
              ...config,
              ...input,
              structuredOutput: false,
            });
          }

          throw error;
        }
      }

      return postChatCompletion({
        ...config,
        ...input,
        structuredOutput: false,
      });
    },
  };
}

export async function testConnectionWithConfig(config: AIProviderConfig) {
  const client = createAIClient(config);
  const startedAt = Date.now();
  await client.generateTextJson({
    requestType: "provider-test",
    prompt: '请返回严格 JSON：{"ok":true}',
    inputSummary: "AI provider connection test",
    preferStructuredOutput: false,
  });

  return {
    success: true,
    latencyMs: Date.now() - startedAt,
    modelName: config.modelName,
  };
}
