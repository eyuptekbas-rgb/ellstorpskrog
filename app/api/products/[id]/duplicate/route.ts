import { NextResponse } from "next/server";
import {
  adminMenuProductInclude,
  serializeAdminProduct,
} from "@/lib/admin/menu-serialize";
import { prisma } from "@/lib/prisma";
import { requireTenantScope } from "@/lib/tenant/scope";
import { tenantApiError } from "@/lib/tenant/admin-api";

async function duplicateOptionGroups(
  sourceProductId: string,
  targetProductId: string
) {
  const groups = await prisma.productOptionGroup.findMany({
    where: { productId: sourceProductId },
    include: { options: true },
    orderBy: { sortOrder: "asc" },
  });

  for (const group of groups) {
    const createdGroup = await prisma.productOptionGroup.create({
      data: {
        productId: targetProductId,
        name: group.name,
        required: group.required,
        minSelect: group.minSelect,
        maxSelect: group.maxSelect,
        sortOrder: group.sortOrder,
      },
    });

    if (group.options.length > 0) {
      await prisma.productOptionItem.createMany({
        data: group.options.map((option) => ({
          groupId: createdGroup.id,
          name: option.name,
          priceModifier: option.priceModifier,
          sortOrder: option.sortOrder,
        })),
      });
    }
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await requireTenantScope();
    const { id } = await params;

    const existing = await prisma.product.findFirst({
      where: { id, category: { tenantId } },
      include: adminMenuProductInclude,
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const maxOrder = await prisma.product.aggregate({
      where: { categoryId: existing.categoryId },
      _max: { sortOrder: true },
    });

    const duplicate = await prisma.product.create({
      data: {
        categoryId: existing.categoryId,
        name: `${existing.name} (kopia)`,
        description: existing.description,
        ingredients: existing.ingredients,
        allergens: existing.allergens,
        price: existing.price,
        campaignPrice: existing.campaignPrice,
        campaignStart: existing.campaignStart,
        campaignEnd: existing.campaignEnd,
        image: existing.image,
        active: false,
        hidden: existing.hidden,
        soldOut: false,
        isPopular: existing.isPopular,
        isNew: existing.isNew,
        isVegetarian: existing.isVegetarian,
        isGlutenFree: existing.isGlutenFree,
        spicyLevel: existing.spicyLevel,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    await duplicateOptionGroups(existing.id, duplicate.id);

    const refreshed = await prisma.product.findUnique({
      where: { id: duplicate.id },
      include: adminMenuProductInclude,
    });

    return NextResponse.json(serializeAdminProduct(refreshed!), {
      status: 201,
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("POST /api/products/[id]/duplicate error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate product" },
      { status: 500 }
    );
  }
}
