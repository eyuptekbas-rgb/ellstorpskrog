import { NextResponse } from "next/server";
import { uniqueCategorySlug } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

type UpdateCategoryBody = {
  name?: string;
  slug?: string;
  image?: string | null;
  icon?: string | null;
  active?: boolean;
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getAdminTenantId();
    const { id } = await params;
    const body: UpdateCategoryBody = await req.json();

    const existing = await prisma.category.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    let finalSlug = existing.slug;
    if (body.slug !== undefined) {
      finalSlug = body.slug.trim().toLowerCase();
    } else if (body.name !== undefined && body.name !== existing.name) {
      finalSlug = await uniqueCategorySlug(body.name, tenantId, id);
    }

    const slugTaken = await prisma.category.findFirst({
      where: { tenantId, slug: finalSlug, NOT: { id } },
    });
    if (slugTaken) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        slug: finalSlug,
        ...(body.image !== undefined && { image: body.image || null }),
        ...(body.icon !== undefined && { icon: body.icon || null }),
        ...(body.active !== undefined && { active: body.active }),
      },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(category);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("PUT /api/categories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getAdminTenantId();
    const { id } = await params;

    const existing = await prisma.category.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
