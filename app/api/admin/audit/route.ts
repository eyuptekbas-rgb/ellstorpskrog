import { NextResponse } from "next/server";
import { safeWriteOperationalAudit, type AuditCategory } from "@/lib/audit/audit-log";
import { requirePermission } from "@/lib/auth/require-permission";
import { prisma } from "@/lib/prisma";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function POST(req: Request) {
  try {
    const authz = await requirePermission("settings");
    const body = (await req.json()) as {
      category?: AuditCategory;
      action?: string;
      details?: string;
    };

    if (!body.category || !body.action) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await safeWriteOperationalAudit(
      authz.tenantId,
      authz.userId,
      body.category,
      body.action,
      body.details
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Audit write failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await requirePermission("settings");
    const tenantId = await getAdminTenantId();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);

    const logs = await prisma.staffAuditLog.findMany({
      where: {
        tenantId,
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Number.isFinite(limit) ? limit : 100,
      include: {
        actor: { select: { id: true, name: true, email: true } },
        target: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        category: log.category,
        action: log.action,
        details: log.details,
        createdAt: log.createdAt.toISOString(),
        actor: log.actor,
        target: log.target,
      })),
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Kunde inte hämta auditlogg." },
      { status: 500 }
    );
  }
}
