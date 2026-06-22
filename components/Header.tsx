"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import HeaderActions from "@/components/header/HeaderActions";
import HeaderStatusChips from "@/components/header/HeaderStatusChips";
import ConceptMobileHeaderRouter from "@/components/concepts/headers/ConceptMobileHeaderRouter";
import { useReservation } from "@/components/ReservationProvider";
import { useTenantBrandingOptional } from "@/components/tenant/TenantBrandingProvider";
import { loadCart } from "@/lib/cart";
import { NAV_LINKS, SITE_PHONE_HREF } from "@/lib/navigation";
import { phoneHref } from "@/lib/settings/utils";
import { stripTenantPrefix, withTenantPath } from "@/lib/tenant/public-path";

export default function Header() {
  const pathname = usePathname();
  const logicalPath = stripTenantPrefix(pathname);
  const { openReservation } = useReservation();
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const isMenuPage = logicalPath === "/menu";

  const branding = useTenantBrandingOptional();
  const restaurantName = branding?.restaurantName ?? "Ellstorps Krog";
  const phoneLink = branding?.phone ? phoneHref(branding.phone) : SITE_PHONE_HREF;
  const homeHref = withTenantPath(pathname, "/");
  const menuHref = withTenantPath(pathname, "/menu");
  const checkoutHref = withTenantPath(pathname, "/checkout");

  const refreshCartCount = useCallback(() => {
    const cart = loadCart();
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    setCartTotal(
      cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    queueMicrotask(() => refreshCartCount());
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

  return (
    <>
      <ConceptMobileHeaderRouter
        cartCount={cartCount}
        cartTotal={cartTotal}
        isMenuPage={isMenuPage}
        isOpen={isOpen}
        scrolled={scrolled}
      />

      <header
        className={`site-header fixed top-0 left-0 z-50 hidden w-full transition-[background,border-color,box-shadow] duration-300 lg:block ${
          scrolled ? "site-header--scrolled" : ""
        }`}
      >
        <div className="site-header-inner mx-auto max-w-7xl px-[var(--content-px)]">
          <div className="site-header-grid">
            <Link href={homeHref} className="site-header-brand-link">
              <BrandLogo size="header-desktop" priority href={undefined} />
              <span className="site-header-brand-copy">
                <span className="site-header-brand-name">{restaurantName}</span>
                <HeaderStatusChips isOpen={isOpen} />
              </span>
            </Link>

            <nav className="site-header-nav" aria-label="Huvudnavigation">
              {NAV_LINKS.map(({ href, label, match }) => {
                const active = match(logicalPath);
                return (
                  <Link
                    key={href}
                    href={withTenantPath(pathname, href)}
                    className={`site-nav-link px-3 py-2 xl:px-4 ${active ? "site-nav-link--active" : ""}`}
                  >
                    {label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={openReservation}
                className="site-nav-link px-3 py-2 xl:px-4"
              >
                Boka bord
              </button>
            </nav>

            <div className="site-header-end">
              <HeaderActions
                phoneHref={phoneLink}
                cartHref={cartCount > 0 ? checkoutHref : menuHref}
                cartCount={cartCount}
                cartTotal={cartTotal}
                isMenuPage={isMenuPage}
                variant="desktop"
              />
              <Link href={menuHref} className="btn-primary btn-sm site-header-order-btn">
                Beställ
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
