import { NextResponse } from "next/server";
import { deleteProductImageFiles } from "@/lib/images/storage";
import {
  adminMenuProductInclude,
  productPayloadFromDraft,
  serializeAdminProduct,
} from "@/lib/admin/menu-serialize";
import { prisma } from "@/lib/prisma";
import {
  findTenantCategory,
  findTenantProduct,
  requireTenantScope,
} from "@/lib/tenant/scope";
import { tenantApiError } from "@/lib/tenant/admin-api";

type UpdateProductBody = {
  name?: string;
  description?: string;
  ingredients?: string;
  allergens?: string;
  price?: number;
  campaignPrice?: number | null;
  campaignStart?: string | null;
  campaignEnd?: string | null;
  image?: string | null;
  categoryId?: string;
  active?: boolean;
  hidden?: boolean;
  soldOut?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  spicyLevel?: number;
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await requireTenantScope();
    const { id } = await params;
    const body: UpdateProductBody = await req.json();

    const existing = await findTenantProduct(id, tenantId);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (body.categoryId) {
      const category = await findTenantCategory(body.categoryId, tenantId);
      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    if (body.price != null && body.price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    if (
      body.image !== undefined &&
      body.image !== existing.image &&
      existing.image
    ) {
      await deleteProductImageFiles(existing.image);
    }

    const movingToCategory =
      body.categoryId !== undefined && body.categoryId !== existing.categoryId;

    let nextSortOrderForTarget: number | null = null;
    if (movingToCategory && body.categoryId) {
      const targetMax = await prisma.product.aggregate({
        where: { categoryId: body.categoryId },
        _max: { sortOrder: true },
      });
      nextSortOrderForTarget = (targetMax._max.sortOrder ?? -1) + 1;
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...productPayloadFromDraft(body),
        ...(movingToCategory && {
          sortOrder: nextSortOrderForTarget ?? existing.sortOrder,
        }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        ...adminMenuProductInclude,
      },
    });

    return NextResponse.json({
      ...serializeAdminProduct(product),
      category: product.category,
      createdAt: product.createdAt,
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await requireTenantScope();
    const { id } = await params;

    const existing = await findTenantProduct(id, tenantId);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    await deleteProductImageFiles(existing.image);

    return NextResponse.json({ success: true });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
