import Link from "next/link";
import { Clock, MapPin, ShoppingBag, Truck } from "lucide-react";

type Props = {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
};

export default function DeliveryPickup({
  pickupEnabled,
  deliveryEnabled,
}: Props) {
  if (!pickupEnabled && !deliveryEnabled) return null;

  return (
    <section className="border-y border-white/[0.05] bg-[#0c0c0c] px-[var(--content-px)] py-[var(--section-py-mobile)] lg:py-[var(--section-py)]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center lg:mb-12">
          <p className="section-label mb-3">Så beställer du</p>
          <h2 className="text-display text-2xl text-white sm:text-3xl lg:text-4xl">
            Avhämtning & hemleverans
          </h2>
          <p className="text-body mx-auto mt-3 max-w-lg text-sm text-white/50 sm:text-base">
            Välj det som passar dig — snabb avhämtning eller bekväm leverans
            direkt till dörren.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          {pickupEnabled && (
            <div className="card-premium relative overflow-hidden rounded-[var(--radius-card)] p-6 sm:p-8">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#b85c38]/12 blur-3xl" />
              <div className="relative">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b85c38]/15 text-[#b85c38]">
                  <ShoppingBag size={22} strokeWidth={1.75} />
                </div>
                <h3 className="font-serif text-xl text-white sm:text-2xl">
                  Avhämtning
                </h3>
                <p className="text-body mt-2 text-sm text-white/50">
                  Beställ online och hämta färdig mat hos oss.
                </p>
                <ul className="mb-6 mt-5 space-y-2.5 text-sm text-white/60">
                  <li className="flex items-center gap-3">
                    <Clock size={15} className="text-[#b85c38]" />
                    Klar på ca 20–30 min
                  </li>
                  <li className="flex items-center gap-3">
                    <MapPin size={15} className="text-[#b85c38]" />
                    Sallerupsvägen 28, Malmö
                  </li>
                </ul>
                <Link href="/menu" className="btn-primary w-full sm:w-auto">
                  Beställ för avhämtning
                </Link>
              </div>
            </div>
          )}

          {deliveryEnabled && (
            <div className="card-premium relative overflow-hidden rounded-[var(--radius-card)] p-6 sm:p-8">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#b85c38]/8 blur-3xl" />
              <div className="relative">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-white/75">
                  <Truck size={22} strokeWidth={1.75} />
                </div>
                <h3 className="font-serif text-xl text-white sm:text-2xl">
                  Hemleverans
                </h3>
                <p className="text-body mt-2 text-sm text-white/50">
                  Vi levererar varm mat till din adress i Malmö.
                </p>
                <ul className="mb-6 mt-5 space-y-2.5 text-sm text-white/60">
                  <li className="flex items-center gap-3">
                    <Clock size={15} className="text-white/45" />
                    Leverans ca 30–45 min
                  </li>
                  <li className="flex items-center gap-3">
                    <MapPin size={15} className="text-white/45" />
                    Malmö centrum & syd
                  </li>
                </ul>
                <Link href="/menu" className="btn-secondary w-full sm:w-auto">
                  Beställ hemleverans
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
