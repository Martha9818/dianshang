import { BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products";
import { estimateTokenCount } from "@/lib/services/ai/aiCostEstimator";
import { createAIRequestLog } from "@/lib/services/ai/aiRequestLogService";
import { sanitizeAIErrorSummary, sanitizePromptForAI, summarizePrompt } from "@/lib/services/ai/aiPromptSanitizer";
import type { AIImageResult, AIProviderConfig, AITextResult, GenerateImageInput, GenerateTextJsonInput } from "@/lib/services/ai/aiTypes";
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

type ImageGenerationResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
};

const PREVIEW_AI_MESSAGE = "预览环境只读，请在 Windows 本地验收 AI 调用。";
const PREVIEW_IMAGE_AI_MESSAGE = "预览环境只读，请在 Windows 本地验收 API 生图。";
const MAX_GENERATED_IMAGE_BYTES = 10 * 1024 * 1024;

function createBusinessError(code: string, message: string) {
  return new ProductBusinessError(code as never, message);
}

function ensureAICallsAllowed(message = PREVIEW_AI_MESSAGE) {
  const runtime = getRuntimeModeSummary();
  if (!runtime.isWritable) {
    throw createBusinessError(BUSINESS_ERROR_CODES.AI_CALL_DISABLED, message);
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function buildImageGenerationEndpoints(baseUrl: string) {
  const normalized = normalizeBaseUrl(baseUrl);
  const endpoints = [`${normalized}/images/generations`];

  try {
    const parsed = new URL(normalized);
    if (!/\/v1\/?$/.test(parsed.pathname)) {
      endpoints.push(`${normalized}/v1/images/generations`);
    }
  } catch {
    // validateImageProviderConfig and fetch will surface the invalid URL.
  }

  return Array.from(new Set(endpoints));
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

function inferGeneratedImageMimeType(buffer: Buffer): AIImageResult["mimeType"] {
  if (buffer.length >= 4 && buffer.toString("ascii", 1, 4) === "PNG") {
    return "image/png";
  }

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }

  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }

  throw createBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, "生图接口返回的不是受支持图片格式。");
}

function bufferFromBase64Image(value: string) {
  const normalized = value.includes(",") ? value.split(",").pop() ?? "" : value;
  return Buffer.from(normalized, "base64");
}

function assertGeneratedImageSize(buffer: Buffer) {
  if (buffer.length === 0) {
    throw createBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, "生图接口返回空图片。");
  }

  if (buffer.length > MAX_GENERATED_IMAGE_BYTES) {
    throw createBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, "生图结果超过 10MB，未保存到素材库。");
  }
}

export function sanitizeProviderErrorMessage(message: string) {
  let normalized = message;

  try {
    const parsed = JSON.parse(message) as {
      error?: { message?: unknown };
      message?: unknown;
    };
    const parsedMessage =
      typeof parsed.error?.message === "string"
        ? parsed.error.message
        : typeof parsed.message === "string"
          ? parsed.message
          : null;
    if (parsedMessage) {
      normalized = parsedMessage;
    }
  } catch {
    // Keep the original text and sanitize below.
  }

  if (/^\s*<(?:!doctype\s+html|html|head|body)\b/i.test(normalized)) {
    normalized = "接口返回网页 HTML，请确认 Base URL 是 OpenAI-compatible API 地址，通常需要以 /v1 结尾。";
  }

  normalized = normalized
    .replace(/request\s*id\s*[:=]\s*[a-z0-9_-]+/gi, "request id: [redacted]")
    .replace(/request[_-]?id[\"']?\s*[:=]\s*[\"']?[a-z0-9_-]+[\"']?/gi, "requestId: [redacted]");

  return sanitizeAIErrorSummary(normalized);
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

function validateImageProviderConfig(config: AIProviderConfig) {
  if (config.providerType !== "openai-compatible") {
    throw createBusinessError(BUSINESS_ERROR_CODES.AI_CONFIG_INVALID, "V1-Core 当前仅支持 openai-compatible。");
  }

  if (!config.baseUrl.trim() || !config.apiKey.trim()) {
    throw createBusinessError(BUSINESS_ERROR_CODES.AI_CONFIG_INVALID, "请完整填写 Base URL 和 API Key。");
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

async function fetchGeneratedImage(url: string, signal: AbortSignal) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") {
    throw createBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, "生图接口返回了不安全的图片地址。");
  }

  const response = await fetch(parsed, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw createBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, "下载生图结果失败。");
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_GENERATED_IMAGE_BYTES) {
    throw createBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, "生图结果超过 10MB，未保存到素材库。");
  }

  return Buffer.from(await response.arrayBuffer());
}

async function postImageGeneration(input: GenerateImageInput): Promise<AIImageResult> {
  ensureAICallsAllowed(PREVIEW_IMAGE_AI_MESSAGE);
  validateImageProviderConfig(input);

  const startedAt = Date.now();
  const sanitizedPrompt = sanitizePromptForAI(input.prompt);
  const inputTokenEstimate = estimateTokenCount(sanitizedPrompt);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000);
  const provider = input.providerType || "openai-compatible";

  try {
    const body = {
      ...(input.modelName.trim() ? { model: input.modelName.trim() } : {}),
      prompt: sanitizedPrompt,
      n: 1,
      size: input.size,
      response_format: "b64_json",
      ...(input.quality ? { quality: input.quality } : {}),
    };

    let parsed: ImageGenerationResponse | null = null;
    const endpoints = buildImageGenerationEndpoints(input.baseUrl);

    for (const [index, endpoint] of endpoints.entries()) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: buildHeaders(input.apiKey),
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      });

      const rawText = await response.text();
      const contentType = response.headers.get("content-type") ?? "";
      const isHtmlResponse = contentType.includes("text/html") || /^\s*<(?:!doctype\s+html|html|head|body)\b/i.test(rawText);
      const canTryNextEndpoint = isHtmlResponse && index < endpoints.length - 1;

      if (!response.ok) {
        if (canTryNextEndpoint) {
          continue;
        }
        throw translateAIError(response.status, rawText);
      }

      try {
        parsed = JSON.parse(rawText) as ImageGenerationResponse;
        break;
      } catch {
        if (canTryNextEndpoint) {
          continue;
        }
        throw createBusinessError(
          BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID,
          isHtmlResponse
            ? "生图接口返回网页 HTML，请确认 Base URL 是 OpenAI-compatible API 地址，通常需要以 /v1 结尾。"
            : "生图接口返回格式异常，无法解析响应。",
        );
      }
    }

    if (!parsed) {
      throw createBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, "生图接口返回格式异常，无法解析响应。");
    }

    const firstImage = parsed.data?.[0];
    if (!firstImage?.b64_json && !firstImage?.url) {
      throw createBusinessError(BUSINESS_ERROR_CODES.AI_RESPONSE_INVALID, "生图接口未返回图片。");
    }

    const imageBuffer = firstImage.b64_json
      ? bufferFromBase64Image(firstImage.b64_json)
      : await fetchGeneratedImage(firstImage.url!, controller.signal);
    assertGeneratedImageSize(imageBuffer);
    const mimeType = inferGeneratedImageMimeType(imageBuffer);
    const durationMs = Date.now() - startedAt;

    await createAIRequestLog({
      provider,
      model: input.modelName || "unknown",
      requestType: input.requestType,
      inputTokens: inputTokenEstimate,
      outputTokens: null,
      durationMs,
      success: true,
      inputSummary: input.inputSummary ?? summarizePrompt(sanitizedPrompt),
      relatedProductId: input.relatedProductId,
      relatedInspirationId: input.relatedInspirationId,
      relatedTaskId: input.relatedTaskId ?? input.jobId,
    });

    return {
      imageBuffer,
      mimeType,
      durationMs,
      source: firstImage.b64_json ? "b64_json" : "url",
    };
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
    async generateImage(input: Omit<GenerateImageInput, keyof AIProviderConfig>) {
      return postImageGeneration({
        ...config,
        ...input,
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
