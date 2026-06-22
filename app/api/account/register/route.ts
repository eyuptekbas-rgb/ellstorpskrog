import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { parseRegisterBody } from "@/lib/account/validation";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = parseRegisterBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const data = parsed.data;
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
      select: { email: true, phone: true },
    });

    if (existing?.email === data.email) {
      return NextResponse.json(
        { error: "E-postadressen används redan" },
        { status: 409 }
      );
    }
    if (existing?.phone === data.phone) {
      return NextResponse.json(
        { error: "Telefonnumret används redan" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(data.password);
    const name = `${data.firstName} ${data.lastName}`.trim();

    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        name,
        firstName: data.firstName,
        lastName: data.lastName,
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        passwordHash,
        role: UserRole.CUSTOMER,
        addresses: {
          create: {
            label: "Hem",
            address: data.address,
            postalCode: data.postalCode,
            city: data.city,
            isDefault: true,
          },
        },
      },
      select: { id: true, email: true },
    });

    return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("[account/register]", error);
    return NextResponse.json(
      { error: "Kunde inte skapa konto" },
      { status: 500 }
    );
  }
}
