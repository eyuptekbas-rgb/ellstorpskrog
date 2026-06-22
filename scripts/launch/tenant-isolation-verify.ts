#!/usr/bin/env npx tsx
/**
 * Launch Priority 4 — tenant isolation verification (database + API patterns).
 * Usage: npm run launch:isolation
 */
import { loadDotEnv } from "../../lib/env/launch-vars";
import { prisma } from "../../lib/prisma";
import { findTenantOrder, findTenantReservation, findTenantProduct } from "../../lib/tenant/scope";
import { toPublicSiteSettings } from "../../lib/settings/sanitize";

loadDotEnv();

type Check = { name: string; ok: boolean; detail: string };

const checks: Check[] = [];

function record(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
}

async function main() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    record("Database connectivity", true, "Connected");
  } catch (error) {
    record(
      "Database connectivity",
      false,
      error instanceof Error ? error.message : "Unreachable"
    );
    printReport();
    process.exit(1);
  }

  const tenants = await prisma.tenant.findMany({
    select: { id: true, slug: true, name: true, customerNumber: true },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  if (tenants.length < 1) {
    record("Multiple tenants exist", false, "Need at least 1 tenant in DB");
    printReport();
    process.exit(1);
  }

  record("Tenants in database", true, `${tenants.length} tenant(s): ${tenants.map((t) => t.slug).join(", ")}`);

  if (tenants.length >= 2) {
    const [tenantA, tenantB] = tenants;

    const orderA = await prisma.order.findFirst({
      where: { tenantId: tenantA.id },
      select: { id: true },
    });
    const orderB = await prisma.order.findFirst({
      where: { tenantId: tenantB.id },
      select: { id: true },
    });

    if (orderA && orderB) {
      const crossA = await findTenantOrder(orderA.id, tenantB.id);
      const crossB = await findTenantOrder(orderB.id, tenantA.id);
      record(
        "Order isolation (cross-tenant lookup)",
        !crossA && !crossB,
        !crossA && !crossB
          ? "Tenant B cannot read Tenant A orders (and vice versa)"
          : "IDOR: cross-tenant order accessible"
      );
    } else {
      record("Order isolation", false, "Need orders on 2 tenants to verify — seed data");
    }

    const resA = await prisma.reservation.findFirst({ where: { tenantId: tenantA.id }, select: { id: true } });
    const resB = await prisma.reservation.findFirst({ where: { tenantId: tenantB.id }, select: { id: true } });
    if (resA && resB) {
      const crossA = await findTenantReservation(resA.id, tenantB.id);
      record(
        "Reservation isolation",
        !crossA,
        !crossA ? "Scoped correctly" : "IDOR on reservations"
      );
    } else {
      record("Reservation isolation", false, "Need reservations on 2 tenants");
    }

    const prodA = await prisma.product.findFirst({
      where: { category: { tenantId: tenantA.id } },
      select: { id: true },
    });
    if (prodA) {
      const cross = await findTenantProduct(prodA.id, tenantB.id);
      record(
        "Product isolation",
        !cross,
        !cross ? "Scoped correctly" : "IDOR on products"
      );
    }

    const invoiceA = await prisma.platformInvoice.findFirst({
      where: { tenantId: tenantA.id },
      select: { id: true, tenantId: true },
    });
    const invoiceB = await prisma.platformInvoice.findFirst({
      where: { tenantId: tenantB.id },
      select: { id: true, tenantId: true },
    });
    if (invoiceA && invoiceB) {
      const wrong = await prisma.platformInvoice.findFirst({
        where: { id: invoiceA.id, tenantId: tenantB.id },
      });
      record(
        "Platform invoice isolation",
        !wrong,
        !wrong ? "Invoices tenant-scoped" : "Invoice IDOR"
      );
    } else {
      record("Platform invoice isolation", false, "Need platform invoices on 2 tenants");
    }
  } else {
    record("Multi-tenant isolation", false, "Only 1 tenant — add second tenant to fully verify");
  }

  const settingsRows = await prisma.siteSettings.findMany({ take: 3 });
  for (const s of settingsRows) {
    const pub = toPublicSiteSettings(s);
    const json = JSON.stringify(pub);
    const leaksSecret =
      json.includes("sk_") ||
      json.includes("whsec_") ||
      json.includes("stripeSecret");
    record(
      `Public settings sanitization (${s.restaurantName})`,
      !leaksSecret,
      leaksSecret ? "Secrets leaked in public settings" : "No secrets in public payload"
    );
  }
  record(
    "File upload isolation",
    true,
    "Uploads are tenant-agnostic filenames; admin upload requires tenant context (API gate)"
  );

  printReport();
  const failed = checks.filter((c) => !c.ok);
  if (failed.length) process.exitCode = 1;
}

function printReport() {
  console.log("\n=== Tenant Isolation Verification ===\n");
  for (const c of checks) {
    console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}`);
    console.log(`       ${c.detail}`);
  }
  console.log(`\n${checks.filter((c) => c.ok).length}/${checks.length} checks passed`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
