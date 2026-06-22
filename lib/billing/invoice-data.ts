import type { PlatformInvoice, Tenant } from "@prisma/client";
import { formatPeriodLabel } from "@/lib/billing/period";
import { getPlatformBillingPaymentInfo } from "@/lib/billing/platform-config";
import type { PlatformInvoiceDocument } from "@/lib/billing/types";

type TenantBilling = Pick<
  Tenant,
  | "name"
  | "customerNumber"
  | "companyName"
  | "organizationNumber"
  | "billingAddress"
  | "invoiceEmail"
>;

export function buildPlatformInvoiceDocument(
  invoice: PlatformInvoice,
  tenant: TenantBilling
): PlatformInvoiceDocument {
  const payment = getPlatformBillingPaymentInfo();
  const period = { year: invoice.periodYear, month: invoice.periodMonth };

  if (!tenant.customerNumber) {
    throw new Error("MISSING_CUSTOMER_NUMBER");
  }

  return {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate.toISOString(),
    dueDate: invoice.dueDate?.toISOString() ?? null,
    periodLabel: formatPeriodLabel(period),
    customer: {
      customerNumber: tenant.customerNumber,
      companyName: tenant.companyName?.trim() || tenant.name,
      organizationNumber: tenant.organizationNumber,
      billingAddress: tenant.billingAddress,
      invoiceEmail: tenant.invoiceEmail,
      tenantName: tenant.name,
    },
    lines: [
      {
        description: "Månadsabonnemang Ordina",
        quantity: 1,
        unitPrice: invoice.subscriptionFee,
        total: invoice.subscriptionFee,
      },
      {
        description: "Orderavgift",
        quantity: invoice.orderCount,
        unitPrice: invoice.orderFeePerOrder,
        total: invoice.orderFeeTotal,
      },
    ],
    subscriptionFee: invoice.subscriptionFee,
    orderCount: invoice.orderCount,
    orderFeePerOrder: invoice.orderFeePerOrder,
    orderFeeTotal: invoice.orderFeeTotal,
    vatRate: invoice.vatRate,
    vatAmount: invoice.vatAmount,
    totalAmount: invoice.totalAmount,
    payment,
    status: invoice.status,
  };
}

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Utkast",
  SENT: "Skickad",
  PAID: "Betald",
  OVERDUE: "Förfallen",
  CANCELLED: "Makulerad",
};
