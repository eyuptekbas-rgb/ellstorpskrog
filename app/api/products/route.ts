import { NextResponse } from "next/server";
import { isPrismaConnectionError } from "@/lib/db/errors";
import {
  adminMenuProductInclude,
  productPayloadFromDraft,
  serializeAdminProduct,
} from "@/lib/admin/menu-serialize";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function GET(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("categoryId");
    const availability = searchParams.get("availability");
    const soldOut = searchParams.get("soldOut");

    const products = await prisma.product.findMany({
      where: {
        category: { tenantId },
        ...(categoryId && categoryId !== "all"
          ? { categoryId }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { ingredients: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(availability === "available"
          ? { active: true, hidden: false }
          : availability === "unavailable"
            ? { OR: [{ active: false }, { hidden: true }] }
            : {}),
        ...(soldOut === "sold"
          ? { soldOut: true }
          : soldOut === "in_stock"
            ? { soldOut: false }
            : {}),
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: {
        category: { select: { id: true, name: true, slug: true } },
        ...adminMenuProductInclude,
      },
    });

    return NextResponse.json(
      products.map((product) => ({
        ...serializeAdminProduct(product),
        category: product.category,
        createdAt: product.createdAt,
      }))
    );
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
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
  ingredients?: string;
  allergens?: string;
  price: number;
  campaignPrice?: number | null;
  campaignStart?: string | null;
  campaignEnd?: string | null;
  image?: string | null;
  categoryId: string;
  active?: boolean;
  hidden?: boolean;
  soldOut?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  spicyLevel?: number;
};

export async function POST(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const body: CreateProductBody = await req.json();
    const { name, description, price, categoryId } = body;

    if (!name || !description || price == null || !categoryId) {
      return NextResponse.json(
        { error: "Fyll i namn, beskrivning, pris och kategori" },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, tenantId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Kategorin hittades inte — skapa en kategori först" },
        { status: 404 }
      );
    }

    const maxOrder = await prisma.product.aggregate({
      where: { categoryId },
      _max: { sortOrder: true },
    });

    const product = await prisma.product.create({
      data: {
        ...productPayloadFromDraft(body),
        name,
        description,
        price: Math.round(price),
        categoryId,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        active: body.active ?? true,
        soldOut: body.soldOut ?? false,
        hidden: body.hidden ?? false,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        ...adminMenuProductInclude,
      },
    });

    return NextResponse.json(
      {
        ...serializeAdminProduct(product),
        category: product.category,
        createdAt: product.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
