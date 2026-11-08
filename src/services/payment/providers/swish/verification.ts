import { swishAmountsMatch } from "./amounts";
import type { SwishCallbackPayload } from "./callback-parser";

export function validateSwishConfirmation(
  payment: { id: string; providerPaymentId: string | null; amount: string; currency: string },
  remote: SwishCallbackPayload,
  merchant: string
) {
  if (remote.id !== payment.providerPaymentId || remote.payeePaymentReference !== payment.id ||
      remote.payeeAlias !== merchant || remote.currency !== "SEK" || payment.currency !== "SEK" ||
      !remote.amount || !swishAmountsMatch(payment.amount, remote.amount) ||
      (remote.status === "PAID" && !remote.paymentReference?.trim())) {
    throw new Error("Swish confirmation does not match persisted payment");
  }
}
