import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  parsePermissions,
  permissionsForRole,
  type StaffJobRoleKey,
  type StaffPermission,
} from "@/lib/staff/permissions";
import { requireAdminTenantId } from "@/lib/tenant/auth";

export type AuthorizedStaff = {
  userId: string;
  tenantId: string;
  role: UserRole;
};

export async function requirePermission(
  permission: StaffPermission
): Promise<AuthorizedStaff> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const tenantId = await requireAdminTenantId();
  const role = session.user.role as UserRole;

  if (role === UserRole.PLATFORM_ADMIN || role === UserRole.ADMIN) {
    return { userId: session.user.id, tenantId, role };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      permissions: true,
      staffJobRole: true,
    },
  });

  const jobRole = (user?.staffJobRole ?? "CUSTOM") as StaffJobRoleKey;
  const custom = parsePermissions(user?.permissions);
  const allowed = permissionsForRole(jobRole, custom);

  if (!allowed.includes(permission)) {
    throw new Error("FORBIDDEN");
  }

  return { userId: session.user.id, tenantId, role };
}
