export const CONSENT_STORAGE_KEY = "ellstorps-consent";
export const CONSENT_VERSION = 1;

export type ConsentCategories = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

export type ConsentRecord = ConsentCategories & {
  version: number;
  updatedAt: string;
};

export type MarketingPublicConfig = {
  googleAnalyticsId: string;
  googleTagManagerId: string;
  googleAdsConversionId: string;
  metaPixelId: string;
  googleAnalyticsEnabled: boolean;
  googleTagManagerEnabled: boolean;
  googleAdsEnabled: boolean;
  metaPixelEnabled: boolean;
  hasTracking: boolean;
};

export const DEFAULT_CONSENT: ConsentCategories = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function hasAnalyticsConsent(consent: ConsentCategories | null): boolean {
  return Boolean(consent?.analytics);
}

export function hasMarketingConsent(consent: ConsentCategories | null): boolean {
  return Boolean(consent?.marketing);
}

export function consentDecided(consent: ConsentRecord | null): boolean {
  return consent !== null && consent.version === CONSENT_VERSION;
}
