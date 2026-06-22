import { paymentProviderRegistry } from "@/src/services/payment/providers/registry";
import { paymentService } from "@/src/services/payment/server/payment-service";
import { PaymentWebhookService } from "@/src/services/payment/server/webhooks/payment-webhook-service";

export const paymentWebhookService = new PaymentWebhookService(
  paymentProviderRegistry,
  paymentService
);
