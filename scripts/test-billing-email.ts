/**
 * Verify Resend configuration for platform billing emails.
 * Usage: npx tsx scripts/test-billing-email.ts [recipient@email.com]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env"), "utf8");
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
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnv();

async function main() {
  const to = process.argv[2]?.trim();
  const hasKey = Boolean(process.env.RESEND_API_KEY?.trim());
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  console.log(JSON.stringify({ resendConfigured: hasKey, fromEmail: from ?? null }, null, 2));

  if (!hasKey) {
    console.error("RESEND_API_KEY is not set");
    process.exit(1);
  }

  if (!from) {
    console.warn("RESEND_FROM_EMAIL is not set — using fallback in code");
  }

  if (!to) {
    console.log("Dry run OK. Pass recipient email to send a test billing email.");
    return;
  }

  const { sendPlatformInvoiceEmail } = await import("../lib/billing/email");
  const result = await sendPlatformInvoiceEmail({
    to,
    document: {
      invoiceNumber: "ORD-TEST-0001",
      invoiceDate: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      periodLabel: "test",
      customer: {
        customerNumber: "00000001",
        companyName: "Test AB",
        organizationNumber: null,
        billingAddress: null,
        invoiceEmail: to,
        tenantName: "Test",
      },
      lines: [],
      subscriptionFee: 499,
      orderCount: 1,
      orderFeePerOrder: 2,
      orderFeeTotal: 2,
      vatRate: 25,
      vatAmount: 125,
      totalAmount: 626,
      payment: {
        companyName: process.env.ORDINA_BILLING_COMPANY ?? "Ordina AB",
        organizationNumber: "",
        address: "",
        email: process.env.ORDINA_BILLING_EMAIL ?? "faktura@ordina.se",
        iban: "",
        bic: "",
        paymentTermsDays: 14,
      },
      status: "DRAFT",
    },
    pdfBase64: Buffer.from("%PDF-1.4 test").toString("base64"),
  });

  console.log(JSON.stringify(result, null, 2));
  if (result.error) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
