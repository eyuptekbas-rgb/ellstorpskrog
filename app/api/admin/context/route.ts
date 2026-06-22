import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { resolveAdminFeatures } from "@/lib/tenant/admin-features";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = await getAdminTenantId();
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        templateId: true,
        primaryColor: true,
        active: true,
        adminFeatures: true,
      },
    });

    const platformAdmin = isPlatformAdmin(session.user.role);

    return NextResponse.json({
      tenant: tenant
        ? {
            name: tenant.name,
            primaryColor: tenant.primaryColor,
            active: tenant.active,
            slug: tenant.slug,
          }
        : null,
      isPlatformAdmin: platformAdmin,
      adminFeatures: resolveAdminFeatures(tenant?.adminFeatures),
    });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Failed to load admin context" }, { status: 500 });
  }
}
