import type { OpeningHours } from "@prisma/client";

/** dayOfWeek: 0 = Sunday … 6 = Saturday (matches JS Date.getDay()) */
export const DEFAULT_OPENING_HOURS: Omit<OpeningHours, "id">[] = [
  { dayOfWeek: 0, openTime: "13:00", closeTime: "21:00", isClosed: false },
  { dayOfWeek: 1, openTime: "13:00", closeTime: "21:00", isClosed: false },
  { dayOfWeek: 2, openTime: "13:00", closeTime: "22:00", isClosed: false },
  { dayOfWeek: 3, openTime: "13:00", closeTime: "22:00", isClosed: false },
  { dayOfWeek: 4, openTime: "13:00", closeTime: "22:00", isClosed: false },
  { dayOfWeek: 5, openTime: "13:00", closeTime: "23:00", isClosed: false },
  { dayOfWeek: 6, openTime: "13:00", closeTime: "23:00", isClosed: false },
];

export const OPENING_HOURS_DISPLAY = [
  { days: "Mån", hours: "13:00–21:00" },
  { days: "Tis–Tor", hours: "13:00–22:00" },
  { days: "Fre–Lör", hours: "13:00–23:00" },
  { days: "Sön", hours: "13:00–21:00" },
] as const;

export const OPENING_HOURS_WEEKLY = [
  { day: "Måndag", hours: "13:00–21:00" },
  { day: "Tisdag", hours: "13:00–22:00" },
  { day: "Onsdag", hours: "13:00–22:00" },
  { day: "Torsdag", hours: "13:00–22:00" },
  { day: "Fredag", hours: "13:00–23:00" },
  { day: "Lördag", hours: "13:00–23:00" },
  { day: "Söndag", hours: "13:00–21:00" },
] as const;

/** @deprecated Use DEFAULT_OPENING_HOURS */
export const openingHours = {
  monday: { open: "13:00", close: "21:00" },
  tuesday: { open: "13:00", close: "22:00" },
  wednesday: { open: "13:00", close: "22:00" },
  thursday: { open: "13:00", close: "22:00" },
  friday: { open: "13:00", close: "23:00" },
  saturday: { open: "13:00", close: "23:00" },
  sunday: { open: "13:00", close: "21:00" },
};
