import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const CUSTOMER_NUMBER_LENGTH = 8;

export function formatCustomerNumber(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 99_999_999) {
    throw new Error("INVALID_CUSTOMER_NUMBER");
  }
  return String(value).padStart(CUSTOMER_NUMBER_LENGTH, "0");
}

export function isValidCustomerNumber(value: string): boolean {
  return /^\d{8}$/.test(value);
}

/** Allocate next sequential 8-digit customer number (transaction-safe). */
export async function allocateCustomerNumber(
  tx: Prisma.TransactionClient = prisma
): Promise<string> {
  const tenants = await tx.tenant.findMany({
    where: { customerNumber: { not: null } },
    select: { customerNumber: true },
    orderBy: { customerNumber: "desc" },
    take: 1,
  });

  const currentMax = tenants[0]?.customerNumber
    ? parseInt(tenants[0].customerNumber, 10)
    : 0;

  return formatCustomerNumber(currentMax + 1);
}

export async function ensureTenantCustomerNumber(tenantId: string): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { customerNumber: true },
  });

  if (tenant?.customerNumber) {
    return tenant.customerNumber;
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: { customerNumber: true },
    });
    if (existing?.customerNumber) return existing.customerNumber;

    const customerNumber = await allocateCustomerNumber(tx);
    await tx.tenant.update({
      where: { id: tenantId },
      data: { customerNumber },
    });
    return customerNumber;
  });
}
