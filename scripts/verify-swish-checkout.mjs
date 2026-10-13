import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.PUBLIC_TEST_URL || "http://localhost:3001";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    await context.addInitScript(() => {
      localStorage.setItem("newsSeen", "1");
      localStorage.setItem("ellstorps-cart", JSON.stringify([{ id: "test-meal", name: "Test meal", basePrice: 199, price: 199, quantity: 1, selectedOptions: [] }]));
    });
    let paymentStatus = "PENDING";
    let creationCount = 0;
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/api/checkout/swish*", route => route.fulfill({ json: new URL(route.request().url()).searchParams.has("paymentId")
      ? { status: paymentStatus, orderNumber: "TEST-SWISH", total: 199 } : { enabled: true } }));
    await page.route("**/api/payments/create", async route => {
      assert.equal(route.request().postDataJSON().paymentMethod, "SWISH");
      creationCount++;
      await route.fulfill({ json: { url: "/checkout/success?swish_payment_id=test-only&token=test-only" } });
    });
    await page.route("**/api/orders", route => route.abort());
    await page.goto(`${base}/checkout`, { waitUntil: "domcontentloaded" });
    await page.getByRole("radio", { name: /^Swish/ }).click();
    await page.getByLabel(/^Namn/).fill("Local Test");
    await page.getByLabel(/^Telefon/).fill("0701234567");
    await page.getByLabel(/^E-post/).fill("test@example.invalid");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/checkout/success?swish_payment_id=*");
    await page.getByText(/Öppna Swish/).waitFor();
    assert.equal(await page.getByText("Tack för din beställning!", { exact: true }).isVisible(), false);
    assert.ok(await page.evaluate(() => localStorage.getItem("ellstorps-cart")));
    paymentStatus = "PAID";
    await page.getByText("Tack för din beställning!", { exact: true }).waitFor();
    assert.equal(creationCount, 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ width, checkoutMethod: "SWISH", pendingThenPaid: "passed", noOverflow: true, pageErrors: errors, realPaymentRequests: 0 }));
    await context.close();
  }
} finally {
  await browser.close();
}
