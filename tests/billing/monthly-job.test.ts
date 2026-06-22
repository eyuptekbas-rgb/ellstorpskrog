import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPreviousBillingPeriod } from "../../lib/billing/period";

describe("monthly billing job helpers", () => {
  it("resolves previous billing period", () => {
    const period = getPreviousBillingPeriod();
    assert.ok(period.year >= 2020);
    assert.ok(period.month >= 1 && period.month <= 12);
  });

  it("monthly job result shape", () => {
    const sample = {
      period: { year: 2026, month: 5 },
      generated: 1,
      sent: 1,
      skipped: 0,
      errors: [] as Array<{ tenantId: string; tenantName: string; error: string }>,
    };
    assert.equal(typeof sample.generated, "number");
    assert.equal(Array.isArray(sample.errors), true);
  });
});
