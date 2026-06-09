import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ReorderBody = {
  items: { id: string; sortOrder: number }[];
};

export async function PATCH(req: Request) {
  try {
    const body: ReorderBody = await req.json();

    if (!body.items?.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    await prisma.$transaction(
      body.items.map((item) =>
        prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("PATCH /api/categories/reorder error:", error);
    return NextResponse.json(
      { error: "Failed to reorder categories" },
      { status: 500 }
    );
  }
}
