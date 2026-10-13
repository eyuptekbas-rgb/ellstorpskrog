-- Align database defaults with schema.prisma without changing existing row values.
BEGIN;

ALTER TABLE "BusinessPaymentSettings" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "SiteSettings" ALTER COLUMN "restaurantName" SET DEFAULT 'Restaurang';
ALTER TABLE "Tenant" ALTER COLUMN "templateId" SET DEFAULT 'dark-copper-premium';

COMMIT;
