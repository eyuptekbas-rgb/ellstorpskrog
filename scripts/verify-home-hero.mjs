import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.HERO_TEST_URL || "http://localhost:3001";
const output = "screenshots/restaurant-hero";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const [width, height] of [[390, 844], [430, 932], [820, 1180], [1280, 900], [1440, 900]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.addInitScript(() => {
      localStorage.setItem("newsSeen", "1");
      window.heroCLS = 0;
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.heroCLS += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 90000 });
    const hero = page.locator("section").filter({ has: page.locator("h1") }).first();
    await hero.locator("img").evaluate(img => img.decode());
    await page.evaluate(() => document.fonts.ready);
    for (const button of await hero.locator("a.btn-primary, a.btn-secondary").all()) {
      await button.click({ trial: true });
    }
    const result = await hero.evaluate(section => {
      const image = section.querySelector("img");
      const heading = section.querySelector("h1");
      const buttons = [...section.querySelectorAll("a.btn-primary, a.btn-secondary")];
      return {
        width: innerWidth,
        overflow: document.documentElement.scrollWidth > innerWidth,
        heading: heading.textContent,
        headingVisible: heading.getBoundingClientRect().bottom < innerHeight,
        imageLoaded: image.complete && image.naturalWidth > 0,
        imageURL: image.currentSrc,
        cls: window.heroCLS,
        buttons: buttons.map(button => {
          const r = button.getBoundingClientRect();
          const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return { text: button.textContent.trim(), href: button.getAttribute("href"), aboveFold: r.bottom <= innerHeight, clickable: button === hit || button.contains(hit) };
        }),
        imageBytes: performance.getEntriesByType("resource").find(r => r.name === image.currentSrc)?.encodedBodySize,
      };
    });
    await page.screenshot({ path: `${output}/${width}.png`, fullPage: true });
    await page.screenshot({ path: `${output}/${width}-viewport.png` });
    console.log(JSON.stringify(result));
    assert.equal(result.overflow, false);
    assert.equal(result.imageLoaded, true);
    assert.match(result.imageURL, /Ellstorps-Krog/);
    assert.equal(result.headingVisible, true);
    assert.equal(result.buttons.length, 2);
    assert.ok(result.buttons.every(b => b.aboveFold && b.clickable && b.href.endsWith("/menu")));
    results.push(result);
    await page.close();
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
