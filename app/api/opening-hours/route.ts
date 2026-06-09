import { NextResponse } from "next/server";
import { ensureOpeningHours } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const hours = await ensureOpeningHours();
    return NextResponse.json(hours);
  } catch (error) {
    console.error("GET /api/opening-hours error:", error);
    return NextResponse.json(
      { error: "Failed to fetch opening hours" },
      { status: 500 }
    );
  }
}

type HourInput = {
  id?: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export async function PUT(req: Request) {
  try {
    const body: { hours: HourInput[] } = await req.json();
    const { hours } = body;

    if (!hours?.length) {
      return NextResponse.json(
        { error: "Hours array is required" },
        { status: 400 }
      );
    }

    await ensureOpeningHours();

    const updated = await prisma.$transaction(
      hours.map((h) =>
        prisma.openingHours.update({
          where: { dayOfWeek: h.dayOfWeek },
          data: {
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          },
        })
      )
    );

    return NextResponse.json(
      updated.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    );
  } catch (error) {
    console.error("PUT /api/opening-hours error:", error);
    return NextResponse.json(
      { error: "Failed to update opening hours" },
      { status: 500 }
    );
  }
}
