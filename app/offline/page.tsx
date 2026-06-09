"use client";

import Link from "next/link";
import { Home, UtensilsCrossed, Phone } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-[#b85c38]/20 flex items-center justify-center text-4xl mb-6">
        📡
      </div>
      <h1 className="text-3xl font-serif mb-3">Du är offline</h1>
      <p className="text-white/60 text-sm max-w-sm leading-relaxed mb-8">
        Ingen internetanslutning hittades. Sidor du besökt tidigare kan fortfarande
        vara tillgängliga.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 bg-[#b85c38] hover:bg-[#9e4e2f] text-white font-semibold py-4 rounded-2xl transition"
        >
          <Home size={18} />
          Startsida
        </Link>
        <Link
          href="/menu"
          className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-white/10 hover:border-[#b85c38]/40 py-4 rounded-2xl transition"
        >
          <UtensilsCrossed size={18} />
          Meny
        </Link>
        <Link
          href="/kontakt"
          className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-white/10 hover:border-[#b85c38]/40 py-4 rounded-2xl transition"
        >
          <Phone size={18} />
          Kontakt
        </Link>
      </div>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-8 text-sm text-white/40 hover:text-white transition"
      >
        Försök igen
      </button>
    </div>
  );
}
