export const STAFF_PERMISSION_KEYS = [
  "dashboard",
  "orders",
  "kitchen",
  "reservations",
  "customers",
  "menu",
  "reports",
  "staff",
  "settings",
] as const;

export type StaffPermission = (typeof STAFF_PERMISSION_KEYS)[number];

export const STAFF_PERMISSION_LABELS: Record<StaffPermission, string> = {
  dashboard: "Dashboard",
  orders: "Beställningar",
  kitchen: "Köksdisplay",
  reservations: "Reservationer",
  customers: "Kunder",
  menu: "Meny",
  reports: "Rapporter",
  staff: "Personal",
  settings: "Inställningar",
};

export const STAFF_JOB_ROLES = [
  "OWNER",
  "MANAGER",
  "KITCHEN",
  "CASHIER",
  "DELIVERY",
  "WAITER",
  "CUSTOM",
] as const;

export type StaffJobRoleKey = (typeof STAFF_JOB_ROLES)[number];

export const STAFF_JOB_ROLE_LABELS: Record<StaffJobRoleKey, string> = {
  OWNER: "Ägare",
  MANAGER: "Manager",
  KITCHEN: "Kök",
  CASHIER: "Kassa",
  DELIVERY: "Leverans",
  WAITER: "Servitör",
  CUSTOM: "Anpassad",
};

export const STAFF_STATUS_LABELS = {
  INVITED: "Inbjuden",
  ACTIVE: "Aktiv",
  INACTIVE: "Inaktiv",
} as const;

export type StaffStatusKey = keyof typeof STAFF_STATUS_LABELS;

export const DEFAULT_ROLE_PERMISSIONS: Record<StaffJobRoleKey, StaffPermission[]> = {
  OWNER: [...STAFF_PERMISSION_KEYS],
  MANAGER: [
    "dashboard",
    "orders",
    "kitchen",
    "reservations",
    "customers",
    "menu",
    "reports",
    "staff",
    "settings",
  ],
  KITCHEN: ["dashboard", "kitchen", "orders"],
  CASHIER: ["dashboard", "orders"],
  DELIVERY: ["dashboard", "orders"],
  WAITER: ["dashboard", "reservations", "orders"],
  CUSTOM: ["dashboard"],
};

export function parsePermissions(raw: unknown): StaffPermission[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (p): p is StaffPermission =>
      typeof p === "string" && STAFF_PERMISSION_KEYS.includes(p as StaffPermission)
  );
}

export function permissionsForRole(
  jobRole: StaffJobRoleKey,
  customPermissions?: StaffPermission[]
): StaffPermission[] {
  if (jobRole === "CUSTOM" && customPermissions?.length) {
    return customPermissions;
  }
  return DEFAULT_ROLE_PERMISSIONS[jobRole] ?? ["dashboard"];
}
