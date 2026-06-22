import { Decimal } from "@prisma/client/runtime/library";

export type PaymentAmount = string;

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function isValidPaymentAmount(value: string): boolean {
  if (!AMOUNT_PATTERN.test(value)) return false;
  const parsed = new Decimal(value);
  return parsed.gt(0);
}

export function amountStringToDecimal(value: PaymentAmount): Decimal {
  return new Decimal(value);
}

export function decimalToAmountString(value: Decimal): PaymentAmount {
  return value.toFixed(2);
}
