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

export type ImageCropRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export async function processProductImage(
  buffer: Buffer,
  fileId: string,
  crop?: ImageCropRect
): Promise<ProcessedProductImage> {
  await ensureProductUploadDir();

  const mainFilename = `${fileId}.webp`;
  const thumbFilename = `${fileId}-thumb.webp`;
  const dir = path.join(process.cwd(), "public", "uploads", "products");
  const mainPath = path.join(dir, mainFilename);
  const thumbPath = path.join(dir, thumbFilename);

  let base = sharp(buffer).rotate();

  if (
    crop &&
    crop.width > 0 &&
    crop.height > 0 &&
    Number.isFinite(crop.left) &&
    Number.isFinite(crop.top)
  ) {
    const metadata = await base.metadata();
    const imgWidth = metadata.width ?? 0;
    const imgHeight = metadata.height ?? 0;
    if (imgWidth > 0 && imgHeight > 0) {
      const left = Math.max(0, Math.min(Math.round(crop.left), imgWidth - 1));
      const top = Math.max(0, Math.min(Math.round(crop.top), imgHeight - 1));
      const width = Math.max(
        1,
        Math.min(Math.round(crop.width), imgWidth - left)
      );
      const height = Math.max(
        1,
        Math.min(Math.round(crop.height), imgHeight - top)
      );
      base = base.extract({ left, top, width, height });
    }
  }

  const [mainBuffer, thumbBuffer] = await Promise.all([
    base
      .clone()
      .resize({ width: MAIN_IMAGE_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer(),
    base
      .clone()
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
