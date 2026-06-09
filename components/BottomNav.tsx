"use client";

import { CalendarDays, Home, Phone, User, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReservationOptional } from "@/components/ReservationProvider";

type SideItem = {
  href?: string;
  label: string;
  icon: typeof Home;
  match: (p: string) => boolean;
  action?: "reservation";
};

type PrimaryItem = {
  href: string;
  label: string;
  icon: typeof UtensilsCrossed;
  match: (p: string) => boolean;
  primary: true;
};

const NAV_ITEMS: Array<SideItem | PrimaryItem> = [
  { href: "/", label: "Hem", icon: Home, match: (p) => p === "/" },
  {
    href: "/kontakt",
    label: "Kontakta",
    icon: Phone,
    match: (p) => p.startsWith("/kontakt"),
  },
  {
    href: "/menu",
    label: "Meny",
    icon: UtensilsCrossed,
    match: (p) => p.startsWith("/menu"),
    primary: true,
  },
  {
    label: "Boka",
    icon: CalendarDays,
    match: () => false,
    action: "reservation",
  },
  {
    href: "/login",
    label: "Konto",
    icon: User,
    match: (p) => p.startsWith("/login"),
  },
];

function SideNavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: SideItem & { active: boolean; onClick?: () => void }) {
  const className = `site-bottom-nav-item ${active ? "site-bottom-nav-item--active" : ""}`;

  const inner = (
    <>
      <span className="site-bottom-nav-icon">
        <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
      </span>
      <span className="site-bottom-nav-label">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={href!} className={className}>
      {inner}
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const reservation = useReservationOptional();

  if (pathname.startsWith("/checkout")) {
    return null;
  }

  return (
    <nav
      className="site-bottom-nav fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      aria-label="Mobilnavigation"
    >
      <div className="site-bottom-nav-bar mx-auto max-w-lg">
        {NAV_ITEMS.map((item) => {
          if ("primary" in item && item.primary) {
            const active = item.match(pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`site-bottom-nav-center ${active ? "site-bottom-nav-center--active" : ""}`}
                aria-label="Meny — beställ mat"
                aria-current={active ? "page" : undefined}
              >
                <span className="site-bottom-nav-fab">
                  <UtensilsCrossed size={24} strokeWidth={2.25} />
                </span>
                <span className="site-bottom-nav-label">{item.label}</span>
              </Link>
            );
          }

          const sideItem = item as SideItem;
          const active =
            sideItem.action === "reservation"
              ? Boolean(reservation?.isReservationOpen)
              : sideItem.match(pathname);

          return (
            <SideNavLink
              key={sideItem.label}
              {...sideItem}
              active={active}
              onClick={
                sideItem.action === "reservation"
                  ? reservation?.openReservation
                  : undefined
              }
            />
          );
        })}
      </div>
      <div className="site-bottom-nav-safe" aria-hidden />
    </nav>
  );
}
