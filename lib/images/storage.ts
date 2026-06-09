import fs from "fs/promises";
import path from "path";
import { PRODUCT_UPLOAD_DIR } from "./constants";

export function isLocalProductImage(url: string | null | undefined): boolean {
  return !!url?.startsWith("/uploads/products/");
}

export function productImagePaths(imageUrl: string): { main: string; thumb: string } {
  const relative = imageUrl.replace(/^\//, "");
  const main = path.join(process.cwd(), relative);
  const thumb = main.replace(/\.webp$/, "-thumb.webp");
  return { main, thumb };
}

export async function ensureProductUploadDir(): Promise<string> {
  const dir = path.join(process.cwd(), PRODUCT_UPLOAD_DIR);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function deleteProductImageFiles(
  imageUrl: string | null | undefined
): Promise<void> {
  if (!isLocalProductImage(imageUrl)) return;
  const { main, thumb } = productImagePaths(imageUrl!);
  await Promise.allSettled([fs.unlink(main), fs.unlink(thumb)]);
}
