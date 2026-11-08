import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import nextEnv from "@next/env";
import { encode } from "next-auth/jwt";

const base = process.env.PUBLIC_TEST_URL || "http://localhost:3001";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Signed test sessions are restricted to the local development server");
const { combinedEnv } = nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const secret = combinedEnv.AUTH_SECRET?.trim() || combinedEnv.NEXTAUTH_SECRET?.trim();
assert.ok(secret, "Local NextAuth secret is required for authenticated browser verification");
const output = "screenshots/desktop-account-routing";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  await Promise.all([1280, 1440].flatMap(width => [false, true].map(async loggedIn => {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    await context.addInitScript(() => localStorage.setItem("newsSeen", "1"));
    if (loggedIn) {
      const cookieName = new URL(base).protocol === "https:" ? "__Secure-authjs.session-token" : "authjs.session-token";
      const token = await encode({ secret, salt: cookieName, maxAge: 600,
        token: { sub: "local-browser-test-customer", id: "local-browser-test-customer", role: "CUSTOMER", name: "Test customer", email: "test@example.com" } });
      await context.addCookies([{ name: cookieName, value: token, url: base, httpOnly: true, sameSite: "Lax", secure: new URL(base).protocol === "https:" }]);
    }
    // Exercise the real session endpoint and middleware, but no real customer
    // records. Cookies exist only in this disposable local browser context.
    await context.route("**/api/account/**", route => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
    const expected = loggedIn ? "/konto" : "/konto/logga-in";
    for (const path of ["/", "/menu", "/kontakt", "/reservation"]) {
      const page = await context.newPage();
      await page.goto(base + path, { waitUntil: "domcontentloaded", timeout: 90000 });
      if (path === "/reservation") {
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        await dialog.getByRole("button", { name: "Stäng", exact: true }).first().click();
      }
      const header = page.locator("header.site-header");
      const account = header.getByRole("link", { name: "Konto", exact: true });
      await page.waitForFunction(href => document.querySelector('header.site-header a[aria-label="Konto"]')?.getAttribute("href") === href, expected);
      await page.evaluate(() => document.fonts.ready);
      const metrics = await header.evaluate(el => {
        const box = el.getBoundingClientRect();
        const actions = [...el.querySelectorAll(".site-header-end a, .site-header-end button")].map(a => a.getBoundingClientRect());
        return {
          noOverflow: document.documentElement.scrollWidth <= innerWidth,
          noOverlap: actions.every((a, i) => !i || a.left >= actions[i - 1].right - 1),
          contained: actions.every(a => a.top >= box.top && a.bottom <= box.bottom),
          sticky: getComputedStyle(el).position === "fixed",
        };
      });
      assert.ok(Object.values(metrics).every(Boolean));
      await header.screenshot({ path: `${output}/${width}-${loggedIn ? "in" : "out"}-${path.replaceAll("/", "") || "home"}.png` });
      // Verify the actual click requests the correct relative route on this host.
      const navigation = page.waitForRequest(req => new URL(req.url()).origin === new URL(base).origin && new URL(req.url()).pathname === expected);
      await account.click();
      await navigation;
      await page.waitForURL(url => url.pathname === expected, { timeout: 60000 });
      results.push({ width, loggedIn, path, expected, landed: new URL(page.url()).pathname, ...metrics });
      await page.close();
    }
    await context.close();
  })));
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(`PASS: ${results.length} desktop account route/click checks`);
} finally { await browser.close(); }
