import { NextResponse } from "next/server";
import { OrderPricingError } from "@/lib/orders/validate-pricing";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";
import {
  createCheckoutPayment,
  type CreateCheckoutPaymentBody,
} from "@/src/services/payment/server/checkout/create-checkout-payment";

export async function POST(req: Request) {
  try {
    const tenantId = await resolvePublicTenantId();
    const body: CreateCheckoutPaymentBody = await req.json();
    const result = await createCheckoutPayment(tenantId, body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      url: result.url,
      sessionId: result.sessionId,
      paymentId: result.paymentId,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    });
  } catch (error) {
    if (error instanceof OrderPricingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("POST /api/payments/create error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
