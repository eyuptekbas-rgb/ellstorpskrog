import { getDbErrorMessage, isPrismaConnectionError } from "@/lib/db/errors";
import { prisma } from "@/lib/prisma";

export type MenuProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  soldOut: boolean;
};

export type MenuCategory = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  sortOrder: number;
  products: MenuProduct[];
};

export async function getPublicMenu(): Promise<MenuCategory[]> {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return categories
      .map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        image: category.image,
        sortOrder: category.sortOrder,
        products: category.products.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          soldOut: product.soldOut,
        })),
      }))
      .filter((category) => category.products.length > 0);
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("Menu DB error:", getDbErrorMessage(error));
      return [];
    }
    throw error;
  }
}
