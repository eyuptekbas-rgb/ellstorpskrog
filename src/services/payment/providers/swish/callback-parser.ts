import { PaymentStatus } from "@prisma/client";
import type { ProviderWebhookResult } from "@/src/services/payment/types/provider";
import { parseSwishAmount } from "@/src/services/payment/providers/swish/amounts";

export const SWISH_CALLBACK_STATUSES = [
  "PAID",
  "DECLINED",
  "ERROR",
  "CANCELLED",
  "CREATED",
] as const;

export type SwishCallbackStatus = (typeof SWISH_CALLBACK_STATUSES)[number];

export type SwishCallbackPayload = {
  id: string;
  payeePaymentReference?: string;
  paymentReference?: string;
  callbackUrl?: string;
  payerAlias?: string;
  payeeAlias?: string;
  amount?: string;
  currency?: string;
  message?: string;
  status?: SwishCallbackStatus;
  dateCreated?: string;
  datePaid?: string;
  errorCode?: string;
  errorMessage?: string;
};

export function isHandledSwishCallbackStatus(
  status: string | undefined
): status is SwishCallbackStatus {
  return SWISH_CALLBACK_STATUSES.includes(status as SwishCallbackStatus);
}

export function mapSwishStatusToPaymentStatus(
  status: SwishCallbackStatus
): PaymentStatus | null {
  switch (status) {
    case "PAID":
      return PaymentStatus.PAID;
    case "DECLINED":
    case "ERROR":
      return PaymentStatus.FAILED;
    case "CANCELLED":
      return PaymentStatus.CANCELLED;
    case "CREATED":
      return PaymentStatus.PENDING;
    default:
      return null;
  }
}

export function buildSwishCallbackEventId(payload: SwishCallbackPayload): string {
  const paidAt = payload.datePaid?.trim();
  return `${payload.id}:${payload.status ?? "UNKNOWN"}:${paidAt ?? payload.dateCreated ?? "unknown"}`;
}

export function parseSwishCallbackPayload(
  payload: SwishCallbackPayload
): ProviderWebhookResult | null {
  const status = payload.status;

  if (!status || !isHandledSwishCallbackStatus(status)) {
    return null;
  }

  const paymentStatus = mapSwishStatusToPaymentStatus(status);

  if (!paymentStatus || paymentStatus === PaymentStatus.PENDING) {
    return null;
  }

  const paymentId = payload.payeePaymentReference?.trim() || null;

  return {
    eventId: buildSwishCallbackEventId(payload),
    paymentId,
    orderId: null,
    status: paymentStatus,
    providerPaymentId: payload.id,
    providerReference: payload.paymentReference?.trim() ?? null,
  };
}

export function parseSwishCallbackBody(rawBody: string): SwishCallbackPayload {
  const parsed = JSON.parse(rawBody) as SwishCallbackPayload;

  if (!parsed?.id?.trim()) {
    throw new Error("Swish callback payload is missing id");
  }

  if (parsed.amount) {
    parsed.amount = parseSwishAmount(parsed.amount);
  }

  return parsed;
}

export function extractSwishBusinessIdFromCallbackUrl(
  callbackUrl: string | undefined
): string | null {
  if (!callbackUrl?.trim()) return null;

  try {
    const url = new URL(callbackUrl);
    return url.searchParams.get("businessId")?.trim() || null;
  } catch {
    return null;
  }
}

export type SwishRefundCallbackPayload = {
  id: string;
  paymentReference?: string;
  originalPaymentReference?: string;
  payerAlias?: string;
  payeeAlias?: string;
  amount?: string;
  currency?: string;
  message?: string;
  callbackUrl?: string;
  status?: "DEBITED" | "PAID" | "ERROR";
  dateCreated?: string;
  datePaid?: string;
  errorCode?: string;
  errorMessage?: string;
};

export function parseSwishRefundCallback(
  payload: SwishRefundCallbackPayload
): ProviderWebhookResult | null {
  if (payload.status !== "DEBITED") {
    return null;
  }

  return {
    eventId: `refund:${payload.id}:${payload.status}:${payload.datePaid ?? payload.dateCreated ?? "unknown"}`,
    paymentId: null,
    orderId: null,
    status: PaymentStatus.REFUNDED,
    providerPaymentId: null,
    providerReference: payload.originalPaymentReference?.trim() ?? null,
  };
}
