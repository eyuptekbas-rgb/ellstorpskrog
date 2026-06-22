#!/usr/bin/env npx tsx
/**
 * Sync Ellstorps printed menu into the database (sortOrder + names + prices).
 * Usage: npm run menu:sync [tenant-slug]
 */
import { syncPrintedMenuForTenant } from "../lib/menu/sync-printed-menu";

const tenantSlug = process.argv[2] ?? "ellstorps-krog";

async function main() {
  console.log(`Syncing printed menu for tenant: ${tenantSlug}\n`);
  const result = await syncPrintedMenuForTenant(tenantSlug);
  console.log(JSON.stringify(result, null, 2));
  console.log("\nDone. Categories follow printed menu sortOrder.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  });
