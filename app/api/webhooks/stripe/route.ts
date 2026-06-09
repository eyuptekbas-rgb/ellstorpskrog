import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  collectStripeWebhookSecrets,
  getStripeConfig,
} from "@/lib/stripe/config";
import { getStripeClient } from "@/lib/stripe/client";
import { ensureSiteSettings } from "@/lib/settings";
import {
  markOrderPaid,
  markOrderPaymentFailed,
} from "@/lib/orders/payment";

function constructEventWithSecrets(
  stripe: Stripe,
  body: string,
  signature: string,
  secrets: string[]
): Stripe.Event {
  let lastError: unknown;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, signature, secret);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("No webhook secrets configured");
}

export async function POST(req: Request) {
  const settings = await ensureSiteSettings();
  const secrets = collectStripeWebhookSecrets(settings);
  const config = await getStripeConfig();

  if (secrets.length === 0) {
    console.error("Stripe webhook secret is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = await getStripeClient();
    event = constructEventWithSecrets(stripe, body, signature, secrets);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (config.testMode !== event.livemode) {
    console.info(
      `Stripe webhook: event livemode=${event.livemode}, active config testMode=${config.testMode}`
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId =
          session.metadata?.orderId || session.client_reference_id;

        if (orderId) {
          await markOrderPaid(orderId, {
            stripeSessionId: session.id,
            paymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id ?? null,
          });
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          await markOrderPaid(orderId, {
            paymentIntentId: paymentIntent.id,
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          await markOrderPaymentFailed(orderId);
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
