import { chromium, devices } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const OUT_DIR = path.join(
  process.cwd(),
  "public",
  "screenshots-mobile-header"
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
  await page.waitForSelector(".mobile-site-header");
  await page.screenshot({
    path: path.join(OUT_DIR, filename),
    fullPage: false,
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  const iphone = await browser.newContext({
    ...devices["iPhone 14 Pro"],
  });
  const iphonePage = await iphone.newPage();
  await capture(iphonePage, "01-safari-iphone.png");
  await iphone.close();

  const pwa = await browser.newContext({
    ...devices["iPhone 14 Pro"],
  });
  const pwaPage = await pwa.newPage();
  await capture(pwaPage, "02-installed-pwa-iphone.png", true);
  await pwa.close();

  const android = await browser.newContext({
    ...devices["Pixel 7"],
  });
  const androidPage = await android.newPage();
  await capture(androidPage, "03-android-chrome.png");
  await android.close();

  await browser.close();
  console.log("Screenshots saved to", OUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
