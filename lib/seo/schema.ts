import type { OpeningHours, SiteSettings } from "@prisma/client";
import type { MenuCategory } from "@/lib/menu";
import { DAY_NAMES } from "@/lib/settings/utils";
import { absoluteUrl, resolveImageUrl } from "@/lib/seo/url";

const SCHEMA_CONTEXT = "https://schema.org";

function parseAddress(address: string) {
  const postalMatch = address.match(/(\d{3}\s?\d{2})/);
  const postalCode = postalMatch?.[1]?.replace(/\s/g, "") ?? undefined;
  const parts = address.split(",").map((p) => p.trim());
  const streetAddress = parts[0] ?? address;

  return {
    "@type": "PostalAddress" as const,
    streetAddress,
    addressLocality: "Malmö",
    postalCode,
    addressCountry: "SE",
  };
}

function openingHoursSpecification(hours: OpeningHours[]) {
  const dayMap = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return hours
    .filter((h) => !h.isClosed)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: dayMap[h.dayOfWeek],
      opens: h.openTime,
      closes: h.closeTime,
    }));
}

export function buildRestaurantSchema(
  settings: SiteSettings,
  openingHours: OpeningHours[]
) {
  const url = absoluteUrl("/");
  const image = resolveImageUrl(settings.ogImage ?? settings.heroImage, "/hero.jpg");
  const logo = settings.logo ? resolveImageUrl(settings.logo, "/hero.jpg") : image;

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Restaurant",
    "@id": `${url}#restaurant`,
    name: settings.restaurantName,
    url,
    image,
    logo,
    telephone: settings.phone,
    email: settings.email,
    address: parseAddress(settings.address),
    servesCuisine: "Svensk husmanskost",
    priceRange: "$$",
    openingHoursSpecification: openingHoursSpecification(openingHours),
    sameAs: [settings.facebookUrl, settings.instagramUrl, settings.tiktokUrl].filter(
      Boolean
    ),
  };
}

export function buildLocalBusinessSchema(
  settings: SiteSettings,
  openingHours: OpeningHours[]
) {
  const url = absoluteUrl("/");
  const image = resolveImageUrl(settings.ogImage ?? settings.heroImage, "/hero.jpg");

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "LocalBusiness",
    "@id": `${url}#localbusiness`,
    name: settings.restaurantName,
    url,
    image,
    telephone: settings.phone,
    email: settings.email,
    address: parseAddress(settings.address),
    openingHoursSpecification: openingHoursSpecification(openingHours),
    geo: {
      "@type": "GeoCoordinates",
      latitude: 55.605,
      longitude: 13.0038,
    },
  };
}

export function buildHomeSchemaGraph(
  settings: SiteSettings,
  openingHours: OpeningHours[]
) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": [
      buildRestaurantSchema(settings, openingHours),
      buildLocalBusinessSchema(settings, openingHours),
    ],
  };
}

export function buildMenuSchema(
  settings: SiteSettings,
  categories: MenuCategory[]
) {
  const url = absoluteUrl("/menu");

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Menu",
    "@id": `${url}#menu`,
    name: `Meny — ${settings.restaurantName}`,
    url,
    inLanguage: "sv-SE",
    hasMenuSection: categories.map((category) => ({
      "@type": "MenuSection",
      name: category.name,
      hasMenuItem: category.products.map((product) => ({
        "@type": "MenuItem",
        name: product.name,
        description: product.description,
        ...(product.image ? { image: resolveImageUrl(product.image, "/hero.jpg") } : {}),
        offers: {
          "@type": "Offer",
          price: (product.price / 1).toFixed(0),
          priceCurrency: "SEK",
          availability: product.soldOut
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
        },
      })),
    })),
  };
}

export function buildMenuPageSchemaGraph(
  settings: SiteSettings,
  openingHours: OpeningHours[],
  categories: MenuCategory[]
) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": [
      buildRestaurantSchema(settings, openingHours),
      buildMenuSchema(settings, categories),
    ],
  };
}

export function formatOpeningHoursForDisplay(hours: OpeningHours[]): string[] {
  return hours
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((h) => {
      const day = DAY_NAMES[h.dayOfWeek];
      if (h.isClosed) return `${day}: Stängt`;
      return `${day}: ${h.openTime}–${h.closeTime}`;
    });
}
