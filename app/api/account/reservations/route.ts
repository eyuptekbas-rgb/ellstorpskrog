import { NextResponse } from "next/server";
import {
  requireCustomerSession,
  unauthorizedResponse,
} from "@/lib/auth/customer";
import { prisma } from "@/lib/prisma";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";

export async function GET() {
  const session = await requireCustomerSession();
  if (!session) return unauthorizedResponse();

  const tenantId = await resolvePublicTenantId();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, phone: true },
  });

  if (!user) return unauthorizedResponse();

  const reservations = await prisma.reservation.findMany({
    where: {
      tenantId,
      OR: [
        { userId: session.user.id },
        { email: user.email },
        { phone: user.phone ?? undefined },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      guestCount: true,
      date: true,
      time: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ reservations });
}
