import { UserRole, type Prisma } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { publishStaffUpdated } from "@/lib/realtime/publish";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ROLE_PERMISSIONS,
  type StaffJobRoleKey,
  type StaffPermission,
  type StaffStatusKey,
  parsePermissions,
  permissionsForRole,
} from "@/lib/staff/permissions";

const STAFF_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.STAFF];

export type StaffListItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  staffJobRole: StaffJobRoleKey | null;
  customRoleLabel: string | null;
  staffStatus: StaffStatusKey | null;
  permissions: StaffPermission[];
  lastLoginAt: string | null;
  createdAt: string;
  isOnline: boolean;
};

export type StaffDashboardStats = {
  staffOnline: number;
  activeSessions: number;
  recentLogins: StaffListItem[];
};

export type StaffProfileDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  staffJobRole: StaffJobRoleKey | null;
  customRoleLabel: string | null;
  staffStatus: StaffStatusKey | null;
  permissions: StaffPermission[];
  lastLoginAt: string | null;
  createdAt: string;
  twoFactorEnabled: boolean;
  notes: { id: string; body: string; createdAt: string; updatedAt: string }[];
  loginHistory: {
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
  }[];
  auditLog: {
    id: string;
    category: string;
    action: string;
    details: string | null;
    createdAt: string;
  }[];
  activity: {
    id: string;
    type: "login" | "admin" | "order" | "reservation";
    title: string;
    subtitle?: string;
    at: string;
  }[];
};

function staffWhere(tenantId: string): Prisma.UserWhereInput {
  return {
    tenantId,
    role: { in: STAFF_ROLES },
  };
}

function serializeStaff(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  staffJobRole: string | null;
  customRoleLabel: string | null;
  staffStatus: string | null;
  permissions: unknown;
  lastLoginAt: Date | null;
  createdAt: Date;
}): StaffListItem {
  const onlineThreshold = Date.now() - 15 * 60_000;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    staffJobRole: user.staffJobRole as StaffJobRoleKey | null,
    customRoleLabel: user.customRoleLabel,
    staffStatus: user.staffStatus as StaffStatusKey | null,
    permissions: parsePermissions(user.permissions),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    isOnline: !!user.lastLoginAt && user.lastLoginAt.getTime() >= onlineThreshold,
  };
}

export async function logStaffLogin(
  userId: string,
  tenantId: string | null,
  meta?: { ipAddress?: string; userAgent?: string }
) {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    }),
    prisma.staffLoginEvent.create({
      data: {
        userId,
        tenantId,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      },
    }),
  ]);

  if (tenantId) {
    publishStaffUpdated(tenantId, userId);
    await writeStaffAudit(tenantId, userId, "security", "Login").catch(() => undefined);
  }
}

export async function writeStaffAudit(
  tenantId: string | null,
  actorUserId: string,
  category: string,
  action: string,
  targetUserId?: string,
  details?: string
) {
  await prisma.staffAuditLog.create({
    data: {
      tenantId,
      actorUserId,
      targetUserId: targetUserId ?? null,
      category,
      action,
      details: details ?? null,
    },
  });
}

export async function listStaff(
  tenantId: string,
  search?: string
): Promise<{ staff: StaffListItem[]; stats: StaffDashboardStats }> {
  const users = await prisma.user.findMany({
    where: {
      ...staffWhere(tenantId),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ staffStatus: "asc" }, { name: "asc" }],
  });

  const staff = users.map(serializeStaff);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60_000);

  const [onlineCount, sessionCount, recentLoginUsers] = await Promise.all([
    prisma.user.count({
      where: {
        ...staffWhere(tenantId),
        staffStatus: "ACTIVE",
        lastLoginAt: { gte: new Date(Date.now() - 15 * 60_000) },
      },
    }),
    prisma.staffLoginEvent.count({
      where: { tenantId, createdAt: { gte: dayAgo } },
    }),
    prisma.user.findMany({
      where: {
        ...staffWhere(tenantId),
        lastLoginAt: { not: null },
      },
      orderBy: { lastLoginAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    staff,
    stats: {
      staffOnline: onlineCount,
      activeSessions: sessionCount,
      recentLogins: recentLoginUsers.map(serializeStaff),
    },
  };
}

export async function getStaffProfile(
  tenantId: string,
  userId: string
): Promise<StaffProfileDetail | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, ...staffWhere(tenantId) },
    include: {
      staffNotes: { orderBy: { updatedAt: "desc" } },
      loginEvents: { orderBy: { createdAt: "desc" }, take: 30 },
      auditLogsAsTarget: { orderBy: { createdAt: "desc" }, take: 40 },
    },
  });
  if (!user) return null;

  const activity: StaffProfileDetail["activity"] = [];

  for (const login of user.loginEvents) {
    activity.push({
      id: `login-${login.id}`,
      type: "login",
      title: "Inloggning",
      subtitle: login.ipAddress ?? undefined,
      at: login.createdAt.toISOString(),
    });
  }

  for (const log of user.auditLogsAsTarget) {
    const type =
      log.category === "order"
        ? "order"
        : log.category === "reservation"
          ? "reservation"
          : "admin";
    activity.push({
      id: `audit-${log.id}`,
      type,
      title: log.action,
      subtitle: log.details ?? undefined,
      at: log.createdAt.toISOString(),
    });
  }

  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    staffJobRole: user.staffJobRole as StaffJobRoleKey | null,
    customRoleLabel: user.customRoleLabel,
    staffStatus: user.staffStatus as StaffStatusKey | null,
    permissions: parsePermissions(user.permissions),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    twoFactorEnabled: user.twoFactorEnabled,
    notes: user.staffNotes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
    loginHistory: user.loginEvents.map((e) => ({
      id: e.id,
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
      createdAt: e.createdAt.toISOString(),
    })),
    auditLog: user.auditLogsAsTarget.map((l) => ({
      id: l.id,
      category: l.category,
      action: l.action,
      details: l.details,
      createdAt: l.createdAt.toISOString(),
    })),
    activity,
  };
}

function generateTempPassword() {
  return `Ek${Math.random().toString(36).slice(2, 10)}!`;
}

export async function inviteStaffMember(
  tenantId: string,
  actorUserId: string,
  data: {
    name: string;
    email: string;
    phone?: string;
    staffJobRole: StaffJobRoleKey;
    customRoleLabel?: string;
    permissions?: StaffPermission[];
  }
) {
  const email = data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("EMAIL_EXISTS");
  }

  const tempPassword = generateTempPassword();
  const permissions = permissionsForRole(data.staffJobRole, data.permissions);
  const userRole = data.staffJobRole === "OWNER" ? UserRole.ADMIN : UserRole.STAFF;

  const user = await prisma.user.create({
    data: {
      email,
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      role: userRole,
      tenantId,
      passwordHash: await hashPassword(tempPassword),
      staffJobRole: data.staffJobRole,
      customRoleLabel:
        data.staffJobRole === "CUSTOM" ? data.customRoleLabel?.trim() || "Anpassad" : null,
      staffStatus: "INVITED",
      permissions,
    },
  });

  await writeStaffAudit(
    tenantId,
    actorUserId,
    "staff",
    "Bjöd in personal",
    user.id,
    email
  );
  if (tenantId) publishStaffUpdated(tenantId, user.id);

  return { user: serializeStaff(user), tempPassword };
}

export async function updateStaffMember(
  tenantId: string,
  actorUserId: string,
  userId: string,
  data: Partial<{
    name: string;
    phone: string | null;
    staffJobRole: StaffJobRoleKey;
    customRoleLabel: string | null;
    staffStatus: StaffStatusKey;
    permissions: StaffPermission[];
    twoFactorEnabled: boolean;
  }>
) {
  const existing = await prisma.user.findFirst({
    where: { id: userId, ...staffWhere(tenantId) },
  });
  if (!existing) return null;

  const jobRole = (data.staffJobRole ?? existing.staffJobRole) as StaffJobRoleKey | null;
  const permissions =
    data.permissions ??
    (jobRole ? permissionsForRole(jobRole, parsePermissions(existing.permissions)) : undefined);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.staffJobRole !== undefined ? { staffJobRole: data.staffJobRole } : {}),
      ...(data.customRoleLabel !== undefined ? { customRoleLabel: data.customRoleLabel } : {}),
      ...(data.staffStatus !== undefined ? { staffStatus: data.staffStatus } : {}),
      ...(permissions !== undefined ? { permissions } : {}),
      ...(data.twoFactorEnabled !== undefined
        ? { twoFactorEnabled: data.twoFactorEnabled }
        : {}),
      ...(data.staffJobRole === "OWNER" ? { role: UserRole.ADMIN } : {}),
    },
  });

  await writeStaffAudit(tenantId, actorUserId, "staff", "Uppdaterade personal", userId);
  if (tenantId) publishStaffUpdated(tenantId, userId);
  return serializeStaff(user);
}

export async function activateStaff(
  tenantId: string,
  actorUserId: string,
  userId: string
) {
  return updateStaffMember(tenantId, actorUserId, userId, { staffStatus: "ACTIVE" });
}

export async function deactivateStaff(
  tenantId: string,
  actorUserId: string,
  userId: string
) {
  const user = await updateStaffMember(tenantId, actorUserId, userId, {
    staffStatus: "INACTIVE",
  });
  if (user) {
    await prisma.user.update({
      where: { id: userId },
      data: { forceLogoutBefore: new Date() },
    });
  }
  return user;
}

export async function deleteStaffMember(
  tenantId: string,
  actorUserId: string,
  userId: string
) {
  const existing = await prisma.user.findFirst({
    where: { id: userId, ...staffWhere(tenantId) },
  });
  if (!existing) return false;
  if (existing.id === actorUserId) {
    throw new Error("SELF_DELETE");
  }

  await writeStaffAudit(
    tenantId,
    actorUserId,
    "staff",
    "Raderade personal",
    userId,
    existing.email
  );
  await prisma.user.delete({ where: { id: userId } });
  return true;
}

export async function forceLogoutStaff(
  tenantId: string,
  actorUserId: string,
  userId: string
) {
  const existing = await prisma.user.findFirst({
    where: { id: userId, ...staffWhere(tenantId) },
  });
  if (!existing) return null;

  await prisma.user.update({
    where: { id: userId },
    data: { forceLogoutBefore: new Date() },
  });
  await writeStaffAudit(tenantId, actorUserId, "security", "Tvingade utloggning", userId);
  return serializeStaff({ ...existing, lastLoginAt: existing.lastLoginAt });
}

export async function resetStaffPassword(
  tenantId: string,
  actorUserId: string,
  userId: string
) {
  const existing = await prisma.user.findFirst({
    where: { id: userId, ...staffWhere(tenantId) },
  });
  if (!existing) return null;

  const tempPassword = generateTempPassword();
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(tempPassword),
      forceLogoutBefore: new Date(),
    },
  });
  await writeStaffAudit(tenantId, actorUserId, "security", "Återställde lösenord", userId);
  return { tempPassword };
}

export async function createStaffNote(
  tenantId: string,
  userId: string,
  body: string
) {
  const user = await prisma.user.findFirst({
    where: { id: userId, ...staffWhere(tenantId) },
  });
  if (!user) return null;
  return prisma.staffNote.create({
    data: { userId, body: body.trim() },
  });
}

export async function updateStaffNote(tenantId: string, noteId: string, body: string) {
  const note = await prisma.staffNote.findFirst({
    where: { id: noteId, user: staffWhere(tenantId) },
  });
  if (!note) return null;
  return prisma.staffNote.update({
    where: { id: noteId },
    data: { body: body.trim() },
  });
}

export async function deleteStaffNote(tenantId: string, noteId: string) {
  const note = await prisma.staffNote.findFirst({
    where: { id: noteId, user: staffWhere(tenantId) },
  });
  if (!note) return false;
  await prisma.staffNote.delete({ where: { id: noteId } });
  return true;
}

export { DEFAULT_ROLE_PERMISSIONS, permissionsForRole };
