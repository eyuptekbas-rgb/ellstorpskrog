import { chromium, devices } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const OUT = path.join(process.cwd(), "public", "screenshots-app-mobile-header");

async function shot(page, file, safeTop = 0) {
  if (safeTop > 0) {
    await page.addInitScript((top) => {
      document.documentElement.style.setProperty("--test-safe-top", top);
      const style = document.createElement("style");
      style.textContent = `
        .app-mobile-header { padding-top: ${top} !important; }
        .site-main { padding-top: calc(${top} + var(--header-content-mobile)) !important; }
      `;
      document.documentElement.appendChild(style);
    }, `${safeTop}px`);
  }

  await page.goto("http://localhost:3000");
  await page.evaluate(() => localStorage.setItem("newsSeen", "1"));
  await page.reload();
  await page.waitForSelector(".app-mobile-header");

  const header = page.locator(".app-mobile-header");
  await header.screenshot({ path: path.join(OUT, file) });

  const barHeight = await page.locator(".app-mobile-header__bar").evaluate(
    (el) => el.getBoundingClientRect().height
  );
  const totalHeight = await header.evaluate((el) => el.getBoundingClientRect().height);
  return { barHeight, totalHeight };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  const safari = await browser.newContext({ ...devices["iPhone 14 Pro"] });
  const s1 = await shot(await safari.newPage(), "01-safari-iphone.png");
  console.log("Safari", s1);
  await safari.close();

  const pwa = await browser.newContext({ ...devices["iPhone 14 Pro"] });
  const s2 = await shot(await pwa.newPage(), "02-installed-pwa-iphone.png", 47);
  console.log("PWA", s2);
  await pwa.close();

  const android = await browser.newContext({ ...devices["Pixel 7"] });
  const s3 = await shot(await android.newPage(), "03-android-chrome.png");
  console.log("Android", s3);
  await android.close();

  await browser.close();
  console.log("Saved to", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
