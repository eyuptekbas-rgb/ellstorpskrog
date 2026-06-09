import { Lock, MapPin, ShieldCheck, Zap } from "lucide-react";

const badges = [
  {
    icon: ShieldCheck,
    title: "Säker betalning",
    description: "256-bit SSL · Stripe",
  },
  {
    icon: Lock,
    title: "Krypterad data",
    description: "Dina uppgifter skyddas",
  },
  {
    icon: Zap,
    title: "Snabb leverans",
    description: "Färsk mat, direkt till dig",
  },
  {
    icon: MapPin,
    title: "Lokal restaurang",
    description: "Ellstorps Krog, Malmö",
  },
] as const;

export default function TrustBadges() {
  return (
    <section className="space-y-4">
      <div className="checkout-secure-bar flex items-center justify-center gap-2.5 rounded-2xl px-4 py-3.5">
        <Lock size={15} className="text-[#d4a574]" strokeWidth={2} />
        <p className="text-xs font-semibold tracking-wide text-white/75">
          Säker checkout · Krypterad anslutning
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {badges.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col items-center rounded-2xl border border-white/[0.07] bg-white/[0.025] px-2 py-4 text-center sm:px-3"
          >
            <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#b85c38]/12 text-[#d4a574]">
              <Icon size={18} strokeWidth={1.75} />
            </div>
            <p className="text-[11px] font-semibold leading-tight text-white/90 sm:text-xs">
              {title}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-white/38">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
