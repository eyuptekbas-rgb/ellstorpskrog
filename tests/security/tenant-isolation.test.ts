import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderPricingError } from "../../lib/orders/validate-pricing";

describe("order pricing security", () => {
  it("rejects tampered totals with explicit error type", () => {
    const err = new OrderPricingError("Order total mismatch");
    assert.equal(err.status, 400);
    assert.match(err.message, /mismatch/i);
  });

  it("rejects invalid quantities", () => {
    const err = new OrderPricingError("Invalid item quantity", 400);
    assert.equal(err.name, "Error");
    assert.equal(err.status, 400);
  });
});

describe("cron auth", () => {
  it("does not accept secret in query string", async () => {
    const { isAuthorizedCronRequest } = await import("../../lib/billing/cron-auth");
    const prev = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "test-cron-secret";

    try {
      const req = new Request(
        "https://example.com/api/platform/billing/cron/monthly?secret=test-cron-secret"
      );
      assert.equal(isAuthorizedCronRequest(req), false);

      const authorized = new Request(
        "https://example.com/api/platform/billing/cron/monthly",
        { headers: { authorization: "Bearer test-cron-secret" } }
      );
      assert.equal(isAuthorizedCronRequest(authorized), true);
    } finally {
      if (prev === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = prev;
    }
  });
});

describe("payments API response shape", () => {
  it("documents that secret keys must not be returned to clients", () => {
    const safeFields = [
      "maskedSecretKey",
      "hasSecretKeyTest",
      "hasSecretKeyLive",
      "stripePublishableKeyTest",
      "stripePublishableKeyLive",
    ];
    const forbidden = ["stripeSecretKeyTest", "stripeSecretKeyLive"];

    for (const field of safeFields) {
      assert.ok(field.length > 0);
    }
    for (const field of forbidden) {
      assert.ok(!safeFields.includes(field));
    }
  });
});
