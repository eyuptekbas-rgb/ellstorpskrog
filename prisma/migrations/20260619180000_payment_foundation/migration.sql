-- Extend payment enums for the provider-neutral payment foundation.
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'APPLE_PAY';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'GOOGLE_PAY';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'SWISH';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'MOBILEPAY';

-- Pickup and delivery orders now require online payment methods.
UPDATE "Order"
SET "paymentMethod" = 'CARD'
WHERE "paymentMethod" IN ('ON_PICKUP', 'ON_DELIVERY');

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "provider" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "providerReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessPaymentSettings" (
    "businessId" TEXT NOT NULL,
    "cardEnabled" BOOLEAN NOT NULL DEFAULT false,
    "applePayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "googlePayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "swishEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mobilePayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripePublishableKey" TEXT,
    "stripeSecretKey" TEXT,
    "swishMerchantNumber" TEXT,
    "mobilePayMerchantId" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessPaymentSettings_pkey" PRIMARY KEY ("businessId")
);

INSERT INTO "BusinessPaymentSettings" (
    "businessId",
    "cardEnabled",
    "stripePublishableKey",
    "stripeSecretKey",
    "isLive",
    "createdAt",
    "updatedAt"
)
SELECT
    "tenantId",
    "stripeEnabled",
    CASE
        WHEN "stripeTestMode" THEN "stripePublishableKeyTest"
        ELSE "stripePublishableKeyLive"
    END,
    CASE
        WHEN "stripeTestMode" THEN "stripeSecretKeyTest"
        ELSE "stripeSecretKeyLive"
    END,
    NOT "stripeTestMode",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "SiteSettings"
ON CONFLICT ("businessId") DO NOTHING;

CREATE UNIQUE INDEX "Payment_provider_providerPaymentId_key" ON "Payment"("provider", "providerPaymentId");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_businessId_idx" ON "Payment"("businessId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_method_idx" ON "Payment"("method");
CREATE INDEX "Payment_providerReference_idx" ON "Payment"("providerReference");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
CREATE INDEX "BusinessPaymentSettings_isLive_idx" ON "BusinessPaymentSettings"("isLive");

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessPaymentSettings" ADD CONSTRAINT "BusinessPaymentSettings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
