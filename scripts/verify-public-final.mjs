import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.PUBLIC_TEST_URL || "http://localhost:3001";
const output = "screenshots/public-final";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  await Promise.all([1280, 1440].map(async width => {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    await page.addInitScript(() => localStorage.setItem("newsSeen", "1"));
    // Install mocks before navigation: no real contact email or booking may escape.
    let fail = true;
    let contacts = 0; let reservations = 0;
    await page.route("**/api/contact", async route => {
      contacts++;
      const body = route.request().postDataJSON();
      assert.deepEqual(Object.keys(body).sort(), ["email", "message", "name"]);
      await route.fulfill({ status: fail ? 500 : 200, contentType: "application/json", body: JSON.stringify(fail ? { error: "Mock contact error" } : { success: true }) });
    });
    await page.route("**/api/reservations", async route => {
      reservations++;
      const body = route.request().postDataJSON();
      for (const key of ["name", "email", "phone", "date", "time", "guestCount", "comment"]) assert.ok(body[key]);
      await route.fulfill({ status: fail ? 503 : 201, contentType: "application/json", body: JSON.stringify(fail ? { error: "Mock reservation error" } : { id: "test-only-booking" }) });
    });
    for (const path of ["/", "/menu", "/kontakt", "/reservation"]) {
      await page.goto(base + path, { waitUntil: "domcontentloaded", timeout: 90000 });
      const header = page.locator("header.site-header");
      const account = header.getByRole("link", { name: "Konto", exact: true });
      await account.waitFor({ state: "visible" });
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await account.getAttribute("href"), "/konto/logga-in");
      const metrics = await header.evaluate(el => {
        const links = [...el.querySelectorAll(".site-header-end a, .site-header-end button")].map(a => a.getBoundingClientRect());
        const header = el.getBoundingClientRect();
        return { overflow: document.documentElement.scrollWidth > innerWidth, noOverlap: links.every((r, i) => !i || r.left >= links[i - 1].right - 1), contained: links.every(r => r.top >= header.top && r.bottom <= header.bottom) };
      });
      assert.equal(metrics.overflow, false); assert.equal(metrics.noOverlap, true);
      assert.equal(metrics.contained, true);
      if (path !== "/reservation") await account.click({ trial: true });
      await header.screenshot({ path: `${output}/header-${width}-${path.replaceAll("/", "") || "home"}.png` });
      if (path === "/") {
        await page.getByRole("link", { name: "Se våra recensioner på Google" }).waitFor();
        assert.equal(await page.locator("article").filter({ hasText: "Anna Andersson" }).count(), 0);
      }
      if (path === "/kontakt") {
        const form = page.locator("form");
        assert.equal(await form.evaluate(el => el.checkValidity()), false);
        await page.getByRole("textbox", { name: "Namn", exact: true }).fill("Test customer");
        await page.getByRole("textbox", { name: "E-post", exact: true }).fill("test@example.com");
        await page.getByRole("textbox", { name: "Ditt meddelande", exact: true }).fill("Mock only");
        await page.getByRole("button", { name: "Skicka meddelande", exact: true }).click();
        await page.getByText("Det gick inte att skicka meddelandet. Försök igen senare.").waitFor();
        fail = false;
        await page.getByRole("button", { name: "Skicka meddelande", exact: true }).click();
        await page.getByText("Tack! Ditt meddelande har skickats.").waitFor();
        assert.equal(contacts, 2);
      }
      if (path === "/reservation") {
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        fail = true;
        await dialog.locator('input[type="date"]:visible').fill("2099-06-20");
        await dialog.getByRole("button", { name: "18:00", exact: true }).click();
        await dialog.getByRole("button", { name: "4", exact: true }).click();
        await dialog.locator('input[id^="res-name"]:visible').fill("Test customer");
        await dialog.locator('input[id^="res-phone"]:visible').fill("0700000000");
        await dialog.locator('input[id^="res-email"]:visible').fill("test@example.com");
        await dialog.locator('textarea:visible').fill("Mock reservation notes");
        await dialog.getByRole("button", { name: "Boka bord", exact: true }).click();
        await dialog.getByText("Mock reservation error").waitFor();
        fail = false;
        await dialog.getByRole("button", { name: "Boka bord", exact: true }).click();
        await dialog.getByText("Tack för din reservation.").waitFor();
        assert.equal(reservations, 2);
        await page.screenshot({ path: `${output}/reservation-success-${width}.png` });
      }
      results.push({ width, path, ...metrics, accountHref: "/konto/logga-in" });
    }
    console.log(`PASS desktop header, fallback, contact/reservation error and success: ${width}px`);
    await page.close();
  }));
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
} finally { await browser.close(); }
