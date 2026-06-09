-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'ON_DELIVERY';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentIntentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripeSessionId_key" ON "Order"("stripeSessionId");

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "stripeEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "stripeTestMode" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "stripePublishableKeyTest" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "stripeSecretKeyTest" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "stripeWebhookSecretTest" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "stripePublishableKeyLive" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "stripeSecretKeyLive" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "stripeWebhookSecretLive" TEXT;

-- Mark existing card orders as paid (legacy), cash orders stay pending
UPDATE "Order" SET "paymentStatus" = 'PAID' WHERE "paymentMethod" = 'CARD';
UPDATE "Order" SET "paymentStatus" = 'PENDING' WHERE "paymentMethod" = 'ON_PICKUP';
