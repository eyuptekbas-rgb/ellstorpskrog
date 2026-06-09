import { chromium, devices } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const OUT_DIR = path.join(
  process.cwd(),
  "public",
  "screenshots-mobile-header-v2"
);

const SAFE_TOP = "47px";

async function capture(page, filename, safeArea = false) {
  if (safeArea) {
    await page.addInitScript((top) => {
      const style = document.createElement("style");
      style.textContent = `
        .site-header { padding-top: ${top} !important; }
        .site-main { padding-top: calc(${top} + var(--header-content-mobile)) !important; }
      `;
      document.documentElement.appendChild(style);
    }, SAFE_TOP);
  }

  await page.goto("http://localhost:3000");
  await page.evaluate(() => localStorage.setItem("newsSeen", "1"));
  await page.reload();
  await page.waitForSelector(".m-header");
  await page.locator(".m-header").screenshot({
    path: path.join(OUT_DIR, filename),
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  const iphone = await browser.newContext({ ...devices["iPhone 14 Pro"] });
  await capture(await iphone.newPage(), "01-safari-iphone-header.png");
  await iphone.close();

  const pwa = await browser.newContext({ ...devices["iPhone 14 Pro"] });
  await capture(await pwa.newPage(), "02-pwa-iphone-header.png", true);
  await pwa.close();

  const android = await browser.newContext({ ...devices["Pixel 7"] });
  await capture(await android.newPage(), "03-android-chrome-header.png");
  await android.close();

  const iphoneFull = await browser.newContext({
    ...devices["iPhone 14 Pro"],
  });
  const fullPage = await iphoneFull.newPage();
  await fullPage.goto("http://localhost:3000");
  await fullPage.evaluate(() => localStorage.setItem("newsSeen", "1"));
  await fullPage.reload();
  await fullPage.waitForSelector(".m-header");
  await fullPage.screenshot({
    path: path.join(OUT_DIR, "04-safari-iphone-full.png"),
    fullPage: false,
  });
  await iphoneFull.close();

  await browser.close();
  console.log("Screenshots saved to", OUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
