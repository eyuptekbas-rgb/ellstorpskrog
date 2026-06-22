import { NextResponse } from "next/server";
import { DEFAULT_TENANT_SLUG, TENANT_COOKIE } from "@/lib/tenant/resolve";
import { requirePlatformAdmin } from "@/lib/tenant/auth";
import { parseAdminFeaturesInput } from "@/lib/tenant/admin-features";
import { prisma } from "@/lib/prisma";
import { getTemplate, isValidTemplateId } from "@/lib/tenant/templates";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, tenant });
    response.cookies.set(TENANT_COOKIE, tenant.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to select tenant" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    if (
      existing.slug === DEFAULT_TENANT_SLUG &&
      body.active === false
    ) {
      return NextResponse.json(
        { error: "Huvudkunden Ellstorps Krog kan inte pausas" },
        { status: 403 }
      );
    }

    const adminFeatures = parseAdminFeaturesInput(body.adminFeatures);
    if (body.adminFeatures !== undefined && adminFeatures === null) {
      return NextResponse.json(
        { error: "Invalid adminFeatures payload" },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.templateId !== undefined &&
          isValidTemplateId(body.templateId) && { templateId: body.templateId }),
        ...(body.primaryColor !== undefined && {
          primaryColor: body.primaryColor.trim(),
        }),
        ...(body.active !== undefined && { active: Boolean(body.active) }),
        ...(adminFeatures !== null && { adminFeatures }),
      },
    });

    return NextResponse.json({
      ...tenant,
      templateName: getTemplate(tenant.templateId).name,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json({ error: "Kunden hittades inte" }, { status: 404 });
    }

    if (tenant.slug === DEFAULT_TENANT_SLUG) {
      return NextResponse.json(
        { error: "Huvudkunden Ellstorps Krog kan inte tas bort" },
        { status: 403 }
      );
    }

    await prisma.tenant.delete({ where: { id } });

    const response = NextResponse.json({ success: true, deletedId: id });
    const cookieStore = await import("next/headers").then((m) => m.cookies());
    const activeCookie = cookieStore.get(TENANT_COOKIE)?.value;
    if (activeCookie === id) {
      response.cookies.delete(TENANT_COOKIE);
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/platform/tenants/[id] error:", error);
    return NextResponse.json({ error: "Kunde inte ta bort kunden" }, { status: 500 });
  }
}
