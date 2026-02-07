"use client";

import { useState } from "react";
import Image from "next/image";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";

export default function Home() {
  const [showDelivery, setShowDelivery] = useState(false);

  return (
    <main className="bg-black text-white min-h-screen">

      {/* HERO */}
      <section className="relative w-full h-[260px] overflow-hidden">
        <img
          src="/hero.jpg"
          alt="Ellstorps Krog"
          className="w-full h-full object-cover brightness-105"
        />
        <div className="absolute inset-0 bg-black/30"></div>

        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-xl text-center px-4 drop-shadow-lg">
            Välkommen till Ellstorps Krog
          </h1>
        </div>
      </section>

      {/* INFO BOXES */}
      <section className="px-4 py-8 space-y-4">

        <h2 className="text-center text-2xl mb-4">
          VI HAR FULLSTÄNDIGA RÄTTIGHETER
        </h2>

        {/* 10% BONUS */}
        <div className="border border-white/30 rounded-lg p-4 flex gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <p className="font-semibold">10% Foodbonus</p>
            <p className="text-sm text-white/60">Samla bonus vid varje beställning</p>
          </div>
        </div>

        {/* 5% BONUS – TILFØJET */}
        <div className="border border-white/30 rounded-lg p-4 flex gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="font-semibold">5% Foodbonus</p>
            <p className="text-sm text-white/60">Tipsa en vän och få extra bonus</p>
          </div>
        </div>

        {/* STUDENT */}
        <div className="border border-white/30 rounded-lg p-4 flex gap-3">
          <span className="text-2xl">🎓</span>
          <div>
            <p className="font-semibold">10% Studentrabatt</p>
            <p className="text-sm text-white/60">Gäller i restaurangen</p>
          </div>
        </div>

        {/* BOKA BORD */}
        <div className="border border-white/30 rounded-lg p-4 flex gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <p className="font-semibold">Boka bord</p>
            <p className="text-sm text-white/60">Reservera snabbt och enkelt</p>
          </div>
        </div>

      </section>

      {/* BESTÄLL ONLINE */}
      <section className="px-6 pb-10 text-center">
        <h4 className="text-xl mb-4">BESTÄLL ONLINE</h4>

        <div className="space-y-3">
          <button className="w-full bg-white text-black py-3 rounded-lg font-semibold">
            Ta med
          </button>

          <button
            onClick={() => setShowDelivery(true)}
            className="w-full bg-white text-black py-3 rounded-lg font-semibold"
          >
            Hemkörning
          </button>
        </div>
      </section>

      {/* POPUP */}
      {showDelivery && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-xl p-6 w-[90%] max-w-sm text-center space-y-4">
            <h3 className="text-xl font-semibold">Välj leverans</h3>

            {/* WOLT */}
            <a
              href="https://wolt.com/en/swe/malmo/restaurant/ellstorps-kvarterskrog?srsltid=AfmBOopZgnldrLhIWOll1nxEA9EBlRxcAoqFxqxL2k9ZCzA3b446-oRc"
              target="_blank"
              className="flex items-center justify-center gap-3 w-full bg-black text-white py-3 rounded-lg"
            >
              <Image
                src="/wolt.png"
                alt="Wolt"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
              />
              <span className="font-semibold w-24 text-left">Wolt</span>
            </a>

            {/* FOODORA */}
            <a
              href="https://www.foodora.se/en/restaurant/xrv9/ellstorps-kvarterskrog"
              target="_blank"
              className="flex items-center justify-center gap-3 w-full bg-black text-white py-3 rounded-lg"
            >
              <Image
                src="/foodora.png"
                alt="Foodora"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
              />
              <span className="font-semibold w-24 text-left">Foodora</span>
            </a>

            <button
              onClick={() => setShowDelivery(false)}
              className="text-sm text-gray-500 mt-2"
            >
              Stäng
            </button>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </main>
  );
}
