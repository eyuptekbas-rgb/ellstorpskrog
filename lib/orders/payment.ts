import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  OrderType,
} from "@prisma/client";
import { notifyPaymentCompleted } from "@/lib/email/notify";
import { prisma } from "@/lib/prisma";
import { publishNewOrder } from "@/lib/realtime/publish";

export async function markOrderPaid(
  orderId: string,
  data: {
    paymentIntentId?: string | null;
    stripeSessionId?: string | null;
  }
) {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, statusHistory: true },
  });

  if (!existing) return null;
  if (existing.paymentStatus === PaymentStatus.PAID) return existing;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: PaymentStatus.PAID,
      paymentIntentId: data.paymentIntentId ?? existing.paymentIntentId,
      stripeSessionId: data.stripeSessionId ?? existing.stripeSessionId,
    },
    include: { items: true, statusHistory: true },
  });

  void notifyPaymentCompleted(order);
  publishNewOrder(order.tenantId, order.id, order.orderNumber);
  return order;
}

export async function markOrderPaymentFailed(orderId: string) {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing || existing.paymentStatus === PaymentStatus.PAID) {
    return existing;
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: PaymentStatus.FAILED },
    include: { items: true, statusHistory: true },
  });
}

export async function markOrderRefunded(orderId: string) {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) return null;

  return prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: PaymentStatus.REFUNDED },
    include: { items: true, statusHistory: true },
  });
}

export async function findOrderByStripeSession(sessionId: string) {
  return prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
}

export type { OrderStatus, PaymentMethod, PaymentStatus, OrderType };
