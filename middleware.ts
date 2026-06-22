import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import {
  isProtectedApiRoute,
  isPublicApiRoute,
} from "@/lib/auth/api-protection";
import { isPlatformAdmin, isStaffRole } from "@/lib/auth/roles";
import { checkRateLimit, getClientIp, RATE_LIMITS, STAFF_MUTATION_RATE_LIMITS } from "@/lib/rate-limit";
import { PUBLIC_TENANT_COOKIE } from "@/lib/tenant/public-path";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const tenantRouteMatch = pathname.match(/^\/r\/([a-z0-9-]+)(\/.*)?$/);
  if (tenantRouteMatch) {
    const slug = tenantRouteMatch[1];
    const rest = tenantRouteMatch[2] || "/";
    const url = nextUrl.clone();
    url.pathname = rest;
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-public-tenant-slug", slug);
    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    response.cookies.set(PUBLIC_TENANT_COOKIE, slug, {
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });
    return response;
  }

  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const hasStaffAccess = isLoggedIn && isStaffRole(role);
  const isPlatform = isLoggedIn && isPlatformAdmin(role);

  if (pathname === "/login") {
    if (isPlatform) {
      return NextResponse.redirect(new URL("/platform", nextUrl));
    }
    if (hasStaffAccess) {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
    return NextResponse.next();
  }

  const isCustomer = isLoggedIn && req.auth?.user?.role === "CUSTOMER";

  if (pathname === "/konto/logga-in" || pathname === "/konto/registrera") {
    if (isCustomer) {
      return NextResponse.redirect(new URL("/konto", nextUrl));
    }
    return NextResponse.next();
  }

  if (pathname === "/konto") {
    if (!isCustomer) {
      return NextResponse.redirect(new URL("/konto/logga-in", nextUrl));
    }
    return NextResponse.next();
  }

  if (pathname === "/platform/login") {
    if (isPlatform) {
      return NextResponse.redirect(new URL("/platform", nextUrl));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/platform")) {
    if (!isPlatform) {
      return NextResponse.redirect(new URL("/platform/login", nextUrl));
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/pos") ||
    pathname.startsWith("/kitchen") ||
    pathname.startsWith("/delivery") ||
    pathname.startsWith("/customer-display")
  ) {
    if (!hasStaffAccess) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(req);

    if (req.method === "POST") {
      const limit =
        RATE_LIMITS[pathname] ??
        (pathname.startsWith("/api/auth")
          ? RATE_LIMITS["/api/auth"]
          : undefined);
      if (limit) {
        const result = checkRateLimit(`${pathname}:${ip}`, limit, 60_000);
        if (!result.allowed) {
          return NextResponse.json(
            { error: "Too many requests" },
            {
              status: 429,
              headers: {
                "Retry-After": String(
                  Math.ceil((result.resetAt - Date.now()) / 1000)
                ),
                "X-RateLimit-Limit": String(result.limit),
                "X-RateLimit-Remaining": String(result.remaining),
              },
            }
          );
        }
      }
    }

    for (const rule of STAFF_MUTATION_RATE_LIMITS) {
      if (
        pathname.startsWith(rule.prefix) &&
        rule.methods.includes(req.method)
      ) {
        const result = checkRateLimit(
          `staff-mutation:${pathname}:${ip}`,
          rule.limit,
          60_000
        );
        if (!result.allowed) {
          return NextResponse.json(
            { error: "Too many requests" },
            {
              status: 429,
              headers: {
                "Retry-After": String(
                  Math.ceil((result.resetAt - Date.now()) / 1000)
                ),
              },
            }
          );
        }
        break;
      }
    }

    if (isPublicApiRoute(req)) {
      return NextResponse.next();
    }

    const isCustomerAccountApi =
      pathname.startsWith("/api/account/") &&
      pathname !== "/api/account/register";

    if (isCustomerAccountApi) {
      if (!isCustomer) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.next();
    }

    if (isProtectedApiRoute(pathname) && !hasStaffAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (pathname.startsWith("/api/platform/") && !isPlatform) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const isPublicSiteRoute =
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/pos") &&
    !pathname.startsWith("/kitchen") &&
    !pathname.startsWith("/delivery") &&
    !pathname.startsWith("/customer-display") &&
    !pathname.startsWith("/platform") &&
    !pathname.startsWith("/api") &&
    pathname !== "/login" &&
    pathname !== "/platform/login" &&
    !pathname.startsWith("/konto");

  if (isPublicSiteRoute && !pathname.startsWith("/r/")) {
    const response = NextResponse.next();
    response.cookies.delete(PUBLIC_TENANT_COOKIE);
    return response;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/r/:path*",
    "/",
    "/menu",
    "/menu/:path*",
    "/kontakt",
    "/faktura",
    "/faktura/:path*",
    "/checkout/:path*",
    "/reservation",
    "/konto",
    "/konto/:path*",
    "/login",
    "/admin",
    "/admin/:path*",
    "/pos",
    "/pos/:path*",
    "/kitchen",
    "/kitchen/:path*",
    "/delivery",
    "/delivery/:path*",
    "/customer-display",
    "/customer-display/:path*",
    "/order",
    "/order/:path*",
    "/platform",
    "/platform/:path*",
    "/api/:path*",
  ],
};
