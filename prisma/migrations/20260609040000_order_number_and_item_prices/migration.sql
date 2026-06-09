-- AlterTable Order: add orderNumber
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderNumber" TEXT;

UPDATE "Order" o
SET "orderNumber" = 'EK-' || LPAD(numbered.rn::text, 6, '0')
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
  FROM "Order"
  WHERE "orderNumber" IS NULL
) AS numbered
WHERE o.id = numbered.id;

ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");

-- AlterTable OrderItem: unitPrice + totalPrice
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "unitPrice" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "totalPrice" INTEGER;

UPDATE "OrderItem"
SET
  "unitPrice" = COALESCE("price", 0),
  "totalPrice" = COALESCE("price", 0) * "quantity"
WHERE "unitPrice" IS NULL;

ALTER TABLE "OrderItem" ALTER COLUMN "unitPrice" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "totalPrice" SET NOT NULL;

ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "price";
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "selectedOptions";
