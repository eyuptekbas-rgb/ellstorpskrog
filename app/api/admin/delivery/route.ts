import { NextResponse } from "next/server";
import { OrderStatus, OrderType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";
import { updateOrderStatus } from "@/lib/orders/update-status";
import { InvalidOrderStatusTransitionError } from "@/lib/orders/status-transitions";

const ACTIVE = [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERING];
const STATUSES = ["queued", "assigned", "picked-up", "en-route", "delivered"] as const;
type DeliveryStatus = (typeof STATUSES)[number];

function eta(address: string | null) {
  if (!address) return 30;
  return address.length < 20 ? 20 : address.length < 40 ? 30 : 40;
}

export async function GET() {
  try {
    const tenantId = await getAdminTenantId();
    const orders = await prisma.order.findMany({
      where: { tenantId, orderType: OrderType.DELIVERY, status: { in: ACTIVE } },
      include: { deliveryAssignment: true }, orderBy: { updatedAt: "desc" },
    });
    const rows = await Promise.all(orders.map(async (order) => {
      const assignment = order.deliveryAssignment ?? await prisma.deliveryAssignment.upsert({
        where: { orderId: order.id },
        create: { tenantId, orderId: order.id, etaMinutes: eta(order.customerAddress) },
        update: {},
      });
      return {
        orderId: order.id, orderNumber: order.orderNumber, customerName: order.customerName,
        customerAddress: order.customerAddress, customerPhone: order.customerPhone,
        total: order.total, status: order.status, deliveryStatus: assignment.deliveryStatus,
        driverId: assignment.driverId, driverName: assignment.driverName,
        etaMinutes: assignment.etaMinutes, assignedAt: assignment.assignedAt?.toISOString() ?? null,
        updatedAt: assignment.updatedAt.toISOString(),
      };
    }));
    return NextResponse.json({ deliveries: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte hämta leveranser." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const body = await req.json() as {
      orderId?: string; driverId?: string; driverName?: string;
      deliveryStatus?: DeliveryStatus; etaMinutes?: number;
    };
    if (!body.orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    const order = await prisma.order.findFirst({
      where: { id: body.orderId, tenantId, orderType: OrderType.DELIVERY },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (body.deliveryStatus && !STATUSES.includes(body.deliveryStatus)) {
      return NextResponse.json({ error: "Invalid delivery status" }, { status: 400 });
    }
    const targetOrderStatus =
      body.deliveryStatus === "picked-up" || body.deliveryStatus === "en-route"
        ? OrderStatus.DELIVERING
        : body.deliveryStatus === "delivered" ? OrderStatus.COMPLETED : null;
    if (targetOrderStatus && order.status !== targetOrderStatus) {
      await updateOrderStatus(order.id, targetOrderStatus, tenantId);
    }
    const assignment = await prisma.deliveryAssignment.upsert({
      where: { orderId: order.id },
      create: {
        tenantId, orderId: order.id, deliveryStatus: body.deliveryStatus ?? (body.driverId ? "assigned" : "queued"),
        driverId: body.driverId, driverName: body.driverName,
        etaMinutes: body.etaMinutes ?? eta(order.customerAddress),
        assignedAt: body.driverId ? new Date() : null,
      },
      update: {
        ...(body.deliveryStatus ? { deliveryStatus: body.deliveryStatus } : {}),
        ...(body.driverId ? { driverId: body.driverId, driverName: body.driverName, assignedAt: new Date(), deliveryStatus: "assigned" } : {}),
        ...(typeof body.etaMinutes === "number" ? { etaMinutes: body.etaMinutes } : {}),
      },
    });
    return NextResponse.json({ assignment });
  } catch (error) {
    if (error instanceof InvalidOrderStatusTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte uppdatera leveransen." }, { status: 500 });
  }
}
