-- Phase 8: Restaurant admin menu management fields

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "icon" TEXT;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "ingredients" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "allergens" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "campaignPrice" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "campaignStart" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "campaignEnd" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "hidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isPopular" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isNew" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isVegetarian" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isGlutenFree" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "spicyLevel" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "ProductOptionGroup" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductOptionGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductOptionItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceModifier" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductOptionItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductOptionGroup_productId_idx" ON "ProductOptionGroup"("productId");
CREATE INDEX IF NOT EXISTS "ProductOptionItem_groupId_idx" ON "ProductOptionItem"("groupId");
CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");

DO $$ BEGIN
  ALTER TABLE "ProductOptionGroup" ADD CONSTRAINT "ProductOptionGroup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProductOptionItem" ADD CONSTRAINT "ProductOptionItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProductOptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
