import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { TENANT_COOKIE } from "@/lib/tenant/resolve";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isPlatformAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await import("next/headers").then((m) => m.cookies());
  const activeTenantId = cookieStore.get(TENANT_COOKIE)?.value ?? null;

  let activeTenant = null;
  if (activeTenantId) {
    activeTenant = await prisma.tenant.findUnique({
      where: { id: activeTenantId },
      select: { id: true, name: true, slug: true, primaryColor: true },
    });
  }

  return NextResponse.json({ activeTenant });
}
