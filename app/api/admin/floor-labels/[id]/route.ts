import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId } from "@/lib/tenant/admin-api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getAdminTenantId(); const { id } = await params; const body = await req.json(); const data: Record<string, unknown> = {};
  if (body.label !== undefined) data.label = String(body.label).trim();
  if (body.orientation !== undefined) data.orientation = body.orientation === "VERTICAL" ? "VERTICAL" : "HORIZONTAL";
  for (const key of ["positionX", "positionY"] as const) if (body[key] !== undefined) { const value = Number(body[key]); if (!Number.isFinite(value) || value < 0 || value > 1) return NextResponse.json({ error: "Ogiltig position." }, { status: 400 }); data[key] = value; }
  const result = await prisma.floorLabel.updateMany({ where: { id, tenantId }, data });
  return result.count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Etiketten hittades inte." }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getAdminTenantId(); const { id } = await params; const result = await prisma.floorLabel.deleteMany({ where: { id, tenantId } });
  return result.count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Etiketten hittades inte." }, { status: 404 });
}
