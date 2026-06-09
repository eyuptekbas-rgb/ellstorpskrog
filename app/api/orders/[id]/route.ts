import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/lib/orders/update-status";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
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

      const result = await updateOrderStatus(id, status);
      if (!result) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json(result.order);
    }

    if (adminNote !== undefined) {
      const existing = await prisma.order.findUnique({ where: { id } });
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
    console.error("PATCH /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
