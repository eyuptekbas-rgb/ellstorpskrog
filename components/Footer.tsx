"use client";

import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  CreditCard,
  Map,
  Clock,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import BrandLogo from "@/components/brand/BrandLogo";
import CookieSettingsLink from "@/components/marketing/CookieSettingsLink";
import FooterReservationButton from "@/components/FooterReservationButton";
import { useTenantBranding } from "@/components/tenant/TenantBrandingProvider";
import { useTenantPublicPath } from "@/components/tenant/TenantPublicPathProvider";
import { OPENING_HOURS_DISPLAY } from "@/lib/openingHours";
import { phoneHref } from "@/lib/settings/utils";

export default function Footer() {
  const tp = useTenantPublicPath();
  const {
    restaurantName,
    phone,
    email,
    address,
    facebookUrl,
    instagramUrl,
  } = useTenantBranding();
  const mapsQuery = encodeURIComponent(address || restaurantName);

  return (
    <footer className="relative border-t border-[var(--brand-copper)]/20 bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--brand-copper)_8%,transparent),transparent_55%)]" />

      <div className="relative border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center sm:px-8 sm:py-12">
          <div>
            <p className="section-label mb-2">{restaurantName}</p>
            <p className="font-serif text-2xl text-white sm:text-3xl">Redo att beställa?</p>
            <p className="mt-2 max-w-sm text-sm text-white/45">
              Beställ online, boka bord eller ring oss — vi hjälper dig gärna.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href={tp("/menu")} className="btn-primary justify-center sm:justify-start">
              Beställ online
              <ArrowRight size={16} />
            </Link>
            <FooterReservationButton />
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-8 pt-12 sm:px-8">
        <div className="flex flex-col gap-6 border-b border-white/8 pb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            <BrandLogo size="footer" href={tp("/")} />
            {address && <p className="max-w-xs text-sm text-white/45">{address}</p>}
          </div>
          <div className="flex gap-3">
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-[var(--brand-copper)]/40 hover:bg-[var(--brand-copper)]/10 hover:text-white"
              >
                <Facebook size={18} />
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-[var(--brand-copper)]/40 hover:bg-[var(--brand-copper)]/10 hover:text-white"
              >
                <Instagram size={18} />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 py-10 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {address && (
            <div>
              <div className="mb-4 flex items-center gap-2 text-[var(--brand-gold)]">
                <MapPin size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Adress</span>
              </div>
              <p className="leading-relaxed text-white/65">{address}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/50">
                <a
                  href={`https://maps.google.com/?q=${mapsQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition hover:text-[var(--brand-copper)]"
                >
                  <Map size={13} />
                  Google Maps
                </a>
              </div>
            </div>
          )}

          <div>
            <div className="mb-4 flex items-center gap-2 text-[var(--brand-gold)]">
              <Phone size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Kontakt</span>
            </div>
            {email && (
              <a
                href={`mailto:${email}`}
                className="mb-2 flex items-center gap-2 text-white/65 transition hover:text-white"
              >
                <Mail size={14} className="shrink-0 opacity-60" />
                {email}
              </a>
            )}
            {phone && (
              <a
                href={phoneHref(phone)}
                className="flex items-center gap-2 text-white/65 transition hover:text-white"
              >
                <Phone size={14} className="shrink-0 opacity-60" />
                {phone}
              </a>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2 text-[var(--brand-gold)]">
              <Clock size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Öppettider</span>
            </div>
            <ul className="space-y-2 text-white/65">
              {OPENING_HOURS_DISPLAY.map(({ days, hours }) => (
                <li key={days} className="flex justify-between gap-4">
                  <span>{days}</span>
                  <span className="tabular-nums text-white/45">{hours}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2 text-[var(--brand-gold)]">
              <CreditCard size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Betalning</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { src: "/payments/visa.png", alt: "Visa", w: 34, h: 22 },
                { src: "/payments/mastercard.png", alt: "Mastercard", w: 34, h: 22 },
                { src: "/payments/applepay.png", alt: "Apple Pay", w: 34, h: 22 },
                { src: "/payments/swish.png", alt: "Swish", w: 50, h: 38 },
              ].map(({ src, alt, w, h }) => (
                <div key={alt} className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
                  <Image src={src} alt={alt} width={w} height={h} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 pb-8 text-xs text-white/40">
          <Link href={tp("/menu")} className="transition hover:text-[var(--brand-copper)]">
            Meny
          </Link>
          <Link href={tp("/kontakt")} className="transition hover:text-[var(--brand-copper)]">
            Kontakt
          </Link>
          <Link href={tp("/checkout")} className="transition hover:text-[var(--brand-copper)]">
            Beställ
          </Link>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/8 pt-6 text-xs text-white/35 sm:flex-row">
          <CookieSettingsLink />
          <p>
            © {new Date().getFullYear()} {restaurantName} — Alla rättigheter förbehållna
          </p>
        </div>
      </div>
    </footer>
  );
}
