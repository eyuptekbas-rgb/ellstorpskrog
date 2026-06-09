import { chromium, devices } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const OUT = path.join(process.cwd(), "public", "screenshots-brand-audit");

async function capture(name, device, url, file, safeTop = 0) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...device });
  const page = await ctx.newPage();

  if (safeTop > 0) {
    await page.addInitScript((top) => {
      const style = document.createElement("style");
      style.textContent = `
        .app-mobile-header { padding-top: ${top} !important; }
        .site-main { padding-top: calc(${top} + var(--header-content-mobile)) !important; }
      `;
      document.documentElement.appendChild(style);
    }, `${safeTop}px`);
  }

  await page.goto(`http://localhost:3000${url}`);
  await page.evaluate(() => localStorage.setItem("newsSeen", "1"));
  await page.reload();
  await page.waitForSelector(".app-mobile-header, .brand-logo, main");

  await page.screenshot({ path: path.join(OUT, file), fullPage: false });

  const audit = await page.evaluate(() => {
    const logos = [...document.querySelectorAll('img[src*="/logo.png"]')];
    const wordmarks = document.querySelectorAll(".brand-wordmark");
    return {
      logoCount: logos.length,
      logoSrcs: [...new Set(logos.map((img) => img.getAttribute("src")))],
      hasWordmark: wordmarks.length > 0,
    };
  });

  console.log(name, audit);
  await browser.close();
  return audit;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const iphone = devices["iPhone 14 Pro"];
  const pixel = devices["Pixel 7"];

  await capture("Safari Kontakt", iphone, "/kontakt", "01-safari-kontakt.png");
  await capture("PWA Kontakt", iphone, "/kontakt", "02-pwa-kontakt.png", 47);
  await capture("Android Kontakt", pixel, "/kontakt", "03-android-kontakt.png");

  console.log("Saved to", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
