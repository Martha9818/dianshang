export type AIValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errorSummary: string;
    };

export type AISchema<T> = {
  name: string;
  validate: (value: unknown) => value is T;
};

export function parseJsonObject(value: string): AIValidationResult<unknown> {
  try {
    return {
      success: true,
      data: JSON.parse(value),
    };
  } catch {
    return {
      success: false,
      errorSummary: "AI 返回格式不是有效 JSON。",
    };
  }
}

export function validateAIOutput<T>(value: unknown, schema: AISchema<T>): AIValidationResult<T> {
  if (schema.validate(value)) {
    return {
      success: true,
      data: value,
    };
  }

  return {
    success: false,
    errorSummary: `AI 输出不符合 ${schema.name} 结构要求。`,
  };
}

export function validateJsonAIOutput<T>(content: string, schema: AISchema<T>): AIValidationResult<T> {
  const parsed = parseJsonObject(content);
  if (!parsed.success) {
    return parsed;
  }

  return validateAIOutput(parsed.data, schema);
}
