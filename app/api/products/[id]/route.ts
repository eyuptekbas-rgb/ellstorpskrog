import { NextResponse } from "next/server";
import { deleteProductImageFiles } from "@/lib/images/storage";
import { prisma } from "@/lib/prisma";

type UpdateProductBody = {
  name?: string;
  description?: string;
  price?: number;
  image?: string | null;
  categoryId?: string;
  active?: boolean;
  soldOut?: boolean;
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateProductBody = await req.json();

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (body.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: body.categoryId },
      });
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

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.price !== undefined && { price: Math.round(body.price) }),
        ...(body.image !== undefined && { image: body.image || null }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.active !== undefined && { active: body.active }),
        ...(body.soldOut !== undefined && { soldOut: body.soldOut }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
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
    const { id } = await params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    await deleteProductImageFiles(existing.image);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
