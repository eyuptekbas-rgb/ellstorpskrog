import type { Metadata } from "next";
import type { SiteSettings } from "@prisma/client";
import { ensureSiteSettings } from "@/lib/settings";
import { LOGO_PATH } from "@/lib/brand/images";
import { absoluteUrl, parseKeywords, resolveImageUrl } from "@/lib/seo/url";

const DEFAULT_DESCRIPTION =
  "Restaurang i Malmö – beställ online, boka bord eller beställ hemleverans.";

export type MetadataOverrides = {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string | null;
  noIndex?: boolean;
};

export function buildMetadataFromSettings(
  settings: SiteSettings,
  overrides: MetadataOverrides = {}
): Metadata {
  const siteName = settings.restaurantName;
  const defaultTitle = settings.metaTitle?.trim() || siteName;
  const title = overrides.title?.trim() || defaultTitle;
  const description =
    overrides.description?.trim() ||
    settings.metaDescription?.trim() ||
    DEFAULT_DESCRIPTION;

  const ogImage = resolveImageUrl(
    overrides.ogImage ?? settings.ogImage ?? settings.logo ?? settings.heroImage,
    LOGO_PATH
  );

  const pageUrl = overrides.path ? absoluteUrl(overrides.path) : absoluteUrl("/");
  const keywords = parseKeywords(settings.keywords);

  return {
    metadataBase: new URL(absoluteUrl("/")),
    title: {
      default: defaultTitle,
      template: `%s | ${siteName}`,
    },
    description,
    keywords,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "website",
      locale: "sv_SE",
      url: pageUrl,
      siteName,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: overrides.noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true },
        },
  };
}

export async function generateSiteMetadata(
  overrides: MetadataOverrides = {}
): Promise<Metadata> {
  const settings = await ensureSiteSettings();
  return buildMetadataFromSettings(settings, overrides);
}

export async function getSeoSettings() {
  const settings = await ensureSiteSettings();
  return {
    metaTitle: settings.metaTitle ?? "",
    metaDescription: settings.metaDescription ?? "",
    ogImage: settings.ogImage ?? "",
    keywords: settings.keywords ?? "",
    restaurantName: settings.restaurantName,
  };
}
