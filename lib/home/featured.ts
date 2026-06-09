import type { MenuCategory } from "@/lib/menu";

export type FeaturedDish = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  categoryName: string;
  categorySlug: string;
};

export function getFeaturedDishes(
  categories: MenuCategory[],
  limit = 6
): FeaturedDish[] {
  const dishes: FeaturedDish[] = [];

  for (const category of categories) {
    for (const product of category.products) {
      if (product.soldOut) continue;
      dishes.push({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        categoryName: category.name,
        categorySlug: category.slug,
      });
      if (dishes.length >= limit) return dishes;
    }
  }

  return dishes;
}
