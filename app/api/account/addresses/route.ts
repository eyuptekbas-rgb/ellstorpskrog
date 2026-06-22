import { NextResponse } from "next/server";
import {
  requireCustomerSession,
  unauthorizedResponse,
} from "@/lib/auth/customer";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireCustomerSession();
  if (!session) return unauthorizedResponse();

  const addresses = await prisma.customerAddress.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const session = await requireCustomerSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const label = String(body.label ?? "").trim() || null;
    const address = String(body.address ?? "").trim();
    const postalCode = String(body.postalCode ?? "").trim();
    const city = String(body.city ?? "").trim();
    const isDefault = Boolean(body.isDefault);

    if (!address || !postalCode || !city) {
      return NextResponse.json(
        { error: "Adress, postnummer och stad krävs" },
        { status: 400 }
      );
    }

    if (isDefault) {
      await prisma.customerAddress.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const created = await prisma.customerAddress.create({
      data: {
        userId: session.user.id,
        label,
        address,
        postalCode,
        city,
        isDefault,
      },
    });

    return NextResponse.json({ address: created }, { status: 201 });
  } catch (error) {
    console.error("[account/addresses POST]", error);
    return NextResponse.json(
      { error: "Kunde inte spara adress" },
      { status: 500 }
    );
  }
}
