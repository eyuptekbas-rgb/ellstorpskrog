import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { getDbErrorMessage } from "@/lib/db/errors";
import { prisma } from "@/lib/prisma";

export type DashboardStats = {
  totalOrders: number;
  todayOrders: number;
  newOrders: number;
  revenue: number;
  statusCounts: Record<string, number>;
  latestOrders: Prisma.OrderGetPayload<{
    include: { items: { select: { id: true; quantity: true } } };
  }>[];
  dbError?: string;
};

const emptyStats: DashboardStats = {
  totalOrders: 0,
  todayOrders: 0,
  newOrders: 0,
  revenue: 0,
  statusCounts: {},
  latestOrders: [],
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      newOrders,
      revenueAgg,
      statusGroups,
      latestOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.order.count({
        where: { status: OrderStatus.NEW },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: todayStart },
          status: { not: OrderStatus.CANCELLED },
          paymentStatus: { not: PaymentStatus.FAILED },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          items: { select: { id: true, quantity: true } },
        },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count.status])
    );

    return {
      totalOrders,
      todayOrders,
      newOrders,
      revenue: revenueAgg._sum.total ?? 0,
      statusCounts,
      latestOrders,
    };
  } catch (error) {
    console.error("Dashboard DB error:", getDbErrorMessage(error));
    return { ...emptyStats, dbError: getDbErrorMessage(error) };
  }
}
