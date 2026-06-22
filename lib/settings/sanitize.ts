import type { DeliveryZone, OpeningHours, SiteSettings } from "@prisma/client";
import { buildStripeConfig } from "@/lib/stripe/config";

/** Safe subset of site settings exposed to public clients and SSR pages. */
export type PublicSiteSettings = {
  tenantId: string;
  restaurantName: string;
  phone: string;
  email: string;
  address: string;
  logo: string | null;
  heroImage: string | null;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  minimumOrder: number;
  deliveryFee: number;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  keywords: string | null;
  stripeCardEnabled: boolean;
  stripeTestMode: boolean;
  stripePublishableKey: string | null;
};

export type SanitizedPublicSettings = {
  settings: PublicSiteSettings;
  openingHours: OpeningHours[];
  deliveryZones: DeliveryZone[];
  isOpen: boolean;
  stripeCardEnabled: boolean;
  stripeTestMode: boolean;
};

export function toPublicSiteSettings(settings: SiteSettings): PublicSiteSettings {
  const stripe = buildStripeConfig(settings);
  return {
    tenantId: settings.tenantId,
    restaurantName: settings.restaurantName,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    logo: settings.logo,
    heroImage: settings.heroImage,
    deliveryEnabled: settings.deliveryEnabled,
    pickupEnabled: settings.pickupEnabled,
    minimumOrder: settings.minimumOrder,
    deliveryFee: settings.deliveryFee,
    facebookUrl: settings.facebookUrl,
    instagramUrl: settings.instagramUrl,
    tiktokUrl: settings.tiktokUrl,
    metaTitle: settings.metaTitle,
    metaDescription: settings.metaDescription,
    ogImage: settings.ogImage,
    keywords: settings.keywords,
    stripeCardEnabled: stripe.enabled,
    stripeTestMode: settings.stripeTestMode,
    stripePublishableKey: stripe.publishableKey,
  };
}

/** Admin settings response — never exposes payment secrets. */
export function toAdminSiteSettings(settings: SiteSettings) {
  const {
    stripeSecretKeyTest: _stripeSecretKeyTest,
    stripeSecretKeyLive: _stripeSecretKeyLive,
    stripeWebhookSecretTest: _stripeWebhookSecretTest,
    stripeWebhookSecretLive: _stripeWebhookSecretLive,
    ...safe
  } = settings;
  void _stripeSecretKeyTest;
  void _stripeSecretKeyLive;
  void _stripeWebhookSecretTest;
  void _stripeWebhookSecretLive;
  return safe;
}
