import { z } from "zod";
import { PAYMENT_PROVIDERS, PAYMENT_STATUSES } from "@/src/services/payment/types";

export const webhookPayloadSchema = z.object({
  businessId: z.string().cuid(),
  provider: z.enum(PAYMENT_PROVIDERS),
  headers: z.instanceof(Headers),
  rawBody: z.string().min(1),
  verifiedEvent: z.unknown().optional(),
});

export const normalizedWebhookEventSchema = z.object({
  provider: z.enum(PAYMENT_PROVIDERS),
  eventId: z.string().trim().min(1),
  providerPaymentId: z.string().trim().min(1).optional(),
  providerReference: z.string().trim().min(1).optional(),
  status: z.enum(PAYMENT_STATUSES),
});

export type WebhookPayloadInput = z.infer<typeof webhookPayloadSchema>;
export type NormalizedWebhookEvent = z.infer<
  typeof normalizedWebhookEventSchema
>;
