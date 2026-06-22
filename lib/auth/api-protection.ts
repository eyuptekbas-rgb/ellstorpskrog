import type { NextRequest } from "next/server";

const PUBLIC_API_ROUTES: Array<{ path: string; methods?: string[] }> = [
  { path: "/api/auth", methods: ["GET", "POST"] },
  { path: "/api/settings/public" },
  { path: "/api/faktura/lookup", methods: ["POST"] },
  { path: "/api/faktura", methods: ["GET"] },
  { path: "/api/reservations", methods: ["POST"] },
  { path: "/api/orders", methods: ["POST"] },
  { path: "/api/checkout/create-session", methods: ["POST"] },
  { path: "/api/payments/create", methods: ["POST"] },
  { path: "/api/checkout/session", methods: ["GET"] },
  { path: "/api/checkout/cash", methods: ["GET"] },
  { path: "/api/webhooks/stripe", methods: ["POST"] },
  { path: "/api/health", methods: ["GET"] },
  { path: "/api/self-order", methods: ["GET", "POST"] },
  { path: "/api/contact", methods: ["POST"] },
  { path: "/api/account/register", methods: ["POST"] },
  { path: "/api/platform/billing/cron/monthly", methods: ["GET", "POST"] },
  { path: "/api/platform/billing/cron/overdue", methods: ["GET", "POST"] },
];

const PROTECTED_API_PREFIXES = [
  "/api/admin",
  "/api/realtime",
  "/api/settings",
  "/api/orders",
  "/api/products",
  "/api/extra-options",
  "/api/platform",
  "/api/categories",
  "/api/payments",
  "/api/notifications",
  "/api/marketing",
  "/api/seo",
  "/api/delivery-zones",
  "/api/opening-hours",
  "/api/reservations",
  "/api/account",
  "/api/deployment",
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
