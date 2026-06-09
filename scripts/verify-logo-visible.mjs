import { chromium, devices } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const OUT = path.join(process.cwd(), "public", "screenshots-logo-proof");

async function verify(pagePath, label, file) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ ...devices["iPhone 14 Pro"] });

  await page.goto(`http://localhost:3000${pagePath}`);
  await page.evaluate(() => localStorage.setItem("newsSeen", "1"));
  await page.reload();
  await page.waitForSelector(".brand-logo--mobile-page, .app-mobile-header", {
    timeout: 10000,
  });

  const report = await page.evaluate(() => {
    const logo = document.querySelector(".brand-logo--mobile-page");
    const header = document.querySelector(".app-mobile-header");
    if (!logo) {
      return { error: "No .brand-logo--mobile-page found" };
    }

    const rect = logo.getBoundingClientRect();
    const cs = getComputedStyle(logo);
    const headerRect = header?.getBoundingClientRect();

    return {
      component: "MobilePageLogo → BrandLogo",
      src: logo.src,
      path: logo.src.includes("logo.png") ? "/logo.png" : logo.src,
      renderedWidth: Math.round(rect.width),
      renderedHeight: Math.round(rect.height),
      top: Math.round(rect.top),
      headerBottom: headerRect ? Math.round(headerRect.bottom) : null,
      gapBelowHeader: headerRect
        ? Math.round(rect.top - headerRect.bottom)
        : null,
      opacity: cs.opacity,
      visibility: cs.visibility,
      display: cs.display,
      zIndex: cs.zIndex,
      naturalWidth: logo.naturalWidth,
      naturalHeight: logo.naturalHeight,
      visible:
        rect.width > 0 &&
        rect.height > 0 &&
        cs.opacity !== "0" &&
        cs.visibility !== "hidden" &&
        cs.display !== "none",
    };
  });

  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(report, null, 2));

  await page.screenshot({ path: path.join(OUT, file), fullPage: false });

  if (report.visible) {
    const logo = page.locator(".brand-logo--mobile-page").first();
    await logo.screenshot({
      path: path.join(OUT, file.replace(".png", "-logo-crop.png")),
    });
  }

  await browser.close();
  return report;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const home = await verify("/", "Home Safari", "01-home-logo-visible.png");
  const kontakt = await verify(
    "/kontakt",
    "Kontakt Safari",
    "02-kontakt-logo-visible.png"
  );

  const ok =
    home.visible &&
    home.renderedWidth >= 180 &&
    kontakt.visible &&
    kontakt.renderedWidth >= 180;

  console.log(ok ? "\nPASS: Logo visible on screen" : "\nFAIL: Check report");
  console.log("Screenshots:", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
