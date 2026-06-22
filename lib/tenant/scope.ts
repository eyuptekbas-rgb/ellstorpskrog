import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId } from "@/lib/tenant/admin-api";

export async function requireTenantScope(): Promise<string> {
  return getAdminTenantId();
}

const orderInclude = {
  items: true,
  statusHistory: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.OrderInclude;

export async function findTenantOrder(id: string, tenantId: string) {
  return prisma.order.findFirst({
    where: { id, tenantId },
    include: orderInclude,
  });
}

export async function findTenantReservation(id: string, tenantId: string) {
  return prisma.reservation.findFirst({
    where: { id, tenantId },
  });
}

export async function findTenantProduct(id: string, tenantId: string) {
  return prisma.product.findFirst({
    where: { id, category: { tenantId } },
    include: { category: { select: { id: true, name: true, slug: true, tenantId: true } } },
  });
}

export async function findTenantExtraOption(id: string, tenantId: string) {
  return prisma.extraOption.findFirst({
    where: { id, tenantId },
  });
}

export async function findTenantCategory(id: string, tenantId: string) {
  return prisma.category.findFirst({
    where: { id, tenantId },
  });
}

export async function findTenantNotificationLog(id: string, tenantId: string) {
  return prisma.notificationLog.findFirst({
    where: { id, order: { tenantId } },
  });
}

export function orderTenantWhere(tenantId: string) {
  return { order: { tenantId } };
}
