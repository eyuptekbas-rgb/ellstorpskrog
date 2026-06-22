export const STAFF_ROLES = ["ADMIN", "STAFF", "PLATFORM_ADMIN"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role: string | undefined | null): role is StaffRole {
  return role === "ADMIN" || role === "STAFF" || role === "PLATFORM_ADMIN";
}

export function isPlatformAdmin(
  role: string | undefined | null
): role is "PLATFORM_ADMIN" {
  return role === "PLATFORM_ADMIN";
}

export function isTenantStaff(role: string | undefined | null): boolean {
  return role === "ADMIN" || role === "STAFF";
}

export function isCustomerRole(role: string | undefined | null): boolean {
  return role === "CUSTOMER";
}
