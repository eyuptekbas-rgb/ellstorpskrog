import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { getStripeClient } from "@/lib/stripe/client";
import {
  findOrderByStripeSession,
  markOrderPaid,
} from "@/lib/orders/payment";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const stripe = await getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 402 }
      );
    }

    let order = await findOrderByStripeSession(sessionId);

    if (!order) {
      const orderId =
        session.metadata?.orderId || session.client_reference_id;

      if (orderId) {
        order = await markOrderPaid(orderId, {
          stripeSessionId: session.id,
          paymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
        });
      }
    }

    if (!order || order.paymentStatus !== PaymentStatus.PAID) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      total: order.total,
      paymentStatus: order.paymentStatus,
      status: order.status,
    });
  } catch (error) {
    console.error("GET /api/checkout/session error:", error);
    return NextResponse.json(
      { error: "Failed to verify session" },
      { status: 500 }
    );
  }
}
