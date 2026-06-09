/**
 * Apply pending migrations, generate client, and ensure SiteSettings row exists.
 * Requires PostgreSQL running (docker compose up -d).
 */
import { execSync } from "node:child_process";
import { checkDatabaseConnection, getDbErrorMessage } from "../lib/db/errors";
import { ensureSiteSettings, ensureOpeningHours } from "../lib/settings";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== Database stabilization ===\n");

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set in .env");
    process.exit(1);
  }

  const conn = await checkDatabaseConnection();
  if (!conn.ok) {
    console.error("ERROR: Cannot connect to PostgreSQL.");
    console.error(conn.error);
    console.error("\nStart the database:");
    console.error("  docker compose up -d");
    process.exit(1);
  }
  console.log("✓ Database connection OK");

  console.log("\nApplying migrations (prisma migrate deploy)...");
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
  } catch {
    console.error("ERROR: migrate deploy failed");
    process.exit(1);
  }
  console.log("✓ Migrations applied");

  console.log("\nGenerating Prisma Client...");
  try {
    execSync("npx prisma generate", { stdio: "inherit" });
  } catch {
    console.error("ERROR: prisma generate failed");
    process.exit(1);
  }
  console.log("✓ Prisma Client generated");

  console.log("\nEnsuring SiteSettings (id=1)...");
  try {
    const settings = await ensureSiteSettings();
    console.log(`✓ SiteSettings: ${settings.restaurantName}`);
  } catch (error) {
    console.error("ERROR: SiteSettings bootstrap failed:", getDbErrorMessage(error));
    process.exit(1);
  }

  console.log("\nEnsuring OpeningHours (7 days)...");
  try {
    const hours = await ensureOpeningHours();
    console.log(`✓ OpeningHours: ${hours.length} rows`);
  } catch (error) {
    console.error("ERROR: OpeningHours bootstrap failed:", getDbErrorMessage(error));
    process.exit(1);
  }

  const tables = await prisma.$queryRaw<
    { tablename: string }[]
  >`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;

  console.log("\nPublic tables:");
  for (const row of tables) {
    console.log(`  - ${row.tablename}`);
  }

  await prisma.$disconnect();
  console.log("\n=== Stabilization complete ===");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
