-- AlterTable SiteSettings: add new fields, remove openHours
ALTER TABLE "SiteSettings" ADD COLUMN "logo" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "heroImage" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "minimumOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SiteSettings" ADD COLUMN "deliveryFee" INTEGER NOT NULL DEFAULT 49;
ALTER TABLE "SiteSettings" ADD COLUMN "facebookUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "instagramUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "tiktokUrl" TEXT;
ALTER TABLE "SiteSettings" DROP COLUMN "openHours";

-- CreateTable OpeningHours
CREATE TABLE "OpeningHours" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OpeningHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable DeliveryZone
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "postalCodes" TEXT NOT NULL,
    "deliveryFee" INTEGER NOT NULL DEFAULT 49,
    "minimumOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpeningHours_dayOfWeek_key" ON "OpeningHours"("dayOfWeek");

-- Seed default opening hours (0=Sunday … 6=Saturday)
INSERT INTO "OpeningHours" ("id", "dayOfWeek", "openTime", "closeTime", "isClosed") VALUES
  ('oh_sun', 0, '13:00', '21:00', false),
  ('oh_mon', 1, '13:00', '21:00', false),
  ('oh_tue', 2, '13:00', '22:00', false),
  ('oh_wed', 3, '13:00', '22:00', false),
  ('oh_thu', 4, '13:00', '22:00', false),
  ('oh_fri', 5, '13:00', '23:00', false),
  ('oh_sat', 6, '13:00', '23:00', false);
