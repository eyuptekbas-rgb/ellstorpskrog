export type NavLink = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

export { OPENING_HOURS_DISPLAY } from "@/lib/openingHours";

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Hem", match: (p) => p === "/" },
  { href: "/menu", label: "Meny", match: (p) => p.startsWith("/menu") },
  { href: "/kontakt", label: "Kontakt", match: (p) => p.startsWith("/kontakt") },
];

export const SITE_PHONE = "+46 40 18 42 68";
export const SITE_PHONE_HREF = "tel:+4640184268";

export const SOCIAL_LINKS = [
  {
    href: "https://facebook.com",
    label: "Facebook",
    icon: "facebook" as const,
  },
  {
    href: "https://instagram.com",
    label: "Instagram",
    icon: "instagram" as const,
  },
] as const;
