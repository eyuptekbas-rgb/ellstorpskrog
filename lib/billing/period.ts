import type { BillingPeriod } from "@/lib/billing/types";

export function getCurrentBillingPeriod(): BillingPeriod {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function getPreviousBillingPeriod(): BillingPeriod {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed previous month when day is 1
  if (month === 0) {
    return { year: now.getFullYear() - 1, month: 12 };
  }
  return { year: now.getFullYear(), month };
}

export function getPeriodBounds(period: BillingPeriod) {
  const start = new Date(Date.UTC(period.year, period.month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(period.year, period.month, 1, 0, 0, 0, 0));
  return { start, end };
}

export function getTodayBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return { start, end };
}

export function formatPeriodLabel(period: BillingPeriod): string {
  const date = new Date(Date.UTC(period.year, period.month - 1, 1));
  return date.toLocaleDateString("sv-SE", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function parsePeriodInput(
  year: unknown,
  month: unknown
): BillingPeriod | null {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) {
    return null;
  }
  return { year: y, month: m };
}
