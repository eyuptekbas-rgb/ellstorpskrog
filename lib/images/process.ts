import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
  MAIN_IMAGE_MAX_WIDTH,
  THUMB_IMAGE_MAX_WIDTH,
} from "./constants";
import { ensureProductUploadDir } from "./storage";

export type ProcessedProductImage = {
  url: string;
  thumbnailUrl: string;
};

export async function processProductImage(
  buffer: Buffer,
  fileId: string
): Promise<ProcessedProductImage> {
  await ensureProductUploadDir();

  const mainFilename = `${fileId}.webp`;
  const thumbFilename = `${fileId}-thumb.webp`;
  const dir = path.join(process.cwd(), "public", "uploads", "products");
  const mainPath = path.join(dir, mainFilename);
  const thumbPath = path.join(dir, thumbFilename);

  const base = sharp(buffer).rotate();

  const [mainBuffer, thumbBuffer] = await Promise.all([
    base
      .clone()
      .resize({ width: MAIN_IMAGE_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer(),
    sharp(buffer)
      .rotate()
      .resize({ width: THUMB_IMAGE_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer(),
  ]);

  await Promise.all([
    fs.writeFile(mainPath, mainBuffer),
    fs.writeFile(thumbPath, thumbBuffer),
  ]);

  return {
    url: `/uploads/products/${mainFilename}`,
    thumbnailUrl: `/uploads/products/${thumbFilename}`,
  };
}
