import assert from "node:assert/strict";
import { describe, it, after } from "node:test";
import { sendPlatformInvoiceEmail } from "../../lib/billing/email";
import type { PlatformInvoiceDocument } from "../../lib/billing/types";

const sampleDocument: PlatformInvoiceDocument = {
  invoiceNumber: "ORD-2026-06-0001",
  invoiceDate: new Date().toISOString(),
  dueDate: new Date().toISOString(),
  periodLabel: "juni 2026",
  customer: {
    customerNumber: "00000001",
    companyName: "Ellstorps Krog AB",
    organizationNumber: "559000-0000",
    billingAddress: "Malmö",
    invoiceEmail: "faktura@test.se",
    tenantName: "Ellstorps Krog",
  },
  lines: [],
  subscriptionFee: 499,
  orderCount: 5,
  orderFeePerOrder: 2,
  orderFeeTotal: 10,
  vatRate: 25,
  vatAmount: 127,
  totalAmount: 636,
  payment: {
    companyName: "Ordina AB",
    organizationNumber: "",
    address: "",
    email: "faktura@ordina.se",
    iban: "",
    bic: "",
    paymentTermsDays: 14,
  },
  status: "DRAFT",
};

describe("sendPlatformInvoiceEmail", () => {
  const originalKey = process.env.RESEND_API_KEY;

  after(() => {
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
  });

  it("returns error when Resend is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendPlatformInvoiceEmail({
      to: "test@example.com",
      document: sampleDocument,
      pdfBase64: Buffer.from("test").toString("base64"),
    });
    assert.equal(result.resendId, null);
    assert.match(result.error ?? "", /RESEND_API_KEY/);
  });
});
