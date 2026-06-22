import { webhookPayloadSchema } from "@/src/services/payment/validators/webhook";
import type { WebhookPayloadInput } from "@/src/services/payment/validators/webhook";

export async function validatePaymentWebhookPayload(input: WebhookPayloadInput) {
  return webhookPayloadSchema.parse(input);
}
