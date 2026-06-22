import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/account/phone";
import {
  requireCustomerSession,
  unauthorizedResponse,
} from "@/lib/auth/customer";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireCustomerSession();
  if (!session) return unauthorizedResponse();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      postalCode: true,
      city: true,
      loyaltyPoints: true,
      addresses: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Konto hittades inte" }, { status: 404 });
  }

  return NextResponse.json({ profile: user });
}

export async function PATCH(req: Request) {
  const session = await requireCustomerSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = normalizePhone(String(body.phone ?? "").trim());
    const address = String(body.address ?? "").trim();
    const postalCode = String(body.postalCode ?? "").trim();
    const city = String(body.city ?? "").trim();

    if (!firstName || !lastName || !email || !phone || !address || !postalCode || !city) {
      return NextResponse.json(
        { error: "Alla fält måste fyllas i" },
        { status: 400 }
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: session.user.id },
        data: {
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          email,
          phone,
          address,
          postalCode,
          city,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          postalCode: true,
          city: true,
          loyaltyPoints: true,
        },
      });

      await tx.customerAddress.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { address, postalCode, city },
      });

      return updated;
    });

    return NextResponse.json({ profile: user });
  } catch (error) {
    console.error("[account/profile PATCH]", error);
    return NextResponse.json(
      { error: "Kunde inte uppdatera profil" },
      { status: 500 }
    );
  }
}
