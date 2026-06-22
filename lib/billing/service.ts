import { OrderStatus, PlatformInvoiceStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateInvoiceAmount } from "@/lib/billing/calculate";
import { buildPlatformInvoiceDocument } from "@/lib/billing/invoice-data";
import { generateInvoiceNumber } from "@/lib/billing/invoice-number";
import {
  getCurrentBillingPeriod,
  getPeriodBounds,
  getPreviousBillingPeriod,
  getTodayBounds,
} from "@/lib/billing/period";
import { getPlatformBillingPaymentInfo, resolveTenantVatRate } from "@/lib/billing/platform-config";
import { ensureTenantCustomerNumber } from "@/lib/billing/customer-number";
import {
  generatePlatformInvoicePdf,
  pdfToBase64,
} from "@/lib/billing/pdf";
import { sendPlatformInvoiceEmail } from "@/lib/billing/email";
import type {
  BillingDashboardStats,
  BillingPeriod,
  TenantBillingRow,
} from "@/lib/billing/types";

const BILLABLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.NEW,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERING,
  OrderStatus.COMPLETED,
];

const tenantBillingSelect = {
  id: true,
  name: true,
  slug: true,
  active: true,
  customerNumber: true,
  companyName: true,
  organizationNumber: true,
  billingAddress: true,
  invoiceEmail: true,
  monthlySubscriptionFee: true,
  orderFee: true,
  billingVatRate: true,
} satisfies Prisma.TenantSelect;

/** Mark sent invoices past due date as overdue. */
export async function markOverdueInvoices(): Promise<number> {
  const now = new Date();
  const result = await prisma.platformInvoice.updateMany({
    where: {
      status: PlatformInvoiceStatus.SENT,
      dueDate: { lt: now },
    },
    data: { status: PlatformInvoiceStatus.OVERDUE },
  });
  return result.count;
}

export async function refreshBillingState(): Promise<{ overdueUpdated: number }> {
  const overdueUpdated = await markOverdueInvoices();
  return { overdueUpdated };
}

export async function countTenantOrders(
  tenantId: string,
  start: Date,
  end: Date
): Promise<number> {
  return prisma.order.count({
    where: {
      tenantId,
      status: { in: BILLABLE_ORDER_STATUSES },
      createdAt: { gte: start, lt: end },
    },
  });
}

export async function getBillingDashboardStats(
  period: BillingPeriod = getCurrentBillingPeriod()
): Promise<BillingDashboardStats> {
  const invoices = await prisma.platformInvoice.findMany({
    where: {
      periodYear: period.year,
      periodMonth: period.month,
      status: { not: PlatformInvoiceStatus.CANCELLED },
    },
  });

  const paid = invoices.filter((i) => i.status === PlatformInvoiceStatus.PAID);
  const outstanding = invoices.filter(
    (i) =>
      i.status === PlatformInvoiceStatus.SENT ||
      i.status === PlatformInvoiceStatus.OVERDUE ||
      i.status === PlatformInvoiceStatus.DRAFT
  );

  const monthlyRevenue = paid.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalOrderFees = invoices.reduce((sum, i) => sum + i.orderFeeTotal, 0);
  const totalSubscriptionFees = invoices.reduce(
    (sum, i) => sum + i.subscriptionFee,
    0
  );

  return {
    monthlyRevenue,
    outstandingInvoices: outstanding.length,
    paidInvoices: paid.length,
    totalOrderFees,
    totalSubscriptionFees,
    period,
  };
}

export async function getTenantBillingRows(
  period: BillingPeriod = getCurrentBillingPeriod()
): Promise<TenantBillingRow[]> {
  const { start, end } = getPeriodBounds(period);
  const today = getTodayBounds();

  const tenants = await prisma.tenant.findMany({
    select: tenantBillingSelect,
    orderBy: { name: "asc" },
  });

  const [monthCounts, todayCounts, periodInvoices, lastSentInvoices] =
    await Promise.all([
      prisma.order.groupBy({
        by: ["tenantId"],
        where: {
          status: { in: BILLABLE_ORDER_STATUSES },
          createdAt: { gte: start, lt: end },
        },
        _count: { _all: true },
      }),
      prisma.order.groupBy({
        by: ["tenantId"],
        where: {
          status: { in: BILLABLE_ORDER_STATUSES },
          createdAt: { gte: today.start, lt: today.end },
        },
        _count: { _all: true },
      }),
      prisma.platformInvoice.findMany({
        where: { periodYear: period.year, periodMonth: period.month },
      }),
      prisma.platformInvoice.findMany({
        where: {
          status: { in: [PlatformInvoiceStatus.SENT, PlatformInvoiceStatus.PAID] },
          sentAt: { not: null },
        },
        orderBy: { sentAt: "desc" },
        distinct: ["tenantId"],
      }),
    ]);

  const monthMap = new Map(monthCounts.map((r) => [r.tenantId, r._count._all]));
  const todayMap = new Map(todayCounts.map((r) => [r.tenantId, r._count._all]));
  const invoiceMap = new Map(periodInvoices.map((i) => [i.tenantId, i]));
  const lastSentMap = new Map(
    lastSentInvoices.map((i) => [i.tenantId, i.sentAt!.toISOString()])
  );

  return tenants.map((tenant) => {
    const ordersThisMonth = monthMap.get(tenant.id) ?? 0;
    const ordersToday = todayMap.get(tenant.id) ?? 0;
    const effectiveVatRate = resolveTenantVatRate(tenant.billingVatRate);
    const current = calculateInvoiceAmount(
      tenant.monthlySubscriptionFee,
      ordersThisMonth,
      tenant.orderFee,
      effectiveVatRate
    );
    const invoice = invoiceMap.get(tenant.id);

    return {
      id: tenant.id,
      customerNumber: tenant.customerNumber,
      name: tenant.name,
      slug: tenant.slug,
      active: tenant.active,
      companyName: tenant.companyName,
      organizationNumber: tenant.organizationNumber,
      billingAddress: tenant.billingAddress,
      invoiceEmail: tenant.invoiceEmail,
      monthlySubscriptionFee: tenant.monthlySubscriptionFee,
      orderFee: tenant.orderFee,
      billingVatRate: tenant.billingVatRate,
      effectiveVatRate,
      ordersToday,
      ordersThisMonth,
      currentInvoiceAmount: current.totalAmount,
      currentPeriod: period,
      currentInvoice: invoice
        ? {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            totalAmount: invoice.totalAmount,
            sentAt: invoice.sentAt?.toISOString() ?? null,
          }
        : null,
      lastInvoiceSentAt: lastSentMap.get(tenant.id) ?? null,
    };
  });
}

export async function updateTenantBilling(
  tenantId: string,
  data: {
    monthlySubscriptionFee?: number;
    orderFee?: number;
    invoiceEmail?: string | null;
    companyName?: string | null;
    organizationNumber?: string | null;
    billingAddress?: string | null;
    billingVatRate?: number | null;
  }
) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(data.monthlySubscriptionFee !== undefined && {
        monthlySubscriptionFee: Math.max(0, Math.round(data.monthlySubscriptionFee)),
      }),
      ...(data.orderFee !== undefined && {
        orderFee: Math.max(0, Math.round(data.orderFee)),
      }),
      ...(data.billingVatRate !== undefined && {
        billingVatRate:
          data.billingVatRate === null
            ? null
            : Math.max(0, Math.min(100, Math.round(data.billingVatRate))),
      }),
      ...(data.invoiceEmail !== undefined && {
        invoiceEmail: data.invoiceEmail?.trim() || null,
      }),
      ...(data.companyName !== undefined && {
        companyName: data.companyName?.trim() || null,
      }),
      ...(data.organizationNumber !== undefined && {
        organizationNumber: data.organizationNumber?.trim() || null,
      }),
      ...(data.billingAddress !== undefined && {
        billingAddress: data.billingAddress?.trim() || null,
      }),
    },
    select: tenantBillingSelect,
  });
}

export async function generatePlatformInvoice(params: {
  tenantId: string;
  period?: BillingPeriod;
  regenerate?: boolean;
}) {
  const period = params.period ?? getCurrentBillingPeriod();

  const existing = await prisma.platformInvoice.findUnique({
    where: {
      tenantId_periodYear_periodMonth: {
        tenantId: params.tenantId,
        periodYear: period.year,
        periodMonth: period.month,
      },
    },
  });

  if (existing && !params.regenerate) {
    if (existing.status === PlatformInvoiceStatus.PAID) {
      throw new Error("INVOICE_ALREADY_PAID");
    }
    if (existing.status === PlatformInvoiceStatus.CANCELLED) {
      throw new Error("INVOICE_CANCELLED");
    }
    return existing;
  }

  if (existing?.status === PlatformInvoiceStatus.CANCELLED && !params.regenerate) {
    throw new Error("INVOICE_CANCELLED");
  }

  await ensureTenantCustomerNumber(params.tenantId);

  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    select: tenantBillingSelect,
  });

  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }

  if (!tenant.customerNumber) {
    throw new Error("MISSING_CUSTOMER_NUMBER");
  }

  const { start, end } = getPeriodBounds(period);
  const orderCount = await countTenantOrders(params.tenantId, start, end);
  const vatRate = resolveTenantVatRate(tenant.billingVatRate);
  const calc = calculateInvoiceAmount(
    tenant.monthlySubscriptionFee,
    orderCount,
    tenant.orderFee,
    vatRate
  );

  const payment = getPlatformBillingPaymentInfo();
  const invoiceDate = new Date();
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + payment.paymentTermsDays);

  const invoiceNumber =
    existing?.invoiceNumber ?? (await generateInvoiceNumber(period));

  const draftData = {
    subscriptionFee: calc.subscriptionFee,
    orderCount: calc.orderCount,
    orderFeePerOrder: calc.orderFeePerOrder,
    orderFeeTotal: calc.orderFeeTotal,
    vatRate: calc.vatRate,
    vatAmount: calc.vatAmount,
    totalAmount: calc.totalAmount,
    invoiceDate,
    dueDate,
  };

  const document = buildPlatformInvoiceDocument(
    {
      id: existing?.id ?? "draft",
      tenantId: tenant.id,
      invoiceNumber,
      periodYear: period.year,
      periodMonth: period.month,
      status: PlatformInvoiceStatus.DRAFT,
      sentAt: null,
      paidAt: null,
      emailSentTo: null,
      resendId: null,
      pdfData: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...draftData,
    },
    tenant
  );

  const pdfBytes = await generatePlatformInvoicePdf(document);
  const pdfData = pdfToBase64(pdfBytes);

  if (existing) {
    return prisma.platformInvoice.update({
      where: { id: existing.id },
      data: {
        ...draftData,
        pdfData,
        status:
          existing.status === PlatformInvoiceStatus.PAID
            ? PlatformInvoiceStatus.PAID
            : existing.status === PlatformInvoiceStatus.CANCELLED
              ? PlatformInvoiceStatus.DRAFT
              : PlatformInvoiceStatus.DRAFT,
      },
    });
  }

  return prisma.platformInvoice.create({
    data: {
      tenantId: params.tenantId,
      invoiceNumber,
      periodYear: period.year,
      periodMonth: period.month,
      ...draftData,
      pdfData,
      status: PlatformInvoiceStatus.DRAFT,
    },
  });
}

export async function getPlatformInvoiceWithDocument(invoiceId: string) {
  const invoice = await prisma.platformInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      tenant: { select: tenantBillingSelect },
    },
  });

  if (!invoice) return null;

  return {
    invoice,
    document: buildPlatformInvoiceDocument(invoice, invoice.tenant),
  };
}

export async function sendPlatformInvoice(invoiceId: string) {
  const result = await getPlatformInvoiceWithDocument(invoiceId);
  if (!result) throw new Error("INVOICE_NOT_FOUND");

  const { invoice, document } = result;
  const recipient = invoice.tenant.invoiceEmail?.trim();

  if (!recipient) {
    throw new Error("MISSING_INVOICE_EMAIL");
  }

  if (invoice.status === PlatformInvoiceStatus.CANCELLED) {
    throw new Error("INVOICE_CANCELLED");
  }
  if (invoice.status === PlatformInvoiceStatus.PAID) {
    throw new Error("INVOICE_ALREADY_PAID");
  }

  let pdfBase64 = invoice.pdfData;
  if (!pdfBase64) {
    const pdfBytes = await generatePlatformInvoicePdf(document);
    pdfBase64 = pdfToBase64(pdfBytes);
  }

  const emailResult = await sendPlatformInvoiceEmail({
    to: recipient,
    document,
    pdfBase64,
  });

  if (emailResult.error) {
    throw new Error(emailResult.error);
  }

  return prisma.platformInvoice.update({
    where: { id: invoiceId },
    data: {
      status: PlatformInvoiceStatus.SENT,
      sentAt: new Date(),
      emailSentTo: recipient,
      resendId: emailResult.resendId,
      pdfData: pdfBase64,
    },
  });
}

export async function markPlatformInvoicePaid(invoiceId: string) {
  const invoice = await prisma.platformInvoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  if (invoice.status === PlatformInvoiceStatus.CANCELLED) {
    throw new Error("INVOICE_CANCELLED");
  }

  return prisma.platformInvoice.update({
    where: { id: invoiceId },
    data: {
      status: PlatformInvoiceStatus.PAID,
      paidAt: new Date(),
    },
  });
}

export async function cancelPlatformInvoice(invoiceId: string) {
  const invoice = await prisma.platformInvoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  if (invoice.status === PlatformInvoiceStatus.PAID) {
    throw new Error("INVOICE_ALREADY_PAID");
  }
  if (invoice.status === PlatformInvoiceStatus.CANCELLED) {
    return invoice;
  }

  return prisma.platformInvoice.update({
    where: { id: invoiceId },
    data: { status: PlatformInvoiceStatus.CANCELLED },
  });
}

export async function getTenantInvoiceHistory(tenantId: string) {
  return prisma.platformInvoice.findMany({
    where: { tenantId },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
  });
}

export type MonthlyBillingResult = {
  period: BillingPeriod;
  generated: number;
  sent: number;
  skipped: number;
  errors: Array<{ tenantId: string; tenantName: string; error: string }>;
};

export async function runMonthlyBillingJob(options?: {
  period?: BillingPeriod;
  autoSend?: boolean;
}): Promise<MonthlyBillingResult> {
  await markOverdueInvoices();

  const period = options?.period ?? getPreviousBillingPeriod();
  const autoSend = options?.autoSend ?? true;

  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, active: true },
    where: { active: true },
  });

  const result: MonthlyBillingResult = {
    period,
    generated: 0,
    sent: 0,
    skipped: 0,
    errors: [],
  };

  for (const tenant of tenants) {
    try {
      const existing = await prisma.platformInvoice.findUnique({
        where: {
          tenantId_periodYear_periodMonth: {
            tenantId: tenant.id,
            periodYear: period.year,
            periodMonth: period.month,
          },
        },
      });

      if (existing?.status === PlatformInvoiceStatus.PAID) {
        result.skipped++;
        continue;
      }

      if (existing?.status === PlatformInvoiceStatus.CANCELLED) {
        result.skipped++;
        continue;
      }

      const invoice = await generatePlatformInvoice({
        tenantId: tenant.id,
        period,
        regenerate: Boolean(existing),
      });
      result.generated++;

      if (autoSend && invoice.totalAmount > 0) {
        try {
          await sendPlatformInvoice(invoice.id);
          result.sent++;
        } catch (sendError) {
          result.errors.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            error:
              sendError instanceof Error
                ? sendError.message
                : "Kunde inte skicka faktura",
          });
        }
      }
    } catch (error) {
      result.errors.push({
        tenantId: tenant.id,
        tenantName: tenant.name,
        error: error instanceof Error ? error.message : "Okänt fel",
      });
    }
  }

  return result;
}
