import { prisma } from "@/lib/prisma";
import type { BillingPeriod } from "@/lib/billing/types";

export async function generateInvoiceNumber(period: BillingPeriod): Promise<string> {
  const prefix = `ORD-${period.year}-${String(period.month).padStart(2, "0")}`;
  const existing = await prisma.platformInvoice.count({
    where: {
      invoiceNumber: { startsWith: prefix },
    },
  });
  return `${prefix}-${String(existing + 1).padStart(4, "0")}`;
}
