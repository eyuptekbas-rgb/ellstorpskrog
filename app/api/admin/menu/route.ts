import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  adminMenuProductInclude,
  serializeAdminMenuCategories,
} from "@/lib/admin/menu-serialize";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function GET(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("categoryId");
    const availability = searchParams.get("availability");
    const soldOut = searchParams.get("soldOut");

    const productWhere: Prisma.ProductWhereInput = {};

    const andParts: Prisma.ProductWhereInput[] = [];

    if (search) {
      andParts.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { ingredients: { contains: search, mode: "insensitive" } },
          { allergens: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (availability === "available") {
      andParts.push({ active: true, hidden: false });
    } else if (availability === "unavailable") {
      andParts.push({ OR: [{ active: false }, { hidden: true }] });
    }

    if (soldOut === "sold") {
      andParts.push({ soldOut: true });
    } else if (soldOut === "in_stock") {
      andParts.push({ soldOut: false });
    }

    if (andParts.length > 0) {
      productWhere.AND = andParts;
    }

    const categories = await prisma.category.findMany({
      where: {
        tenantId,
        ...(categoryId && categoryId !== "all" ? { id: categoryId } : {}),
      },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: true, extraOptions: true } },
        products: {
          where: productWhere,
          orderBy: { sortOrder: "asc" },
          include: adminMenuProductInclude,
        },
      },
    });

    return NextResponse.json(serializeAdminMenuCategories(categories));
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("GET /api/admin/menu error:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}
