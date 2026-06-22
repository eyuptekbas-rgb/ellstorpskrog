import { OrderStatus, Prisma } from "@prisma/client";
import { safeWriteOperationalAudit } from "@/lib/audit/audit-log";
import { notifyOrderStatusChanged } from "@/lib/email/notify";
import { publishOrderUpdated } from "@/lib/realtime/publish";
import { prisma } from "@/lib/prisma";

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

  const order = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status },
    });

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
