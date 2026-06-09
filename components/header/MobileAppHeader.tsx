"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

type Props = {
  cartCount: number;
  isOpen: boolean | null;
  scrolled?: boolean;
};

/**
 * Single mobile app header — fixed markup and styles for Safari, installed PWA,
 * and Android Chrome. Safe area is applied on this element only.
 */
export default function MobileAppHeader({
  cartCount,
  isOpen,
  scrolled = false,
}: Props) {
  const statusLabel =
    isOpen === null ? "…" : isOpen ? "Öppet nu" : "Stängt";

  return (
    <header
      className={`app-mobile-header lg:hidden ${scrolled ? "app-mobile-header--scrolled" : ""}`}
    >
      <div className="app-mobile-header__bar mx-auto max-w-7xl px-[var(--content-px)]">
        <div className="app-mobile-header__grid">
          <Link href="/" className="app-mobile-header__brand">
            Ellstorps Krog
          </Link>

          <p className="app-mobile-header__meta">
            <span>Malmö</span>
            <span className="app-mobile-header__dot" aria-hidden>
              •
            </span>
            <span
              className={
                isOpen
                  ? "app-mobile-header__status app-mobile-header__status--open"
                  : isOpen === false
                    ? "app-mobile-header__status app-mobile-header__status--closed"
                    : "app-mobile-header__status"
              }
            >
              {statusLabel}
            </span>
          </p>

          <Link
            href={cartCount > 0 ? "/checkout" : "/menu"}
            className="app-mobile-header__cart"
            aria-label={
              cartCount > 0
                ? `Varukorg, ${cartCount} artiklar`
                : "Gå till menyn"
            }
          >
            <ShoppingBag size={18} strokeWidth={1.65} aria-hidden />
            {cartCount > 0 && (
              <span className="app-mobile-header__cart-badge">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
