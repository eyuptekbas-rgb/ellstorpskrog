/**
 * Generate premium placeholder brand images (hero + categories).
 * Run: npm run brand:images
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "public/images/categories");

type Scene = {
  name: string;
  width: number;
  height: number;
  colors: [string, string, string];
  label: string;
  emoji: string;
};

const categories: Scene[] = [
  {
    name: "pizza",
    width: 800,
    height: 600,
    colors: ["#3d1f14", "#b85c38", "#e8c4a8"],
    label: "Pizza",
    emoji: "🍕",
  },
  {
    name: "kebab",
    width: 800,
    height: 600,
    colors: ["#1a2418", "#8b6914", "#d4a574"],
    label: "Kebab",
    emoji: "🥙",
  },
  {
    name: "burgare",
    width: 800,
    height: 600,
    colors: ["#2a1810", "#a04f30", "#f0d5b8"],
    label: "Burgare",
    emoji: "🍔",
  },
  {
    name: "grill",
    width: 800,
    height: 600,
    colors: ["#1a1410", "#6b3a28", "#c9a88a"],
    label: "Grill",
    emoji: "🥩",
  },
  {
    name: "drycker",
    width: 800,
    height: 600,
    colors: ["#101820", "#2a4a6b", "#a8c4e8"],
    label: "Drycker",
    emoji: "🥤",
  },
];

function sceneSvg({ width, height, colors, label, emoji }: Scene) {
  const [c1, c2, c3] = colors;
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="55%" stop-color="${c2}"/>
          <stop offset="100%" stop-color="${c1}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="${c3}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${c1}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#glow)"/>
      <circle cx="${width * 0.75}" cy="${height * 0.25}" r="${width * 0.22}" fill="${c2}" opacity="0.12"/>
      <text x="50%" y="46%" text-anchor="middle" font-size="${width * 0.18}" dominant-baseline="middle">${emoji}</text>
      <text x="50%" y="72%" text-anchor="middle" font-family="Georgia, serif" font-size="${width * 0.06}" fill="${c3}" opacity="0.9">${label}</text>
      <text x="50%" y="82%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${width * 0.028}" fill="${c3}" opacity="0.45" letter-spacing="4">ELLSTORPS KROG</text>
    </svg>
  `;
}

async function generateHero() {
  const w = 1920;
  const h = 1080;
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a0a0a"/>
          <stop offset="40%" stop-color="#2a1810"/>
          <stop offset="100%" stop-color="#0f0f0f"/>
        </linearGradient>
        <radialGradient id="warm" cx="30%" cy="60%" r="55%">
          <stop offset="0%" stop-color="#b85c38" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#0a0a0a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#warm)"/>
      <circle cx="1550" cy="280" r="320" fill="#d4a574" opacity="0.08"/>
      <circle cx="400" cy="800" r="450" fill="#b85c38" opacity="0.12"/>
      <text x="96" y="520" font-family="Georgia, serif" font-size="120" fill="#e8c4a8">Ellstorps Krog</text>
      <text x="100" y="600" font-family="Arial, sans-serif" font-size="36" fill="#d4a574" opacity="0.8" letter-spacing="6">MALMÖ · SEDAN 1987</text>
      <text x="100" y="680" font-family="Arial, sans-serif" font-size="28" fill="#ffffff" opacity="0.45">Pizza · Kebab · Husmanskost</text>
    </svg>
  `;
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(root, "public/hero.jpg"));
  console.log("Created public/hero.jpg");
}

async function main() {
  await mkdir(outDir, { recursive: true });
  await generateHero();
  for (const scene of categories) {
    const out = path.join(outDir, `${scene.name}.jpg`);
    await sharp(Buffer.from(sceneSvg(scene)))
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(out);
    console.log(`Created ${out.replace(root + path.sep, "")}`);
  }
  console.log("Brand images generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
