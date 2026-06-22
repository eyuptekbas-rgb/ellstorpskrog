-- Category-level extra options (global library + category assignment)

CREATE TABLE "ExtraOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceModifier" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CategoryExtraOption" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "extraOptionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CategoryExtraOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CategoryExtraOption_categoryId_extraOptionId_key" ON "CategoryExtraOption"("categoryId", "extraOptionId");
CREATE INDEX "CategoryExtraOption_categoryId_idx" ON "CategoryExtraOption"("categoryId");
CREATE INDEX "CategoryExtraOption_extraOptionId_idx" ON "CategoryExtraOption"("extraOptionId");

ALTER TABLE "CategoryExtraOption" ADD CONSTRAINT "CategoryExtraOption_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CategoryExtraOption" ADD CONSTRAINT "CategoryExtraOption_extraOptionId_fkey" FOREIGN KEY ("extraOptionId") REFERENCES "ExtraOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate distinct extras from per-product options into the global library
INSERT INTO "ExtraOption" ("id", "name", "priceModifier", "sortOrder", "active", "createdAt", "updatedAt")
SELECT
    'mig_' || substr(md5("name" || ':' || "priceModifier"::text), 1, 20),
    "name",
    "priceModifier",
    MIN("sortOrder"),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "ProductOption"
GROUP BY "name", "priceModifier";

INSERT INTO "CategoryExtraOption" ("id", "categoryId", "extraOptionId", "sortOrder")
SELECT DISTINCT ON (p."categoryId", eo."id")
    'mig_' || substr(md5(p."categoryId" || ':' || eo."id"), 1, 20),
    p."categoryId",
    eo."id",
    po."sortOrder"
FROM "ProductOption" po
INNER JOIN "Product" p ON p."id" = po."productId"
INNER JOIN "ExtraOption" eo ON eo."name" = po."name" AND eo."priceModifier" = po."priceModifier"
ORDER BY p."categoryId", eo."id", po."sortOrder";

DROP TABLE "ProductOption";
