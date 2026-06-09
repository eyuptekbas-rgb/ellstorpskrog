-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "notificationEmail" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "customerEmailsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN "restaurantEmailsEnabled" BOOLEAN NOT NULL DEFAULT true;
