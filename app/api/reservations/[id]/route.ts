import { NextResponse } from "next/server";
import { ReservationStatus } from "@prisma/client";
import { requireStaffSession } from "@/lib/auth/require-staff";
import { isPrismaConnectionError } from "@/lib/db/errors";
import {
  assignReservationTable,
  updateReservationStatus,
} from "@/lib/reservations/admin-service";
import { findTenantReservation } from "@/lib/tenant/scope";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { response } = await requireStaffSession();
  if (response) return response;

  try {
    const tenantId = await getAdminTenantId();
    const { id } = await params;
    const body = await req.json();

    const existing = await findTenantReservation(id, tenantId);
    if (!existing) {
      return NextResponse.json(
        { error: "Reservationen hittades inte." },
        { status: 404 }
      );
    }

    if (body.tableId !== undefined) {
      const tableId =
        body.tableId === null || body.tableId === ""
          ? null
          : String(body.tableId);
      const reservation = await assignReservationTable(tenantId, id, tableId);
      if (!reservation) {
        return NextResponse.json({ error: "Kunde inte tilldela bord." }, { status: 400 });
      }
      return NextResponse.json(reservation);
    }

    const status = body.status as ReservationStatus;
    if (!status || !Object.values(ReservationStatus).includes(status)) {
      return NextResponse.json({ error: "Ogiltig status." }, { status: 400 });
    }

    const reservation = await updateReservationStatus(tenantId, id, status);
    if (!reservation) {
      return NextResponse.json(
        { error: "Reservationen hittades inte." },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    if (isPrismaConnectionError(error)) {
      return NextResponse.json(
        { error: "Databasen är inte tillgänglig." },
        { status: 503 }
      );
    }

    console.error("PATCH /api/reservations/[id] error:", error);
    return NextResponse.json(
      { error: "Kunde inte uppdatera reservationen." },
      { status: 500 }
    );
  }
}
