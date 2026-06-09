export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function resolveImageUrl(image: string | null | undefined, fallback: string): string {
  const src = image?.trim() || fallback;
  return absoluteUrl(src);
}

export function parseKeywords(raw: string | null | undefined): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const list = raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}
