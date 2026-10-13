import { OrderStatus, Prisma } from "@prisma/client";
import { safeWriteOperationalAudit } from "@/lib/audit/audit-log";
import { notifyOrderStatusChanged } from "@/lib/email/notify";
import { publishOrderUpdated } from "@/lib/realtime/publish";
import { prisma } from "@/lib/prisma";
import {
  assertValidOrderStatusTransition,
  InvalidOrderStatusTransitionError,
} from "@/lib/orders/status-transitions";

export type UpdateOrderStatusOptions = {
  actorUserId?: string;
};

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: true;
    statusHistory: { orderBy: { createdAt: "desc" } };
  };
}>;

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  tenantId: string,
  options?: UpdateOrderStatusOptions
): Promise<{ order: OrderWithRelations; previousStatus: OrderStatus } | null> {
  const existing = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
  });
  if (!existing) return null;

  if (existing.status === status) {
    const order = await prisma.order.findFirstOrThrow({
      where: { id: orderId, tenantId },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });
    return { order, previousStatus: existing.status };
  }

  assertValidOrderStatusTransition(existing.status, status, existing.orderType);

  const order = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: orderId, tenantId, status: existing.status },
      data: { status },
    });

    if (updated.count !== 1) {
      throw new InvalidOrderStatusTransitionError(
        existing.status,
        status,
        existing.orderType
      );
    }

    await tx.orderStatusHistory.create({
      data: { orderId, status },
    });

    return tx.order.findFirstOrThrow({
      where: { id: orderId, tenantId },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });
  });

  void notifyOrderStatusChanged(order, existing.status);

  publishOrderUpdated(tenantId, orderId, status, order.orderNumber);
  void safeWriteOperationalAudit(
    tenantId,
    options?.actorUserId,
    "order",
    "Statusändring",
    `${order.orderNumber}: ${existing.status} → ${status}`,
    undefined
  );

  return { order, previousStatus: existing.status };
}
