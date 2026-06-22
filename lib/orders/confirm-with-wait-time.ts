import { OrderStatus, Prisma } from "@prisma/client";
import { safeWriteOperationalAudit } from "@/lib/audit/audit-log";
import {
  notifyCustomerEstimatedReady,
  notifyOrderStatusChanged,
} from "@/lib/email/notify";
import { isValidWaitTimeMinutes } from "@/lib/pos/wait-time";
import { publishOrderUpdated } from "@/lib/realtime/publish";
import { prisma } from "@/lib/prisma";
import type { UpdateOrderStatusOptions } from "@/lib/orders/update-status";

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: true;
    statusHistory: { orderBy: { createdAt: "desc" } };
  };
}>;

export async function confirmOrderWithWaitTime(
  orderId: string,
  minutes: number,
  tenantId: string,
  options?: UpdateOrderStatusOptions
): Promise<{ order: OrderWithRelations; previousStatus: OrderStatus } | null> {
  if (!isValidWaitTimeMinutes(minutes)) {
    throw new Error("Invalid wait time");
  }

  const existing = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
  });
  if (!existing) return null;

  if (existing.status !== OrderStatus.NEW) {
    throw new Error("Order is not in NEW status");
  }

  const order = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CONFIRMED,
        estimatedReadyMinutes: minutes,
      },
    });

    await tx.orderStatusHistory.create({
      data: { orderId, status: OrderStatus.CONFIRMED },
    });

    return tx.order.findFirstOrThrow({
      where: { id: orderId, tenantId },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });
  });

  void notifyCustomerEstimatedReady(order);
  void notifyOrderStatusChanged(order, existing.status);
  publishOrderUpdated(
    tenantId,
    orderId,
    OrderStatus.CONFIRMED,
    order.orderNumber
  );
  void safeWriteOperationalAudit(
    tenantId,
    options?.actorUserId,
    "order",
    "Bekräftad med väntetid",
    `${order.orderNumber}: ${minutes} min`,
    undefined
  );

  return { order, previousStatus: existing.status };
}
