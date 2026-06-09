import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

type UpdateZoneBody = {
  name?: string;
  postalCodes?: string;
  deliveryFee?: number;
  minimumOrder?: number;
};

export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body: UpdateZoneBody = await req.json();

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
    console.error("PUT /api/delivery-zones/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update delivery zone" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await prisma.deliveryZone.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/delivery-zones/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete delivery zone" },
      { status: 500 }
    );
  }
}
