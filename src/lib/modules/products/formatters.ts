function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatCurrency(value: number | null | undefined) {
  if (!isFiniteNumber(value)) {
    return "--";
  }

  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDecimal(value: number | null | undefined, digits = 2) {
  if (!isFiniteNumber(value)) {
    return "--";
  }

  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatInteger(value: number | null | undefined) {
  if (!isFiniteNumber(value)) {
    return "--";
  }

  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentFromRatio(value: number | null | undefined, digits = 2) {
  if (!isFiniteNumber(value)) {
    return "--";
  }

  return new Intl.NumberFormat("zh-CN", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function computeEstimatedNetProfit(input: {
  estimatedPrice?: number | null;
  estimatedCost?: number | null;
  estimatedShipping?: number | null;
  packagingCost?: number | null;
}) {
  if (!isFiniteNumber(input.estimatedPrice)) {
    return null;
  }

  return (
    input.estimatedPrice -
    (input.estimatedCost ?? 0) -
    (input.estimatedShipping ?? 0) -
    (input.packagingCost ?? 0)
  );
}

export function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) {
    return "--";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
