import type { Prisma } from "@prisma/client";
import type { AdminMenuCategory, AdminMenuProduct } from "./menu-types";

export const adminMenuProductInclude = {
  optionGroups: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      options: { orderBy: { sortOrder: "asc" as const } },
    },
  },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{
  include: typeof adminMenuProductInclude;
}>;

export function serializeAdminProduct(product: ProductRow): AdminMenuProduct {
  return {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
    ingredients: product.ingredients,
    allergens: product.allergens,
    price: product.price,
    campaignPrice: product.campaignPrice,
    campaignStart: product.campaignStart?.toISOString() ?? null,
    campaignEnd: product.campaignEnd?.toISOString() ?? null,
    image: product.image,
    active: product.active,
    hidden: product.hidden,
    soldOut: product.soldOut,
    isPopular: product.isPopular,
    isNew: product.isNew,
    isVegetarian: product.isVegetarian,
    isGlutenFree: product.isGlutenFree,
    spicyLevel: product.spicyLevel,
    sortOrder: product.sortOrder,
    optionGroups: product.optionGroups.map((group) => ({
      id: group.id,
      name: group.name,
      required: group.required,
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      sortOrder: group.sortOrder,
      options: group.options.map((option) => ({
        id: option.id,
        name: option.name,
        priceModifier: option.priceModifier,
        sortOrder: option.sortOrder,
      })),
    })),
  };
}

export function productPayloadFromDraft(
  draft: Partial<{
    name: string;
    description: string;
    ingredients: string;
    allergens: string;
    price: number;
    campaignPrice: number | null;
    campaignStart: string | null;
    campaignEnd: string | null;
    image: string | null;
    categoryId: string;
    active: boolean;
    hidden: boolean;
    soldOut: boolean;
    isPopular: boolean;
    isNew: boolean;
    isVegetarian: boolean;
    isGlutenFree: boolean;
    spicyLevel: number;
  }>
) {
  return {
    ...(draft.name !== undefined && { name: draft.name }),
    ...(draft.description !== undefined && { description: draft.description }),
    ...(draft.ingredients !== undefined && { ingredients: draft.ingredients }),
    ...(draft.allergens !== undefined && { allergens: draft.allergens }),
    ...(draft.price !== undefined && { price: Math.round(draft.price) }),
    ...(draft.campaignPrice !== undefined && {
      campaignPrice:
        draft.campaignPrice == null ? null : Math.round(draft.campaignPrice),
    }),
    ...(draft.campaignStart !== undefined && {
      campaignStart: draft.campaignStart
        ? new Date(draft.campaignStart)
        : null,
    }),
    ...(draft.campaignEnd !== undefined && {
      campaignEnd: draft.campaignEnd ? new Date(draft.campaignEnd) : null,
    }),
    ...(draft.image !== undefined && { image: draft.image || null }),
    ...(draft.categoryId !== undefined && { categoryId: draft.categoryId }),
    ...(draft.active !== undefined && { active: draft.active }),
    ...(draft.hidden !== undefined && { hidden: draft.hidden }),
    ...(draft.soldOut !== undefined && { soldOut: draft.soldOut }),
    ...(draft.isPopular !== undefined && { isPopular: draft.isPopular }),
    ...(draft.isNew !== undefined && { isNew: draft.isNew }),
    ...(draft.isVegetarian !== undefined && { isVegetarian: draft.isVegetarian }),
    ...(draft.isGlutenFree !== undefined && { isGlutenFree: draft.isGlutenFree }),
    ...(draft.spicyLevel !== undefined && {
      spicyLevel: Math.min(3, Math.max(0, draft.spicyLevel)),
    }),
  };
}

export function serializeAdminMenuCategories(
  categories: Array<
    Prisma.CategoryGetPayload<{
      include: {
        _count: { select: { products: true; extraOptions: true } };
        products: { include: typeof adminMenuProductInclude };
      };
    }>
  >
): AdminMenuCategory[] {
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    image: category.image,
    icon: category.icon,
    active: category.active,
    sortOrder: category.sortOrder,
    _count: category._count,
    products: category.products.map(serializeAdminProduct),
  }));
}
