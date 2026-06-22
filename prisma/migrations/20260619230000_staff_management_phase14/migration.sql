-- Staff management (Phase 14)
CREATE TYPE "StaffJobRole" AS ENUM ('OWNER', 'MANAGER', 'KITCHEN', 'CASHIER', 'DELIVERY', 'WAITER', 'CUSTOM');
CREATE TYPE "StaffStatus" AS ENUM ('INVITED', 'ACTIVE', 'INACTIVE');

ALTER TABLE "User" ADD COLUMN "staffJobRole" "StaffJobRole";
ALTER TABLE "User" ADD COLUMN "staffStatus" "StaffStatus";
ALTER TABLE "User" ADD COLUMN "customRoleLabel" TEXT;
ALTER TABLE "User" ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "forceLogoutBefore" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "User_staffStatus_idx" ON "User"("staffStatus");
CREATE INDEX "User_staffJobRole_idx" ON "User"("staffJobRole");

CREATE TABLE "StaffNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffLoginEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffLoginEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffAuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StaffNote_userId_idx" ON "StaffNote"("userId");
CREATE INDEX "StaffLoginEvent_userId_idx" ON "StaffLoginEvent"("userId");
CREATE INDEX "StaffLoginEvent_tenantId_idx" ON "StaffLoginEvent"("tenantId");
CREATE INDEX "StaffLoginEvent_createdAt_idx" ON "StaffLoginEvent"("createdAt");
CREATE INDEX "StaffAuditLog_tenantId_idx" ON "StaffAuditLog"("tenantId");
CREATE INDEX "StaffAuditLog_actorUserId_idx" ON "StaffAuditLog"("actorUserId");
CREATE INDEX "StaffAuditLog_targetUserId_idx" ON "StaffAuditLog"("targetUserId");
CREATE INDEX "StaffAuditLog_category_idx" ON "StaffAuditLog"("category");
CREATE INDEX "StaffAuditLog_createdAt_idx" ON "StaffAuditLog"("createdAt");

ALTER TABLE "StaffNote" ADD CONSTRAINT "StaffNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffLoginEvent" ADD CONSTRAINT "StaffLoginEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffAuditLog" ADD CONSTRAINT "StaffAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffAuditLog" ADD CONSTRAINT "StaffAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
