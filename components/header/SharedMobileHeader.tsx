"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

type Props = {
  homeHref: string;
  menuHref: string;
  checkoutHref: string;
  restaurantName: string;
  cartCount: number;
  cartTotal: number;
  isMenuPage: boolean;
  isOpen: boolean | null;
  scrolled?: boolean;
  location?: string;
};

function StatusChip({
  isOpen,
  label,
}: {
  isOpen: boolean | null;
  label: string;
}) {
  const tone =
    isOpen === true
      ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300/95"
      : isOpen === false
        ? "border-white/10 bg-white/[0.04] text-white/40"
        : "border-white/10 bg-white/[0.04] text-white/35";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none tracking-wide ${tone}`}
    >
      {isOpen !== null && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current shadow-[0_0_8px_currentColor]"
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}

function openCartDrawer() {
  window.dispatchEvent(new Event("open-cart-drawer"));
}

/**
 * Mobile header — Tailwind-only styles so layout works in Safari, PWA and dev over LAN.
 */
export default function SharedMobileHeader({
  homeHref,
  menuHref,
  checkoutHref,
  restaurantName,
  cartCount,
  cartTotal,
  isMenuPage,
  isOpen,
  scrolled = false,
  location = "Malmö",
}: Props) {
  const statusLabel =
    isOpen === null ? "…" : isOpen ? "Öppet nu" : "Stängt";

  const cartLabel =
    cartCount > 0
      ? `Varukorg, ${cartCount} artiklar, ${cartTotal} kr`
      : "Gå till menyn";

  const cartClassName =
    "relative flex shrink-0 min-h-[2.75rem] min-w-[2.75rem] flex-col items-center gap-px rounded-2xl border border-[#b85c38]/35 bg-gradient-to-b from-[#1a1412] to-[#0c0c0c] px-2.5 py-1 text-[#e8c4a8] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_4px_14px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/[0.05] transition-transform active:scale-[0.96]";

  const cartContent = (
    <>
      <span className="relative flex h-7 w-7 items-center justify-center">
        <ShoppingBag size={19} strokeWidth={1.55} aria-hidden />
        {cartCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[#b85c38] px-1 text-[0.5625rem] font-bold leading-none text-white shadow-[0_2px_8px_rgba(184,92,56,0.55)] ring-2 ring-[#070707]">
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        )}
      </span>
      {cartCount > 0 && (
        <span className="w-full text-center text-[10px] font-semibold leading-none tracking-wide tabular-nums text-[#d4a574]">
          {cartTotal} kr
        </span>
      )}
    </>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#070707]/88 pt-[env(safe-area-inset-top,0px)] backdrop-blur-2xl backdrop-saturate-[1.45] transition-[background-color,box-shadow,border-color] duration-300 lg:hidden ${
        scrolled
          ? "border-white/[0.1] bg-[#070707]/95 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.75)]"
          : ""
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#b85c38]/45 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto flex h-[var(--header-content-mobile)] max-h-[4.5rem] max-w-7xl items-center gap-3 px-[var(--content-px)]">
        <Link
          href={homeHref}
          className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 active:opacity-90"
        >
          <span className="truncate font-[family-name:var(--font-playfair)] text-[1.125rem] font-semibold leading-none tracking-[0.01em] text-white">
            {restaurantName}
          </span>

          <span className="flex items-center gap-2">
            <span className="text-[11px] font-medium leading-none text-white/45">
              {location}
            </span>
            <span
              className="h-0.5 w-0.5 shrink-0 rounded-full bg-white/25"
              aria-hidden
            />
            <StatusChip isOpen={isOpen} label={statusLabel} />
          </span>
        </Link>

        {isMenuPage ? (
          <button
            type="button"
            onClick={openCartDrawer}
            className={cartClassName}
            aria-label={cartLabel}
          >
            {cartContent}
          </button>
        ) : (
          <Link
            href={cartCount > 0 ? checkoutHref : menuHref}
            className={cartClassName}
            aria-label={cartLabel}
          >
            {cartContent}
          </Link>
        )}
      </div>
    </header>
  );
}
