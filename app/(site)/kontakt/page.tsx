"use client";

import { useState } from "react";
import {
  Clock,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Send,
} from "lucide-react";
import { libre } from "@/app/(site)/fonts";
import BrandLogo from "@/components/brand/BrandLogo";
import MobilePageLogo from "@/components/brand/MobilePageLogo";
import {
  OPENING_HOURS_DISPLAY,
  OPENING_HOURS_WEEKLY,
} from "@/lib/openingHours";
import { SITE_PHONE, SITE_PHONE_HREF } from "@/lib/navigation";

const ADDRESS = {
  street: "Sallerupsvägen 28D",
  city: "212 18 Malmö",
  full: "Sallerupsvägen 28D, 212 18 Malmö",
};

const MAPS_QUERY = encodeURIComponent("Sallerupsvägen 28D, Malmö, Sweden");
const GOOGLE_DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${MAPS_QUERY}`;
const MAP_EMBED = `https://maps.google.com/maps?q=${MAPS_QUERY}&hl=sv&z=15&output=embed`;

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`card-premium overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-white/[0.03] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

export default function KontaktPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    setSent(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) throw new Error();

      setName("");
      setEmail("");
      setMessage("");
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(184,92,56,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(212,165,116,0.05),transparent_50%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-lg px-[var(--content-px)] pb-6 pt-6 lg:max-w-2xl lg:pb-10 lg:pt-10">
        {/* 1. Hero */}
        <header className="mb-8 text-center lg:mb-10 lg:text-left">
          <MobilePageLogo className="mx-auto mb-5" priority />
          <BrandLogo
            size="hero"
            href="/"
            className="mx-auto mb-5 hidden lg:mx-0 lg:mb-6 lg:block"
            priority
          />
          <p className="section-label mb-3">Ellstorps Krog · Malmö</p>
          <h1
            className={`${libre.className} text-[2.125rem] leading-[1.12] tracking-tight text-white sm:text-5xl`}
          >
            Kontakta oss
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55 lg:mx-0 lg:text-base">
            Vi finns här för bord, beställningar och frågor. Ring oss direkt
            eller skicka ett meddelande — vi återkommer så snart vi kan.
          </p>
        </header>

        {/* 2. Quick actions */}
        <div className="mb-8 grid grid-cols-2 gap-3">
          <a
            href={SITE_PHONE_HREF}
            className="btn-primary flex min-h-[3.75rem] items-center justify-center gap-2.5 !px-4 !py-3.5 text-sm shadow-[0_12px_32px_-10px_rgba(184,92,56,0.55)]"
          >
            <Phone size={18} strokeWidth={2} />
            Ring nu
          </a>
          <a
            href={GOOGLE_DIRECTIONS}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex min-h-[3.75rem] items-center justify-center gap-2.5 !px-4 !py-3.5 text-sm"
          >
            <Navigation size={18} strokeWidth={2} />
            Få vägvisning
          </a>
        </div>

        {/* 3. Contact cards */}
        <div className="mb-8 space-y-3">
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b85c38]/15 text-[#e8c4a8]">
                <Phone size={18} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[#d4a574]">
                  Telefon
                </p>
                <p className="text-xs text-white/45">Snabbast svar</p>
              </div>
            </div>
            <a
              href={SITE_PHONE_HREF}
              className="font-serif text-2xl text-white transition hover:text-[#e8c4a8]"
            >
              {SITE_PHONE}
            </a>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b85c38]/15 text-[#e8c4a8]">
                <MapPin size={18} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[#d4a574]">
                  Adress
                </p>
                <p className="text-xs text-white/45">Malmö</p>
              </div>
            </div>
            <p className="font-serif text-xl leading-snug text-white">
              {ADDRESS.street}
            </p>
            <p className="mt-1 text-sm text-white/55">{ADDRESS.city}</p>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b85c38]/15 text-[#e8c4a8]">
                <Clock size={18} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[#d4a574]">
                  Öppettider
                </p>
                <p className="text-xs text-white/45">Servering & avhämtning</p>
              </div>
            </div>
            <ul className="space-y-2 border-t border-white/[0.06] pt-4">
              {OPENING_HOURS_DISPLAY.map(({ days, hours }) => (
                <li
                  key={days}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-white/70">{days}</span>
                  <span className="font-medium tabular-nums text-[#e8c4a8]">
                    {hours}
                  </span>
                </li>
              ))}
            </ul>
            <details className="group mt-4 border-t border-white/[0.06] pt-4">
              <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-[0.12em] text-white/40 transition hover:text-white/60 [&::-webkit-details-marker]:hidden">
                Visa alla dagar
              </summary>
              <ul className="mt-3 space-y-1.5">
                {OPENING_HOURS_WEEKLY.map(({ day, hours }) => (
                  <li
                    key={day}
                    className="flex justify-between gap-4 text-xs text-white/55"
                  >
                    <span>{day}</span>
                    <span className="tabular-nums">{hours}</span>
                  </li>
                ))}
              </ul>
            </details>
          </GlassCard>
        </div>

        {/* 4. Map */}
        <section className="mb-8" aria-label="Karta">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="section-label mb-1">Hitta hit</p>
              <h2 className={`${libre.className} text-xl text-white`}>
                Välkommen till Ellstorps Krog
              </h2>
            </div>
            <a
              href={GOOGLE_DIRECTIONS}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-semibold uppercase tracking-[0.1em] text-[#d4a574] transition hover:text-[#e8c4a8]"
            >
              Öppna i Maps
            </a>
          </div>
          <GlassCard className="p-1.5">
            <div className="overflow-hidden rounded-[1.1rem] border border-white/[0.06]">
              <iframe
                title="Ellstorps Krog på Google Maps"
                src={MAP_EMBED}
                className="aspect-[4/3] w-full border-0 bg-[#111] sm:aspect-[16/10]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </GlassCard>
        </section>

        {/* 5. Contact form */}
        <section aria-labelledby="contact-form-heading">
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b85c38]/15 text-[#e8c4a8]">
                <Mail size={18} strokeWidth={1.75} />
              </span>
              <div>
                <h2
                  id="contact-form-heading"
                  className={`${libre.className} text-xl text-white`}
                >
                  Skicka meddelande
                </h2>
                <p className="mt-1 text-sm text-white/45">
                  För bokningar och större sällskap — vi svarar inom 24 timmar.
                </p>
              </div>
            </div>

            {sent && (
              <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Tack! Ditt meddelande har skickats.
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                Det gick inte att skicka meddelandet. Försök igen senare.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="contact-name" className="sr-only">
                  Namn
                </label>
                <input
                  id="contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Namn"
                  required
                  autoComplete="name"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#b85c38]/45 focus:bg-white/[0.06]"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="sr-only">
                  E-post
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-post"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#b85c38]/45 focus:bg-white/[0.06]"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="sr-only">
                  Meddelande
                </label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ditt meddelande…"
                  required
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#b85c38]/45 focus:bg-white/[0.06]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex w-full items-center justify-center gap-2 !py-3.5 text-sm disabled:opacity-60"
              >
                <Send size={16} />
                {loading ? "Skickar…" : "Skicka meddelande"}
              </button>
            </form>
          </GlassCard>
        </section>
      </div>
    </div>
  );
}
