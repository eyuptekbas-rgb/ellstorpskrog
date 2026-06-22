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
    select: { email: true },
  });

  if (!user) return unauthorizedResponse();

  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      OR: [{ userId: session.user.id }, { customerEmail: user.email }],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      orderType: true,
      createdAt: true,
      items: {
        select: { productName: true, quantity: true },
        take: 3,
      },
    },
  });

  return NextResponse.json({ orders });
}
