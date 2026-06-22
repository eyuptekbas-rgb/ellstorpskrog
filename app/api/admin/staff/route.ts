import { NextResponse } from "next/server";
import { inviteStaffMember, listStaff } from "@/lib/staff/staff-service";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  STAFF_JOB_ROLES,
  STAFF_PERMISSION_KEYS,
  type StaffJobRoleKey,
  type StaffPermission,
} from "@/lib/staff/permissions";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requirePermission("staff");
    const tenantId = await getAdminTenantId();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || undefined;
    const result = await listStaff(tenantId, search);
    return NextResponse.json(result);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte hämta personal." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: actorUserId } = await requirePermission("staff");
    const tenantId = await getAdminTenantId();
    const body = await req.json();
    const name = body.name?.trim();
    const email = body.email?.trim();
    const staffJobRole = body.staffJobRole as StaffJobRoleKey;

    if (!name || !email || !STAFF_JOB_ROLES.includes(staffJobRole)) {
      return NextResponse.json({ error: "Ogiltiga uppgifter." }, { status: 400 });
    }

    const permissions = Array.isArray(body.permissions)
      ? body.permissions.filter(
          (p: unknown): p is StaffPermission =>
            typeof p === "string" && STAFF_PERMISSION_KEYS.includes(p as StaffPermission)
        )
      : undefined;

    const result = await inviteStaffMember(tenantId, actorUserId, {
      name,
      email,
      phone: body.phone,
      staffJobRole,
      customRoleLabel: body.customRoleLabel,
      permissions,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return NextResponse.json({ error: "E-postadressen används redan." }, { status: 409 });
    }
    return NextResponse.json({ error: "Kunde inte bjuda in personal." }, { status: 500 });
  }
}
