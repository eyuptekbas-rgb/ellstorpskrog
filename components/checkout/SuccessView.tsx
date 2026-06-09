import Link from "next/link";
import { ArrowRight, CheckCircle2, Home, Receipt } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import TrustBadges from "./TrustBadges";

type Props = {
  loading: boolean;
  error: string;
  orderNumber: string;
  total: number;
  cashOrder: boolean;
};

export default function SuccessView({
  loading,
  error,
  orderNumber,
  total,
  cashOrder,
}: Props) {
  if (loading) {
    return (
      <div className="space-y-8">
        <LoadingSpinner label="Verifierar betalning…" size="lg" />
        <TrustBadges />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/30">
          <span className="text-3xl text-red-400">✕</span>
        </div>
        <div>
          <h1 className="font-serif text-3xl text-white">Något gick fel</h1>
          <p className="mt-2 text-sm text-white/55">{error}</p>
        </div>
        <Link
          href="/checkout"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b85c38] py-4 font-semibold text-white transition hover:bg-[#a04f30]"
        >
          Tillbaka till kassan
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative mx-auto w-fit">
        <div className="absolute inset-0 animate-ping rounded-full bg-[#b85c38]/20" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#b85c38]/15 ring-2 ring-[#b85c38]/40">
          <CheckCircle2 size={48} className="text-[#d4a574]" strokeWidth={1.5} />
        </div>
      </div>

      <div>
        <p className="text-[#d4a574] text-xs font-medium tracking-[0.2em] uppercase mb-2">
          Order bekräftad
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-white">
          Tack för din beställning!
        </h1>
        <p className="mt-3 text-sm text-white/55 leading-relaxed">
          {cashOrder
            ? "Vi har mottagit din order och återkommer så snart som möjligt."
            : "Betalningen är genomförd. Vi har mottagit din order och börjar tillaga din mat."}
        </p>
      </div>

      {(orderNumber || total > 0) && (
        <div className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 space-y-4 text-left">
          {orderNumber && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b85c38]/15 text-[#d4a574]">
                <Receipt size={20} />
              </div>
              <div>
                <p className="text-xs text-white/40">Ordernummer</p>
                <p className="font-semibold text-[#e8c4a8]">{orderNumber}</p>
              </div>
            </div>
          )}
          {total > 0 && (
            <div className="flex items-center justify-between border-t border-white/6 pt-4">
              <span className="text-sm text-white/50">Totalt betalt</span>
              <span className="font-serif text-2xl text-white">
                {total}
                <span className="text-sm font-sans text-white/40 ml-1">kr</span>
              </span>
            </div>
          )}
        </div>
      )}

      <TrustBadges />

      <div className="space-y-3">
        <Link
          href="/menu"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b85c38] py-4 font-semibold text-white transition hover:bg-[#a04f30]"
        >
          <Home size={18} />
          Beställ mer
        </Link>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center py-3 text-sm text-white/45 transition hover:text-white"
        >
          Till startsidan
        </Link>
      </div>
    </div>
  );
}
