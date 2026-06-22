import type { PaymentMethod } from "@prisma/client";
import type {
  PaymentProviderId,
  PaymentRequest,
  PaymentResult,
} from "@/src/services/payment/types";
import type { PaymentAmount } from "@/src/services/payment/types/decimal";

export type ProviderPaymentResponse = PaymentResult & {
  redirectUrl?: string;
};

export type ProviderWebhookResult = {
  providerPaymentId?: string | null;
  providerReference?: string | null;
  status: PaymentResult["status"];
  eventId: string;
  paymentId?: string | null;
  orderId?: string | null;
};

export type ProviderWebhookPayload = {
  headers: Headers;
  rawBody: string;
  businessId?: string;
  verifiedEvent?: unknown;
};

export interface PaymentProvider {
  readonly id: PaymentProviderId;

  createPayment(request: PaymentRequest): Promise<ProviderPaymentResponse>;

  capturePayment(providerPaymentId: string): Promise<PaymentResult>;

  cancelPayment(providerPaymentId: string): Promise<PaymentResult>;

  refundPayment(
    providerPaymentId: string,
    amount?: PaymentAmount
  ): Promise<PaymentResult>;

  parseWebhook(payload: ProviderWebhookPayload): Promise<ProviderWebhookResult>;
}

export interface PaymentProviderRegistry {
  resolveProviderId(method: PaymentMethod): PaymentProviderId;

  getProvider(providerId: PaymentProviderId): PaymentProvider;
}
