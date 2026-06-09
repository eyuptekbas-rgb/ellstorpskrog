-- Rename PENDING to NEW and add DELIVERING status
ALTER TYPE "OrderStatus" RENAME VALUE 'PENDING' TO 'NEW';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DELIVERING' AFTER 'READY';

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill status history for existing orders
INSERT INTO "OrderStatusHistory" ("id", "orderId", "status", "createdAt")
SELECT 'hist_' || "id", "id", "status", "createdAt" FROM "Order";
