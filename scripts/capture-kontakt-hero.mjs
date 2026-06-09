import { chromium, devices } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const OUT = path.join(process.cwd(), "public", "screenshots-kontakt-hero");

async function capture(contextName, device, file, safeTop = 0) {
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

  await page.goto("http://localhost:3000/kontakt");
  await page.evaluate(() => localStorage.setItem("newsSeen", "1"));
  await page.reload();
  await page.waitForSelector(".kontakt-hero");

  await page.screenshot({
    path: path.join(OUT, file),
    fullPage: false,
  });

  const metrics = await page.evaluate(() => {
    const header = document.querySelector(".app-mobile-header");
    const wordmark = document.querySelector(".brand-wordmark--contact");
    const actions = document.querySelector(".kontakt-hero__actions");
    const legacyLogo = document.querySelector(".brand-logo--hero");
    const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
    const wordmarkTop = wordmark?.getBoundingClientRect().top ?? 0;
    const actionsBottom = actions?.getBoundingClientRect().bottom ?? 0;
    const wordmarkWidth = wordmark?.getBoundingClientRect().width ?? 0;
    const viewport = window.innerHeight;

    return {
      headerToLogo: Math.round(wordmarkTop - headerBottom),
      wordmarkWidth: Math.round(wordmarkWidth),
      heroFitsViewport: actionsBottom <= viewport,
      actionsBottom: Math.round(actionsBottom),
      viewport,
      hasLegacyLogo: Boolean(legacyLogo),
    };
  });

  console.log(contextName, metrics);
  await browser.close();
  return metrics;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const safari = await capture(
    "Safari",
    devices["iPhone 14 Pro"],
    "01-safari-kontakt.png"
  );
  const pwa = await capture(
    "PWA",
    devices["iPhone 14 Pro"],
    "02-pwa-kontakt.png",
    47
  );
  const android = await capture(
    "Android",
    devices["Pixel 7"],
    "03-android-kontakt.png"
  );

  const ok =
    safari.heroFitsViewport &&
    pwa.heroFitsViewport &&
    android.heroFitsViewport &&
    !safari.hasLegacyLogo &&
    safari.headerToLogo >= 24 &&
    safari.headerToLogo <= 32 &&
    safari.wordmarkWidth >= 180 &&
    safari.wordmarkWidth <= 220;

  console.log(ok ? "PASS" : "CHECK METRICS");
  console.log("Saved to", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
