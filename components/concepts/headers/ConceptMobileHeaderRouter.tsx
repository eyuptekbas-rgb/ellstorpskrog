"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Menu, Phone, Search, ShoppingBag } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import MobileAppHeader from "@/components/header/MobileAppHeader";
import TenantMobileHeader from "@/components/templates/headers/TenantMobileHeader";
import { useConceptLayout } from "@/components/concepts/ConceptLayoutProvider";
import { useTenantBrandingOptional } from "@/components/tenant/TenantBrandingProvider";
import { useTenantPublicPath } from "@/components/tenant/TenantPublicPathProvider";
import { phoneHref } from "@/lib/settings/utils";
import { parseTenantSlugFromPath } from "@/lib/tenant/public-path";

type HeaderProps = {
  cartCount: number;
  cartTotal: number;
  isMenuPage: boolean;
  isOpen: boolean | null;
  scrolled: boolean;
};

function DeliveryHeader({ cartCount, isOpen, scrolled }: HeaderProps) {
  const tp = useTenantPublicPath();
  const branding = useTenantBrandingOptional();
  const name = branding?.restaurantName ?? "Restaurang";

  return (
    <header className={`concept-header concept-header--delivery lg:hidden ${scrolled ? "concept-header--scrolled" : ""}`}>
      <div className="concept-header__inner">
        <div className="concept-header__search-row">
          <Search size={18} className="opacity-40" />
          <span className="text-sm opacity-50">Sök i menyn…</span>
        </div>
        <div className="concept-header__meta-row">
          <div>
            <p className="text-sm font-bold">{name}</p>
            <p className="text-[10px] opacity-45">
              {isOpen ? "Öppet · Leverans & avhämtning" : "Stängt"}
            </p>
          </div>
          <Link href={tp("/menu")} className="concept-header__cart-chip">
            <ShoppingBag size={16} />
            {cartCount > 0 && <span>{cartCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}

function BookingHeader({ cartCount, scrolled }: HeaderProps) {
  const tp = useTenantPublicPath();
  const branding = useTenantBrandingOptional();

  return (
    <header className={`concept-header concept-header--booking lg:hidden ${scrolled ? "concept-header--scrolled" : ""}`}>
      <div className="concept-header__inner concept-header__inner--center">
        <BrandLogo size="header-mobile-compact" priority href={tp("/")} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-45">
          Reservera bord
        </p>
        <p className="text-xs opacity-55">{branding?.restaurantName}</p>
        <Link href={tp("/menu")} className="concept-header__text-link">
          Se meny {cartCount > 0 ? `(${cartCount})` : ""}
        </Link>
      </div>
    </header>
  );
}

function MinimalHeader({ cartCount, scrolled }: HeaderProps) {
  const tp = useTenantPublicPath();

  return (
    <header className={`concept-header concept-header--minimal lg:hidden ${scrolled ? "concept-header--scrolled" : ""}`}>
      <div className="concept-header__inner concept-header__inner--spread">
        <Link href={tp("/menu")} className="concept-header__icon-btn" aria-label="Meny">
          <Menu size={22} />
        </Link>
        <BrandLogo size="header-mobile-compact" priority href={tp("/")} />
        <Link href={tp("/menu")} className="concept-header__icon-btn" aria-label="Varukorg">
          <ShoppingBag size={20} />
          {cartCount > 0 && <span className="concept-header__badge">{cartCount}</span>}
        </Link>
      </div>
    </header>
  );
}

function EditorialHeader({ scrolled }: HeaderProps) {
  const tp = useTenantPublicPath();
  const branding = useTenantBrandingOptional();

  return (
    <header className={`concept-header concept-header--editorial lg:hidden ${scrolled ? "concept-header--scrolled" : ""}`}>
      <div className="concept-header__inner">
        <Link href={tp("/")} className="text-[0.65rem] font-medium uppercase tracking-[0.35em]">
          {branding?.restaurantName ?? "Restaurang"}
        </Link>
      </div>
    </header>
  );
}

function ScandinavianHeader({ cartCount, scrolled }: HeaderProps) {
  const tp = useTenantPublicPath();

  return (
    <header className={`concept-header concept-header--scandi lg:hidden ${scrolled ? "concept-header--scrolled" : ""}`}>
      <div className="concept-header__inner concept-header__inner--spread">
        <span className="text-xs font-medium opacity-60">Malmö</span>
        <Link href={tp("/menu")} className="concept-header__icon-btn concept-header__icon-btn--glass">
          <ShoppingBag size={20} />
          {cartCount > 0 && <span className="concept-header__badge">{cartCount}</span>}
        </Link>
      </div>
    </header>
  );
}

function GastroHeader({ cartCount, isOpen, scrolled }: HeaderProps) {
  const branding = useTenantBrandingOptional();
  const tp = useTenantPublicPath();

  return (
    <header className={`concept-header concept-header--gastro lg:hidden ${scrolled ? "concept-header--scrolled" : ""}`}>
      <div className="concept-header__inner">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-serif text-lg">{branding?.restaurantName}</p>
            <p className="text-[10px] opacity-45">{isOpen ? "Öppet · Pub & mat" : "Stängt"}</p>
          </div>
          <Link href={tp("/menu")} className="btn-primary btn-sm !px-4">
            Beställ
            {cartCount > 0 ? ` · ${cartCount}` : ""}
          </Link>
        </div>
      </div>
    </header>
  );
}

function AppStoreHeader({ cartCount, scrolled }: HeaderProps) {
  const tp = useTenantPublicPath();
  const branding = useTenantBrandingOptional();

  return (
    <header className={`concept-header concept-header--appstore lg:hidden ${scrolled ? "concept-header--scrolled" : ""}`}>
      <div className="concept-header__inner">
        <p className="text-xs opacity-45">Idag</p>
        <h2 className="text-display text-xl">{branding?.restaurantName}</h2>
        <div className="mt-2 flex gap-2">
          <Link href={tp("/menu")} className="concept-header__chip">
            Beställ {cartCount > 0 ? `(${cartCount})` : ""}
          </Link>
          <Link href={tp("/kontakt")} className="concept-header__chip concept-header__chip--muted">
            Kontakt
          </Link>
        </div>
      </div>
    </header>
  );
}

function FastOrderHeader({ cartCount, isOpen, scrolled }: HeaderProps) {
  const branding = useTenantBrandingOptional();
  const tp = useTenantPublicPath();
  const phone = branding?.phone;

  return (
    <header className={`concept-header concept-header--fast lg:hidden ${scrolled ? "concept-header--scrolled" : ""}`}>
      <div className="concept-header__inner concept-header__inner--spread">
        <div>
          <p className="text-sm font-bold">{branding?.restaurantName}</p>
          <p className="text-[10px] opacity-45">{isOpen ? "Redo att beställa" : "Stängt"}</p>
        </div>
        <div className="flex items-center gap-2">
          {phone && (
            <a href={phoneHref(phone)} className="concept-header__icon-btn" aria-label="Ring">
              <Phone size={18} />
            </a>
          )}
          <Link href={tp("/menu")} className="concept-header__order-pill">
            <ShoppingBag size={16} />
            {cartCount > 0 ? cartCount : "Order"}
          </Link>
        </div>
      </div>
    </header>
  );
}

function CardModularHeader({ cartCount, isOpen, scrolled }: HeaderProps) {
  const tp = useTenantPublicPath();

  return (
    <header className={`concept-header concept-header--cards lg:hidden ${scrolled ? "concept-header--scrolled" : ""}`}>
      <div className="concept-header__inner">
        <div className="flex items-start justify-between">
          <div>
            <BrandLogo size="header-mobile-compact" priority href={tp("/")} />
            <span className="mt-2 inline-flex items-center gap-1 text-[10px] opacity-45">
              <MapPin size={10} /> Malmö · {isOpen ? "Öppet" : "Stängt"}
            </span>
          </div>
          <Link href={tp("/menu")} className="concept-header__cart-chip">
            <ShoppingBag size={16} />
            {cartCount > 0 && <span>{cartCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function ConceptMobileHeaderRouter(props: HeaderProps) {
  const pathname = usePathname();
  const branding = useTenantBrandingOptional();
  const { layoutId } = useConceptLayout();
  const isTenantSite =
    Boolean(parseTenantSlugFromPath(pathname)) ||
    Boolean(branding && !branding.isDefaultTenant);

  if (layoutId === "traditional") {
    return isTenantSite ? (
      <TenantMobileHeader {...props} />
    ) : (
      <MobileAppHeader {...props} />
    );
  }

  switch (layoutId) {
    case "delivery-app":
      return <DeliveryHeader {...props} />;
    case "booking-first":
      return <BookingHeader {...props} />;
    case "menu-first":
      return <MinimalHeader {...props} />;
    case "luxury-editorial":
      return <EditorialHeader {...props} />;
    case "scandinavian-imagery":
      return <ScandinavianHeader {...props} />;
    case "gastro-pub":
      return <GastroHeader {...props} />;
    case "app-store-horizontal":
      return <AppStoreHeader {...props} />;
    case "fast-order":
      return <FastOrderHeader {...props} />;
    case "card-modular":
      return <CardModularHeader {...props} />;
    default:
      return isTenantSite ? (
        <TenantMobileHeader {...props} />
      ) : (
        <MobileAppHeader {...props} />
      );
  }
}
