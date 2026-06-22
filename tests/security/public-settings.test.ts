import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SiteSettings } from "@prisma/client";
import { toPublicSiteSettings } from "../../lib/settings/sanitize";

const SECRET_SETTINGS = {
  tenantId: "tenant-1",
  restaurantName: "Test Restaurang",
  phone: "+46 40 00 00 00",
  email: "test@example.com",
  address: "Testgatan 1",
  logo: null,
  heroImage: null,
  deliveryEnabled: true,
  pickupEnabled: true,
  minimumOrder: 100,
  deliveryFee: 49,
  facebookUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  metaTitle: null,
  metaDescription: null,
  ogImage: null,
  keywords: null,
  stripeEnabled: true,
  stripeTestMode: true,
  stripePublishableKeyTest: "pk_test_abc",
  stripeSecretKeyTest: "sk_test_super_secret",
  stripeWebhookSecretTest: "whsec_test_secret",
  stripePublishableKeyLive: "pk_live_abc",
  stripeSecretKeyLive: "sk_live_super_secret",
  stripeWebhookSecretLive: "whsec_live_secret",
  updatedAt: new Date(),
} as SiteSettings;

describe("public settings sanitization", () => {
  it("never exposes stripe secret or webhook keys", () => {
    const pub = toPublicSiteSettings(SECRET_SETTINGS);
    const json = JSON.stringify(pub);

    assert.equal(pub.stripePublishableKey, "pk_test_abc");
    assert.equal(pub.stripeTestMode, true);
    assert.equal(pub.stripeCardEnabled, true);

    assert.doesNotMatch(json, /sk_test/);
    assert.doesNotMatch(json, /sk_live/);
    assert.doesNotMatch(json, /whsec_/);
    assert.doesNotMatch(json, /stripeSecretKey/);
    assert.doesNotMatch(json, /stripeWebhookSecret/);
  });

  it("includes only safe operational fields", () => {
    const pub = toPublicSiteSettings(SECRET_SETTINGS);
    const keys = Object.keys(pub).sort();

    assert.deepEqual(keys, [
      "address",
      "deliveryEnabled",
      "deliveryFee",
      "email",
      "facebookUrl",
      "heroImage",
      "instagramUrl",
      "keywords",
      "logo",
      "metaDescription",
      "metaTitle",
      "minimumOrder",
      "ogImage",
      "phone",
      "pickupEnabled",
      "restaurantName",
      "stripeCardEnabled",
      "stripePublishableKey",
      "stripeTestMode",
      "tenantId",
      "tiktokUrl",
    ]);
  });
});
