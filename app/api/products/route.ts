import { NextResponse } from "next/server";
import { isPrismaConnectionError } from "@/lib/db/errors";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    const products = await prisma.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    if (isPrismaConnectionError(error)) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

type CreateProductBody = {
  name: string;
  description: string;
  price: number;
  image?: string | null;
  categoryId: string;
  active?: boolean;
  soldOut?: boolean;
};

export async function POST(req: Request) {
  try {
    const body: CreateProductBody = await req.json();
    const { name, description, price, image, categoryId, active, soldOut } =
      body;

    if (!name || !description || price == null || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Math.round(price),
        image: image || null,
        categoryId,
        active: active ?? true,
        soldOut: soldOut ?? false,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
