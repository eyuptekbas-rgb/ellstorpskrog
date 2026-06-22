import { NextResponse } from "next/server";
import {
  extraOptionInclude,
  serializeExtraOption,
  syncExtraOptionCategories,
  type ExtraOptionInput,
} from "@/lib/extra-options";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function GET() {
  try {
    const tenantId = await getAdminTenantId();
    const options = await prisma.extraOption.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
      include: extraOptionInclude,
    });

    return NextResponse.json(options.map(serializeExtraOption));
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("GET /api/extra-options error:", error);
    return NextResponse.json(
      { error: "Failed to fetch extra options" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const body: ExtraOptionInput = await req.json();
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const priceModifier = Math.max(0, Math.round(body.priceModifier ?? 0));
    const maxOrder = await prisma.extraOption.aggregate({
      where: { tenantId },
      _max: { sortOrder: true },
    });

    const option = await prisma.extraOption.create({
      data: {
        tenantId,
        name,
        priceModifier,
        sortOrder: body.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
        active: body.active ?? true,
      },
      include: extraOptionInclude,
    });

    if (body.categoryIds?.length) {
      await syncExtraOptionCategories(option.id, body.categoryIds, tenantId);
    }

    const refreshed = await prisma.extraOption.findUnique({
      where: { id: option.id },
      include: extraOptionInclude,
    });

    return NextResponse.json(
      serializeExtraOption(refreshed ?? option),
      { status: 201 }
    );
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("POST /api/extra-options error:", error);
    if (error instanceof Error && error.message === "Category not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to create extra option" },
      { status: 500 }
    );
  }
}
