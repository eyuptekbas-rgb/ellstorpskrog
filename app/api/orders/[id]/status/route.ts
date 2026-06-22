import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { auth } from "@/auth";
import { updateOrderStatus } from "@/lib/orders/update-status";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getAdminTenantId();
    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status?: OrderStatus };

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const session = await auth();
    const result = await updateOrderStatus(id, status, tenantId, {
      actorUserId: session?.user?.id,
    });
    if (!result) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(result.order);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("PUT /api/orders/[id]/status error:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
