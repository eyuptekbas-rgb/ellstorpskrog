CREATE TABLE "DeliveryAssignment" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "orderId" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'queued', "driverId" TEXT, "driverName" TEXT,
    "etaMinutes" INTEGER, "assignedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "DeliveryAssignment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RmsTerminal" (
    "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "name" TEXT NOT NULL, "location" TEXT NOT NULL,
    "kitchen" TEXT NOT NULL, "deviceKind" TEXT NOT NULL DEFAULT 'pos', "printerStatus" TEXT NOT NULL DEFAULT 'unknown',
    "printQueueLength" INTEGER NOT NULL DEFAULT 0, "offlineQueueLength" INTEGER NOT NULL DEFAULT 0,
    "appVersion" TEXT, "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RmsTerminal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeliveryAssignment_orderId_key" ON "DeliveryAssignment"("orderId");
CREATE INDEX "DeliveryAssignment_tenantId_updatedAt_idx" ON "DeliveryAssignment"("tenantId", "updatedAt");
CREATE INDEX "DeliveryAssignment_tenantId_deliveryStatus_idx" ON "DeliveryAssignment"("tenantId", "deliveryStatus");
CREATE UNIQUE INDEX "RmsTerminal_tenantId_id_key" ON "RmsTerminal"("tenantId", "id");
CREATE INDEX "RmsTerminal_tenantId_lastSeen_idx" ON "RmsTerminal"("tenantId", "lastSeen");
ALTER TABLE "DeliveryAssignment" ADD CONSTRAINT "DeliveryAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryAssignment" ADD CONSTRAINT "DeliveryAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RmsTerminal" ADD CONSTRAINT "RmsTerminal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
