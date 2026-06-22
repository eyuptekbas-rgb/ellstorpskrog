import type { MenuProduct } from "@/lib/menu";

/** Always returns the plain product name — no pizza numbers in the digital menu. */
export function getProductDisplayName(
  product: MenuProduct,
  categorySlug?: string
): string {
  void categorySlug;
  return product.name;
}
