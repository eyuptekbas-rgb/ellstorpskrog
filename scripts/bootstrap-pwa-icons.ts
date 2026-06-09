/**
 * Generate PWA icons and splash screens from the official logo.
 * Run: npm run pwa:bootstrap
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const logo = path.join(process.cwd(), "public/logo.png");

async function main() {
  if (!existsSync(logo)) {
    console.error("Missing public/logo.png — add the official Ellstorps Krog logo first.");
    process.exit(1);
  }

  execSync("npm run pwa:assets", { stdio: "inherit", cwd: process.cwd() });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
