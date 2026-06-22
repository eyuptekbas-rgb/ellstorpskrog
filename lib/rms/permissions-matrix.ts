import type { StaffJobRoleKey, StaffPermission } from "@/lib/staff/permissions";
import {
  DEFAULT_ROLE_PERMISSIONS,
  STAFF_PERMISSION_KEYS,
  STAFF_PERMISSION_LABELS,
} from "@/lib/staff/permissions";

/** RMS access tiers mapped to existing staff job roles. */
export type RmsTier = "ADMIN" | "MANAGER" | "STAFF";

export const RMS_TIER_LABELS: Record<RmsTier, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
};

export const RMS_TIER_ROLES: Record<RmsTier, StaffJobRoleKey[]> = {
  ADMIN: ["OWNER"],
  MANAGER: ["MANAGER"],
  STAFF: ["KITCHEN", "CASHIER", "DELIVERY", "WAITER", "CUSTOM"],
};

export function rmsTierForJobRole(jobRole: StaffJobRoleKey | null): RmsTier {
  if (!jobRole || jobRole === "OWNER") return "ADMIN";
  if (jobRole === "MANAGER") return "MANAGER";
  return "STAFF";
}

export function permissionsForTier(tier: RmsTier): StaffPermission[] {
  const role = RMS_TIER_ROLES[tier][0];
  return DEFAULT_ROLE_PERMISSIONS[role] ?? ["dashboard"];
}

export const PERMISSION_MATRIX: {
  permission: StaffPermission;
  label: string;
  admin: boolean;
  manager: boolean;
  staff: boolean;
}[] = STAFF_PERMISSION_KEYS.map((permission) => ({
  permission,
  label: STAFF_PERMISSION_LABELS[permission],
  admin: permissionsForTier("ADMIN").includes(permission),
  manager: permissionsForTier("MANAGER").includes(permission),
  staff: permissionsForTier("STAFF").includes(permission),
}));

export function tierHasPermission(
  tier: RmsTier,
  permission: StaffPermission
): boolean {
  return permissionsForTier(tier).includes(permission);
}

export function jobRoleHasPermission(
  jobRole: StaffJobRoleKey,
  permission: StaffPermission,
  customPermissions?: StaffPermission[]
): boolean {
  if (jobRole === "CUSTOM" && customPermissions?.length) {
    return customPermissions.includes(permission);
  }
  return (DEFAULT_ROLE_PERMISSIONS[jobRole] ?? []).includes(permission);
}
