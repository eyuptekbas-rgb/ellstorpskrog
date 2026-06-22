import { PaymentStatus } from "@prisma/client";
import type Stripe from "stripe";
import type { ProviderWebhookResult } from "@/src/services/payment/types/provider";

const HANDLED_EVENTS = new Set([
  "checkout.session.completed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "charge.refunded",
]);

export function isHandledStripeWebhookEvent(type: string): boolean {
  return HANDLED_EVENTS.has(type);
}

function readMetaPaymentId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readMetaOrderId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function baseWebhookFields(
  event: Stripe.Event,
  metadata?: Record<string, string | undefined> | null
) {
  return {
    eventId: event.id,
    paymentId: readMetaPaymentId(metadata?.paymentId),
    orderId: readMetaOrderId(metadata?.orderId),
  };
}

function readPaymentIntentId(
  value: string | Stripe.PaymentIntent | null | undefined
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export function parseStripeWebhookEvent(
  event: Stripe.Event
): ProviderWebhookResult | null {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== "paid") {
        return null;
      }

      return {
        ...baseWebhookFields(event, session.metadata),
        status: PaymentStatus.PAID,
        providerPaymentId: session.id,
        providerReference: readPaymentIntentId(session.payment_intent),
      };
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      return {
        ...baseWebhookFields(event, paymentIntent.metadata),
        status: PaymentStatus.PAID,
        providerPaymentId: readMetaPaymentId(paymentIntent.metadata?.sessionId),
        providerReference: paymentIntent.id,
      };
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      return {
        ...baseWebhookFields(event, paymentIntent.metadata),
        status: PaymentStatus.FAILED,
        providerPaymentId: readMetaPaymentId(paymentIntent.metadata?.sessionId),
        providerReference: paymentIntent.id,
      };
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntent = charge.payment_intent;
      const paymentIntentMetadata =
        typeof paymentIntent === "object" && paymentIntent
          ? paymentIntent.metadata
          : undefined;

      const mergedMetadata = {
        ...paymentIntentMetadata,
        ...charge.metadata,
      };

      return {
        ...baseWebhookFields(event, mergedMetadata),
        status: PaymentStatus.REFUNDED,
        providerPaymentId:
          readMetaPaymentId(charge.metadata?.sessionId) ??
          readMetaPaymentId(paymentIntentMetadata?.sessionId),
        providerReference: readPaymentIntentId(charge.payment_intent),
      };
    }

    default:
      return null;
  }
}

export function extractStripeBusinessId(event: Stripe.Event): string | null {
  const object = event.data.object as {
    metadata?: Record<string, string | undefined>;
  };

  return (
    object.metadata?.businessId?.trim() ||
    object.metadata?.tenantId?.trim() ||
    null
  );
}
