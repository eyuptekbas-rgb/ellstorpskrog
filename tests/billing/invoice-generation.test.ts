import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PlatformInvoiceStatus } from "@prisma/client";
import { buildPlatformInvoiceDocument } from "../../lib/billing/invoice-data";

describe("invoice document", () => {
  it("includes customer number on invoice", () => {
    const doc = buildPlatformInvoiceDocument(
      {
        id: "inv1",
        tenantId: "t1",
        invoiceNumber: "ORD-2026-06-0001",
        periodYear: 2026,
        periodMonth: 6,
        invoiceDate: new Date("2026-06-01"),
        dueDate: new Date("2026-06-15"),
        subscriptionFee: 499,
        orderCount: 5,
        orderFeePerOrder: 2,
        orderFeeTotal: 10,
        vatRate: 25,
        vatAmount: 127,
        totalAmount: 636,
        status: PlatformInvoiceStatus.DRAFT,
        sentAt: null,
        paidAt: null,
        emailSentTo: null,
        resendId: null,
        pdfData: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Ellstorps Krog",
        customerNumber: "00000001",
        companyName: "Ellstorps Krog AB",
        organizationNumber: "559000-0000",
        billingAddress: "Malmö",
        invoiceEmail: "faktura@ellstorpskrog.se",
      }
    );

    assert.equal(doc.customer.customerNumber, "00000001");
    assert.equal(doc.totalAmount, 636);
    assert.equal(doc.vatRate, 25);
  });

  it("throws when customer number is missing", () => {
    assert.throws(() =>
      buildPlatformInvoiceDocument(
        {
          id: "inv1",
          tenantId: "t1",
          invoiceNumber: "ORD-2026-06-0001",
          periodYear: 2026,
          periodMonth: 6,
          invoiceDate: new Date(),
          dueDate: null,
          subscriptionFee: 499,
          orderCount: 0,
          orderFeePerOrder: 2,
          orderFeeTotal: 0,
          vatRate: 0,
          vatAmount: 0,
          totalAmount: 499,
          status: PlatformInvoiceStatus.DRAFT,
          sentAt: null,
          paidAt: null,
          emailSentTo: null,
          resendId: null,
          pdfData: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Test",
          customerNumber: null,
          companyName: null,
          organizationNumber: null,
          billingAddress: null,
          invoiceEmail: null,
        }
      )
    );
  });
});
