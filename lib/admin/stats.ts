import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { getEconomyStats } from "@/lib/economy/stats";
import { getDbErrorMessage } from "@/lib/db/errors";
import { prisma } from "@/lib/prisma";
import { POLL_INTERVAL_MS } from "@/lib/orders/admin-filters";
import type { ServiceStatus } from "@/lib/health/checks";
import { getStripeConfig } from "@/lib/stripe/config";

export type HourlyOrderBucket = { hour: number; count: number };
export type DailyRevenueBucket = { date: string; label: string; revenue: number };

export type DashboardOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: { id: string; quantity: number }[];
};

export type DashboardSystemStatus = {
  database: ServiceStatus;
  databaseMessage?: string;
  payments: ServiceStatus;
  paymentsMessage?: string;
  pollingIntervalMs: number;
};

export type DashboardStats = {
  todayOrders: number;
  revenue: number;
  ordersPreparing: number;
  ordersReady: number;
  completedToday: number;
  averageOrderValue: number;
  ordersPerHour: HourlyOrderBucket[];
  revenueLast7Days: DailyRevenueBucket[];
  latestOrders: DashboardOrder[];
  lastOrderReceived: string | null;
  system: DashboardSystemStatus;
  dbError?: string;
};

const emptyStats: DashboardStats = {
  todayOrders: 0,
  revenue: 0,
  ordersPreparing: 0,
  ordersReady: 0,
  completedToday: 0,
  averageOrderValue: 0,
  ordersPerHour: Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 })),
  revenueLast7Days: [],
  latestOrders: [],
  lastOrderReceived: null,
  system: {
    database: "error",
    databaseMessage: "Okänd",
    payments: "warning",
    paymentsMessage: "Okänd",
    pollingIntervalMs: POLL_INTERVAL_MS,
  },
};

function todayStart(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

function buildHourlyBuckets(
  orders: { createdAt: Date }[]
): HourlyOrderBucket[] {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  for (const order of orders) {
    buckets[order.createdAt.getHours()].count += 1;
  }
  return buckets;
}

function buildRevenueBuckets(
  orders: { total: number; createdAt: Date }[],
  days: number
): DailyRevenueBucket[] {
  const buckets: DailyRevenueBucket[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const key = day.toISOString().slice(0, 10);
    buckets.push({
      date: key,
      label: day.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric" }),
      revenue: 0,
    });
  }

  const indexByDate = Object.fromEntries(buckets.map((b, i) => [b.date, i]));

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const idx = indexByDate[key];
    if (idx !== undefined) {
      buckets[idx].revenue += order.total;
    }
  }

  return buckets;
}

function stripeServiceStatus(config: Awaited<ReturnType<typeof getStripeConfig>>): {
  status: ServiceStatus;
  message: string;
} {
  if (!config.configured) {
    return { status: "warning", message: "Stripe ej konfigurerad" };
  }
  if (!config.enabled) {
    return { status: "warning", message: "Betalningar inaktiverade i inställningar" };
  }
  if (config.testMode) {
    return { status: "warning", message: "Stripe aktivt i testläge" };
  }
  return { status: "ok", message: "Stripe aktivt i live-läge" };
}

function serializeOrders(
  orders: Prisma.OrderGetPayload<{
    include: { items: { select: { id: true; quantity: true } } };
  }>[]
): DashboardOrder[] {
  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.items,
  }));
}

export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  try {
    const start = todayStart();
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - 6);

    const revenueWhere = {
      status: { not: OrderStatus.CANCELLED },
      paymentStatus: { not: PaymentStatus.FAILED },
    } as const;

    const [
      todayEconomy,
      todayOrders,
      statusGroups,
      completedToday,
      todayOrderTimes,
      weekRevenueOrders,
      latestOrders,
      stripeConfig,
    ] = await Promise.all([
      getEconomyStats(tenantId, "today"),
      prisma.order.count({
        where: { tenantId, createdAt: { gte: start } },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { status: true },
      }),
      prisma.order.count({
        where: {
          tenantId,
          status: OrderStatus.COMPLETED,
          updatedAt: { gte: start },
        },
      }),
      prisma.order.findMany({
        where: { tenantId, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      prisma.order.findMany({
        where: {
          tenantId,
          createdAt: { gte: weekStart },
          ...revenueWhere,
        },
        select: { total: true, createdAt: true },
      }),
      prisma.order.findMany({
        where: { tenantId },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          items: { select: { id: true, quantity: true } },
        },
      }),
      getStripeConfig(),
    ]);

    const statusCounts = Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count.status])
    );

    const ordersPreparing =
      (statusCounts[OrderStatus.CONFIRMED] ?? 0) +
      (statusCounts[OrderStatus.PREPARING] ?? 0);
    const ordersReady =
      (statusCounts[OrderStatus.READY] ?? 0) +
      (statusCounts[OrderStatus.DELIVERING] ?? 0);

    const payments = stripeServiceStatus(stripeConfig);
    const lastOrder = latestOrders[0];

    return {
      todayOrders,
      revenue: todayEconomy.revenue,
      ordersPreparing,
      ordersReady,
      completedToday,
      averageOrderValue: todayEconomy.averageOrderValue,
      ordersPerHour: buildHourlyBuckets(todayOrderTimes),
      revenueLast7Days: buildRevenueBuckets(weekRevenueOrders, 7),
      latestOrders: serializeOrders(latestOrders),
      lastOrderReceived: lastOrder?.createdAt.toISOString() ?? null,
      system: {
        database: "ok",
        databaseMessage: "Ansluten",
        payments: payments.status,
        paymentsMessage: payments.message,
        pollingIntervalMs: POLL_INTERVAL_MS,
      },
    };
  } catch (error) {
    console.error("Dashboard DB error:", getDbErrorMessage(error));
    return {
      ...emptyStats,
      dbError: getDbErrorMessage(error),
      system: {
        ...emptyStats.system,
        database: "error",
        databaseMessage: getDbErrorMessage(error),
      },
    };
  }
}
