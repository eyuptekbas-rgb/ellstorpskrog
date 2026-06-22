import { Decimal } from "@prisma/client/runtime/library";
import type { PaymentAmount } from "@/src/services/payment/types/decimal";

/** Swish Handel expects amounts as decimal strings with exactly two fraction digits. */
export function toSwishAmount(amount: PaymentAmount): string {
  return new Decimal(amount).toFixed(2);
}

export function orderTotalToSwishAmount(total: number): PaymentAmount {
  return new Decimal(total).toFixed(2);
}

export function parseSwishAmount(value: string): PaymentAmount {
  return new Decimal(value).toFixed(2);
}

export function swishAmountsMatch(
  expected: PaymentAmount,
  received: string
): boolean {
  return toSwishAmount(expected) === parseSwishAmount(received);
}
