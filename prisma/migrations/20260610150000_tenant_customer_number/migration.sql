-- AlterTable: customer number + VAT override
ALTER TABLE "Tenant" ADD COLUMN "billingVatRate" INTEGER;
ALTER TABLE "Tenant" ADD COLUMN "customerNumber" TEXT;

-- Backfill customer numbers (oldest tenant first → 00000001)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, id ASC) AS rn
  FROM "Tenant"
)
UPDATE "Tenant" t
SET "customerNumber" = LPAD(n.rn::text, 8, '0')
FROM numbered n
WHERE t.id = n.id AND t."customerNumber" IS NULL;

-- Unique index (nullable until backfill completes)
CREATE UNIQUE INDEX "Tenant_customerNumber_key" ON "Tenant"("customerNumber");
