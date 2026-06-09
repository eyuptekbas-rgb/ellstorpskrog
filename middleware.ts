import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import {
  isProtectedApiRoute,
  isPublicApiRoute,
} from "@/lib/auth/api-protection";
import { isStaffRole } from "@/lib/auth/roles";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const hasStaffAccess = isLoggedIn && isStaffRole(role);

  if (pathname === "/login") {
    if (hasStaffAccess) {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!hasStaffAccess) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (req.method === "POST") {
      const limit = RATE_LIMITS[pathname];
      if (limit) {
        const ip = getClientIp(req);
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

    if (isPublicApiRoute(req)) {
      return NextResponse.next();
    }

    if (isProtectedApiRoute(pathname) && !hasStaffAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/login",
    "/admin",
    "/admin/:path*",
    "/api/:path*",
  ],
};
