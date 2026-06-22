"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  LayoutGrid,
  Menu as MenuIcon,
  Phone,
  ShoppingBag,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { useReservationOptional } from "@/components/ReservationProvider";
import { useConceptLayout } from "@/components/concepts/ConceptLayoutProvider";
import { stripTenantPrefix, withTenantPath } from "@/lib/tenant/public-path";

type NavItem = {
  href?: string;
  label: string;
  icon: typeof Home;
  match: (p: string) => boolean;
  action?: "reservation" | "menu-drawer";
  primary?: boolean;
};

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
  className = "",
}: NavItem & { active: boolean; onClick?: () => void; className?: string }) {
  const inner = (
    <>
      <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
      <span>{label}</span>
    </>
  );

  if (onClick || !href) {
    return (
      <button type="button" onClick={onClick} className={className} aria-current={active ? "page" : undefined}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={href} className={className} aria-current={active ? "page" : undefined}>
      {inner}
    </Link>
  );
}

function ClassicBottomNav({
  pathname,
  logicalPath,
}: {
  pathname: string;
  logicalPath: string;
}) {
  const reservation = useReservationOptional();

  const items: NavItem[] = [
    { href: "/", label: "Hem", icon: Home, match: (p) => p === "/" },
    { href: "/kontakt", label: "Kontakta", icon: Phone, match: (p) => p.startsWith("/kontakt") },
    { href: "/menu", label: "Meny", icon: UtensilsCrossed, match: (p) => p.startsWith("/menu"), primary: true },
    { label: "Boka", icon: CalendarDays, match: () => false, action: "reservation" },
    { href: "/konto", label: "Konto", icon: User, match: (p) => p.startsWith("/konto") },
  ];

  const navItems = items.map((item) =>
    item.href ? { ...item, href: withTenantPath(pathname, item.href) } : item
  );

  return (
    <nav className="site-bottom-nav fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label="Mobilnavigation">
      <div className="site-bottom-nav-bar mx-auto max-w-lg">
        {navItems.map((item) => {
          if (item.primary) {
            const active = item.match(logicalPath);
            return (
              <Link
                key={item.label}
                href={item.href!}
                className={`site-bottom-nav-center ${active ? "site-bottom-nav-center--active" : ""}`}
                aria-label="Meny — beställ mat"
              >
                <span className="site-bottom-nav-fab">
                  <UtensilsCrossed size={24} strokeWidth={2.25} />
                </span>
                <span className="site-bottom-nav-label">{item.label}</span>
              </Link>
            );
          }

          const sideItem = item;
          const active =
            sideItem.action === "reservation"
              ? Boolean(reservation?.isReservationOpen)
              : sideItem.match(logicalPath);

          const className = `site-bottom-nav-item ${active ? "site-bottom-nav-item--active" : ""}`;
          const inner = (
            <>
              <span className="site-bottom-nav-icon">
                <sideItem.icon size={20} strokeWidth={active ? 2.25 : 1.75} />
              </span>
              <span className="site-bottom-nav-label">{sideItem.label}</span>
            </>
          );

          if (sideItem.action === "reservation") {
            return (
              <button
                key={sideItem.label}
                type="button"
                onClick={() => reservation?.openReservation?.()}
                className={className}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link key={sideItem.label} href={sideItem.href!} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
      <div className="site-bottom-nav-safe" aria-hidden />
    </nav>
  );
}

function EqualTabsNav({ pathname, logicalPath }: { pathname: string; logicalPath: string }) {
  const reservation = useReservationOptional();
  const tabs = [
    { href: "/", label: "Hem", icon: Home, match: (p: string) => p === "/" },
    { href: "/menu", label: "Meny", icon: UtensilsCrossed, match: (p: string) => p.startsWith("/menu") },
    { href: "/kontakt", label: "Kontakt", icon: Phone, match: (p: string) => p.startsWith("/kontakt") },
    { label: "Boka", icon: CalendarDays, match: () => false, action: "reservation" as const },
  ];

  return (
    <nav className="concept-nav concept-nav--equal fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label="Mobilnavigation">
      <div className="concept-nav__bar">
        {tabs.map((tab) => {
          const href = tab.href ? withTenantPath(pathname, tab.href) : undefined;
          const active =
            tab.action === "reservation"
              ? Boolean(reservation?.isReservationOpen)
              : tab.match(logicalPath);
          return (
            <NavLink
              key={tab.label}
              {...tab}
              href={href}
              active={active}
              className={`concept-nav__tab ${active ? "concept-nav__tab--active" : ""}`}
              onClick={
                tab.action === "reservation"
                  ? () => reservation?.openReservation?.()
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

function BookingFabNav({ pathname, logicalPath }: { pathname: string; logicalPath: string }) {
  const reservation = useReservationOptional();
  const sides = [
    { href: withTenantPath(pathname, "/"), label: "Hem", icon: Home, match: (p: string) => p === "/" },
    { href: withTenantPath(pathname, "/menu"), label: "Meny", icon: UtensilsCrossed, match: (p: string) => p.startsWith("/menu") },
  ];

  return (
    <nav className="concept-nav concept-nav--booking-fab fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label="Mobilnavigation">
      <div className="concept-nav__bar concept-nav__bar--booking">
        {sides.map((item) => (
          <NavLink
            key={item.label}
            {...item}
            active={item.match(logicalPath)}
            className={`concept-nav__tab ${item.match(logicalPath) ? "concept-nav__tab--active" : ""}`}
          />
        ))}
        <button
          type="button"
          onClick={() => reservation?.openReservation?.()}
          className={`concept-nav__booking-fab ${reservation?.isReservationOpen ? "concept-nav__booking-fab--active" : ""}`}
          aria-label="Boka bord"
        >
          <CalendarDays size={26} />
          <span>Boka</span>
        </button>
        <NavLink
          href={withTenantPath(pathname, "/kontakt")}
          label="Kontakt"
          icon={Phone}
          match={(p) => p.startsWith("/kontakt")}
          active={logicalPath.startsWith("/kontakt")}
          className={`concept-nav__tab ${logicalPath.startsWith("/kontakt") ? "concept-nav__tab--active" : ""}`}
        />
      </div>
      <div className="site-bottom-nav-safe" aria-hidden />
    </nav>
  );
}

function PillTabsNav({ pathname, logicalPath }: { pathname: string; logicalPath: string }) {
  const reservation = useReservationOptional();
  const tabs = [
    { href: "/", icon: Home, label: "Hem", match: (p: string) => p === "/" },
    { href: "/menu", icon: LayoutGrid, label: "Meny", match: (p: string) => p.startsWith("/menu") },
    { label: "Boka", icon: CalendarDays, match: () => false, action: "reservation" as const },
    { href: "/kontakt", icon: Phone, label: "Kontakt", match: (p: string) => p.startsWith("/kontakt") },
  ];

  return (
    <nav className="concept-nav concept-nav--pill fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label="Mobilnavigation">
      <div className="concept-nav__pill-bar">
        {tabs.map((tab) => {
          const href = tab.href ? withTenantPath(pathname, tab.href) : undefined;
          const active =
            tab.action === "reservation"
              ? Boolean(reservation?.isReservationOpen)
              : tab.match(logicalPath);
          return (
            <NavLink
              key={tab.label}
              {...tab}
              href={href}
              active={active}
              className={`concept-nav__pill ${active ? "concept-nav__pill--active" : ""}`}
              onClick={
                tab.action === "reservation"
                  ? () => reservation?.openReservation?.()
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

function ConversionBarNav({ pathname, logicalPath }: { pathname: string; logicalPath: string }) {
  const reservation = useReservationOptional();

  return (
    <nav className="concept-nav concept-nav--conversion fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label="Mobilnavigation">
      <div className="concept-nav__conversion-bar">
        <Link href={withTenantPath(pathname, "/menu")} className="concept-nav__order-cta">
          <ShoppingBag size={20} />
          Beställ
        </Link>
        <div className="concept-nav__conversion-icons">
          <NavLink href={withTenantPath(pathname, "/")} label="Hem" icon={Home} match={(p) => p === "/"} active={logicalPath === "/"} className="concept-nav__icon-btn" />
          <button type="button" onClick={() => reservation?.openReservation?.()} className="concept-nav__icon-btn" aria-label="Boka">
            <CalendarDays size={20} />
          </button>
          <NavLink href={withTenantPath(pathname, "/kontakt")} label="Kontakt" icon={Phone} match={(p) => p.startsWith("/kontakt")} active={logicalPath.startsWith("/kontakt")} className="concept-nav__icon-btn" />
        </div>
      </div>
      <div className="site-bottom-nav-safe" aria-hidden />
    </nav>
  );
}

function MinimalDotsNav({ pathname, logicalPath }: { pathname: string; logicalPath: string }) {
  const tabs = [
    { href: "/", icon: Home },
    { href: "/menu", icon: UtensilsCrossed },
    { href: "/kontakt", icon: Phone },
  ];

  return (
    <nav className="concept-nav concept-nav--minimal fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label="Mobilnavigation">
      <div className="concept-nav__minimal-bar">
        {tabs.map((tab) => {
          const href = withTenantPath(pathname, tab.href);
          const active =
            tab.href === "/"
              ? logicalPath === "/"
              : logicalPath.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={href}
              className={`concept-nav__minimal-dot ${active ? "concept-nav__minimal-dot--active" : ""}`}
            >
              <tab.icon size={22} strokeWidth={1.5} />
            </Link>
          );
        })}
      </div>
      <div className="site-bottom-nav-safe" aria-hidden />
    </nav>
  );
}

function SocialBarNav({ pathname, logicalPath }: { pathname: string; logicalPath: string }) {
  const reservation = useReservationOptional();

  return (
    <nav className="concept-nav concept-nav--social fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label="Mobilnavigation">
      <div className="concept-nav__social-bar">
        {[
          { href: "/", icon: Home, label: "Hem", match: (p: string) => p === "/" },
          { href: "/menu", icon: UtensilsCrossed, label: "Mat", match: (p: string) => p.startsWith("/menu") },
          { action: "reservation" as const, icon: CalendarDays, label: "Event", match: () => false },
          { href: "/kontakt", icon: Phone, label: "Hitta", match: (p: string) => p.startsWith("/kontakt") },
        ].map((item) => {
          if (item.action) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => reservation?.openReservation?.()}
                className="concept-nav__social-item"
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          }
          const active = item.match!(logicalPath);
          return (
            <Link
              key={item.label}
              href={withTenantPath(pathname, item.href!)}
              className={`concept-nav__social-item ${active ? "concept-nav__social-item--active" : ""}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="site-bottom-nav-safe" aria-hidden />
    </nav>
  );
}

function HorizontalPillsNav({ pathname, logicalPath }: { pathname: string; logicalPath: string }) {
  const reservation = useReservationOptional();
  const items = [
    { href: "/", label: "Hem" },
    { href: "/menu", label: "Meny" },
    { label: "Boka", action: "reservation" as const },
    { href: "/kontakt", label: "Kontakt" },
  ];

  return (
    <nav className="concept-nav concept-nav--horizontal fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label="Mobilnavigation">
      <div className="concept-nav__horizontal-scroll">
        {items.map((item) => {
          if (item.action) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => reservation?.openReservation?.()}
                className="concept-nav__horizontal-pill"
              >
                {item.label}
              </button>
            );
          }
          const href = withTenantPath(pathname, item.href!);
          const active =
            item.href === "/"
              ? logicalPath === "/"
              : logicalPath.startsWith(item.href!);
          return (
            <Link
              key={item.label}
              href={href}
              className={`concept-nav__horizontal-pill ${active ? "concept-nav__horizontal-pill--active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="site-bottom-nav-safe" aria-hidden />
    </nav>
  );
}

function DrawerMenuNav({ pathname, logicalPath }: { pathname: string; logicalPath: string }) {
  const reservation = useReservationOptional();

  return (
    <nav className="concept-nav concept-nav--drawer fixed bottom-0 left-0 right-0 z-50 lg:hidden" aria-label="Mobilnavigation">
      <div className="concept-nav__drawer-bar">
        <Link href={withTenantPath(pathname, "/menu")} className="concept-nav__drawer-menu">
          <MenuIcon size={22} />
          <span>Meny</span>
        </Link>
        <div className="concept-nav__drawer-links">
          <Link href={withTenantPath(pathname, "/")} className={logicalPath === "/" ? "is-active" : ""}>
            Hem
          </Link>
          <button type="button" onClick={() => reservation?.openReservation?.()}>
            Boka
          </button>
          <Link href={withTenantPath(pathname, "/kontakt")} className={logicalPath.startsWith("/kontakt") ? "is-active" : ""}>
            Kontakt
          </Link>
        </div>
      </div>
      <div className="site-bottom-nav-safe" aria-hidden />
    </nav>
  );
}

function ImageBarNav({ pathname, logicalPath }: { pathname: string; logicalPath: string }) {
  return <MinimalDotsNav pathname={pathname} logicalPath={logicalPath} />;
}

export default function ConceptBottomNav() {
  const pathname = usePathname();
  const logicalPath = stripTenantPrefix(pathname);
  const { meta } = useConceptLayout();

  if (logicalPath.startsWith("/checkout")) {
    return null;
  }

  const props = { pathname, logicalPath };

  switch (meta.navStyle) {
    case "equal-tabs":
      return <EqualTabsNav {...props} />;
    case "booking-fab":
      return <BookingFabNav {...props} />;
    case "pill-tabs":
      return <PillTabsNav {...props} />;
    case "drawer-menu":
      return <DrawerMenuNav {...props} />;
    case "editorial-minimal":
      return <MinimalDotsNav {...props} />;
    case "image-bar":
      return <ImageBarNav {...props} />;
    case "social-bar":
      return <SocialBarNav {...props} />;
    case "horizontal-pills":
      return <HorizontalPillsNav {...props} />;
    case "conversion-bar":
      return <ConversionBarNav {...props} />;
    case "fab-center":
    default:
      return <ClassicBottomNav {...props} />;
  }
}
