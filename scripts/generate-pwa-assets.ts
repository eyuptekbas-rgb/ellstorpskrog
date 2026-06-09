/**
 * Regenerate PWA icons and iOS splash screens from the official logo.
 * Run: npm run pwa:assets
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const iconsDir = path.join(root, "public/icons");
const splashDir = path.join(root, "public/splash");
const logoPath = path.join(root, "public/logo.png");

const BRAND = {
  bg: "#0f0f0f",
  copper: "#b85c38",
};

const splashes: [number, number, string][] = [
  [1170, 2532, "iphone-14"],
  [1284, 2778, "iphone-14-pro-max"],
  [750, 1334, "iphone-se"],
  [1536, 2048, "ipad"],
];

async function buildIcon(size: number, logoScale = 0.82) {
  const logoSize = Math.round(size * logoScale);
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: "contain", background: BRAND.bg })
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND.bg,
    },
  }).composite([{ input: logo, gravity: "center" }]);
}

async function splashBackground(width: number, height: number) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stop-color="${BRAND.copper}" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="${BRAND.bg}" stop-opacity="1"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="${BRAND.bg}"/>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function main() {
  await mkdir(iconsDir, { recursive: true });
  await mkdir(splashDir, { recursive: true });

  await (await buildIcon(512, 0.88)).png().toFile(path.join(iconsDir, "icon-512.png"));
  await (await buildIcon(512, 0.72))
    .png()
    .toFile(path.join(iconsDir, "icon-512-maskable.png"));
  await (await buildIcon(192, 0.84)).png().toFile(path.join(iconsDir, "icon-192.png"));
  await (await buildIcon(180, 0.84))
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));

  const logoSize = 240;
  const logoBuf = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  for (const [w, h, name] of splashes) {
    const bg = await splashBackground(w, h);
    await sharp(bg)
      .composite([{ input: logoBuf, gravity: "center" }])
      .png()
      .toFile(path.join(splashDir, `${name}.png`));
  }

  console.log("PWA assets generated from public/logo.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
