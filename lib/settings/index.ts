import { Prisma, type DeliveryZone, type OpeningHours, type SiteSettings } from "@prisma/client";
import { getDbErrorMessage, isPrismaConnectionError } from "@/lib/db/errors";
import { DEFAULT_OPENING_HOURS } from "@/lib/openingHours";
import { buildStripeConfig } from "@/lib/stripe/config";
import {
  toPublicSiteSettings,
  type PublicSiteSettings,
  type SanitizedPublicSettings,
} from "@/lib/settings/sanitize";
import { prisma } from "@/lib/prisma";
import { isRestaurantOpen } from "@/lib/settings/utils";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";

export {
  DAY_NAMES,
  formatHoursRange,
  isRestaurantOpen,
  matchDeliveryZone,
  parsePostalCodes,
  phoneHref,
} from "@/lib/settings/utils";

export type { PublicSiteSettings, SanitizedPublicSettings };

function defaultSettingsForTenant(
  tenantId: string
): Prisma.SiteSettingsUncheckedCreateInput {
  return {
    tenantId,
    restaurantName: "Restaurang",
    phone: "+46 40 18 42 68",
    email: "info@example.com",
    address: "Adress",
    logo: null,
    heroImage: "/hero.jpg",
    deliveryEnabled: true,
    pickupEnabled: true,
    minimumOrder: 0,
    deliveryFee: 49,
    facebookUrl: null,
    instagramUrl: null,
    tiktokUrl: null,
    notificationEmail: null,
    emailSenderName: null,
    emailSenderAddress: null,
    customerEmailsEnabled: true,
    restaurantEmailsEnabled: true,
    notifyCustomerOrderConfirmation: true,
    notifyCustomerPaymentConfirmation: true,
    notifyCustomerOrderReady: true,
    notifyCustomerOrderDelivered: true,
    notifyCustomerOrderCancelled: true,
    notifyRestaurantNewOrder: true,
    notifyRestaurantPaymentReceived: true,
    notifyRestaurantOrderCancelled: true,
    metaTitle: null,
    metaDescription: null,
    ogImage: null,
    keywords: null,
    googleAnalyticsId: null,
    googleTagManagerId: null,
    googleAdsConversionId: null,
    metaPixelId: null,
    googleAnalyticsEnabled: false,
    googleTagManagerEnabled: false,
    googleAdsEnabled: false,
    metaPixelEnabled: false,
    stripeEnabled: false,
    stripeTestMode: true,
    stripePublishableKeyTest: null,
    stripeSecretKeyTest: null,
    stripeWebhookSecretTest: null,
    stripePublishableKeyLive: null,
    stripeSecretKeyLive: null,
    stripeWebhookSecretLive: null,
  };
}

const DEFAULT_HOURS = DEFAULT_OPENING_HOURS;

export type PublicSettings = SanitizedPublicSettings;

function fallbackSiteSettings(tenantId: string): SiteSettings {
  return {
    ...(defaultSettingsForTenant(tenantId) as unknown as SiteSettings),
    updatedAt: new Date(),
    rmsTerminalSettings: null,
    rmsPrinterRegistry: null,
    rmsEscposConfig: null,
    rmsWindowsPrinterConfig: null,
  };
}

export async function ensureSiteSettings(tenantId?: string): Promise<SiteSettings> {
  const resolvedTenantId = tenantId ?? (await resolvePublicTenantId());
  try {
    const existing = await prisma.siteSettings.findUnique({
      where: { tenantId: resolvedTenantId },
    });
    if (existing) return existing;

    return await prisma.siteSettings.create({
      data: defaultSettingsForTenant(resolvedTenantId),
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("ensureSiteSettings fallback:", getDbErrorMessage(error));
      return fallbackSiteSettings(resolvedTenantId);
    }
    throw error;
  }
}

export async function ensureOpeningHours(tenantId?: string): Promise<OpeningHours[]> {
  const resolvedTenantId = tenantId ?? (await resolvePublicTenantId());
  try {
    const existing = await prisma.openingHours.findMany({
      where: { tenantId: resolvedTenantId },
      orderBy: { dayOfWeek: "asc" },
    });
    if (existing.length === 7) return existing;

    await prisma.openingHours.deleteMany({ where: { tenantId: resolvedTenantId } });
    for (const h of DEFAULT_HOURS) {
      await prisma.openingHours.create({ data: { tenantId: resolvedTenantId, ...h } });
    }

    return prisma.openingHours.findMany({
      where: { tenantId: resolvedTenantId },
      orderBy: { dayOfWeek: "asc" },
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("ensureOpeningHours fallback:", getDbErrorMessage(error));
      return DEFAULT_HOURS.map((h, i) => ({
        id: `default-${i}`,
        tenantId: resolvedTenantId,
        ...h,
      }));
    }
    throw error;
  }
}

export async function getPublicSettings(
  tenantId?: string
): Promise<PublicSettings> {
  const resolvedTenantId = tenantId ?? (await resolvePublicTenantId());

  try {
    const [settings, openingHours, deliveryZones] = await Promise.all([
      ensureSiteSettings(resolvedTenantId),
      ensureOpeningHours(resolvedTenantId),
      getDeliveryZones(resolvedTenantId),
    ]);

    return {
      settings: toPublicSiteSettings(settings),
      openingHours,
      deliveryZones,
      isOpen: isRestaurantOpen(openingHours),
      stripeCardEnabled: buildStripeConfig(settings).enabled,
      stripeTestMode: settings.stripeTestMode,
    };
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      const fallback = fallbackSiteSettings(resolvedTenantId);
      return {
        settings: toPublicSiteSettings(fallback),
        openingHours: DEFAULT_HOURS.map((h, i) => ({
          id: `default-${i}`,
          tenantId: resolvedTenantId,
          ...h,
        })),
        deliveryZones: [],
        isOpen: isRestaurantOpen(DEFAULT_HOURS),
        stripeCardEnabled: false,
        stripeTestMode: true,
      };
    }
    throw error;
  }
}

async function getDeliveryZones(tenantId: string): Promise<DeliveryZone[]> {
  try {
    return await prisma.deliveryZone.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return [];
    }
    throw error;
  }
}
