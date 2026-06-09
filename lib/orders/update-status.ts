import { OrderStatus, Prisma } from "@prisma/client";
import { notifyOrderStatusChanged } from "@/lib/email/notify";
import { prisma } from "@/lib/prisma";

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: true;
    statusHistory: { orderBy: { createdAt: "desc" } };
  };
}>;

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ order: OrderWithRelations; previousStatus: OrderStatus } | null> {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) return null;

  if (existing.status === status) {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
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

    return tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });
  });

  void notifyOrderStatusChanged(order, existing.status);

  return { order, previousStatus: existing.status };
}
