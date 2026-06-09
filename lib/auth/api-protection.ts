import type { NextRequest } from "next/server";

const PUBLIC_API_ROUTES: Array<{ path: string; methods?: string[] }> = [
  { path: "/api/auth", methods: ["GET", "POST"] },
  { path: "/api/settings/public" },
  { path: "/api/contact", methods: ["POST"] },
  { path: "/api/reservations", methods: ["POST"] },
  { path: "/api/orders", methods: ["POST"] },
  { path: "/api/checkout/create-session", methods: ["POST"] },
  { path: "/api/checkout/session", methods: ["GET"] },
  { path: "/api/webhooks/stripe", methods: ["POST"] },
  { path: "/api/health", methods: ["GET"] },
];

const PROTECTED_API_PREFIXES = [
  "/api/admin",
  "/api/settings",
  "/api/orders",
  "/api/products",
  "/api/categories",
  "/api/payments",
  "/api/notifications",
  "/api/marketing",
  "/api/seo",
  "/api/delivery-zones",
  "/api/opening-hours",
  "/api/reservations",
];

export function isPublicApiRoute(req: NextRequest): boolean {
  const { pathname } = req.nextUrl;
  const method = req.method;

  for (const route of PUBLIC_API_ROUTES) {
    if (
      pathname === route.path ||
      pathname.startsWith(`${route.path}/`)
    ) {
      if (!route.methods || route.methods.includes(method)) {
        return true;
      }
    }
  }

  if (
    pathname === "/api/categories" &&
    method === "GET" &&
    req.nextUrl.searchParams.get("admin") !== "true"
  ) {
    return true;
  }

  return false;
}

export function isProtectedApiRoute(pathname: string): boolean {
  if (!pathname.startsWith("/api/")) return false;
  if (PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return false;
}
