import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, beforeEach, it } from "node:test";
import { OrderType } from "@prisma/client";

const require = createRequire(import.meta.url);
const settings = {
  minimumOrder: 150,
  deliveryFee: 40,
  pickupEnabled: true,
  deliveryEnabled: true,
};
const zone = { postalCodes: "21214", deliveryFee: 20, minimumOrder: 200 };
let zones = [zone];
const product = {
  id: "test-product", name: "Test item", price: 35,
  optionGroups: [], category: { extraOptions: [] },
};
const originals = new Map<string, NodeModule | undefined>();
for (const [path, exports] of Object.entries({
  "../../lib/settings": { ensureSiteSettings: async () => settings },
  "../../lib/prisma": { prisma: {
    deliveryZone: { findMany: async () => zones },
    product: { findFirst: async () => product },
  } },
})) {
  const id = require.resolve(path);
  originals.set(id, require.cache[id]);
  require.cache[id] = { id, filename: id, loaded: true, exports } as NodeModule;
}
const { validateOrderPricing } = require("../../lib/orders/validate-pricing") as typeof import("../../lib/orders/validate-pricing");
after(() => {
  for (const [id, original] of originals) {
    if (original) require.cache[id] = original;
    else delete require.cache[id];
  }
});
beforeEach(() => {
  zones = [zone];
  settings.pickupEnabled = true;
  settings.deliveryEnabled = true;
});
const input = {
  tenantId: "test-tenant", orderType: OrderType.PICKUP,
  items: [{ productId: product.id, productName: product.name, quantity: 1, price: 35 }],
};

it("accepts a 35 SEK pickup despite a stored 150 SEK minimum", async () => {
  const result = await validateOrderPricing(input);
  assert.equal(result.subtotal, 35);
  assert.equal(result.deliveryFee, 0);
  assert.equal(result.total, 35);
});
it("accepts a 35 SEK delivery subtotal despite the zone minimum and preserves its fee", async () => {
  const result = await validateOrderPricing({ ...input, orderType: OrderType.DELIVERY, customerAddress: "Test street, 212 14" });
  assert.equal(result.subtotal, 35);
  assert.equal(result.deliveryFee, 20);
  assert.equal(result.total, 55);
});
it("accepts delivery below the default minimum and preserves the default fee", async () => {
  zones = [];
  const result = await validateOrderPricing({ ...input, orderType: OrderType.DELIVERY, customerAddress: "Test street" });
  assert.equal(result.subtotal, 35);
  assert.equal(result.deliveryFee, 40);
  assert.equal(result.total, 75);
});
it("still rejects an empty cart", async () => {
  await assert.rejects(validateOrderPricing({ ...input, items: [] }), /at least one item/);
});
it("still rejects invalid quantities", async () => {
  await assert.rejects(validateOrderPricing({ ...input, items: [{ ...input.items[0], quantity: 0 }] }), /Invalid item quantity/);
});
it("still uses catalog prices", async () => {
  const result = await validateOrderPricing({ ...input, items: [{ ...input.items[0], price: 1 }] });
  assert.equal(result.total, 35);
});
it("still rejects delivery outside the delivery area", async () => {
  await assert.rejects(validateOrderPricing({ ...input, orderType: OrderType.DELIVERY, customerAddress: "Test street, 99999" }), /outside delivery area/);
});
it("still requires a delivery address", async () => {
  await assert.rejects(validateOrderPricing({ ...input, orderType: OrderType.DELIVERY }), /Address is required/);
});
it("still respects pickup and delivery availability", async () => {
  settings.pickupEnabled = false;
  settings.deliveryEnabled = false;
  await assert.rejects(validateOrderPricing(input), /Pickup is not available/);
  await assert.rejects(validateOrderPricing({ ...input, orderType: OrderType.DELIVERY, customerAddress: "Test street, 21214" }), /Delivery is not available/);
});
