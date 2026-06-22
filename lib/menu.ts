import { getDbErrorMessage, isPrismaConnectionError } from "@/lib/db/errors";
import { categoryExtrasInclude, mapCategoryExtrasToMenuOptions } from "@/lib/extra-options";
import { prisma } from "@/lib/prisma";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";

export type MenuProductOption = {
  id: string;
  name: string;
  priceModifier: number;
};

export type MenuProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  soldOut: boolean;
  sortOrder: number;
  options: MenuProductOption[];
};

export type MenuCategory = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  sortOrder: number;
  products: MenuProduct[];
};

export async function getPublicMenu(tenantId?: string): Promise<MenuCategory[]> {
  try {
    const resolvedTenantId = tenantId ?? (await resolvePublicTenantId());

    const categories = await prisma.category.findMany({
      where: { active: true, tenantId: resolvedTenantId },
      orderBy: { sortOrder: "asc" },
      include: {
        ...categoryExtrasInclude,
        products: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return categories
      .map((category) => {
        const categoryOptions = mapCategoryExtrasToMenuOptions(
          category.extraOptions
        );

        return {
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
            sortOrder: product.sortOrder,
            options: categoryOptions,
          })),
        };
      })
      .filter((category) => category.products.length > 0);
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      console.error("Menu DB error:", getDbErrorMessage(error));
      return [];
    }
    throw error;
  }
}
