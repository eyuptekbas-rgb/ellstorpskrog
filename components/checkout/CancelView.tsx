import Link from "next/link";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import TrustBadges from "./TrustBadges";

type Props = {
  orderId: string | null;
};

export default function CancelView({ orderId }: Props) {
  return (
    <div className="space-y-8">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10 ring-2 ring-amber-500/25">
        <span className="text-4xl text-amber-400">!</span>
      </div>

      <div>
        <p className="text-amber-400/80 text-xs font-medium tracking-[0.2em] uppercase mb-2">
          Betalning avbruten
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-white">
          Ingen debitering gjordes
        </h1>
        <p className="mt-3 text-sm text-white/55 leading-relaxed">
          Du avbröt betalningen. Din varukorg är sparad och du kan försöka igen
          när du vill.
          {orderId && " Ordern skapades inte färdig — inget har debiterats."}
        </p>
      </div>

      <div className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5">
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/50">
            <ShoppingBag size={20} />
          </div>
          <p className="text-sm text-white/55">
            Dina valda rätter finns kvar i varukorgen. Gå tillbaka till kassan
            för att slutföra beställningen.
          </p>
        </div>
      </div>

      <TrustBadges />

      <div className="space-y-3">
        <Link
          href="/checkout"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b85c38] py-4 font-semibold text-white transition hover:bg-[#a04f30]"
        >
          <ArrowRight size={18} />
          Tillbaka till kassan
        </Link>
        <Link
          href="/menu"
          className="inline-flex w-full items-center justify-center gap-2 py-3 text-sm text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Till menyn
        </Link>
      </div>
    </div>
  );
}
