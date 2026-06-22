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
import { useConceptLayout } from "@/components/concepts/ConceptLayoutProvider";
import { useTenantBranding } from "@/components/tenant/TenantBrandingProvider";
import {
  OPENING_HOURS_DISPLAY,
  OPENING_HOURS_WEEKLY,
} from "@/lib/openingHours";
import { phoneHref } from "@/lib/settings/utils";

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

function useContactForm() {
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

  return {
    name,
    setName,
    email,
    setEmail,
    message,
    setMessage,
    loading,
    error,
    sent,
    handleSubmit,
  };
}

function ContactForm({
  form,
  compact = false,
}: {
  form: ReturnType<typeof useContactForm>;
  compact?: boolean;
}) {
  return (
    <GlassCard className={compact ? "p-4" : "p-5 sm:p-6"}>
      <div className={`mb-5 flex items-start gap-3 ${compact ? "mb-3" : ""}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-copper)]/15 text-[var(--brand-cream)]">
          <Mail size={18} strokeWidth={1.75} />
        </span>
        <div>
          <h2 className={`${libre.className} text-xl text-white`}>Skicka meddelande</h2>
          <p className="mt-1 text-sm text-white/45">
            Vi svarar inom 24 timmar.
          </p>
        </div>
      </div>

      {form.sent && (
        <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Tack! Ditt meddelande har skickats.
        </div>
      )}

      {form.error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Det gick inte att skicka meddelandet. Försök igen senare.
        </div>
      )}

      <form onSubmit={form.handleSubmit} className="space-y-3.5">
        <input
          value={form.name}
          onChange={(e) => form.setName(e.target.value)}
          placeholder="Namn"
          required
          autoComplete="name"
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[var(--brand-copper)]/45"
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => form.setEmail(e.target.value)}
          placeholder="E-post"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[var(--brand-copper)]/45"
        />
        <textarea
          value={form.message}
          onChange={(e) => form.setMessage(e.target.value)}
          placeholder="Ditt meddelande…"
          required
          rows={compact ? 3 : 4}
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[var(--brand-copper)]/45"
        />
        <button
          type="submit"
          disabled={form.loading}
          className="btn-primary flex w-full items-center justify-center gap-2 !py-3.5 text-sm disabled:opacity-60"
        >
          <Send size={16} />
          {form.loading ? "Skickar…" : "Skicka meddelande"}
        </button>
      </form>
    </GlassCard>
  );
}

function HoursBlock({ stacked = false }: { stacked?: boolean }) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-copper)]/15 text-[var(--brand-cream)]">
          <Clock size={18} strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--brand-gold)]">
            Öppettider
          </p>
          <p className="text-xs text-white/45">Servering & avhämtning</p>
        </div>
      </div>
      <ul className={`space-y-2 border-t border-white/[0.06] pt-4 ${stacked ? "text-center" : ""}`}>
        {OPENING_HOURS_DISPLAY.map(({ days, hours }) => (
          <li key={days} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-white/70">{days}</span>
            <span className="font-medium tabular-nums text-[var(--brand-cream)]">{hours}</span>
          </li>
        ))}
      </ul>
      <details className="group mt-4 border-t border-white/[0.06] pt-4">
        <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-[0.12em] text-white/40 [&::-webkit-details-marker]:hidden">
          Visa alla dagar
        </summary>
        <ul className="mt-3 space-y-1.5">
          {OPENING_HOURS_WEEKLY.map(({ day, hours }) => (
            <li key={day} className="flex justify-between gap-4 text-xs text-white/55">
              <span>{day}</span>
              <span className="tabular-nums">{hours}</span>
            </li>
          ))}
        </ul>
      </details>
    </GlassCard>
  );
}

function MapBlock({ embed, directions }: { mapsQuery?: string; embed: string; directions: string }) {
  return (
    <section aria-label="Karta">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="section-label mb-1">Hitta hit</p>
          <h2 className={`${libre.className} text-xl text-white`}>Välkommen</h2>
        </div>
        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--brand-gold)]"
        >
          Öppna i Maps
        </a>
      </div>
      <GlassCard className="p-1.5">
        <div className="overflow-hidden rounded-[1.1rem] border border-white/[0.06]">
          <iframe
            title="Karta"
            src={embed}
            className="aspect-[4/3] w-full border-0 bg-[#111]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </GlassCard>
    </section>
  );
}

export default function ConceptContactPage() {
  const { layoutId } = useConceptLayout();
  const { restaurantName, phone, address } = useTenantBranding();
  const form = useContactForm();

  const street = address?.split(",")[0]?.trim() ?? "Sallerupsvägen 28D";
  const city = address?.includes(",") ? address.split(",").slice(1).join(",").trim() : "212 18 Malmö";
  const mapsQuery = encodeURIComponent(address ?? "Sallerupsvägen 28D, Malmö, Sweden");
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;
  const embed = `https://maps.google.com/maps?q=${mapsQuery}&hl=sv&z=15&output=embed`;
  const tel = phoneHref(phone);

  const quickActions = (
    <div className="mb-8 grid grid-cols-2 gap-3">
      <a href={tel} className="btn-primary flex min-h-[3.75rem] items-center justify-center gap-2.5 !px-4 !py-3.5 text-sm">
        <Phone size={18} /> Ring nu
      </a>
      <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-secondary flex min-h-[3.75rem] items-center justify-center gap-2.5 !px-4 !py-3.5 text-sm">
        <Navigation size={18} /> Vägvisning
      </a>
    </div>
  );

  const phoneCard = (
    <GlassCard className="p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-copper)]/15 text-[var(--brand-cream)]">
          <Phone size={18} />
        </span>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--brand-gold)]">Telefon</p>
      </div>
      <a href={tel} className="font-serif text-2xl text-white">{phone}</a>
    </GlassCard>
  );

  const addressCard = (
    <GlassCard className="p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-copper)]/15 text-[var(--brand-cream)]">
          <MapPin size={18} />
        </span>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--brand-gold)]">Adress</p>
      </div>
      <p className="font-serif text-xl text-white">{street}</p>
      <p className="mt-1 text-sm text-white/55">{city}</p>
    </GlassCard>
  );

  const traditionalHeader = (
    <header className="mb-8 text-center lg:mb-10 lg:text-left">
      <MobilePageLogo className="mx-auto mb-5" priority />
      <BrandLogo size="hero" href="/" className="mx-auto mb-5 hidden lg:mx-0 lg:mb-6 lg:block" priority />
      <p className="section-label mb-3">{restaurantName} · Malmö</p>
      <h1 className={`${libre.className} text-[2.125rem] leading-[1.12] tracking-tight sm:text-5xl`}>Kontakta oss</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55 lg:mx-0 lg:text-base">
        Vi finns här för bord, beställningar och frågor.
      </p>
    </header>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="relative mx-auto max-w-lg px-[var(--content-px)] pb-6 pt-6 lg:max-w-2xl lg:pb-10 lg:pt-10">
        {layoutId === "delivery-app" && (
          <>
            <header className="mb-6">
              <p className="text-xs opacity-45">Support</p>
              <h1 className="text-display text-2xl">Kontakta oss</h1>
            </header>
            {quickActions}
            <div className="mb-6 space-y-3">{phoneCard}{addressCard}</div>
            <ContactForm form={form} compact />
            <div className="mt-6"><HoursBlock /></div>
          </>
        )}

        {layoutId === "booking-first" && (
          <>
            <header className="mb-8 border-b border-white/[0.06] pb-6 text-center">
              <p className="section-label mb-2">Bokning & kontakt</p>
              <h1 className={`${libre.className} text-3xl`}>Hör av dig</h1>
            </header>
            <div className="mb-6 space-y-3">{phoneCard}<HoursBlock stacked /></div>
            <MapBlock mapsQuery={mapsQuery} embed={embed} directions={directions} />
            <div className="mt-6"><ContactForm form={form} /></div>
          </>
        )}

        {layoutId === "card-modular" && (
          <>
            <h1 className="text-display mb-6 text-2xl">Kontakt</h1>
            <div className="mb-6 grid grid-cols-2 gap-3">
              <a href={tel} className="card-premium flex flex-col rounded-[var(--radius-card)] p-4">
                <Phone size={20} className="mb-2 text-[var(--brand-copper)]" />
                <span className="text-sm font-semibold">Ring</span>
              </a>
              <a href={directions} target="_blank" rel="noopener noreferrer" className="card-premium flex flex-col rounded-[var(--radius-card)] p-4">
                <Navigation size={20} className="mb-2 text-[var(--brand-copper)]" />
                <span className="text-sm font-semibold">Karta</span>
              </a>
            </div>
            {addressCard}
            <div className="mt-4"><HoursBlock /></div>
            <div className="mt-6"><ContactForm form={form} compact /></div>
          </>
        )}

        {layoutId === "menu-first" && (
          <>
            <header className="mb-8 text-center">
              <h1 className="text-display text-3xl">Kontakt</h1>
              <a href={tel} className="btn-primary mt-6 inline-flex">{phone}</a>
            </header>
            <MapBlock mapsQuery={mapsQuery} embed={embed} directions={directions} />
            <div className="mt-6"><ContactForm form={form} compact /></div>
          </>
        )}

        {layoutId === "luxury-editorial" && (
          <>
            <header className="mb-10 border-b border-white/[0.06] pb-8">
              <p className="mb-4 text-[0.65rem] uppercase tracking-[0.35em] opacity-40">Kontakt</p>
              <h1 className={`${libre.className} text-4xl leading-none`}>Reach us</h1>
              <p className="mt-6 max-w-xs text-sm opacity-50">{street}, {city}</p>
              <a href={tel} className="mt-4 inline-block text-lg">{phone}</a>
            </header>
            <HoursBlock stacked />
            <div className="mt-8"><ContactForm form={form} /></div>
          </>
        )}

        {layoutId === "scandinavian-imagery" && (
          <>
            <div className="mb-8 aspect-video overflow-hidden rounded-[var(--radius-card)] bg-[var(--brand-elevated)]">
              <iframe title="Karta" src={embed} className="h-full w-full border-0" loading="lazy" />
            </div>
            <h1 className="text-display mb-2 text-2xl">{restaurantName}</h1>
            <p className="mb-6 text-sm opacity-50">{street}</p>
            <a href={tel} className="text-lg font-medium">{phone}</a>
            <div className="mt-8"><ContactForm form={form} compact /></div>
          </>
        )}

        {layoutId === "gastro-pub" && (
          <>
            <header className="mb-6">
              <h1 className="font-serif text-3xl">Hitta puben</h1>
              <p className="mt-2 text-sm opacity-50">Frågor om events eller bord?</p>
            </header>
            {quickActions}
            <div className="mb-6 space-y-3">{addressCard}<HoursBlock /></div>
            <ContactForm form={form} />
          </>
        )}

        {layoutId === "app-store-horizontal" && (
          <>
            <p className="section-label mb-2">Kontakt</p>
            <h1 className="text-display mb-6 text-2xl">Hitta hit</h1>
            <div className="mb-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[phoneCard, addressCard].map((card, i) => (
                <div key={i} className="w-[85vw] max-w-[320px] shrink-0">{card}</div>
              ))}
            </div>
            <MapBlock mapsQuery={mapsQuery} embed={embed} directions={directions} />
            <div className="mt-6"><ContactForm form={form} compact /></div>
          </>
        )}

        {layoutId === "fast-order" && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-display text-2xl">Kontakt</h1>
              <a href={tel} className="btn-primary btn-sm"><Phone size={16} /> Ring</a>
            </div>
            {addressCard}
            <div className="mt-4"><HoursBlock /></div>
            <div className="mt-6"><ContactForm form={form} compact /></div>
          </>
        )}

        {(layoutId === "traditional" || !layoutId) && (
          <>
            {traditionalHeader}
            {quickActions}
            <div className="mb-8 space-y-3">{phoneCard}{addressCard}<HoursBlock /></div>
            <MapBlock mapsQuery={mapsQuery} embed={embed} directions={directions} />
            <div className="mt-8"><ContactForm form={form} /></div>
          </>
        )}
      </div>
    </div>
  );
}
