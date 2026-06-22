import { NextResponse } from "next/server";
import { trackGuestOrder } from "@/lib/self-order/track";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";

export async function GET(req: Request) {
  try {
    const tenantId = await resolvePublicTenantId();
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber") ?? "";
    const phoneLast4 = searchParams.get("phoneLast4") ?? "";

    const order = await trackGuestOrder(tenantId, orderNumber, phoneLast4);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Tracking unavailable" }, { status: 503 });
  }
}
