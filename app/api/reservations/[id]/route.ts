import { NextResponse } from "next/server";
import { ReservationStatus } from "@prisma/client";
import { requireStaffSession } from "@/lib/auth/require-staff";
import { isPrismaConnectionError } from "@/lib/db/errors";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { response } = await requireStaffSession();
  if (response) return response;

  try {
    const { id } = await params;
    const body = await req.json();
    const status = body.status as ReservationStatus;

    if (!Object.values(ReservationStatus).includes(status)) {
      return NextResponse.json({ error: "Ogiltig status." }, { status: 400 });
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(reservation);
  } catch (error) {
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
