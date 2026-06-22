-- Customer CRM & loyalty (Phase 13)
CREATE TYPE "CustomerVipLevel" AS ENUM ('REGULAR', 'SILVER', 'GOLD', 'VIP');

CREATE TABLE "CustomerCrmProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT,
    "address" TEXT,
    "vipLevel" "CustomerVipLevel" NOT NULL DEFAULT 'REGULAR',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "vipOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCrmProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerAdminNote" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAdminNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoyaltyEvent" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "pointsDelta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerCrmProfile_userId_key" ON "CustomerCrmProfile"("userId");
CREATE UNIQUE INDEX "CustomerCrmProfile_tenantId_email_key" ON "CustomerCrmProfile"("tenantId", "email");
CREATE INDEX "CustomerCrmProfile_tenantId_idx" ON "CustomerCrmProfile"("tenantId");
CREATE INDEX "CustomerCrmProfile_phone_idx" ON "CustomerCrmProfile"("phone");
CREATE INDEX "CustomerAdminNote_profileId_idx" ON "CustomerAdminNote"("profileId");
CREATE INDEX "LoyaltyEvent_profileId_idx" ON "LoyaltyEvent"("profileId");
CREATE INDEX "LoyaltyEvent_createdAt_idx" ON "LoyaltyEvent"("createdAt");

ALTER TABLE "CustomerCrmProfile" ADD CONSTRAINT "CustomerCrmProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerCrmProfile" ADD CONSTRAINT "CustomerCrmProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerAdminNote" ADD CONSTRAINT "CustomerAdminNote_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CustomerCrmProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoyaltyEvent" ADD CONSTRAINT "LoyaltyEvent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CustomerCrmProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
