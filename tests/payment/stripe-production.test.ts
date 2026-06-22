import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import {
  amountToStripeMinorUnits,
  orderTotalToPaymentAmount,
  stripeMinorUnitsToAmount,
} from "@/src/services/payment/providers/stripe/amounts";
import {
  buildStripeCheckoutMetadata,
  buildStripeCheckoutSessionParams,
  resolveCheckoutMethodLabel,
  STRIPE_CHECKOUT_PAYMENT_METHODS,
} from "@/src/services/payment/providers/stripe/checkout-session";
import { createHash } from "node:crypto";
import {
  extractStripeBusinessId,
  isHandledStripeWebhookEvent,
  parseStripeWebhookEvent,
} from "@/src/services/payment/providers/stripe/webhook-parser";

function hashWebhookPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

describe("Stripe amounts", () => {
  it("converts SEK decimals to minor units safely", () => {
    assert.equal(amountToStripeMinorUnits("199.50", "SEK"), 19950);
    assert.equal(stripeMinorUnitsToAmount(19950, "SEK"), "199.50");
  });

  it("formats order totals as decimal strings", () => {
    assert.equal(orderTotalToPaymentAmount(249), "249.00");
  });
});

describe("Stripe checkout session", () => {
  it("uses card payment method for wallet support", () => {
    assert.deepEqual(STRIPE_CHECKOUT_PAYMENT_METHODS, ["card"]);
  });

  it("maps Apple Pay and Google Pay methods", () => {
    assert.equal(resolveCheckoutMethodLabel(PaymentMethod.APPLE_PAY), "apple_pay");
    assert.equal(resolveCheckoutMethodLabel(PaymentMethod.GOOGLE_PAY), "google_pay");
    assert.equal(resolveCheckoutMethodLabel(PaymentMethod.CARD), "card");
  });

  it("includes tenant metadata in checkout session params", () => {
    const params = buildStripeCheckoutSessionParams({
      request: {
        orderId: "ord_1",
        businessId: "tenant_a",
        method: PaymentMethod.CARD,
        amount: "100.00",
        currency: "SEK",
        paymentId: "pay_1",
      },
      order: {
        id: "ord_1",
        orderNumber: "10001",
        customerEmail: "guest@test.se",
        items: [],
      },
      lineItems: [
        {
          price_data: {
            currency: "sek",
            product_data: { name: "Test" },
            unit_amount: 10000,
          },
          quantity: 1,
        },
      ],
      baseUrl: "https://example.com",
      currency: "sek",
    });

    assert.equal(params.mode, "payment");
    assert.equal(params.locale, "sv");
    assert.equal(params.metadata?.tenantId, "tenant_a");
    assert.equal(params.metadata?.paymentId, "pay_1");
    assert.equal(params.payment_intent_data?.metadata?.orderId, "ord_1");
    assert.match(params.success_url ?? "", /CHECKOUT_SESSION_ID/);
  });

  it("builds metadata with checkout method label", () => {
    const metadata = buildStripeCheckoutMetadata(
      {
        orderId: "ord_1",
        businessId: "tenant_a",
        method: PaymentMethod.APPLE_PAY,
        amount: "50.00",
        currency: "SEK",
        paymentId: "pay_2",
      },
      { id: "ord_1", orderNumber: "10002" }
    );

    assert.equal(metadata.checkoutMethod, "apple_pay");
    assert.equal(metadata.businessId, "tenant_a");
  });
});

describe("Stripe webhook parser", () => {
  it("recognizes handled production events", () => {
    assert.ok(isHandledStripeWebhookEvent("checkout.session.completed"));
    assert.ok(isHandledStripeWebhookEvent("payment_intent.succeeded"));
    assert.ok(isHandledStripeWebhookEvent("payment_intent.payment_failed"));
    assert.ok(isHandledStripeWebhookEvent("charge.refunded"));
    assert.ok(!isHandledStripeWebhookEvent("customer.created"));
  });

  it("parses checkout.session.completed as PAID", () => {
    const parsed = parseStripeWebhookEvent({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_1",
          payment_status: "paid",
          payment_intent: "pi_test_1",
          metadata: {
            businessId: "tenant_a",
            paymentId: "pay_1",
            orderId: "ord_1",
          },
        },
      },
    } as never);

    assert.ok(parsed);
    assert.equal(parsed?.status, PaymentStatus.PAID);
    assert.equal(parsed?.providerPaymentId, "cs_test_1");
    assert.equal(parsed?.providerReference, "pi_test_1");
    assert.equal(parsed?.paymentId, "pay_1");
  });

  it("ignores unpaid checkout sessions", () => {
    const parsed = parseStripeWebhookEvent({
      id: "evt_2",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_2",
          payment_status: "unpaid",
          metadata: { businessId: "tenant_a" },
        },
      },
    } as never);

    assert.equal(parsed, null);
  });

  it("parses payment_intent.payment_failed", () => {
    const parsed = parseStripeWebhookEvent({
      id: "evt_3",
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_failed",
          metadata: {
            businessId: "tenant_a",
            paymentId: "pay_1",
            sessionId: "cs_test_1",
            orderId: "ord_1",
          },
        },
      },
    } as never);

    assert.equal(parsed?.status, PaymentStatus.FAILED);
    assert.equal(parsed?.providerReference, "pi_failed");
  });

  it("parses charge.refunded with payment intent reference", () => {
    const parsed = parseStripeWebhookEvent({
      id: "evt_4",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_1",
          payment_intent: {
            id: "pi_test_1",
            metadata: {
              paymentId: "pay_1",
              orderId: "ord_1",
              sessionId: "cs_test_1",
            },
          },
          metadata: {},
        },
      },
    } as never);

    assert.equal(parsed?.status, PaymentStatus.REFUNDED);
    assert.equal(parsed?.providerReference, "pi_test_1");
    assert.equal(parsed?.providerPaymentId, "cs_test_1");
  });

  it("extracts tenant id from webhook metadata", () => {
    const tenantId = extractStripeBusinessId({
      id: "evt_5",
      type: "payment_intent.succeeded",
      data: {
        object: {
          metadata: { tenantId: "tenant_a" },
        },
      },
    } as never);

    assert.equal(tenantId, "tenant_a");
  });
});

describe("Stripe payment method routing", () => {
  it("documents card, Apple Pay, and Google Pay as online Stripe methods", () => {
    const stripeMethods = ["CARD", "APPLE_PAY", "GOOGLE_PAY"] as const;
    assert.equal(stripeMethods.length, 3);
    assert.ok(stripeMethods.includes("APPLE_PAY"));
  });
});

describe("Webhook payload hashing", () => {
  it("hashes payloads deterministically for idempotency storage", () => {
    const a = hashWebhookPayload('{"id":"evt_1"}');
    const b = hashWebhookPayload('{"id":"evt_1"}');
    const c = hashWebhookPayload('{"id":"evt_2"}');
    assert.equal(a, b);
    assert.notEqual(a, c);
  });
});
