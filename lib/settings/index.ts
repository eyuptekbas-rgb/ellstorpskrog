import type { DeliveryZone, OpeningHours, SiteSettings } from "@prisma/client";
import { getDbErrorMessage, isPrismaConnectionError } from "@/lib/db/errors";
import { DEFAULT_OPENING_HOURS } from "@/lib/openingHours";
import { buildStripeConfig } from "@/lib/stripe/config";
import { prisma } from "@/lib/prisma";
import { isRestaurantOpen } from "@/lib/settings/utils";

export {
  DAY_NAMES,
  formatHoursRange,
  isRestaurantOpen,
  matchDeliveryZone,
  parsePostalCodes,
  phoneHref,
} from "@/lib/settings/utils";

const DEFAULT_SETTINGS: Omit<SiteSettings, "updatedAt"> = {
  id: 1,
  restaurantName: "Ellstorps Krog",
  phone: "+46 40 18 42 68",
  email: "info@ellstorpskrog.se",
  address: "Sallerupsvägen 28D, 212 18 Malmö",
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

const DEFAULT_HOURS = DEFAULT_OPENING_HOURS;

export type PublicSettings = {
  settings: SiteSettings;
  openingHours: OpeningHours[];
  deliveryZones: DeliveryZone[];
  isOpen: boolean;
  stripeCardEnabled: boolean;
  stripeTestMode: boolean;
};

export async function ensureSiteSettings(): Promise<SiteSettings> {
  try {
    const existing = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (existing) return existing;

    return await prisma.siteSettings.create({
      data: { ...DEFAULT_SETTINGS },
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("ensureSiteSettings fallback:", getDbErrorMessage(error));
      return { ...DEFAULT_SETTINGS, updatedAt: new Date() };
    }
    throw error;
  }
}

export async function ensureOpeningHours(): Promise<OpeningHours[]> {
  try {
    const existing = await prisma.openingHours.findMany({
      orderBy: { dayOfWeek: "asc" },
    });
    if (existing.length === 7) return existing;

    await prisma.openingHours.deleteMany();
    for (const h of DEFAULT_HOURS) {
      await prisma.openingHours.create({ data: h });
    }

    return prisma.openingHours.findMany({ orderBy: { dayOfWeek: "asc" } });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("ensureOpeningHours fallback:", getDbErrorMessage(error));
      return DEFAULT_HOURS.map((h, i) => ({
        id: `default-${i}`,
        ...h,
      }));
    }
    throw error;
  }
}

export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const [settings, openingHours, deliveryZones] = await Promise.all([
      ensureSiteSettings(),
      ensureOpeningHours(),
      getDeliveryZones(),
    ]);

    return {
      settings,
      openingHours,
      deliveryZones,
      isOpen: isRestaurantOpen(openingHours),
      stripeCardEnabled: buildStripeConfig(settings).enabled,
      stripeTestMode: settings.stripeTestMode,
    };
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return {
        settings: { ...DEFAULT_SETTINGS, updatedAt: new Date() },
        openingHours: DEFAULT_HOURS.map((h, i) => ({
          id: `default-${i}`,
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

async function getDeliveryZones(): Promise<DeliveryZone[]> {
  try {
    return await prisma.deliveryZone.findMany({ orderBy: { name: "asc" } });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return [];
    }
    throw error;
  }
}
