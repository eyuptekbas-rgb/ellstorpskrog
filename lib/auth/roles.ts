export const STAFF_ROLES = ["ADMIN", "STAFF"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role: string | undefined | null): role is StaffRole {
  return role === "ADMIN" || role === "STAFF";
}
