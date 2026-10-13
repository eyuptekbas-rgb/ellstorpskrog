import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function GET() {
  const tenantId = await getAdminTenantId();
  await Promise.all(["Entré", "Bar"].map((label) => prisma.floorLabel.upsert({ where: { tenantId_label: { tenantId, label } }, update: {}, create: { tenantId, label } })));
  return NextResponse.json(await prisma.floorLabel.findMany({ where: { tenantId }, orderBy: { label: "asc" } }));
}

export async function POST(req: Request) {
  try {
    const tenantId = await getAdminTenantId(); const body = await req.json(); const label = String(body.label ?? "").trim();
    if (!label) return NextResponse.json({ error: "Ange etikett." }, { status: 400 });
    const orientation = body.orientation === "VERTICAL" ? "VERTICAL" : "HORIZONTAL";
    return NextResponse.json(await prisma.floorLabel.create({ data: { tenantId, label, orientation } }), { status: 201 });
  } catch (error) { return tenantApiError(error) ?? NextResponse.json({ error: "Kunde inte skapa etikett." }, { status: 500 }); }
}
