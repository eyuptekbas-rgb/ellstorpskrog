/**
 * Fails Vercel production builds when required env vars are missing.
 * Skips on local dev / preview without VERCEL_ENV=production.
 */
const REQUIRED_PRODUCTION = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXT_PUBLIC_APP_URL",
] as const;

const RECOMMENDED_PRODUCTION = [
  "RESEND_API_KEY",
  "CONTACT_TO_EMAIL",
  "RESEND_FROM_EMAIL",
] as const;

function isSet(key: string): boolean {
  return Boolean(process.env[key]?.trim());
}

function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log(
      `[env] Skipping production env gate (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"})`
    );
    return;
  }

  const missing = REQUIRED_PRODUCTION.filter((key) => !isSet(key));
  if (missing.length > 0) {
    console.error(
      "\n[env] Production deploy blocked — missing required environment variables:\n"
    );
    for (const key of missing) {
      console.error(`  - ${key}`);
    }
    console.error(
      "\nAdd them in Vercel → Project → Settings → Environment Variables, then redeploy."
    );
    console.error(
      "After first deploy: run `npx prisma migrate deploy` and `npx tsx scripts/ensure-admin.ts` against production DB.\n"
    );
    process.exit(1);
  }

  const authSecret = process.env.AUTH_SECRET!.trim();
  if (authSecret.length < 32) {
    console.error("[env] AUTH_SECRET must be at least 32 characters.");
    process.exit(1);
  }

  const missingRecommended = RECOMMENDED_PRODUCTION.filter((key) => !isSet(key));
  if (missingRecommended.length > 0) {
    console.warn("[env] Warning — recommended variables not set:");
    for (const key of missingRecommended) {
      console.warn(`  - ${key}`);
    }
  }

  console.log("[env] Production environment gate passed.");
}

main();
