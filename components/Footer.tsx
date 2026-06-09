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
import { OPENING_HOURS_DISPLAY } from "@/lib/openingHours";

export default function Footer() {
  return (
    <footer className="relative border-t border-[#b85c38]/20 bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(184,92,56,0.08),transparent_55%)] pointer-events-none" />

      {/* CTA band */}
      <div className="relative border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center sm:px-8 sm:py-12">
          <div>
            <p className="section-label mb-2">Ellstorps Krog</p>
            <p className="font-serif text-2xl text-white sm:text-3xl">
              Redo att beställa?
            </p>
            <p className="mt-2 max-w-sm text-sm text-white/45">
              Beställ online, boka bord eller ring oss — vi hjälper dig gärna.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/menu" className="btn-primary justify-center sm:justify-start">
              Beställ online
              <ArrowRight size={16} />
            </Link>
            <FooterReservationButton />
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-8">
        {/* Brand row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-10 border-b border-white/8">
          <div className="flex flex-col gap-3">
            <BrandLogo size="footer" href="/" />
            <p className="text-sm text-white/45 max-w-xs">
              Klassisk mat i hjärtat av Malmö · Sallerupsvägen 28
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-[#b85c38]/40 hover:bg-[#b85c38]/10 hover:text-white"
            >
              <Facebook size={18} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-[#b85c38]/40 hover:bg-[#b85c38]/10 hover:text-white"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 py-10 text-sm">
          {/* Address */}
          <div>
            <div className="flex items-center gap-2 text-[#d4a574] mb-4">
              <MapPin size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Adress
              </span>
            </div>
            <p className="text-white/65 leading-relaxed">
              Sallerupsvägen 28
              <br />
              212 18 Malmö
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-white/50">
              <a
                href="https://maps.google.com/?q=Sallerupsvägen+28+Malmö"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-[#b85c38] transition"
              >
                <Map size={13} />
                Google Maps
              </a>
              <a
                href="https://maps.apple.com/?q=Sallerupsvägen+28+Malmö"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-[#b85c38] transition"
              >
                <Map size={13} />
                Apple Maps
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="flex items-center gap-2 text-[#d4a574] mb-4">
              <Phone size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Kontakt
              </span>
            </div>
            <a
              href="mailto:info@ellstorpskrog.se"
              className="flex items-center gap-2 text-white/65 hover:text-white transition mb-2"
            >
              <Mail size={14} className="shrink-0 opacity-60" />
              info@ellstorpskrog.se
            </a>
            <a
              href="tel:+4640184268"
              className="flex items-center gap-2 text-white/65 hover:text-white transition"
            >
              <Phone size={14} className="shrink-0 opacity-60" />
              040-18 42 68
            </a>
          </div>

          {/* Hours */}
          <div>
            <div className="flex items-center gap-2 text-[#d4a574] mb-4">
              <Clock size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Öppettider
              </span>
            </div>
            <ul className="space-y-2 text-white/65">
              {OPENING_HOURS_DISPLAY.map(({ days, hours }) => (
                <li key={days} className="flex justify-between gap-4">
                  <span>{days}</span>
                  <span className="text-white/45 tabular-nums">{hours}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Payments */}
          <div>
            <div className="flex items-center gap-2 text-[#d4a574] mb-4">
              <CreditCard size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Betalning
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { src: "/payments/visa.png", alt: "Visa", w: 34, h: 22 },
                { src: "/payments/mastercard.png", alt: "Mastercard", w: 34, h: 22 },
                { src: "/payments/applepay.png", alt: "Apple Pay", w: 34, h: 22 },
                { src: "/payments/swish.png", alt: "Swish", w: 50, h: 38 },
              ].map(({ src, alt, w, h }) => (
                <div
                  key={alt}
                  className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm"
                >
                  <Image src={src} alt={alt} width={w} height={h} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 pb-8 text-xs text-white/40">
          <Link href="/menu" className="hover:text-[#b85c38] transition">
            Meny
          </Link>
          <Link href="/kontakt" className="hover:text-[#b85c38] transition">
            Kontakt
          </Link>
          <Link href="/checkout" className="hover:text-[#b85c38] transition">
            Beställ
          </Link>
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/35">
          <CookieSettingsLink />
          <p>
            © {new Date().getFullYear()} Ellstorps Krog — Alla rättigheter
            förbehållna
          </p>
        </div>
      </div>
    </footer>
  );
}
