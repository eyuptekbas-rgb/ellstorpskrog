import { NextResponse } from "next/server";
import { ReservationStatus } from "@prisma/client";
import { requireStaffSession } from "@/lib/auth/require-staff";
import { isPrismaConnectionError } from "@/lib/db/errors";
import { prisma } from "@/lib/prisma";
import { validateReservationInput } from "@/lib/reservations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = validateReservationInput(body);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const reservation = await prisma.reservation.create({
      data: {
        ...parsed.data,
        status: ReservationStatus.NEW,
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return NextResponse.json(
        { error: "Databasen är inte tillgänglig just nu." },
        { status: 503 }
      );
    }

    console.error("POST /api/reservations error:", error);
    return NextResponse.json(
      { error: "Kunde inte spara reservationen." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { response } = await requireStaffSession();
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");

    const statusWhere =
      status && Object.values(ReservationStatus).includes(status as ReservationStatus)
        ? { status: status as ReservationStatus }
        : {};

    const reservations = await prisma.reservation.findMany({
      where: {
        ...statusWhere,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ date: "asc" }, { time: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(reservations);
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return NextResponse.json([], { status: 200 });
    }

    console.error("GET /api/reservations error:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta reservationer." },
      { status: 500 }
    );
  }
}
