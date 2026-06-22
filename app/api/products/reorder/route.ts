import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantScope } from "@/lib/tenant/scope";
import { tenantApiError } from "@/lib/tenant/admin-api";

type ReorderBody = {
  items: { id: string; sortOrder: number; categoryId?: string }[];
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
    const owned = await prisma.product.findMany({
      where: { id: { in: ids }, category: { tenantId } },
      select: { id: true },
    });

    if (owned.length !== ids.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.$transaction(
      body.items.map((item) =>
        prisma.product.update({
          where: { id: item.id },
          data: {
            sortOrder: item.sortOrder,
            ...(item.categoryId ? { categoryId: item.categoryId } : {}),
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("PATCH /api/products/reorder error:", error);
    return NextResponse.json(
      { error: "Failed to reorder products" },
      { status: 500 }
    );
  }
}
