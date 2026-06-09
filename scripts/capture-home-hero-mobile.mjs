import { chromium, devices } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const OUT = path.join(process.cwd(), "public", "screenshots-home-hero-mobile");

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ ...devices["iPhone 14 Pro"] });

  await page.goto("http://localhost:3000/");
  await page.evaluate(() => localStorage.setItem("newsSeen", "1"));
  await page.reload();
  await page.waitForSelector(".brand-logo--home-hero");

  const report = await page.evaluate(() => {
    const logo = document.querySelector(".brand-logo--home-hero");
    const eyebrow = document.querySelector(".section-label");
    const heading = document.querySelector(".text-display");
    const desc = document.querySelector(".text-body");
    const ctas = [...document.querySelectorAll(".btn-primary, .btn-secondary")].filter(
      (el) => el.closest("section") && el.getBoundingClientRect().top < window.innerHeight
    );
    const logoRect = logo?.getBoundingClientRect();
    const lastCta = ctas[ctas.length - 1]?.getBoundingClientRect();

    return {
      logo: logoRect
        ? {
            width: Math.round(logoRect.width),
            height: Math.round(logoRect.height),
          }
        : null,
      aboveFold:
        logoRect &&
        heading &&
        desc &&
        ctas.length >= 2 &&
        lastCta.bottom <= window.innerHeight,
      lastCtaBottom: lastCta ? Math.round(lastCta.bottom) : null,
      viewport: window.innerHeight,
    };
  });

  console.log(JSON.stringify(report, null, 2));
  await page.screenshot({ path: path.join(OUT, "01-safari-home-hero.png") });
  console.log("Saved to", OUT);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
