import { prisma } from "@/lib/prisma";
import type { MenuProductOption } from "@/lib/menu";

export type ExtraOptionInput = {
  name: string;
  priceModifier: number;
  sortOrder?: number;
  active?: boolean;
  categoryIds?: string[];
};

export type ExtraOptionWithCategories = {
  id: string;
  name: string;
  priceModifier: number;
  sortOrder: number;
  active: boolean;
  categoryIds: string[];
  categories: Array<{ id: string; name: string; slug: string }>;
};

export const extraOptionInclude = {
  categories: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  },
};

export const categoryExtrasInclude = {
  extraOptions: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      extraOption: true,
    },
  },
};

export function mapCategoryExtrasToMenuOptions(
  rows: Array<{
    sortOrder: number;
    extraOption: {
      id: string;
      name: string;
      priceModifier: number;
      active: boolean;
    };
  }>
): MenuProductOption[] {
  return rows
    .filter((row) => row.extraOption.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({
      id: row.extraOption.id,
      name: row.extraOption.name,
      priceModifier: row.extraOption.priceModifier,
    }));
}

export function serializeExtraOption(
  option: {
    id: string;
    name: string;
    priceModifier: number;
    sortOrder: number;
    active: boolean;
    categories: Array<{
      category: { id: string; name: string; slug: string };
    }>;
  }
): ExtraOptionWithCategories {
  return {
    id: option.id,
    name: option.name,
    priceModifier: option.priceModifier,
    sortOrder: option.sortOrder,
    active: option.active,
    categoryIds: option.categories.map((row) => row.category.id),
    categories: option.categories.map((row) => row.category),
  };
}

export async function syncExtraOptionCategories(
  extraOptionId: string,
  categoryIds: string[],
  tenantId: string
) {
  const uniqueIds = [...new Set(categoryIds)];

  if (uniqueIds.length > 0) {
    const found = await prisma.category.findMany({
      where: { id: { in: uniqueIds }, tenantId },
      select: { id: true },
    });
    if (found.length !== uniqueIds.length) {
      throw new Error("Category not found");
    }
  }

  const existing = await prisma.categoryExtraOption.findMany({
    where: { extraOptionId },
    select: { id: true, categoryId: true },
  });

  const keep = new Set(uniqueIds);
  const deleteIds = existing
    .filter((row) => !keep.has(row.categoryId))
    .map((row) => row.id);

  if (deleteIds.length > 0) {
    await prisma.categoryExtraOption.deleteMany({
      where: { id: { in: deleteIds } },
    });
  }

  const existingCategoryIds = new Set(existing.map((row) => row.categoryId));
  const toCreate = uniqueIds.filter((id) => !existingCategoryIds.has(id));

  if (toCreate.length > 0) {
    await prisma.categoryExtraOption.createMany({
      data: toCreate.map((categoryId, index) => ({
        categoryId,
        extraOptionId,
        sortOrder: index,
      })),
    });
  }
}
