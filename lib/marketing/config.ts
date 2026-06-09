import type { SiteSettings } from "@prisma/client";
import type { MarketingPublicConfig } from "@/lib/consent/types";

export function buildMarketingPublicConfig(
  settings: SiteSettings
): MarketingPublicConfig {
  const googleAnalyticsId = settings.googleAnalyticsId?.trim() ?? "";
  const googleTagManagerId = settings.googleTagManagerId?.trim() ?? "";
  const googleAdsConversionId = settings.googleAdsConversionId?.trim() ?? "";
  const metaPixelId = settings.metaPixelId?.trim() ?? "";

  const googleAnalyticsEnabled =
    settings.googleAnalyticsEnabled && Boolean(googleAnalyticsId);
  const googleTagManagerEnabled =
    settings.googleTagManagerEnabled && Boolean(googleTagManagerId);
  const googleAdsEnabled =
    settings.googleAdsEnabled && Boolean(googleAdsConversionId);
  const metaPixelEnabled =
    settings.metaPixelEnabled && Boolean(metaPixelId);

  return {
    googleAnalyticsId,
    googleTagManagerId,
    googleAdsConversionId,
    metaPixelId,
    googleAnalyticsEnabled,
    googleTagManagerEnabled,
    googleAdsEnabled,
    metaPixelEnabled,
    hasTracking:
      googleAnalyticsEnabled ||
      googleTagManagerEnabled ||
      googleAdsEnabled ||
      metaPixelEnabled,
  };
}

export type MarketingAdminConfig = MarketingPublicConfig;

export function buildMarketingAdminConfig(
  settings: SiteSettings
): MarketingAdminConfig & {
  googleAnalyticsEnabledToggle: boolean;
  googleTagManagerEnabledToggle: boolean;
  googleAdsEnabledToggle: boolean;
  metaPixelEnabledToggle: boolean;
} {
  const pub = buildMarketingPublicConfig(settings);
  return {
    ...pub,
    googleAnalyticsEnabledToggle: settings.googleAnalyticsEnabled,
    googleTagManagerEnabledToggle: settings.googleTagManagerEnabled,
    googleAdsEnabledToggle: settings.googleAdsEnabled,
    metaPixelEnabledToggle: settings.metaPixelEnabled,
  };
}
