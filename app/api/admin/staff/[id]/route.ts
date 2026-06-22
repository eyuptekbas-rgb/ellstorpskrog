import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/require-permission";
import {
  activateStaff,
  deactivateStaff,
  deleteStaffMember,
  forceLogoutStaff,
  getStaffProfile,
  resetStaffPassword,
  updateStaffMember,
} from "@/lib/staff/staff-service";
import {
  STAFF_JOB_ROLES,
  STAFF_PERMISSION_KEYS,
  type StaffJobRoleKey,
  type StaffPermission,
  type StaffStatusKey,
} from "@/lib/staff/permissions";
import { getAdminTenantId, tenantApiError } from "@/lib/tenant/admin-api";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: Params) {
  try {
    await requirePermission("staff");
    const tenantId = await getAdminTenantId();
    const { id } = await params;
    const profile = await getStaffProfile(tenantId, id);
    if (!profile) {
      return NextResponse.json({ error: "Personal hittades inte." }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte hämta profil." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { userId: actorUserId } = await requirePermission("staff");
    const tenantId = await getAdminTenantId();

    const { id } = await params;
    const body = await req.json();

    if (body.action === "activate") {
      const user = await activateStaff(tenantId, actorUserId, id);
      if (!user) return NextResponse.json({ error: "Hittades inte." }, { status: 404 });
      return NextResponse.json(await getStaffProfile(tenantId, id));
    }
    if (body.action === "deactivate") {
      const user = await deactivateStaff(tenantId, actorUserId, id);
      if (!user) return NextResponse.json({ error: "Hittades inte." }, { status: 404 });
      return NextResponse.json(await getStaffProfile(tenantId, id));
    }
    if (body.action === "force-logout") {
      await forceLogoutStaff(tenantId, actorUserId, id);
      return NextResponse.json(await getStaffProfile(tenantId, id));
    }
    if (body.action === "reset-password") {
      const result = await resetStaffPassword(tenantId, actorUserId, id);
      if (!result) return NextResponse.json({ error: "Hittades inte." }, { status: 404 });
      return NextResponse.json(result);
    }

    const staffJobRole =
      body.staffJobRole && STAFF_JOB_ROLES.includes(body.staffJobRole)
        ? (body.staffJobRole as StaffJobRoleKey)
        : undefined;

    const permissions = Array.isArray(body.permissions)
      ? body.permissions.filter(
          (p: unknown): p is StaffPermission =>
            typeof p === "string" && STAFF_PERMISSION_KEYS.includes(p as StaffPermission)
        )
      : undefined;

    const staffStatus =
      body.staffStatus === "INVITED" ||
      body.staffStatus === "ACTIVE" ||
      body.staffStatus === "INACTIVE"
        ? (body.staffStatus as StaffStatusKey)
        : undefined;

    const user = await updateStaffMember(tenantId, actorUserId, id, {
      name: body.name,
      phone: body.phone,
      staffJobRole,
      customRoleLabel: body.customRoleLabel,
      staffStatus,
      permissions,
      twoFactorEnabled:
        typeof body.twoFactorEnabled === "boolean" ? body.twoFactorEnabled : undefined,
    });

    if (!user) {
      return NextResponse.json({ error: "Personal hittades inte." }, { status: 404 });
    }

    return NextResponse.json(await getStaffProfile(tenantId, id));
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    return NextResponse.json({ error: "Kunde inte uppdatera personal." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { userId: actorUserId } = await requirePermission("staff");
    const tenantId = await getAdminTenantId();

    const { id } = await params;
    const ok = await deleteStaffMember(tenantId, actorUserId, id);
    if (!ok) {
      return NextResponse.json({ error: "Personal hittades inte." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const apiError = tenantApiError(error);
    if (apiError) return apiError;
    if (error instanceof Error && error.message === "SELF_DELETE") {
      return NextResponse.json({ error: "Du kan inte radera ditt eget konto." }, { status: 400 });
    }
    return NextResponse.json({ error: "Kunde inte radera personal." }, { status: 500 });
  }
}
