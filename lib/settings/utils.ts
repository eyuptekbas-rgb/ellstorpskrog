import type { DeliveryZone, OpeningHours, SiteSettings } from "@prisma/client";

export const DAY_NAMES = [
  "Söndag",
  "Måndag",
  "Tisdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lördag",
] as const;

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function isRestaurantOpen(
  openingHours: Pick<OpeningHours, "dayOfWeek" | "openTime" | "closeTime" | "isClosed">[],
  now = new Date()
): boolean {
  const dayOfWeek = now.getDay();
  const today = openingHours.find((h) => h.dayOfWeek === dayOfWeek);
  if (!today || today.isClosed) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  const open = parseTimeToMinutes(today.openTime);
  const close = parseTimeToMinutes(today.closeTime);
  return current >= open && current < close;
}

export function formatHoursRange(
  openTime: string,
  closeTime: string,
  isClosed: boolean
): string {
  if (isClosed) return "Stängt";
  return `${openTime.replace(":00", "")}–${closeTime.replace(":00", "")}`;
}

export function parsePostalCodes(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((c) => c.replace(/\D/g, ""))
    .filter(Boolean);
}

export function extractPostalCode(address: string): string | null {
  const match = address.match(/\b(\d{3})\s?(\d{2})\b/);
  if (!match) return null;
  return `${match[1]}${match[2]}`;
}

export function matchDeliveryZone(
  address: string,
  zones: DeliveryZone[],
  fallback: Pick<SiteSettings, "deliveryFee" | "minimumOrder">
): { zone: DeliveryZone | null; deliveryFee: number; minimumOrder: number } {
  const postal = extractPostalCode(address);
  if (!postal) {
    return {
      zone: null,
      deliveryFee: fallback.deliveryFee,
      minimumOrder: fallback.minimumOrder,
    };
  }

  for (const zone of zones) {
    const codes = parsePostalCodes(zone.postalCodes);
    if (codes.includes(postal)) {
      return {
        zone,
        deliveryFee: zone.deliveryFee,
        minimumOrder: zone.minimumOrder,
      };
    }
  }

  return {
    zone: null,
    deliveryFee: fallback.deliveryFee,
    minimumOrder: fallback.minimumOrder,
  };
}

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[\s-]/g, "")}`;
}
