export const PUBLIC_TENANT_COOKIE = "public-tenant-slug";

/** Browser path e.g. /r/lomma-pizzeria/menu → lomma-pizzeria */
export function parseTenantSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/r\/([a-z0-9-]+)/);
  return match?.[1] ?? null;
}

/** /r/lomma-pizzeria/menu → /menu */
export function stripTenantPrefix(pathname: string): string {
  const match = pathname.match(/^\/r\/[a-z0-9-]+(\/.*)?$/);
  if (!match) return pathname;
  return match[1] || "/";
}

/** Prefix path when browsing a tenant preview under /r/[slug] */
export function withTenantPath(pathname: string, path: string): string {
  const slug = parseTenantSlugFromPath(pathname);
  if (!slug) return path;
  return `/r/${slug}${path === "/" ? "" : path}`;
}

export function publicSiteUrl(slug: string, path = "/"): string {
  return `/r/${slug}${path === "/" ? "" : path}`;
}

/** Base path prefix for in-app links when viewing a non-default tenant */
export function tenantBasePath(slug: string): string {
  const defaultSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "ellstorps-krog";
  if (slug === defaultSlug) return "";
  return `/r/${slug}`;
}
