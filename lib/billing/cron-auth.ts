import type { NextRequest } from "next/server";

/** Authorize cron endpoints (Vercel cron GET or manual Bearer token). */
export function isAuthorizedCronRequest(req: Request | NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
  }

  if (
    process.env.VERCEL === "1" &&
    req.headers.get("x-vercel-cron") === "1"
  ) {
    return true;
  }

  return false;
}
