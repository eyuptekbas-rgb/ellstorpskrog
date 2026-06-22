import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function GET(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    const products = await prisma.product.findMany({
      where: {
        category: { tenantId },
        active: true,
        hidden: false,
        soldOut: false,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      select: {
        id: true,
        name: true,
        price: true,
        soldOut: true,
        category: { select: { id: true, name: true } },
      },
      take: 200,
    });

    return NextResponse.json({
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        categoryId: product.category.id,
        categoryName: product.category.name,
        soldOut: product.soldOut,
        barcode: product.id.slice(-8),
      })),
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Catalog unavailable" }, { status: 500 });
  }
}
