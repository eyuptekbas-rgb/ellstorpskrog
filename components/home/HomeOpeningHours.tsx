import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { OPENING_HOURS_DISPLAY } from "@/lib/openingHours";

type Props = {
  isOpen: boolean;
};

export default function HomeOpeningHours({ isOpen }: Props) {
  return (
    <section className="px-[var(--content-px)] py-[var(--section-py-mobile)] lg:py-[var(--section-py)]">
      <div className="mx-auto max-w-6xl">
        <div className="card-premium overflow-hidden rounded-[var(--radius-card)] border border-white/[0.06]">
          <div className="grid lg:grid-cols-[1fr_1.1fr]">
            <div className="border-b border-white/[0.06] p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <p className="section-label mb-3">Besök oss</p>
              <h2 className="text-display text-2xl text-white sm:text-3xl lg:text-[2.25rem]">
                Öppettider
              </h2>
              <p className="text-body mt-3 max-w-sm text-sm text-white/50 sm:text-base">
                Servering, avhämtning och bordsbokning enligt schemat nedan.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOpen
                      ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                      : "bg-white/30"
                  }`}
                />
                <span className={isOpen ? "text-white" : "text-white/50"}>
                  {isOpen ? "Öppet nu" : "Stängt just nu"}
                </span>
              </div>

              <Link
                href="/kontakt"
                className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#b85c38] transition hover:text-[#d4a574]"
              >
                Kontakta oss
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="bg-white/[0.02] p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2 text-[#d4a574]">
                <Clock size={16} />
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                  Veckoschema
                </span>
              </div>
              <ul className="space-y-3">
                {OPENING_HOURS_DISPLAY.map(({ days, hours }) => (
                  <li
                    key={days}
                    className="flex items-center justify-between gap-4 border-b border-white/[0.05] pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-white/80">
                      {days}
                    </span>
                    <span className="text-sm tabular-nums text-[#e8c4a8]">
                      {hours}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
