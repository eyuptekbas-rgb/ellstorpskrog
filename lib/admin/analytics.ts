import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ProductStat = {
  name: string;
  quantity: number;
  revenue: number;
};

export type PaymentMethodStat = {
  method: PaymentMethod;
  count: number;
  total: number;
};

export type AnalyticsSnapshot = {
  todaySales: number;
  todayOrders: number;
  averageTicket: number;
  topProducts: ProductStat[];
  paymentMethods: PaymentMethodStat[];
  averageKitchenMinutes: number | null;
  cancellationRate: number;
  completedToday: number;
  cancelledToday: number;
};

function todayStart(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function getAnalyticsSnapshot(
  tenantId: string
): Promise<AnalyticsSnapshot> {
  const start = todayStart();

  const orders = await prisma.order.findMany({
    where: { tenantId, createdAt: { gte: start } },
    select: {
      id: true,
      total: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      createdAt: true,
      statusHistory: {
        select: { status: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      items: {
        select: {
          productName: true,
          quantity: true,
          totalPrice: true,
        },
      },
    },
  });

  const paidOrders = orders.filter(
    (o) =>
      o.paymentStatus === PaymentStatus.PAID ||
      o.status === OrderStatus.COMPLETED ||
      o.status === OrderStatus.READY ||
      o.status === OrderStatus.DELIVERING ||
      o.status === OrderStatus.PREPARING ||
      o.status === OrderStatus.CONFIRMED
  );

  const todaySales = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const todayOrders = orders.length;
  const averageTicket =
    paidOrders.length > 0 ? Math.round(todaySales / paidOrders.length) : 0;

  const productMap = new Map<string, ProductStat>();
  for (const order of orders) {
    for (const item of order.items) {
      const baseName = item.productName.split("|")[0]?.trim() || item.productName;
      const existing = productMap.get(baseName) ?? {
        name: baseName,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.totalPrice;
      productMap.set(baseName, existing);
    }
  }

  const topProducts = [...productMap.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  const paymentMap = new Map<PaymentMethod, PaymentMethodStat>();
  for (const order of orders) {
    const existing = paymentMap.get(order.paymentMethod) ?? {
      method: order.paymentMethod,
      count: 0,
      total: 0,
    };
    existing.count += 1;
    existing.total += order.total;
    paymentMap.set(order.paymentMethod, existing);
  }

  const kitchenDurations: number[] = [];
  for (const order of orders) {
    const ready = order.statusHistory.find((h) => h.status === OrderStatus.READY);
    const preparing = order.statusHistory.find(
      (h) => h.status === OrderStatus.PREPARING || h.status === OrderStatus.CONFIRMED
    );
    const startEvent = preparing ?? { createdAt: order.createdAt };
    if (ready) {
      const minutes =
        (ready.createdAt.getTime() - new Date(startEvent.createdAt).getTime()) /
        60_000;
      if (minutes >= 0) kitchenDurations.push(minutes);
    }
  }

  const averageKitchenMinutes =
    kitchenDurations.length > 0
      ? Math.round(
          kitchenDurations.reduce((a, b) => a + b, 0) / kitchenDurations.length
        )
      : null;

  const cancelledToday = orders.filter(
    (o) => o.status === OrderStatus.CANCELLED
  ).length;
  const completedToday = orders.filter(
    (o) => o.status === OrderStatus.COMPLETED
  ).length;
  const cancellationRate =
    todayOrders > 0 ? Math.round((cancelledToday / todayOrders) * 1000) / 10 : 0;

  return {
    todaySales,
    todayOrders,
    averageTicket,
    topProducts,
    paymentMethods: [...paymentMap.values()],
    averageKitchenMinutes,
    cancellationRate,
    completedToday,
    cancelledToday,
  };
}
