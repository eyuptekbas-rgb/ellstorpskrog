import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const zones = await prisma.deliveryZone.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(zones);
  } catch (error) {
    console.error("GET /api/delivery-zones error:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery zones" },
      { status: 500 }
    );
  }
}

type CreateZoneBody = {
  name: string;
  postalCodes: string;
  deliveryFee?: number;
  minimumOrder?: number;
};

export async function POST(req: Request) {
  try {
    const body: CreateZoneBody = await req.json();
    const { name, postalCodes, deliveryFee, minimumOrder } = body;

    if (!name?.trim() || !postalCodes?.trim()) {
      return NextResponse.json(
        { error: "Name and postal codes are required" },
        { status: 400 }
      );
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        name: name.trim(),
        postalCodes: postalCodes.trim(),
        deliveryFee: Math.max(0, Number(deliveryFee) || 0),
        minimumOrder: Math.max(0, Number(minimumOrder) || 0),
      },
    });

    return NextResponse.json(zone, { status: 201 });
  } catch (error) {
    console.error("POST /api/delivery-zones error:", error);
    return NextResponse.json(
      { error: "Failed to create delivery zone" },
      { status: 500 }
    );
  }
}
