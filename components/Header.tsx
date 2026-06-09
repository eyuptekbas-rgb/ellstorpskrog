"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Phone, ShoppingBag } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import MobileAppHeader from "@/components/header/MobileAppHeader";
import { useReservation } from "@/components/ReservationProvider";
import { loadCart } from "@/lib/cart";
import { NAV_LINKS, SITE_PHONE_HREF } from "@/lib/navigation";

export default function Header() {
  const pathname = usePathname();
  const { openReservation } = useReservation();
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  const refreshCartCount = useCallback(() => {
    const cart = loadCart();
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    refreshCartCount();
    window.addEventListener("cart-updated", refreshCartCount);
    window.addEventListener("storage", refreshCartCount);
    return () => {
      window.removeEventListener("cart-updated", refreshCartCount);
      window.removeEventListener("storage", refreshCartCount);
    };
  }, [refreshCartCount, pathname]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/settings/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.isOpen === "boolean") {
          setIsOpen(data.isOpen);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const statusMeta = isOpen !== null && (
    <span className="site-header-brand-meta">
      <span className="site-header-brand-sub">Malmö</span>
      <span
        className={`site-header-status ${isOpen ? "site-header-status--open" : "site-header-status--closed"}`}
      >
        <span className="site-header-status-dot" aria-hidden />
        {isOpen ? "Öppet nu" : "Stängt"}
      </span>
    </span>
  );

  return (
    <>
      <MobileAppHeader
        cartCount={cartCount}
        isOpen={isOpen}
        scrolled={scrolled}
      />

      <header
        className={`site-header fixed top-0 left-0 z-50 hidden w-full transition-[background,border-color,box-shadow] duration-300 lg:block ${
          scrolled ? "site-header--scrolled" : ""
        }`}
      >
        <div className="site-header-inner mx-auto max-w-7xl px-[var(--content-px)]">
          <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="site-header-brand-stack justify-self-start">
              <BrandLogo size="header-desktop" priority />
              {statusMeta}
            </div>

            <nav
              className="flex items-center justify-center gap-1"
              aria-label="Huvudnavigation"
            >
              {NAV_LINKS.map(({ href, label, match }) => {
                const active = match(pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`site-nav-link px-4 py-2 ${active ? "site-nav-link--active" : ""}`}
                  >
                    {label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={openReservation}
                className="site-nav-link px-4 py-2"
              >
                Boka bord
              </button>
            </nav>

            <div className="flex items-center justify-end gap-2.5">
              <a
                href={SITE_PHONE_HREF}
                className="site-header-icon-btn"
                aria-label="Ring oss"
              >
                <Phone size={18} strokeWidth={1.75} />
              </a>
              <Link href="/menu" className="btn-primary btn-sm !px-5">
                <ShoppingBag size={16} />
                Beställ
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
