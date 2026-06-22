-- Extend reservation statuses for admin workflow
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'SEATED';
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'NO_SHOW';

-- Restaurant table management
CREATE TABLE "RestaurantTable" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "mergeGroupId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantTable_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Reservation" ADD COLUMN "tableId" TEXT;

CREATE INDEX "Reservation_tableId_idx" ON "Reservation"("tableId");
CREATE INDEX "RestaurantTable_tenantId_idx" ON "RestaurantTable"("tenantId");
CREATE INDEX "RestaurantTable_mergeGroupId_idx" ON "RestaurantTable"("mergeGroupId");
CREATE UNIQUE INDEX "RestaurantTable_tenantId_name_key" ON "RestaurantTable"("tenantId", "name");

ALTER TABLE "RestaurantTable" ADD CONSTRAINT "RestaurantTable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
