export function getTodayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatStatDelta(currentCount: number, previousCount: number) {
  const delta = currentCount - previousCount;
  if (delta > 0) return `+${delta}`;
  return String(delta);
}
