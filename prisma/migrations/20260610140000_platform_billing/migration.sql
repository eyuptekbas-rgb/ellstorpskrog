-- CreateEnum
CREATE TYPE "PlatformInvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "monthlySubscriptionFee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Tenant" ADD COLUMN "orderFee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Tenant" ADD COLUMN "invoiceEmail" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "companyName" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "organizationNumber" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "billingAddress" TEXT;

-- CreateTable
CREATE TABLE "PlatformInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "subscriptionFee" INTEGER NOT NULL,
    "orderCount" INTEGER NOT NULL,
    "orderFeePerOrder" INTEGER NOT NULL,
    "orderFeeTotal" INTEGER NOT NULL,
    "vatRate" INTEGER NOT NULL DEFAULT 0,
    "vatAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "status" "PlatformInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "emailSentTo" TEXT,
    "resendId" TEXT,
    "pdfData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformInvoice_invoiceNumber_key" ON "PlatformInvoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformInvoice_tenantId_periodYear_periodMonth_key" ON "PlatformInvoice"("tenantId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "PlatformInvoice_tenantId_idx" ON "PlatformInvoice"("tenantId");

-- CreateIndex
CREATE INDEX "PlatformInvoice_status_idx" ON "PlatformInvoice"("status");

-- CreateIndex
CREATE INDEX "PlatformInvoice_periodYear_periodMonth_idx" ON "PlatformInvoice"("periodYear", "periodMonth");

-- AddForeignKey
ALTER TABLE "PlatformInvoice" ADD CONSTRAINT "PlatformInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
