-- Multi-tenant platform: Ordina + restaurant tenants

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN';

CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#b85c38',
    "logo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

INSERT INTO "Tenant" ("id", "slug", "name", "primaryColor", "active", "createdAt", "updatedAt")
VALUES (
    'tenant_ellstorps_krog',
    'ellstorps-krog',
    'Ellstorps Krog',
    '#b85c38',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "User" SET "tenantId" = 'tenant_ellstorps_krog' WHERE "role" IN ('ADMIN', 'STAFF');

ALTER TABLE "Category" ADD COLUMN "tenantId" TEXT;
UPDATE "Category" SET "tenantId" = 'tenant_ellstorps_krog';
ALTER TABLE "Category" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "Category_slug_key";
CREATE UNIQUE INDEX "Category_tenantId_slug_key" ON "Category"("tenantId", "slug");
CREATE INDEX "Category_tenantId_idx" ON "Category"("tenantId");
ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExtraOption" ADD COLUMN "tenantId" TEXT;
UPDATE "ExtraOption" SET "tenantId" = 'tenant_ellstorps_krog';
ALTER TABLE "ExtraOption" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "ExtraOption_tenantId_idx" ON "ExtraOption"("tenantId");
ALTER TABLE "ExtraOption" ADD CONSTRAINT "ExtraOption_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order" ADD COLUMN "tenantId" TEXT;
UPDATE "Order" SET "tenantId" = 'tenant_ellstorps_krog';
ALTER TABLE "Order" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "Order_orderNumber_key";
CREATE UNIQUE INDEX "Order_tenantId_orderNumber_key" ON "Order"("tenantId", "orderNumber");
CREATE INDEX "Order_tenantId_idx" ON "Order"("tenantId");
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OpeningHours" ADD COLUMN "tenantId" TEXT;
UPDATE "OpeningHours" SET "tenantId" = 'tenant_ellstorps_krog';
ALTER TABLE "OpeningHours" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "OpeningHours_dayOfWeek_key";
CREATE UNIQUE INDEX "OpeningHours_tenantId_dayOfWeek_key" ON "OpeningHours"("tenantId", "dayOfWeek");
CREATE INDEX "OpeningHours_tenantId_idx" ON "OpeningHours"("tenantId");
ALTER TABLE "OpeningHours" ADD CONSTRAINT "OpeningHours_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DeliveryZone" ADD COLUMN "tenantId" TEXT;
UPDATE "DeliveryZone" SET "tenantId" = 'tenant_ellstorps_krog';
ALTER TABLE "DeliveryZone" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "DeliveryZone_tenantId_idx" ON "DeliveryZone"("tenantId");
ALTER TABLE "DeliveryZone" ADD CONSTRAINT "DeliveryZone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reservation" ADD COLUMN "tenantId" TEXT;
UPDATE "Reservation" SET "tenantId" = 'tenant_ellstorps_krog';
ALTER TABLE "Reservation" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Reservation_tenantId_idx" ON "Reservation"("tenantId");
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SiteSettings: migrate from integer id to tenantId primary key
ALTER TABLE "SiteSettings" ADD COLUMN "tenantId" TEXT;
UPDATE "SiteSettings" SET "tenantId" = 'tenant_ellstorps_krog' WHERE "id" = 1;
ALTER TABLE "SiteSettings" DROP CONSTRAINT "SiteSettings_pkey";
ALTER TABLE "SiteSettings" DROP COLUMN "id";
ALTER TABLE "SiteSettings" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("tenantId");
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
