import { NextResponse } from "next/server";
import { uniqueCategorySlug } from "@/lib/categories";
import { prisma } from "@/lib/prisma";

type UpdateCategoryBody = {
  name?: string;
  slug?: string;
  image?: string | null;
  active?: boolean;
  sortOrder?: number;
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateCategoryBody = await req.json();

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    let finalSlug = existing.slug;
    if (body.slug !== undefined) {
      finalSlug = body.slug.trim().toLowerCase();
    } else if (body.name !== undefined && body.name !== existing.name) {
      finalSlug = await uniqueCategorySlug(body.name, id);
    }

    const slugTaken = await prisma.category.findFirst({
      where: { slug: finalSlug, NOT: { id } },
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
        ...(body.active !== undefined && { active: body.active }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(category);
  } catch (error) {
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
    const { id } = await params;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
