import { NextResponse } from "next/server";
import { getReservationAdminBundle } from "@/lib/reservations/admin-service";
import type { ReservationDateRange } from "@/lib/reservations/admin";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

const RANGES: ReservationDateRange[] = ["today", "tomorrow", "week", "all"];

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const tenantId = await getAdminTenantId();
    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get("range") ?? "week";
    const range = RANGES.includes(rangeParam as ReservationDateRange)
      ? (rangeParam as ReservationDateRange)
      : "week";
    const search = searchParams.get("search") ?? undefined;

    const bundle = await getReservationAdminBundle(tenantId, { range, search });
    return NextResponse.json(bundle, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    console.error("GET /api/admin/reservations error:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta reservationer." },
      { status: 500 }
    );
  }
}
