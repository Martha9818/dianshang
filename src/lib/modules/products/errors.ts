export const BUSINESS_ERROR_CODES = {
  PREVIEW_READONLY: "PREVIEW_READONLY",
  LOCAL_DB_UNAVAILABLE: "LOCAL_DB_UNAVAILABLE",
  LOCAL_UPLOADS_UNAVAILABLE: "LOCAL_UPLOADS_UNAVAILABLE",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  PROVIDER_NOT_FOUND: "PROVIDER_NOT_FOUND",
  PROVIDER_IN_USE: "PROVIDER_IN_USE",
  PROVIDER_DISABLED: "PROVIDER_DISABLED",
  DEFAULT_PROVIDER_REQUIRED: "DEFAULT_PROVIDER_REQUIRED",
  AI_CALL_DISABLED: "AI_CALL_DISABLED",
  AI_CONFIG_INVALID: "AI_CONFIG_INVALID",
  AI_AUTH_FAILED: "AI_AUTH_FAILED",
  AI_MODEL_UNAVAILABLE: "AI_MODEL_UNAVAILABLE",
  AI_RATE_LIMITED: "AI_RATE_LIMITED",
  AI_INSUFFICIENT_BALANCE: "AI_INSUFFICIENT_BALANCE",
  AI_TIMEOUT: "AI_TIMEOUT",
  AI_RESPONSE_INVALID: "AI_RESPONSE_INVALID",
  COPYWRITING_GENERATING: "COPYWRITING_GENERATING",
  COPYWRITING_NOT_FOUND: "COPYWRITING_NOT_FOUND",
  BANNED_WORD_DUPLICATE: "BANNED_WORD_DUPLICATE",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export type BusinessErrorCode = (typeof BUSINESS_ERROR_CODES)[keyof typeof BUSINESS_ERROR_CODES];

export class ProductBusinessError extends Error {
  code: BusinessErrorCode;
  cause?: unknown;

  constructor(code: BusinessErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "ProductBusinessError";
    this.code = code;
    this.cause = options?.cause;
  }
}

export function isProductBusinessError(error: unknown): error is ProductBusinessError {
  return error instanceof ProductBusinessError;
}

export function getProductErrorMessage(error: unknown, fallbackMessage: string) {
  if (isProductBusinessError(error)) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}
