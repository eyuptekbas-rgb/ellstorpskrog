import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";

export async function GET() {
  const tenantId = await resolvePublicTenantId();
  const tables = await prisma.restaurantTable.findMany({
    where: { tenantId, active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, capacity: true, positionX: true, positionY: true },
  });
  return NextResponse.json(tables);
}
