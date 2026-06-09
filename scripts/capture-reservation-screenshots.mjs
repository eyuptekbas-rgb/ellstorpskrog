import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const OUT_DIR = path.join(
  process.cwd(),
  "public",
  "screenshots-reservation-steps"
);

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  await page.goto("http://localhost:3000");
  await page.evaluate(() => localStorage.setItem("newsSeen", "1"));
  await page.goto("http://localhost:3000/reservation");
  await page.waitForSelector('[role="dialog"]', { timeout: 30000 });

  await page.getByRole("button", { name: /Imorgon/i }).first().click();
  await page.waitForSelector("text=13:00", { timeout: 10000 });

  await page.screenshot({
    path: path.join(OUT_DIR, "01-time-step.png"),
    fullPage: false,
  });

  await page.getByRole("button", { name: "18:00", exact: true }).click();
  await page.waitForSelector("text=10+", { timeout: 10000 });

  await page.screenshot({
    path: path.join(OUT_DIR, "02-guest-step.png"),
    fullPage: false,
  });

  await page.getByRole("button", { name: "6", exact: true }).click();
  await page.waitForSelector("#res-name-mobile", { timeout: 10000 });

  await page.fill("#res-name-mobile", "Anna Andersson");
  await page.fill("#res-phone-mobile", "0701234567");
  await page.fill("#res-email-mobile", "anna@example.com");
  await page.getByRole("button", { name: /Nästa/i }).click();

  await page.waitForSelector("text=Namn ·", { timeout: 10000 });

  await page.screenshot({
    path: path.join(OUT_DIR, "03-confirmation-step.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("Screenshots saved to", OUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
