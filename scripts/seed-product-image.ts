/**
 * Dev helper: attach a processed upload to Margherita for demos.
 * Usage: npx tsx scripts/seed-product-image.ts
 */
import fs from "fs/promises";
import path from "path";
import { prisma } from "../lib/prisma";
import { processProductImage } from "../lib/images/process";
import { randomUUID } from "crypto";

async function main() {
  const source = path.join(process.cwd(), "public", "images", "categories", "pizza.jpg");
  const buffer = await fs.readFile(source);
  const fileId = randomUUID();
  const { url } = await processProductImage(buffer, fileId);

  const product = await prisma.product.findFirst({
    where: { name: "Margherita" },
  });

  if (!product) {
    console.error("Margherita not found");
    process.exit(1);
  }

  await prisma.product.update({
    where: { id: product.id },
    data: { image: url },
  });

  console.log(`Updated ${product.name} with ${url}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
