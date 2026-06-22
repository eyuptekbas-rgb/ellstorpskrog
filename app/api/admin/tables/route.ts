import { NextResponse } from "next/server";
import {
  createRestaurantTable,
  listRestaurantTables,
} from "@/lib/reservations/admin-service";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tenantId = await getAdminTenantId();
    const tables = await listRestaurantTables(tenantId);
    return NextResponse.json(tables);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte hämta bord." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const body = await req.json();
    const name = body.name?.trim();
    const capacity = Number(body.capacity);

    if (!name || !Number.isFinite(capacity) || capacity < 1 || capacity > 50) {
      return NextResponse.json(
        { error: "Ange namn och kapacitet (1–50)." },
        { status: 400 }
      );
    }

    const table = await createRestaurantTable(tenantId, { name, capacity });
    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("POST /api/admin/tables error:", error);
    return NextResponse.json({ error: "Kunde inte skapa bord." }, { status: 500 });
  }
}
