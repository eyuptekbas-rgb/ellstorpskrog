import Stripe from "stripe";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/stripe/config";
import type {
  PaymentProviderId,
  PaymentRequest,
  PaymentResult,
} from "@/src/services/payment/types";
import type { PaymentAmount } from "@/src/services/payment/types/decimal";
import type {
  PaymentProvider,
  ProviderPaymentResponse,
  ProviderWebhookPayload,
  ProviderWebhookResult,
} from "@/src/services/payment/types/provider";
import { amountToStripeMinorUnits } from "@/src/services/payment/providers/stripe/amounts";
import { getStripeProviderClient } from "@/src/services/payment/providers/stripe/client";
import {
  collectStripeWebhookSecrets,
} from "@/src/services/payment/providers/stripe/config";
import {
  buildStripeCheckoutSessionParams,
} from "@/src/services/payment/providers/stripe/checkout-session";
import {
  isHandledStripeWebhookEvent,
  parseStripeWebhookEvent,
} from "@/src/services/payment/providers/stripe/webhook-parser";

export class StripeProvider implements PaymentProvider {
  readonly id: PaymentProviderId = "stripe";

  async createPayment(request: PaymentRequest): Promise<ProviderPaymentResponse> {
    const { stripe } = await getStripeProviderClient(request.businessId);
    const order = await prisma.order.findFirst({
      where: {
        id: request.orderId,
        tenantId: request.businessId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "ORDER_NOT_FOUND",
        errorMessage: "Order not found for Stripe checkout",
      };
    }

    const currency = request.currency.toLowerCase();
    const baseUrl = getAppBaseUrl();

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.items.map((item) => ({
        price_data: {
          currency,
          product_data: { name: item.productName },
          unit_amount: amountToStripeMinorUnits(
            item.unitPrice.toFixed(2),
            request.currency
          ),
        },
        quantity: item.quantity,
      }));

    const orderTotalMinor = amountToStripeMinorUnits(request.amount, request.currency);
    const lineItemsTotal = lineItems.reduce(
      (sum, item) =>
        sum + (item.price_data?.unit_amount ?? 0) * (item.quantity ?? 1),
      0
    );

    if (lineItemsTotal !== orderTotalMinor && lineItems.length > 0) {
      const difference = orderTotalMinor - lineItemsTotal;
      if (difference > 0) {
        lineItems.push({
          price_data: {
            currency,
            product_data: { name: "Leveransavgift" },
            unit_amount: difference,
          },
          quantity: 1,
        });
      }
    }

    const session = await stripe.checkout.sessions.create(
      buildStripeCheckoutSessionParams({
        request,
        order,
        lineItems,
        baseUrl,
        currency,
      })
    );

    if (!session.url) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "CHECKOUT_URL_MISSING",
        errorMessage: "Stripe did not return a checkout URL",
      };
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (paymentIntentId) {
      await stripe.paymentIntents.update(paymentIntentId, {
        metadata: {
          businessId: request.businessId,
          tenantId: request.businessId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentId: request.paymentId ?? "",
          sessionId: session.id,
        },
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return {
      success: true,
      status: PaymentStatus.PENDING,
      providerPaymentId: session.id,
      providerReference: paymentIntentId ?? null,
      redirectUrl: session.url,
    };
  }

  async capturePayment(providerPaymentId: string): Promise<PaymentResult> {
    return {
      success: true,
      status: PaymentStatus.PROCESSING,
      providerPaymentId,
    };
  }

  async cancelPayment(providerPaymentId: string): Promise<PaymentResult> {
    const businessId = await this.resolveBusinessIdFromSession(providerPaymentId);

    if (!businessId) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "BUSINESS_NOT_FOUND",
        errorMessage: "Unable to resolve business for Stripe session",
      };
    }

    const { stripe } = await getStripeProviderClient(businessId);

    try {
      await stripe.checkout.sessions.expire(providerPaymentId);
      return {
        success: true,
        status: PaymentStatus.CANCELLED,
        providerPaymentId,
      };
    } catch {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        providerPaymentId,
        errorCode: "CANCEL_FAILED",
        errorMessage: "Failed to cancel Stripe checkout session",
      };
    }
  }

  async refundPayment(
    providerPaymentId: string,
    amount?: PaymentAmount
  ): Promise<PaymentResult> {
    const businessId = await this.resolveBusinessIdFromSession(providerPaymentId);

    if (!businessId) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "BUSINESS_NOT_FOUND",
        errorMessage: "Unable to resolve business for Stripe session",
      };
    }

    const { stripe } = await getStripeProviderClient(businessId);
    const session = await stripe.checkout.sessions.retrieve(providerPaymentId);
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!paymentIntentId) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorCode: "PAYMENT_INTENT_MISSING",
        errorMessage: "Stripe session has no payment intent to refund",
      };
    }

    const payment = await prisma.payment.findFirst({
      where: {
        businessId,
        provider: "stripe",
        providerPaymentId,
      },
    });

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount && payment) {
      refundParams.amount = amountToStripeMinorUnits(
        amount,
        payment.currency as PaymentRequest["currency"]
      );
    }

    await stripe.refunds.create(refundParams);

    return {
      success: true,
      status: PaymentStatus.REFUNDED,
      providerPaymentId,
      providerReference: paymentIntentId,
    };
  }

  async parseWebhook(payload: ProviderWebhookPayload): Promise<ProviderWebhookResult> {
    const event = payload.verifiedEvent
      ? (payload.verifiedEvent as Stripe.Event)
      : await this.verifyWebhookPayload(payload);

    if (!isHandledStripeWebhookEvent(event.type)) {
      throw new Error(`Unhandled Stripe webhook event type: ${event.type}`);
    }

    const parsed = parseStripeWebhookEvent(event);

    if (!parsed) {
      throw new Error(`Stripe event ${event.id} did not produce a payment update`);
    }

    return parsed;
  }

  private async verifyWebhookPayload(
    payload: ProviderWebhookPayload
  ): Promise<Stripe.Event> {
    const signature = payload.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("Missing Stripe signature header");
    }

    const secrets = await collectStripeWebhookSecrets(payload.businessId);
    const uniqueSecrets = [...new Set(secrets.filter(Boolean))];

    if (uniqueSecrets.length === 0) {
      throw new Error("Stripe webhook secret is not configured");
    }

    return this.constructStripeEvent(payload.rawBody, signature, uniqueSecrets);
  }

  private constructStripeEvent(
    rawBody: string,
    signature: string,
    secrets: string[]
  ): Stripe.Event {
    let lastError: unknown;

    for (const secret of secrets) {
      try {
        return Stripe.webhooks.constructEvent(rawBody, signature, secret);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new Error("Stripe webhook signature verification failed");
  }

  private async resolveBusinessIdFromSession(
    sessionId: string
  ): Promise<string | null> {
    const payment = await prisma.payment.findFirst({
      where: {
        provider: "stripe",
        providerPaymentId: sessionId,
      },
      select: { businessId: true },
    });

    if (payment) return payment.businessId;

    const order = await prisma.order.findFirst({
      where: { stripeSessionId: sessionId },
      select: { tenantId: true },
    });

    return order?.tenantId ?? null;
  }
}

export const stripePaymentProvider = new StripeProvider();
