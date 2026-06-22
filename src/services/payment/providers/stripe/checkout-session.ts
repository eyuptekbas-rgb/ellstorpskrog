import type Stripe from "stripe";
import type { PaymentMethod } from "@prisma/client";
import type { PaymentRequest } from "@/src/services/payment/types";

/** Checkout Sessions support card + wallet express checkout (Apple Pay, Google Pay). */
export const STRIPE_CHECKOUT_PAYMENT_METHODS: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] =
  ["card"];

export function resolveCheckoutMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case "APPLE_PAY":
      return "apple_pay";
    case "GOOGLE_PAY":
      return "google_pay";
    default:
      return "card";
  }
}

export type BuildCheckoutSessionInput = {
  request: PaymentRequest;
  order: {
    id: string;
    orderNumber: string;
    customerEmail: string;
    items: Array<{ productName: string; unitPrice: { toString(): string }; quantity: number }>;
  };
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  baseUrl: string;
  currency: string;
};

export function buildStripeCheckoutMetadata(
  request: PaymentRequest,
  order: { id: string; orderNumber: string }
): Record<string, string> {
  return {
    businessId: request.businessId,
    tenantId: request.businessId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentId: request.paymentId ?? "",
    checkoutMethod: resolveCheckoutMethodLabel(request.method),
  };
}

export function buildStripeCheckoutSessionParams(
  input: BuildCheckoutSessionInput
): Stripe.Checkout.SessionCreateParams {
  const { request, order, lineItems, baseUrl } = input;
  const metadata = buildStripeCheckoutMetadata(request, order);

  return {
    mode: "payment",
    locale: "sv",
    customer_email: order.customerEmail,
    client_reference_id: order.id,
    line_items: lineItems,
    payment_method_types: STRIPE_CHECKOUT_PAYMENT_METHODS,
    payment_method_options: {
      card: {
        request_three_d_secure: "automatic",
      },
    },
    metadata,
    payment_intent_data: {
      metadata: {
        ...metadata,
      },
    },
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout/cancel?order_id=${order.id}`,
  };
}
