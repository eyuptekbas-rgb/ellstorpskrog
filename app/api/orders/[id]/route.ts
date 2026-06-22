import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/lib/orders/update-status";
import { findTenantOrder } from "@/lib/tenant/scope";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getAdminTenantId();
    const { id } = await params;

    const order = await findTenantOrder(id, tenantId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getAdminTenantId();
    const { id } = await params;
    const body = await req.json();
    const { status, adminNote } = body as {
      status?: OrderStatus;
      adminNote?: string | null;
    };

    if (status !== undefined) {
      if (!Object.values(OrderStatus).includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const result = await updateOrderStatus(id, status, tenantId);
      if (!result) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json(result.order);
    }

    if (adminNote !== undefined) {
      const existing = await findTenantOrder(id, tenantId);
      if (!existing) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const order = await prisma.order.update({
        where: { id },
        data: { adminNote: adminNote?.trim() || null },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: "desc" } },
        },
      });

      return NextResponse.json(order);
    }

    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("PATCH /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
