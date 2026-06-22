import { prisma } from "@/lib/prisma";
import {
  PRINTED_MENU_CATEGORIES,
  PRINTED_MENU_SLUGS,
} from "@/lib/menu/printed-menu";

const DEFAULT_TENANT_SLUG = "ellstorps-krog";

export type SyncPrintedMenuResult = {
  tenantId: string;
  categoriesUpdated: number;
  productsCreated: number;
  productsUpdated: number;
  productsDeactivated: number;
  categoriesDeactivated: number;
};

export async function syncPrintedMenuForTenant(
  tenantSlug: string = DEFAULT_TENANT_SLUG
): Promise<SyncPrintedMenuResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantSlug}`);
  }

  const tenantId = tenant.id;
  let productsCreated = 0;
  let productsUpdated = 0;
  let categoriesUpdated = 0;

  await prisma.$transaction(async (tx) => {
    const extraOptionIds = new Map<string, string>();

    for (const categoryDef of PRINTED_MENU_CATEGORIES) {
      const category = await tx.category.upsert({
        where: {
          tenantId_slug: { tenantId, slug: categoryDef.slug },
        },
        create: {
          tenantId,
          name: categoryDef.name,
          slug: categoryDef.slug,
          sortOrder: categoryDef.sortOrder,
          image: categoryDef.image ?? null,
          active: true,
        },
        update: {
          name: categoryDef.name,
          sortOrder: categoryDef.sortOrder,
          image: categoryDef.image ?? undefined,
          active: true,
        },
      });
      categoriesUpdated += 1;

      if (categoryDef.extras?.length) {
        await tx.categoryExtraOption.deleteMany({
          where: { categoryId: category.id },
        });

        for (const [index, extra] of categoryDef.extras.entries()) {
          const key = `${extra.name}:${extra.priceModifier}`;
          let extraOptionId = extraOptionIds.get(key);

          if (!extraOptionId) {
            const existing = await tx.extraOption.findFirst({
              where: { tenantId, name: extra.name, priceModifier: extra.priceModifier },
              select: { id: true },
            });

            if (existing) {
              extraOptionId = existing.id;
            } else {
              const created = await tx.extraOption.create({
                data: {
                  tenantId,
                  name: extra.name,
                  priceModifier: extra.priceModifier,
                  sortOrder: extraOptionIds.size,
                  active: true,
                },
              });
              extraOptionId = created.id;
            }
            extraOptionIds.set(key, extraOptionId);
          }

          await tx.categoryExtraOption.create({
            data: {
              categoryId: category.id,
              extraOptionId,
              sortOrder: index,
            },
          });
        }
      }

      const catalogNames = new Set(
        categoryDef.products.map((p) => p.name.trim().toLowerCase())
      );

      const existingProducts = await tx.product.findMany({
        where: { categoryId: category.id },
      });

      for (const [index, productDef] of categoryDef.products.entries()) {
        const match = existingProducts.find(
          (p) => p.name.trim().toLowerCase() === productDef.name.trim().toLowerCase()
        );

        if (match) {
          await tx.product.update({
            where: { id: match.id },
            data: {
              name: productDef.name,
              description: productDef.description,
              price: productDef.price,
              sortOrder: index,
              active: true,
              soldOut: false,
            },
          });
          productsUpdated += 1;
        } else {
          await tx.product.create({
            data: {
              categoryId: category.id,
              name: productDef.name,
              description: productDef.description,
              price: productDef.price,
              sortOrder: index,
              active: true,
            },
          });
          productsCreated += 1;
        }
      }

      for (const product of existingProducts) {
        if (!catalogNames.has(product.name.trim().toLowerCase())) {
          await tx.product.update({
            where: { id: product.id },
            data: { active: false },
          });
        }
      }
    }

    const staleCategories = await tx.category.findMany({
      where: {
        tenantId,
        slug: { notIn: [...PRINTED_MENU_SLUGS] },
        active: true,
      },
      select: { id: true },
    });

    for (const stale of staleCategories) {
      await tx.category.update({
        where: { id: stale.id },
        data: { active: false },
      });
      await tx.product.updateMany({
        where: { categoryId: stale.id },
        data: { active: false },
      });
    }
  });

  const productsDeactivated = await prisma.product.count({
    where: {
      category: { tenantId },
      active: false,
    },
  });

  const categoriesDeactivated = await prisma.category.count({
    where: { tenantId, active: false },
  });

  return {
    tenantId,
    categoriesUpdated,
    productsCreated,
    productsUpdated,
    productsDeactivated,
    categoriesDeactivated,
  };
}
