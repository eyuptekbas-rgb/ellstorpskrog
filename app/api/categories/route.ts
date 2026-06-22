import { NextResponse } from "next/server";
import { uniqueCategorySlug } from "@/lib/categories";
import { isPrismaConnectionError } from "@/lib/db/errors";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const admin = searchParams.get("admin") === "true";
    const tenantId = admin
      ? await getAdminTenantId()
      : await resolvePublicTenantId();

    const categories = await prisma.category.findMany({
      where: admin ? { tenantId } : { active: true, tenantId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: true, extraOptions: true } },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
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
  icon?: string | null;
  active?: boolean;
  sortOrder?: number;
};

export async function POST(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const body: CreateCategoryBody = await req.json();
    const { name, slug, image, icon, active, sortOrder } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const finalSlug = slug?.trim()
      ? slug.trim().toLowerCase()
      : await uniqueCategorySlug(name, tenantId);

    const existing = await prisma.category.findUnique({
      where: { tenantId_slug: { tenantId, slug: finalSlug } },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const maxOrder = await prisma.category.aggregate({
      where: { tenantId },
      _max: { sortOrder: true },
    });
    const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const category = await prisma.category.create({
      data: {
        tenantId,
        name: name.trim(),
        slug: finalSlug,
        image: image || null,
        icon: icon || null,
        active: active ?? true,
        sortOrder: sortOrder ?? nextOrder,
      },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
