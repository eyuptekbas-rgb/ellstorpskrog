import { NextResponse } from "next/server";
import {
  extraOptionInclude,
  serializeExtraOption,
  syncExtraOptionCategories,
  type ExtraOptionInput,
} from "@/lib/extra-options";
import { prisma } from "@/lib/prisma";
import { findTenantExtraOption, requireTenantScope } from "@/lib/tenant/scope";
import { tenantApiError } from "@/lib/tenant/admin-api";

type UpdateBody = Partial<ExtraOptionInput>;

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await requireTenantScope();
    const { id } = await params;
    const body: UpdateBody = await req.json();

    const existing = await findTenantExtraOption(id, tenantId);
    if (!existing) {
      return NextResponse.json({ error: "Extra option not found" }, { status: 404 });
    }

    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await prisma.extraOption.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.priceModifier !== undefined && {
          priceModifier: Math.max(0, Math.round(body.priceModifier)),
        }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.active !== undefined && { active: body.active }),
      },
    });

    if (body.categoryIds !== undefined) {
      await syncExtraOptionCategories(id, body.categoryIds, tenantId);
    }

    const refreshed = await prisma.extraOption.findFirst({
      where: { id, tenantId },
      include: extraOptionInclude,
    });

    if (!refreshed) {
      return NextResponse.json({ error: "Extra option not found" }, { status: 404 });
    }

    return NextResponse.json(serializeExtraOption(refreshed));
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("PUT /api/extra-options/[id] error:", error);
    if (error instanceof Error && error.message === "Category not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update extra option" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await requireTenantScope();
    const { id } = await params;

    const existing = await findTenantExtraOption(id, tenantId);
    if (!existing) {
      return NextResponse.json({ error: "Extra option not found" }, { status: 404 });
    }

    await prisma.extraOption.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("DELETE /api/extra-options/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete extra option" },
      { status: 500 }
    );
  }
}
