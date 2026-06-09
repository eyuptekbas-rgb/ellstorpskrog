-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "metaPixelId" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "googleAnalyticsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "googleTagManagerEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "googleAdsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "metaPixelEnabled" BOOLEAN NOT NULL DEFAULT false;
