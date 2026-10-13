import assert from "node:assert/strict";
import { randomUUID, randomBytes, randomInt } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { chromium } from "playwright";

const base = process.env.PUBLIC_TEST_URL || "http://localhost:3001";
const { combinedEnv } = nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Real test login is local-only");
assert.ok(["localhost", "127.0.0.1"].includes(new URL(combinedEnv.DATABASE_URL).hostname), "Test account writes require a local database");
const prisma = new PrismaClient();
const id = `login-verification-${randomUUID()}`;
const email = `${id}@example.invalid`;
const password = randomBytes(24).toString("base64url");
const output = "screenshots/customer-login";
await mkdir(output, { recursive: true });
let browser;
let created = false;
const results = [];
try {
  await prisma.user.create({ data: { id, email, name: "Tillfälligt testkonto", firstName: "Test", lastName: "Kund", phone: `+46999${randomInt(1000000, 9999999)}`, role: "CUSTOMER", passwordHash: await bcrypt.hash(password, 12) } });
  created = true;
  browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const [width, height] of [[390, 844], [430, 932], [1280, 1000], [1440, 1000]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.addInitScript(() => localStorage.setItem("newsSeen", "1"));
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto(`${base}/konto/logga-in`, { waitUntil: "domcontentloaded", timeout: 90000 });
    assert.equal(response.status(), 200);
    await page.getByRole("heading", { name: "Logga in", exact: true }).waitFor();
    await page.getByRole("link", { name: "Skapa konto", exact: true }).waitFor();
    const form = page.locator("form");
    const button = form.getByRole("button", { name: "Logga in", exact: true });
    await button.click({ trial: true });
    assert.equal(await form.evaluate(el => el.checkValidity()), false);
    const metrics = await form.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { noOverflow: document.documentElement.scrollWidth <= innerWidth, fitsWidth: rect.left >= 0 && rect.right <= innerWidth, formVisible: getComputedStyle(el.parentElement).display !== "none" };
    });
    assert.ok(Object.values(metrics).every(Boolean));
    await page.screenshot({ path: `${output}/login-${width}.png`, fullPage: true, caret: "initial" });
    await page.locator("#identifier").fill(email);
    await page.locator("#password").fill("incorrect-test-password");
    await button.click();
    await page.getByText("Fel e-post/telefon eller lösenord", { exact: true }).waitFor();
    await page.locator("#password").fill(password);
    await button.click();
    await page.waitForURL(url => url.pathname === "/konto", { timeout: 60000 });
    await page.getByRole("heading", { name: "Mitt konto", exact: true }).waitFor();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Mitt konto", exact: true }).waitFor();
    if (width >= 1024) {
      await page.waitForFunction(() => document.querySelector('header.site-header a[aria-label="Konto"]')?.getAttribute("href") === "/konto");
    }
    await page.screenshot({ path: `${output}/account-${width}.png`, fullPage: true });
    await page.goto(`${base}/konto/logga-in`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(url => url.pathname === "/konto", { timeout: 30000 });
    assert.equal(new URL(page.url()).pathname, "/konto");
    await page.getByRole("heading", { name: "Mitt konto", exact: true }).waitFor();
    assert.deepEqual(errors, []);
    const result = { width, ...metrics, invalidCredentials: "visible error", validCredentials: "signed in", accountVisible: true, sessionAfterReload: true, loggedInLoginRedirect: "/konto", pageErrors: errors };
    console.log(JSON.stringify(result));
    results.push(result);
    await context.close();
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
} finally {
  await browser?.close();
  if (created) {
    const removed = await prisma.user.deleteMany({ where: { id, email, role: "CUSTOMER" } });
    assert.equal(removed.count, 1);
    console.log("Temporary customer removed.");
  }
  await prisma.$disconnect();
}
