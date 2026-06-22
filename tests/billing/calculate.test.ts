import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateInvoiceAmount, formatSek } from "../../lib/billing/calculate";

describe("calculateInvoiceAmount", () => {
  it("computes subscription + order fees without VAT", () => {
    const result = calculateInvoiceAmount(499, 125, 2, 0);
    assert.equal(result.subscriptionFee, 499);
    assert.equal(result.orderCount, 125);
    assert.equal(result.orderFeePerOrder, 2);
    assert.equal(result.orderFeeTotal, 250);
    assert.equal(result.vatRate, 0);
    assert.equal(result.vatAmount, 0);
    assert.equal(result.totalAmount, 749);
  });

  it("applies VAT on subtotal", () => {
    const result = calculateInvoiceAmount(499, 125, 2, 25);
    assert.equal(result.vatAmount, 187);
    assert.equal(result.totalAmount, 936);
  });

  it("handles zero orders", () => {
    const result = calculateInvoiceAmount(499, 0, 2, 25);
    assert.equal(result.orderFeeTotal, 0);
    assert.equal(result.totalAmount, 624);
  });
});

describe("formatSek", () => {
  it("formats Swedish currency", () => {
    assert.match(formatSek(749), /749/);
    assert.match(formatSek(749), /kr/);
  });
});
