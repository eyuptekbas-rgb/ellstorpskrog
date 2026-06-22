import { NextResponse } from "next/server";
import { mergeRestaurantTables } from "@/lib/reservations/admin-service";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function POST(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const body = await req.json();
    const tableIds = Array.isArray(body.tableIds) ? body.tableIds : [];

    if (tableIds.length < 2) {
      return NextResponse.json(
        { error: "Välj minst två bord att slå ihop." },
        { status: 400 }
      );
    }

    const tables = await mergeRestaurantTables(tenantId, tableIds);
    return NextResponse.json(tables);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;

    if (error instanceof Error && error.message === "MERGE_MIN_TWO") {
      return NextResponse.json(
        { error: "Välj minst två bord att slå ihop." },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "TABLE_NOT_FOUND") {
      return NextResponse.json({ error: "Ett eller flera bord hittades inte." }, { status: 404 });
    }

    return NextResponse.json({ error: "Kunde inte slå ihop bord." }, { status: 500 });
  }
}
