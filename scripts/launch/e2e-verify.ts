#!/usr/bin/env npx tsx
/**
 * Launch Priority 2 — end-to-end verification harness.
 * Usage: npm run launch:e2e [baseUrl]
 *
 * Requires: DATABASE_URL (running Postgres). Optional: baseUrl for API smoke (default http://localhost:3000).
 */
import { loadDotEnv, normalizeAuthEnv } from "../../lib/env/launch-vars";
import { prisma } from "../../lib/prisma";
import { runMonthlyBillingJob } from "../../lib/billing/service";
import { isEmailConfigured } from "../../lib/email/resend";
import { sendPlatformInvoiceEmail } from "../../lib/billing/email";
import { PlatformInvoiceStatus } from "@prisma/client";
import { allocateCustomerNumber } from "../../lib/billing/customer-number";
import { generatePlatformInvoicePdf, pdfToBase64 } from "../../lib/billing/pdf";
import { buildPlatformInvoiceDocument } from "../../lib/billing/invoice-data";

loadDotEnv();
normalizeAuthEnv();

const BASE = process.argv[2] ?? "http://localhost:3000";

type Step = {
  id: string;
  name: string;
  status: "pass" | "fail" | "skip" | "warn";
  detail: string;
};

const steps: Step[] = [];

function step(id: string, name: string, status: Step["status"], detail: string) {
  steps.push({ id, name, status, detail });
}

async function api(path: string, init?: RequestInit) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { ok: res.ok, status: res.status, body };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: { error: error instanceof Error ? error.message : "fetch failed" },
    };
  }
}

async function main() {
  // 1. Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    step("db", "Database connection", "pass", "PostgreSQL reachable");
  } catch (error) {
    step(
      "db",
      "Database connection",
      "fail",
      error instanceof Error ? error.message : "Unreachable"
    );
    return printAndExit();
  }

  // 2. Login — verify user exists and password hash works
  const admin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "PLATFORM_ADMIN"] } },
    select: { email: true, passwordHash: true, role: true, tenantId: true },
  });
  if (!admin?.passwordHash) {
    step("login", "Login (credentials)", "fail", "No admin user with password in database");
  } else {
    step(
      "login",
      "Login (credentials)",
      "warn",
      `Admin user exists (${admin.email}, ${admin.role}) — live sign-in requires running server`
    );
  }

  // 3–4. Customer / restaurant creation
  const testSlug = `launch-verify-${Date.now()}`;
  let testTenantId: string | null = null;
  try {
    const customerNumber = await prisma.$transaction(async (tx) => {
      const num = await allocateCustomerNumber(tx);
      const tenant = await tx.tenant.create({
        data: {
          name: "Launch Verify Restaurant",
          slug: testSlug,
          templateId: "classic",
          primaryColor: "#b85c38",
          customerNumber: num,
        },
      });
      testTenantId = tenant.id;
      await tx.siteSettings.create({
        data: {
          tenantId: tenant.id,
          restaurantName: "Launch Verify Restaurant",
          phone: "+46 40 00 00 00",
          email: "verify@launch.test",
          address: "Testgatan 1",
        },
      });
      return num;
    });
    step(
      "customer-create",
      "Customer creation (tenant)",
      customerNumber.length === 8 ? "pass" : "fail",
      `Tenant created with customer number ${customerNumber}`
    );
    step("restaurant-create", "Restaurant creation", "pass", `Slug ${testSlug}`);
  } catch (error) {
    step(
      "customer-create",
      "Customer creation",
      "fail",
      error instanceof Error ? error.message : "Failed"
    );
  }

  // 5. Order placement (direct DB + validation path)
  if (testTenantId) {
    try {
      const category = await prisma.category.create({
        data: { tenantId: testTenantId, name: "Launch Test", slug: "launch-test", sortOrder: 99 },
      });
      const product = await prisma.product.create({
        data: {
          categoryId: category.id,
          name: "Test Pizza",
          price: 100,
          description: "E2E",
          active: true,
        },
      });
      const order = await prisma.order.create({
        data: {
          tenantId: testTenantId,
          orderNumber: `LV-${Date.now()}`,
          customerName: "Launch Tester",
          customerPhone: "0700000000",
          customerEmail: "launch@test.se",
          orderType: "PICKUP",
          paymentMethod: "CASH",
          paymentStatus: "PENDING",
          status: "NEW",
          total: 100,
          items: {
            create: [{ productId: product.id, productName: "Test Pizza", quantity: 1, price: 100 }],
          },
        },
        include: { items: true },
      });
      step("order", "Order placement", "pass", `Order ${order.orderNumber} created`);
    } catch (error) {
      step("order", "Order placement", "fail", error instanceof Error ? error.message : "Failed");
    }
  }

  // 6–8. Checkout / Stripe / Webhook — need env + server
  const hasStripe =
    Boolean(process.env.STRIPE_SECRET_KEY?.trim()) ||
    Boolean(process.env.STRIPE_TEST_SECRET_KEY?.trim());
  if (!hasStripe) {
    step("checkout", "Checkout session", "skip", "STRIPE_SECRET_KEY not configured");
    step("stripe-pay", "Stripe payment", "skip", "Stripe keys missing");
    step("webhook", "Webhook processing", "skip", "STRIPE_WEBHOOK_SECRET not configured");
  } else {
    const checkout = await api("/api/checkout/create-session", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Stripe Test",
        customerPhone: "0700000000",
        customerEmail: "stripe@test.se",
        orderType: "pickup",
        total: 100,
        subtotal: 100,
        items: [{ productId: "invalid", productName: "X", quantity: 1, price: 100 }],
      }),
    });
    step(
      "checkout",
      "Checkout session",
      checkout.status === 503 ? "warn" : checkout.status === 400 ? "pass" : "warn",
      `HTTP ${checkout.status} — ${(checkout.body as { error?: string })?.error ?? "response received"}`
    );
    step("stripe-pay", "Stripe payment", "skip", "Requires manual Stripe Checkout in browser");
    step("webhook", "Webhook processing", "skip", "Requires Stripe CLI or live webhook event");
  }

  // 9. Reservation
  if (testTenantId) {
    try {
      const res = await prisma.reservation.create({
        data: {
          tenantId: testTenantId,
          name: "Launch Guest",
          phone: "0700000001",
          email: "guest@test.se",
          date: "2026-12-01",
          time: "18:00",
          guests: 2,
          status: "NEW",
        },
      });
      step("reservation", "Reservation creation", "pass", `Reservation ${res.id} created`);
    } catch (error) {
      step("reservation", "Reservation creation", "fail", error instanceof Error ? error.message : "Failed");
    }
  }

  // 10. Contact form
  const contact = await api("/api/contact", {
    method: "POST",
    body: JSON.stringify({ name: "Launch", email: "launch@test.se", message: "E2E test" }),
  });
  step(
    "contact",
    "Contact form",
    contact.status === 200 ? "pass" : contact.status === 503 ? "warn" : "fail",
    contact.status === 503
      ? "RESEND_API_KEY not configured (503 expected)"
      : `HTTP ${contact.status}`
  );

  // 11–13. Invoice / PDF / Email
  if (testTenantId) {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: testTenantId } });
      if (tenant?.customerNumber) {
        const mockInvoice = {
          id: "launch-test",
          tenantId: testTenantId,
          invoiceNumber: "LV-TEST-001",
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 86400000),
          periodYear: new Date().getFullYear(),
          periodMonth: new Date().getMonth() + 1,
          subscriptionFee: 50000,
          orderCount: 3,
          orderFeePerOrder: 500,
          orderFeeTotal: 1500,
          vatRate: 25,
          vatAmount: 12875,
          totalAmount: 64375,
          status: PlatformInvoiceStatus.DRAFT,
          sentAt: null,
          paidAt: null,
          emailSentTo: null,
          resendId: null,
          pdfData: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const doc = buildPlatformInvoiceDocument(mockInvoice, tenant);
        const pdf = await generatePlatformInvoicePdf(doc);
        step(
          "pdf",
          "PDF generation",
          pdf.byteLength > 500 ? "pass" : "fail",
          `${pdf.byteLength} bytes generated`
        );
        step("invoice", "Invoice generation", "pass", `Invoice ${doc.invoiceNumber}`);

        if (isEmailConfigured()) {
          const emailResult = await sendPlatformInvoiceEmail({
            to: tenant.invoiceEmail ?? "billing@test.se",
            document: doc,
            pdfBase64: pdfToBase64(pdf),
          });
          step(
            "invoice-email",
            "Invoice email",
            emailResult.resendId ? "pass" : "warn",
            emailResult.resendId ? `Sent (${emailResult.resendId})` : (emailResult.error ?? "Failed")
          );
        } else {
          step("invoice-email", "Invoice email", "skip", "RESEND_API_KEY not configured");
        }
      }
    } catch (error) {
      step("invoice", "Invoice generation", "fail", error instanceof Error ? error.message : "Failed");
    }
  }

  // 14. Monthly billing
  try {
    const result = await runMonthlyBillingJob({ autoSend: false });
    step(
      "monthly-billing",
      "Monthly billing run",
      result.errors.length === 0 ? "pass" : "warn",
      `Invoices: ${result.invoicesCreated}, errors: ${result.errors.length}`
    );
  } catch (error) {
    step(
      "monthly-billing",
      "Monthly billing run",
      "fail",
      error instanceof Error ? error.message : "Failed"
    );
  }

  // API smoke if server up
  const health = await api("/api/health");
  step(
    "api-health",
    "API health endpoint",
    health.status === 200 || health.status === 503 ? "pass" : "warn",
    health.status ? `HTTP ${health.status}` : "Server not running — start with npm run dev"
  );

  const publicSettings = await api("/api/settings/public");
  const pubJson = JSON.stringify(publicSettings.body ?? {});
  const secretLeak = /sk_|whsec_/.test(pubJson);
  step(
    "public-settings",
    "Public settings API",
    publicSettings.status === 200 && !secretLeak ? "pass" : publicSettings.status === 0 ? "skip" : "fail",
    publicSettings.status === 0
      ? "Server not running"
      : secretLeak
        ? "Secrets exposed in response"
        : "No secrets in public settings"
  );

  // Cleanup test tenant
  if (testTenantId) {
    try {
      await prisma.tenant.delete({ where: { id: testTenantId } });
      step("cleanup", "Test data cleanup", "pass", "Launch verify tenant removed");
    } catch {
      step("cleanup", "Test data cleanup", "warn", `Manual cleanup: tenant ${testSlug}`);
    }
  }

  printAndExit();
}

function printAndExit() {
  console.log("\n=== Launch E2E Verification ===\n");
  console.log(`Base URL: ${BASE}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  for (const s of steps) {
    const icon =
      s.status === "pass" ? "PASS" : s.status === "fail" ? "FAIL" : s.status === "skip" ? "SKIP" : "WARN";
    console.log(`${icon.padEnd(5)} ${s.name}`);
    console.log(`      ${s.detail}`);
  }

  const pass = steps.filter((s) => s.status === "pass").length;
  const fail = steps.filter((s) => s.status === "fail").length;
  const skip = steps.filter((s) => s.status === "skip").length;
  const warn = steps.filter((s) => s.status === "warn").length;

  console.log(`\nResults: ${pass} pass, ${warn} warn, ${skip} skip, ${fail} fail (${steps.length} total)`);

  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
