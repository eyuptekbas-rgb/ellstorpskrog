import {
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { createOrder } from "@/lib/orders/create-order";
import { publishNewOrder } from "@/lib/realtime/publish";
import { prisma } from "@/lib/prisma";
import type { TableContext } from "./table";
import { formatTableNote } from "./table";

export type GuestOrderItem = {
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
};

export type CreateGuestOrderInput = {
  tenantId: string;
  guestName?: string;
  guestPhone?: string;
  table: TableContext;
  note?: string;
  items: GuestOrderItem[];
};

export type GuestOrderResult = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

export async function createGuestTableOrder(
  input: CreateGuestOrderInput
): Promise<GuestOrderResult> {
  const total = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const tableLabel = input.table.tableName ?? "Gäst";
  const customerName = input.guestName?.trim() || `Bord ${tableLabel}`;
  const customerPhone = input.guestPhone?.trim() || "0000000000";
  const customerEmail = `guest+${Date.now()}@selforder.local`;

  const order = await prisma.$transaction(async (tx) =>
    createOrder(tx, {
      tenantId: input.tenantId,
      customerName,
      customerPhone,
      customerEmail,
      orderType: OrderType.PICKUP,
      paymentMethod: PaymentMethod.SWISH,
      paymentStatus: PaymentStatus.PENDING,
      note: formatTableNote(input.table, input.note),
      total,
      items: input.items,
    })
  );

  publishNewOrder(input.tenantId, order.id, order.orderNumber);
  return order;
}
