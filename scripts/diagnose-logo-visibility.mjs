import { chromium, devices } from "playwright";

const PAGES = ["/", "/kontakt", "/menu", "/login"];

async function diagnose(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ ...devices["iPhone 14 Pro"] });

  await page.goto(`http://localhost:3000${url}`);
  await page.evaluate(() => localStorage.setItem("newsSeen", "1"));
  await page.reload();
  await page.waitForTimeout(1500);

  const result = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")];
    const logoImgs = imgs.filter(
      (img) =>
        img.src.includes("logo.png") ||
        img.getAttribute("src")?.includes("logo.png") ||
        img.alt?.includes("Kvarterskrog") ||
        img.alt?.includes("Ellstorps")
    );

    const brandLogoImgs = [...document.querySelectorAll(".brand-logo")];

    function inspect(el) {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        src: el.src || el.getAttribute("src"),
        alt: el.alt,
        className: el.className,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        opacity: cs.opacity,
        visibility: cs.visibility,
        display: cs.display,
        zIndex: cs.zIndex,
        naturalWidth: el.naturalWidth,
        naturalHeight: el.naturalHeight,
        complete: el.complete,
      };
    }

    return {
      url: location.pathname,
      logoImgs: logoImgs.map(inspect),
      brandLogoImgs: brandLogoImgs.map(inspect),
      headerText: document.querySelector(".app-mobile-header__brand")?.textContent?.trim(),
      hasBrandLogoLink: !!document.querySelector(".brand-logo-link"),
    };
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

async function main() {
  for (const p of PAGES) {
    console.log("\n=== " + p + " ===");
    await diagnose(p);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
