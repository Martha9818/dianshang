import { BUSINESS_ERROR_CODES, ProductBusinessError } from "@/lib/modules/products/errors";

export const RUNTIME_MODE_VALUES = ["local", "preview", "cloud"] as const;

export type RuntimeMode = (typeof RUNTIME_MODE_VALUES)[number];

function isRuntimeMode(value: string): value is RuntimeMode {
  return (RUNTIME_MODE_VALUES as readonly string[]).includes(value);
}

function getExplicitRuntimeMode() {
  const value = process.env.ECOMPILOT_RUNTIME_MODE?.trim().toLowerCase();

  if (!value) {
    return null;
  }

  return isRuntimeMode(value) ? value : null;
}

export function isVercel() {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

export function getRuntimeMode(): RuntimeMode {
  if (isVercel()) {
    return "preview";
  }

  const explicitMode = getExplicitRuntimeMode();
  return explicitMode ?? "local";
}

export function isLocalWritable(mode = getRuntimeMode()) {
  return mode === "local" && !isVercel();
}

export function isWritableRuntime(mode = getRuntimeMode()) {
  return isLocalWritable(mode);
}

export function isPreviewRuntime(mode = getRuntimeMode()) {
  return mode === "preview";
}

export function isCloudRuntime(mode = getRuntimeMode()) {
  return mode === "cloud";
}

export function getRuntimeModeLabel(mode = getRuntimeMode()) {
  switch (mode) {
    case "local":
      return "Windows 本地";
    case "preview":
      return "Preview 预览";
    case "cloud":
      return "Cloud 预留模式";
    default:
      return mode;
  }
}

export function buildReadonlyRuntimeMessage(mode = getRuntimeMode()) {
  if (mode === "cloud") {
    return "Cloud 模式仍为预留能力，请先在 Windows 本地验收。";
  }

  return "预览环境只读，请在 Windows 本地验收。";
}

export function getRuntimeModeSummary() {
  const mode = getRuntimeMode();

  return {
    mode,
    label: getRuntimeModeLabel(mode),
    isVercel: isVercel(),
    isWritable: isLocalWritable(mode),
    readonlyMessage: isLocalWritable(mode) ? null : buildReadonlyRuntimeMessage(mode),
  };
}

export function assertLocalWritable() {
  const mode = getRuntimeMode();

  if (!isLocalWritable(mode)) {
    throw new ProductBusinessError(BUSINESS_ERROR_CODES.PREVIEW_READONLY, buildReadonlyRuntimeMessage(mode));
  }
}
