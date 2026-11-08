import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const output = "screenshots/contact-layout";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const results = await Promise.all([[390, 844], [430, 932], [820, 1180], [1280, 900], [1440, 900]].map(async ([width, height]) => {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.addInitScript(() => localStorage.setItem("newsSeen", "1"));
    const response = await page.goto(`${process.env.CONTACT_TEST_URL || "http://localhost:3001"}/kontakt`, { waitUntil: "domcontentloaded", timeout: 90000 });
    assert.equal(response.status(), 200);
    await page.getByRole("heading", { name: "Kontakta oss" }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const info = page.getByRole("region", { name: "Kontaktuppgifter" });
    const map = page.getByRole("region", { name: "Karta" });
    const form = page.locator("form");
    const infoBox = await info.boundingBox();
    const mapBox = await map.boundingBox();
    const formBox = await form.boundingBox();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false);
    if (width >= 768) {
      assert.ok(mapBox.x > infoBox.x + infoBox.width);
      assert.ok(Math.abs(mapBox.y - infoBox.y) < 2);
    } else {
      assert.ok(mapBox.y >= infoBox.y + infoBox.height);
      const action = await page.getByRole("link", { name: "Ring nu", exact: true }).boundingBox();
      assert.ok(action.width >= width - 65);
    }
    assert.ok(formBox.y > mapBox.y + mapBox.height);
    assert.match(decodeURIComponent(await page.locator('iframe[title="Karta"]').getAttribute("src")), /Sallerupsvägen 28D, 212 18 Malmö/);
    const iframe = page.locator('iframe[title="Karta"]');
    await iframe.scrollIntoViewIfNeeded();
    const mapFrame = await (await iframe.elementHandle()).contentFrame();
    await mapFrame.waitForFunction(() => [...document.images].some(image => image.complete && image.naturalWidth > 0), { timeout: 30000 });
    // Let Google's tile renderer finish painting while the lazy iframe is visible.
    await page.waitForTimeout(2000);
    await map.screenshot({ path: `${output}/${width}-map.png` });
    await page.evaluate(() => scrollTo(0, 0));
    await page.getByRole("link", { name: "Ring nu", exact: true }).click({ trial: true });
    await page.getByRole("link", { name: "Vägbeskrivning", exact: true }).click({ trial: true });
    await page.screenshot({ path: `${output}/${width}-viewport.png` });
    await page.screenshot({ path: `${output}/${width}.png`, fullPage: true });
    assert.equal(await form.evaluate(el => el.checkValidity()), false);
    let submissions = 0;
    await page.route("**/api/contact", async route => {
      submissions += 1;
      assert.deepEqual(route.request().postDataJSON(), { name: "Layout test", email: "layout@example.com", message: "Local verification only." });
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });
    await page.getByRole("textbox", { name: "Namn", exact: true }).fill("Layout test");
    await page.getByRole("textbox", { name: "E-post", exact: true }).fill("layout@example.com");
    await page.getByRole("textbox", { name: "Ditt meddelande", exact: true }).fill("Local verification only.");
    await page.getByRole("button", { name: "Skicka meddelande", exact: true }).click();
    await page.getByText("Tack! Ditt meddelande har skickats.").waitFor();
    assert.equal(submissions, 1);
    const result = { width, overflow, columns: width >= 768 ? 2 : 1, mapWidth: Math.round(mapBox.width), formHeight: Math.round(formBox.height), mockedFormSubmission: "passed" };
    console.log(JSON.stringify(result));
    await page.close();
    return result;
  }));
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
