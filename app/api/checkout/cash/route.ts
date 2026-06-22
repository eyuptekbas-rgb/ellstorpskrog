import { NextResponse } from "next/server";
import { PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order_id")?.trim();

  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

  try {
    const tenantId = await resolvePublicTenantId();
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId,
        paymentMethod: PaymentMethod.ON_PICKUP,
      },
      select: {
        orderNumber: true,
        total: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      total: order.total,
    });
  } catch (error) {
    console.error("GET /api/checkout/cash error:", error);
    return NextResponse.json(
      { error: "Failed to verify order" },
      { status: 500 }
    );
  }
}
