import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { getDbErrorMessage } from "@/lib/db/errors";
import { prisma } from "@/lib/prisma";

export type EconomyPeriod = "today" | "week" | "month" | "all";

export type EconomyStats = {
  period: EconomyPeriod;
  revenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  orderCount: number;
  paidCount: number;
  pendingCount: number;
  cancelledCount: number;
  averageOrderValue: number;
  invoices: EconomyInvoiceRow[];
  dbError?: string;
};

export type EconomyInvoiceRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
};

function periodStart(period: EconomyPeriod): Date | null {
  if (period === "all") return null;

  const now = new Date();
  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start;
  }

  const start = new Date(now);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

const completedRevenueWhere = {
  status: { not: OrderStatus.CANCELLED },
  paymentStatus: { not: PaymentStatus.FAILED },
} as const;

export async function getEconomyStats(
  tenantId: string,
  period: EconomyPeriod = "month"
): Promise<EconomyStats> {
  try {
    const start = periodStart(period);
    const dateWhere = start ? { createdAt: { gte: start } } : {};

    const baseWhere = { tenantId, ...dateWhere };

    const [
      revenueAgg,
      paidAgg,
      pendingAgg,
      orderCount,
      paidCount,
      pendingCount,
      cancelledCount,
      invoices,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { ...baseWhere, ...completedRevenueWhere },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          ...baseWhere,
          paymentStatus: PaymentStatus.PAID,
          status: { not: OrderStatus.CANCELLED },
        },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          ...baseWhere,
          paymentStatus: PaymentStatus.PENDING,
          status: { not: OrderStatus.CANCELLED },
        },
      }),
      prisma.order.count({ where: baseWhere }),
      prisma.order.count({
        where: {
          ...baseWhere,
          paymentStatus: PaymentStatus.PAID,
          status: { not: OrderStatus.CANCELLED },
        },
      }),
      prisma.order.count({
        where: {
          ...baseWhere,
          paymentStatus: PaymentStatus.PENDING,
          status: { not: OrderStatus.CANCELLED },
        },
      }),
      prisma.order.count({
        where: { ...baseWhere, status: OrderStatus.CANCELLED },
      }),
      prisma.order.findMany({
        where: baseWhere,
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          total: true,
          paymentStatus: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const revenue = revenueAgg._sum.total ?? 0;
    const countedOrders = orderCount - cancelledCount;

    return {
      period,
      revenue,
      paidRevenue: paidAgg._sum.total ?? 0,
      pendingRevenue: pendingAgg._sum.total ?? 0,
      orderCount,
      paidCount,
      pendingCount,
      cancelledCount,
      averageOrderValue:
        countedOrders > 0 ? Math.round(revenue / countedOrders) : 0,
      invoices: invoices.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Economy stats error:", getDbErrorMessage(error));
    return {
      period,
      revenue: 0,
      paidRevenue: 0,
      pendingRevenue: 0,
      orderCount: 0,
      paidCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
      averageOrderValue: 0,
      invoices: [],
      dbError: getDbErrorMessage(error),
    };
  }
}

export type EconomyOrderDetail = Prisma.OrderGetPayload<{
  include: { items: true };
}>;
