import { NextResponse } from "next/server";
import Stripe from "stripe";
import { collectStripeWebhookSecrets } from "@/src/services/payment/providers/stripe/config";
import {
  extractStripeBusinessId,
  isHandledStripeWebhookEvent,
} from "@/src/services/payment/providers/stripe/webhook-parser";
import { paymentWebhookService } from "@/src/services/payment/server/webhooks/instance";

function constructStripeEvent(
  body: string,
  signature: string,
  secrets: string[]
): Stripe.Event {
  let lastError: unknown;

  for (const secret of secrets) {
    try {
      return Stripe.webhooks.constructEvent(body, signature, secret);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("No webhook secrets configured");
}

export async function POST(req: Request) {
  const secrets = await collectStripeWebhookSecrets();

  if (secrets.length === 0) {
    console.error("Stripe webhook secret is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructStripeEvent(rawBody, signature, secrets);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!isHandledStripeWebhookEvent(event.type)) {
    return NextResponse.json({ received: true });
  }

  const businessId = extractStripeBusinessId(event);

  if (!businessId) {
    console.error(`Stripe webhook ${event.id} is missing businessId metadata`);
    return NextResponse.json(
      { error: "Missing business metadata" },
      { status: 400 }
    );
  }

  try {
    const result = await paymentWebhookService.processWebhook({
      businessId,
      provider: "stripe",
      headers: req.headers,
      rawBody,
      verifiedEvent: event,
    });

    return NextResponse.json({
      received: true,
      duplicate: result.duplicate,
      paymentId: result.paymentId,
      status: result.status,
    });
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
