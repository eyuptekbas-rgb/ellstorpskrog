import { NextResponse } from "next/server";
import { uniqueCategorySlug } from "@/lib/categories";
import { isPrismaConnectionError } from "@/lib/db/errors";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const admin = searchParams.get("admin") === "true";

    const categories = await prisma.category.findMany({
      where: admin ? undefined : { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);
    if (isPrismaConnectionError(error)) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

type CreateCategoryBody = {
  name: string;
  slug?: string;
  image?: string | null;
  active?: boolean;
  sortOrder?: number;
};

export async function POST(req: Request) {
  try {
    const body: CreateCategoryBody = await req.json();
    const { name, slug, image, active, sortOrder } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const finalSlug = slug?.trim()
      ? slug.trim().toLowerCase()
      : await uniqueCategorySlug(name);

    const existing = await prisma.category.findUnique({
      where: { slug: finalSlug },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const maxOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });
    const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        image: image || null,
        active: active ?? true,
        sortOrder: sortOrder ?? nextOrder,
      },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
