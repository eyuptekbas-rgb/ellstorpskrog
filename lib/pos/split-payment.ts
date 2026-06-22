import type { PaymentMethod } from "@prisma/client";
import type { PaymentAmount } from "@/src/services/payment/types/decimal";

export type SplitPaymentLine = {
  method: PaymentMethod;
  amount: PaymentAmount;
};

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

function isValidAmount(value: string): boolean {
  if (!AMOUNT_PATTERN.test(value)) return false;
  return Number.parseFloat(value) > 0;
}

export function orderTotalToAmount(totalKr: number): PaymentAmount {
  return totalKr.toFixed(2);
}

export function parseAmountKr(value: PaymentAmount | string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sumSplitPayments(lines: SplitPaymentLine[]): number {
  return lines.reduce((sum, line) => sum + parseAmountKr(line.amount), 0);
}

export function remainingBalance(
  lines: SplitPaymentLine[],
  orderTotalKr: number
): number {
  return Math.max(0, orderTotalKr - sumSplitPayments(lines));
}

export function calculateChange(cashReceivedKr: number, dueKr: number): number {
  return Math.max(0, cashReceivedKr - dueKr);
}

export function validateSplitPayments(
  lines: SplitPaymentLine[],
  orderTotalKr: number
): boolean {
  if (lines.length === 0) return false;
  if (!lines.every((line) => isValidAmount(line.amount))) return false;
  const total = sumSplitPayments(lines);
  return Math.abs(total - orderTotalKr) < 0.01;
}

export function formatKr(amount: number): string {
  return `${amount.toFixed(0)} kr`;
}

export function formatAmountKr(amount: number): PaymentAmount {
  return amount.toFixed(2);
}
