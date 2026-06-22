-- Production blockers: Decimal amounts, webhook idempotency, composite indexes.

ALTER TABLE "Payment"
  ALTER COLUMN "amount" TYPE DECIMAL(12, 2) USING ("amount"::numeric);

CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "paymentId" TEXT,
    "payloadHash" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentWebhookEvent_provider_eventId_key" ON "PaymentWebhookEvent"("provider", "eventId");
CREATE INDEX "PaymentWebhookEvent_paymentId_idx" ON "PaymentWebhookEvent"("paymentId");
CREATE INDEX "PaymentWebhookEvent_processedAt_idx" ON "PaymentWebhookEvent"("processedAt");

CREATE INDEX "Payment_businessId_createdAt_idx" ON "Payment"("businessId", "createdAt");
CREATE INDEX "Payment_businessId_status_idx" ON "Payment"("businessId", "status");
CREATE INDEX "Payment_businessId_orderId_idx" ON "Payment"("businessId", "orderId");
CREATE INDEX "Payment_businessId_providerReference_idx" ON "Payment"("businessId", "providerReference");

ALTER TABLE "PaymentWebhookEvent" ADD CONSTRAINT "PaymentWebhookEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
