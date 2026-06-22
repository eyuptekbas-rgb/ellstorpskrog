import { NextResponse } from "next/server";
import { OrderType } from "@prisma/client";
import { createGuestTableOrder } from "@/lib/self-order/create-guest-order";
import { parseTableFromSearchParams } from "@/lib/self-order/table";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  OrderPricingError,
  validateOrderPricing,
} from "@/lib/orders/validate-pricing";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(`self-order:${ip}`, 15, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const tenantId = await resolvePublicTenantId();
    const body = (await req.json()) as {
      guestName?: string;
      guestPhone?: string;
      table?: string;
      tableId?: string;
      note?: string;
      items?: {
        productId?: string;
        productName: string;
        quantity: number;
        price: number;
      }[];
    };

    if (!body.items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    for (const item of body.items) {
      if (!item.productId?.trim()) {
        return NextResponse.json(
          { error: "Each item must include productId" },
          { status: 400 }
        );
      }
    }

    const pricing = await validateOrderPricing({
      tenantId,
      orderType: OrderType.PICKUP,
      items: body.items,
    });

    const params = new URLSearchParams();
    if (body.table) params.set("table", body.table);
    if (body.tableId) params.set("tableId", body.tableId);
    const table = parseTableFromSearchParams(params);

    const order = await createGuestTableOrder({
      tenantId,
      guestName: body.guestName,
      guestPhone: body.guestPhone,
      table,
      note: body.note,
      items: pricing.items,
    });

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
    });
  } catch (error) {
    if (error instanceof OrderPricingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("POST /api/self-order error:", error);
    return NextResponse.json(
      { error: "Could not place order" },
      { status: 500 }
    );
  }
}
