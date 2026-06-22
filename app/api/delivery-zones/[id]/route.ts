import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

type RouteContext = { params: Promise<{ id: string }> };

type UpdateZoneBody = {
  name?: string;
  postalCodes?: string;
  deliveryFee?: number;
  minimumOrder?: number;
};

export async function PUT(req: Request, context: RouteContext) {
  try {
    const tenantId = await getAdminTenantId();
    const { id } = await context.params;
    const body: UpdateZoneBody = await req.json();

    const existing = await prisma.deliveryZone.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    const zone = await prisma.deliveryZone.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.postalCodes !== undefined && {
          postalCodes: body.postalCodes.trim(),
        }),
        ...(body.deliveryFee !== undefined && {
          deliveryFee: Math.max(0, Number(body.deliveryFee) || 0),
        }),
        ...(body.minimumOrder !== undefined && {
          minimumOrder: Math.max(0, Number(body.minimumOrder) || 0),
        }),
      },
    });

    return NextResponse.json(zone);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("PUT /api/delivery-zones/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update delivery zone" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const tenantId = await getAdminTenantId();
    const { id } = await context.params;

    const existing = await prisma.deliveryZone.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    await prisma.deliveryZone.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("DELETE /api/delivery-zones/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete delivery zone" },
      { status: 500 }
    );
  }
}
