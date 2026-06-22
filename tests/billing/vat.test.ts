import assert from "node:assert/strict";
import { describe, it, after } from "node:test";
import {
  getDefaultBillingVatRate,
  resolveTenantVatRate,
} from "../../lib/billing/platform-config";

describe("VAT configuration", () => {
  const original = process.env.ORDINA_BILLING_VAT_RATE;

  after(() => {
    if (original === undefined) delete process.env.ORDINA_BILLING_VAT_RATE;
    else process.env.ORDINA_BILLING_VAT_RATE = original;
  });

  it("uses platform default from env", () => {
    process.env.ORDINA_BILLING_VAT_RATE = "25";
    assert.equal(getDefaultBillingVatRate(), 25);
  });

  it("tenant override takes precedence", () => {
    process.env.ORDINA_BILLING_VAT_RATE = "25";
    assert.equal(resolveTenantVatRate(12), 12);
    assert.equal(resolveTenantVatRate(null), 25);
  });
});
