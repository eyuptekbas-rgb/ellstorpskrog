import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantScope } from "@/lib/tenant/scope";
import { tenantApiError } from "@/lib/tenant/admin-api";

type ReorderBody = {
  items: { id: string; sortOrder: number }[];
};

export async function PATCH(req: Request) {
  try {
    const reorderModeEnabled =
      req.headers.get("x-menu-reorder-mode") === "enabled";
    if (!reorderModeEnabled) {
      return NextResponse.json(
        { error: "Reorder mode is required" },
        { status: 403 }
      );
    }

    const tenantId = await requireTenantScope();
    const body: ReorderBody = await req.json();

    if (!body.items?.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const ids = body.items.map((item) => item.id);
    const owned = await prisma.category.findMany({
      where: { id: { in: ids }, tenantId },
      select: { id: true },
    });

    if (owned.length !== ids.length) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
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
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(categories);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("PATCH /api/categories/reorder error:", error);
    return NextResponse.json(
      { error: "Failed to reorder categories" },
      { status: 500 }
    );
  }
}
