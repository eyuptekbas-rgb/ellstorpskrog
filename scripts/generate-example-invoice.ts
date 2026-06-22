/**
 * Generate example platform invoice for Ellstorps Krog and print summary JSON.
 */
import { PrismaClient, PlatformInvoiceStatus } from "@prisma/client";
import { generatePlatformInvoice } from "../lib/billing/service";
import { buildPlatformInvoiceDocument } from "../lib/billing/invoice-data";
import { getCurrentBillingPeriod } from "../lib/billing/period";

async function main() {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findUnique({
    where: { slug: "ellstorps-krog" },
    select: {
      id: true,
      name: true,
      customerNumber: true,
      monthlySubscriptionFee: true,
      orderFee: true,
      billingVatRate: true,
    },
  });

  if (!tenant) {
    console.error("Ellstorps Krog tenant not found");
    process.exit(1);
  }

  const period = getCurrentBillingPeriod();
  const invoice = await generatePlatformInvoice({
    tenantId: tenant.id,
    period,
    regenerate: true,
  });

  const full = await prisma.platformInvoice.findUnique({
    where: { id: invoice.id },
    include: {
      tenant: {
        select: {
          name: true,
          customerNumber: true,
          companyName: true,
          organizationNumber: true,
          billingAddress: true,
          invoiceEmail: true,
        },
      },
    },
  });

  if (!full?.tenant.customerNumber) {
    throw new Error("Missing customer number");
  }

  const document = buildPlatformInvoiceDocument(full, full.tenant);

  console.log(
    JSON.stringify(
      {
        tenant: tenant.name,
        customerNumber: tenant.customerNumber,
        invoiceNumber: full.invoiceNumber,
        status: full.status,
        period: `${full.periodYear}-${String(full.periodMonth).padStart(2, "0")}`,
        subscriptionFee: full.subscriptionFee,
        orderCount: full.orderCount,
        orderFeePerOrder: full.orderFeePerOrder,
        orderFeeTotal: full.orderFeeTotal,
        vatRate: full.vatRate,
        vatAmount: full.vatAmount,
        totalAmount: full.totalAmount,
        calculation: `${full.subscriptionFee} + (${full.orderCount} × ${full.orderFeePerOrder}) + moms ${full.vatRate}% = ${full.totalAmount} SEK`,
        pdfStored: Boolean(full.pdfData),
        documentCustomerNumber: document.customer.customerNumber,
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
