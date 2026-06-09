/**
 * Prints the env vars required for Vercel Production admin login.
 * Run: npx tsx scripts/setup-vercel-production.ts
 */
import { randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const db = process.env.DATABASE_URL ?? "";
const isLocalDb =
  /localhost|127\.0\.0\.1/.test(db) || db.includes("@localhost:");

const authSecret =
  process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32
    ? process.env.AUTH_SECRET
    : randomBytes(32).toString("base64");

console.log(`
=== Vercel Production — admin login setup ===

1) Create a hosted PostgreSQL database (Vercel cannot use localhost):
   - Neon (free): https://neon.tech
   - Or Vercel → Storage → Postgres

2) In Vercel → ellstorpskrog → Settings → Environment Variables
   Add for PRODUCTION:

   DATABASE_URL=<your hosted postgres URL>?sslmode=require
   AUTH_SECRET=<copy from your local .env — min 32 chars>
   NEXT_PUBLIC_APP_URL=https://ellstorpskrog.vercel.app

3) Redeploy (Deployments → Redeploy latest, or push to main)

4) From your machine, against the HOSTED database:

   set DATABASE_URL=<hosted url>
   npx prisma migrate deploy
   npx tsx scripts/ensure-admin.ts

5) Log in at:
   https://ellstorpskrog.vercel.app/login
   Email: admin@ellstorpskrog.se
   Password: ChangeMe123!  (or ADMIN_INITIAL_PASSWORD)

--- Current local .env status ---
DATABASE_URL: ${db ? (isLocalDb ? "LOCAL (not usable on Vercel)" : "REMOTE (copy to Vercel)") : "MISSING"}
AUTH_SECRET: ${process.env.AUTH_SECRET ? "SET — copy same value to Vercel" : "MISSING — use value above"}
`);
