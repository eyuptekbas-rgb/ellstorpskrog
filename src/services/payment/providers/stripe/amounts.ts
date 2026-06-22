import type { PaymentAmount } from "@/src/services/payment/types/decimal";
import type { Iso4217Currency } from "@/src/services/payment/types/currencies";
import { Decimal } from "@prisma/client/runtime/library";

const ZERO_DECIMAL_CURRENCIES = new Set<Iso4217Currency>(["ISK"]);

export function amountToStripeMinorUnits(
  amount: PaymentAmount,
  currency: Iso4217Currency
): number {
  const value = new Decimal(amount);

  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return value.round().toNumber();
  }

  return value.mul(100).round().toNumber();
}

export function orderTotalToPaymentAmount(total: number): PaymentAmount {
  return new Decimal(total).toFixed(2);
}

export function stripeMinorUnitsToAmount(
  minorUnits: number,
  currency: Iso4217Currency
): PaymentAmount {
  const value = ZERO_DECIMAL_CURRENCIES.has(currency)
    ? new Decimal(minorUnits)
    : new Decimal(minorUnits).div(100);

  return value.toFixed(2);
}
