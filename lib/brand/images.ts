const CATEGORY_IMAGES: Record<string, string> = {
  pizza: "/images/categories/pizza.jpg",
  kebab: "/images/categories/kebab.jpg",
  burgare: "/images/categories/burgare.jpg",
  grill: "/images/categories/grill.jpg",
  drycker: "/images/categories/drycker.jpg",
};

export const HERO_FALLBACK = "/hero.jpg";
export const LOGO_PATH = "/logo.png";
export const LOGO_ALT =
  "Ellstorps Kvarterskrog — Pizzeria, pub och restaurang i Malmö";
export const PRODUCT_FALLBACK = "/images/categories/pizza.jpg";

export function getCategoryImage(slug: string): string {
  return CATEGORY_IMAGES[slug] ?? PRODUCT_FALLBACK;
}

export function isLocalUploadPath(path: string): boolean {
  return path.startsWith("/uploads/");
}

export function getProductThumbnailUrl(
  image: string | null | undefined
): string | null {
  if (!image?.trim()) return null;
  const trimmed = image.trim();
  if (
    trimmed.startsWith("/uploads/products/") &&
    trimmed.endsWith(".webp") &&
    !trimmed.endsWith("-thumb.webp")
  ) {
    return trimmed.replace(/\.webp$/, "-thumb.webp");
  }
  return trimmed;
}

export function resolveProductImage(
  image: string | null | undefined,
  categorySlug: string
): string {
  if (image?.trim()) return image.trim();
  return getCategoryImage(categorySlug);
}

export function resolveProductThumbnail(
  image: string | null | undefined,
  categorySlug: string
): string {
  return getProductThumbnailUrl(image) ?? getCategoryImage(categorySlug);
}

export function shouldUnoptimizeImage(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

export function resolveHeroImage(heroImage: string | null | undefined): string {
  return heroImage?.trim() || HERO_FALLBACK;
}
