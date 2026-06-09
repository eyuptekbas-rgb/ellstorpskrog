"use client";

import Link from "next/link";
import { Clock, Facebook, Instagram, Phone, X } from "lucide-react";
import { useEffect } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import {
  NAV_LINKS,
  OPENING_HOURS_DISPLAY,
  SITE_PHONE,
  SITE_PHONE_HREF,
  SOCIAL_LINKS,
} from "@/lib/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
  pathname: string;
  onReservation: () => void;
};

export default function MobileMenu({
  open,
  onClose,
  pathname,
  onReservation,
}: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close when route changes
  }, [pathname]);

  return (
    <>
      <div
        className={`mobile-menu-backdrop fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        id="mobile-menu"
        className={`mobile-menu-drawer fixed inset-y-0 right-0 z-[70] flex w-full max-w-[min(100vw,24rem)] flex-col border-l border-white/[0.08] lg:hidden ${
          open ? "mobile-menu-drawer--open" : ""
        }`}
        aria-hidden={!open}
        aria-label="Mobilmeny"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
          <BrandLogo size="header-mobile" onClick={onClose} />
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/70 transition hover:border-white/20 hover:text-white"
            aria-label="Stäng meny"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-8">
          <ul className="space-y-1">
            {NAV_LINKS.map(({ href, label, match }) => {
              const active = match(pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={`site-nav-link-mobile block rounded-2xl px-4 py-3.5 text-lg ${
                      active ? "site-nav-link-mobile--active" : ""
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReservation();
                }}
                className="site-nav-link-mobile block w-full rounded-2xl px-4 py-3.5 text-left text-lg"
              >
                Boka bord
              </button>
            </li>
          </ul>

          <div className="mt-10 space-y-3">
            <Link
              href="/menu"
              onClick={onClose}
              className="btn-primary flex w-full"
            >
              Beställ online
            </Link>
            <Link
              href="/kontakt"
              onClick={onClose}
              className="btn-secondary flex w-full"
            >
              <Phone size={18} />
              Kontakta oss
            </Link>
            <a href={SITE_PHONE_HREF} className="btn-secondary flex w-full">
              <Phone size={18} />
              {SITE_PHONE}
            </a>
          </div>

          <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center gap-2 text-[#d4a574]">
              <Clock size={16} />
              <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                Öppettider
              </span>
            </div>
            <ul className="space-y-2.5 text-sm">
              {OPENING_HOURS_DISPLAY.map(({ days, hours }) => (
                <li
                  key={days}
                  className="flex justify-between gap-4 text-white/65"
                >
                  <span>{days}</span>
                  <span className="text-white/40">{hours}</span>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="border-t border-white/[0.06] px-5 py-6">
          <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
            Följ oss
          </p>
          <div className="flex justify-center gap-3">
            {SOCIAL_LINKS.map(({ href, label, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-[#b85c38]/40 hover:text-[#e8c4a8]"
              >
                {icon === "facebook" ? (
                  <Facebook size={18} />
                ) : (
                  <Instagram size={18} />
                )}
              </a>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
