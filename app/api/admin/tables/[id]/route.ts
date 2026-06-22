import { NextResponse } from "next/server";
import { publishTableUpdated } from "@/lib/realtime/publish";
import { updateRestaurantTable } from "@/lib/reservations/admin-service";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const tenantId = await getAdminTenantId();
    const { id } = await params;
    const body = await req.json();

    const patch: Parameters<typeof updateRestaurantTable>[2] = {};

    if (typeof body.name === "string" && body.name.trim()) {
      patch.name = body.name.trim();
    }
    if (body.capacity !== undefined) {
      const capacity = Number(body.capacity);
      if (!Number.isFinite(capacity) || capacity < 1 || capacity > 50) {
        return NextResponse.json({ error: "Ogiltig kapacitet." }, { status: 400 });
      }
      patch.capacity = capacity;
    }
    if (typeof body.active === "boolean") {
      patch.active = body.active;
    }
    if (body.mergeGroupId === null || typeof body.mergeGroupId === "string") {
      patch.mergeGroupId = body.mergeGroupId;
    }

    const table = await updateRestaurantTable(tenantId, id, patch);
    if (!table) {
      return NextResponse.json({ error: "Bordet hittades inte." }, { status: 404 });
    }

    publishTableUpdated(tenantId, table.id);
    return NextResponse.json(table);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte uppdatera bord." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const tenantId = await getAdminTenantId();
    const { id } = await params;
    const table = await updateRestaurantTable(tenantId, id, { active: false });
    if (!table) {
      return NextResponse.json({ error: "Bordet hittades inte." }, { status: 404 });
    }
    publishTableUpdated(tenantId, table.id);
    return NextResponse.json(table);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte inaktivera bord." }, { status: 500 });
  }
}
