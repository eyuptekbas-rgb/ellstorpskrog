import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type TrackedOrder = {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  total: number;
  tableNote: string | null;
  items: { productName: string; quantity: number }[];
};

const TRACKABLE_STATUSES: OrderStatus[] = [
  OrderStatus.NEW,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

export async function trackGuestOrder(
  tenantId: string,
  orderNumber: string,
  phoneLast4: string
): Promise<TrackedOrder | null> {
  const normalized = orderNumber.trim().toUpperCase();
  const last4 = phoneLast4.replace(/\D/g, "").slice(-4);
  if (!normalized || last4.length < 4) return null;

  const order = await prisma.order.findFirst({
    where: {
      tenantId,
      orderNumber: { equals: normalized, mode: "insensitive" },
      customerPhone: { endsWith: last4 },
      status: { in: TRACKABLE_STATUSES },
    },
    select: {
      orderNumber: true,
      status: true,
      createdAt: true,
      total: true,
      note: true,
      items: { select: { productName: true, quantity: true } },
    },
  });

  if (!order) return null;

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    total: order.total,
    tableNote: order.note,
    items: order.items,
  };
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Mottagen",
  CONFIRMED: "Bekräftad",
  PREPARING: "Tillagas",
  READY: "Klar",
  DELIVERING: "På väg",
  COMPLETED: "Avslutad",
  CANCELLED: "Avbruten",
};
