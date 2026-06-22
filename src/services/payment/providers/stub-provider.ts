import { PaymentStatus } from "@prisma/client";
import type {
  PaymentProviderId,
  PaymentRequest,
  PaymentResult,
} from "@/src/services/payment/types";
import type {
  PaymentProvider,
  ProviderPaymentResponse,
  ProviderWebhookPayload,
  ProviderWebhookResult,
} from "@/src/services/payment/types/provider";

export class StubPaymentProvider implements PaymentProvider {
  constructor(readonly id: PaymentProviderId) {}

  async createPayment(request: PaymentRequest): Promise<ProviderPaymentResponse> {
    return {
      success: true,
      status: PaymentStatus.PENDING,
      providerReference: request.providerReference ?? null,
    };
  }

  async capturePayment(providerPaymentId: string): Promise<PaymentResult> {
    void providerPaymentId;
    return {
      success: true,
      status: PaymentStatus.PROCESSING,
    };
  }

  async cancelPayment(providerPaymentId: string): Promise<PaymentResult> {
    void providerPaymentId;
    return {
      success: true,
      status: PaymentStatus.CANCELLED,
    };
  }

  async refundPayment(providerPaymentId: string): Promise<PaymentResult> {
    void providerPaymentId;
    return {
      success: true,
      status: PaymentStatus.REFUNDED,
    };
  }

  async parseWebhook(payload: ProviderWebhookPayload): Promise<ProviderWebhookResult> {
    void payload;
    throw new Error(`Webhook parsing is not implemented for provider: ${this.id}`);
  }
}
