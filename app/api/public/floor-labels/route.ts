import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePublicTenantId } from "@/lib/tenant/resolve";
export async function GET() { const tenantId = await resolvePublicTenantId(); return NextResponse.json(await prisma.floorLabel.findMany({ where: { tenantId }, select: { id: true, label: true, positionX: true, positionY: true, orientation: true } })); }
