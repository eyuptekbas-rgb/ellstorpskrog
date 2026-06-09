-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
  'CUSTOMER_ORDER_CONFIRMATION',
  'CUSTOMER_PAYMENT_CONFIRMATION',
  'CUSTOMER_ORDER_READY',
  'CUSTOMER_ORDER_DELIVERED',
  'CUSTOMER_ORDER_CANCELLED',
  'RESTAURANT_NEW_ORDER',
  'RESTAURANT_PAYMENT_RECEIVED',
  'RESTAURANT_ORDER_CANCELLED'
);

CREATE TYPE "NotificationDeliveryStatus" AS ENUM (
  'PENDING',
  'SENT',
  'FAILED',
  'SKIPPED'
);

-- AlterTable SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "emailSenderName" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "emailSenderAddress" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "notifyCustomerOrderConfirmation" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "notifyCustomerPaymentConfirmation" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "notifyCustomerOrderReady" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "notifyCustomerOrderDelivered" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "notifyCustomerOrderCancelled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "notifyRestaurantNewOrder" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "notifyRestaurantPaymentReceived" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "notifyRestaurantOrderCancelled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE IF NOT EXISTS "NotificationLog" (
  "id" TEXT NOT NULL,
  "orderId" TEXT,
  "type" "NotificationType" NOT NULL,
  "recipient" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "errorMessage" TEXT,
  "resendId" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NotificationLog_orderId_idx" ON "NotificationLog"("orderId");
CREATE INDEX IF NOT EXISTS "NotificationLog_type_idx" ON "NotificationLog"("type");
CREATE INDEX IF NOT EXISTS "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");

ALTER TABLE "NotificationLog" DROP CONSTRAINT IF EXISTS "NotificationLog_orderId_fkey";
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
