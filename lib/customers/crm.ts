export const CUSTOMER_VIP_LEVELS = ["REGULAR", "SILVER", "GOLD", "VIP"] as const;

export type CustomerVipLevel = (typeof CUSTOMER_VIP_LEVELS)[number];

export const CustomerVipLevel = {
  REGULAR: "REGULAR",
  SILVER: "SILVER",
  GOLD: "GOLD",
  VIP: "VIP",
} as const satisfies Record<CustomerVipLevel, CustomerVipLevel>;

export const CUSTOMER_TAGS = [
  "VIP",
  "REGULAR",
  "BLOCKED",
  "DELIVERY_ONLY",
  "PICKUP_ONLY",
] as const;

export type CustomerTag = (typeof CUSTOMER_TAGS)[number];

export const CUSTOMER_TAG_LABELS: Record<CustomerTag, string> = {
  VIP: "VIP",
  REGULAR: "Regular",
  BLOCKED: "Blockerad",
  DELIVERY_ONLY: "Endast leverans",
  PICKUP_ONLY: "Endast avhämtning",
};

export const VIP_LEVEL_LABELS: Record<CustomerVipLevel, string> = {
  REGULAR: "Regular",
  SILVER: "Silver",
  GOLD: "Guld",
  VIP: "VIP",
};

export function vipLevelFromSpend(spend: number): CustomerVipLevel {
  if (spend >= 10_000) return CustomerVipLevel.VIP;
  if (spend >= 5_000) return CustomerVipLevel.GOLD;
  if (spend >= 2_000) return CustomerVipLevel.SILVER;
  return CustomerVipLevel.REGULAR;
}

export function parseCustomerTags(raw: unknown): CustomerTag[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (t): t is CustomerTag =>
      typeof t === "string" && CUSTOMER_TAGS.includes(t as CustomerTag)
  );
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

export type CustomerListItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  vipLevel: CustomerVipLevel;
  tags: CustomerTag[];
  lastOrderAt: string | null;
  isReturning: boolean;
};

export type CustomerDashboardStats = {
  newToday: number;
  returning: number;
  vipCount: number;
  topCustomers: CustomerListItem[];
};

export type CustomerTimelineEvent = {
  id: string;
  type: "order" | "reservation" | "payment" | "note" | "loyalty";
  title: string;
  subtitle?: string;
  amount?: number;
  at: string;
};

export type CustomerProfileDetail = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  tags: CustomerTag[];
  vipLevel: CustomerVipLevel;
  vipOverride: boolean;
  loyaltyPoints: number;
  lifetimeSpend: number;
  totalOrders: number;
  averageOrder: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  favouriteDishes: { name: string; count: number }[];
  favouriteCategory: string | null;
  reservationCount: number;
  lastReservationAt: string | null;
  reservations: {
    id: string;
    date: string;
    time: string;
    guestCount: number;
    status: string;
  }[];
  adminNotes: {
    id: string;
    body: string;
    createdAt: string;
    updatedAt: string;
  }[];
  loyaltyEvents: {
    id: string;
    pointsDelta: number;
    reason: string;
    createdBy: string | null;
    createdAt: string;
  }[];
  timeline: CustomerTimelineEvent[];
};
