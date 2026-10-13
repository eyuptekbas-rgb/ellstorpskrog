import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";
import { resolveSwishProviderConfig } from "@/src/services/payment/providers/swish/config";
import { validSwishToken } from "@/src/services/payment/providers/swish/tokens";
import { confirmSwishPayment } from "@/src/services/payment/server/swish-confirmation";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const businessId = await resolvePublicTenantId();
    const url = new URL(req.url);
    const paymentId = url.searchParams.get("paymentId");
    if (!paymentId) return NextResponse.json({ enabled: Boolean(await resolveSwishProviderConfig(businessId)) }, { headers });
    if (!validSwishToken(paymentId, "status", url.searchParams.get("token") || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
    }
    const payment = await prisma.payment.findFirst({ where: { id: paymentId, businessId, provider: "swish" }, include: { order: true } });
    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404, headers });
    if (payment.status === "PENDING" || payment.status === "PROCESSING") {
      const result = await confirmSwishPayment(paymentId);
      return NextResponse.json({ status: result.payment.status, orderNumber: result.order.orderNumber, total: result.order.total }, { headers });
    }
    return NextResponse.json({ status: payment.status, orderNumber: payment.order.orderNumber, total: payment.order.total }, { headers });
  } catch {
    return NextResponse.json({ error: "Swish verification unavailable" }, { status: 503, headers });
  }
}
