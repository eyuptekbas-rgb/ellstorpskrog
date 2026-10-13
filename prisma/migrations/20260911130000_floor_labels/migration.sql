CREATE TABLE "FloorLabel" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "positionX" DOUBLE PRECISION,
  "positionY" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FloorLabel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FloorLabel_tenantId_label_key" ON "FloorLabel"("tenantId", "label");
CREATE INDEX "FloorLabel_tenantId_idx" ON "FloorLabel"("tenantId");
ALTER TABLE "FloorLabel" ADD CONSTRAINT "FloorLabel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
