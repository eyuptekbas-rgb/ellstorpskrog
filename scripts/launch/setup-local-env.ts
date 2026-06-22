#!/usr/bin/env npx tsx
/**
 * Fill local .env with non-secret launch defaults (never overwrites existing values).
 * External keys (Resend, Stripe) must be added manually.
 *
 * Usage: npm run launch:setup-local
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");

function parseEnv(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return map;
}

function getOr(map: Map<string, string>, key: string, fallback: string): string {
  const v = map.get(key)?.trim();
  return v || fallback;
}

const existing = existsSync(envPath)
  ? parseEnv(readFileSync(envPath, "utf8"))
  : new Map<string, string>();

const additions: Record<string, string> = {};

function setIfMissing(key: string, value: string) {
  if (!existing.get(key)?.trim()) {
    additions[key] = value;
    existing.set(key, value);
  }
}

const localUrl = "http://localhost:3000";

setIfMissing("NEXT_PUBLIC_APP_URL", localUrl);
setIfMissing("AUTH_URL", localUrl);
setIfMissing("NEXTAUTH_URL", localUrl);
setIfMissing("CONTACT_TO_EMAIL", "info@ellstorpskrog.se");
setIfMissing("RESEND_FROM_EMAIL", "no-reply@ellstorpskrog.se");
setIfMissing("CRON_SECRET", randomBytes(32).toString("hex"));
setIfMissing("ORDINA_BILLING_COMPANY", "Ordina AB");
setIfMissing("ORDINA_BILLING_EMAIL", "faktura@ordina.se");
setIfMissing("ORDINA_BILLING_VAT_RATE", "25");
setIfMissing("ORDINA_BILLING_ADDRESS", "Malmö, Sverige");
setIfMissing("ORDINA_BILLING_ORG_NUMBER", "");
setIfMissing("ORDINA_BILLING_PAYMENT_DAYS", "14");

if (!existing.get("DATABASE_URL")?.trim()) {
  setIfMissing(
    "DATABASE_URL",
    "postgresql://ellstorps:ellstorps@localhost:5432/ellstorps?schema=public"
  );
}

if (!existing.get("AUTH_SECRET")?.trim()) {
  setIfMissing("AUTH_SECRET", randomBytes(32).toString("hex"));
}

const lines: string[] = existsSync(envPath)
  ? readFileSync(envPath, "utf8").split(/\r?\n/)
  : [];

const appended: string[] = [];
if (Object.keys(additions).length > 0) {
  appended.push("", "# --- Added by npm run launch:setup-local ---");
  for (const [key, value] of Object.entries(additions)) {
    appended.push(`${key}="${value}"`);
  }
  writeFileSync(envPath, [...lines, ...appended].join("\n") + "\n", "utf8");
}

console.log("\n=== Local launch env setup ===\n");

if (Object.keys(additions).length === 0) {
  console.log("No missing local defaults — .env already has base values.");
} else {
  console.log("Added to .env:");
  for (const key of Object.keys(additions)) {
    const sensitive = key.includes("SECRET") || key.includes("KEY");
    console.log(`  + ${key}${sensitive ? " (generated)" : ""}`);
  }
}

console.log("\nStill required manually (external accounts):");
console.log("  - RESEND_API_KEY          → https://resend.com");
console.log("  - STRIPE_SECRET_KEY       → Stripe Dashboard (or STRIPE_TEST_* / STRIPE_LIVE_*)");
console.log("  - STRIPE_PUBLISHABLE_KEY");
console.log("  - STRIPE_WEBHOOK_SECRET   → stripe listen --forward-to localhost:3000/api/webhooks/stripe");
console.log("\nInfrastructure:");
console.log("  - Start Docker Desktop, then: docker compose up -d");
console.log("  - Then: npx prisma migrate deploy && npm run launch:sprint");
