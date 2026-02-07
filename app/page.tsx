"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";

export default function Home() {
  const [showDelivery, setShowDelivery] = useState(false);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [showTop, setShowTop] = useState(false);

  // show "to top" button
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openDelivery = () => {
    setLoadingDelivery(true);
    setTimeout(() => {
      setLoadingDelivery(false);
      setShowDelivery(true);
    }, 500);
  };

  const scrollDown = () => {
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="bg-black text-white min-h-screen">

      {/* HERO */}
      <section className="relative w-full h-[260px] overflow-hidden">
        <img
          src="/hero.jpg"
          alt="Ellstorps Krog"
          className="w-full h-full object-cover brightness-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-xl text-center px-4 drop-shadow-lg">
            Välkommen till Ellstorps Krog
          </h1>
        </div>

        {/* SCROLL PIL */}
        <button
          onClick={scrollDown}
          className="absolute bottom-3 w-full text-center text-white/70 animate-bounce"
        >
          ↓
        </button>
      </section>

      <div className="h-px bg-white/10 mx-6"></div>

      {/* INFO BOXES */}
      <section className="px-4 py-8 space-y-4">
        <h2 className="text-center text-3xl tracking-wide mb-4">
          VI HAR FULLSTÄNDIGA RÄTTIGHETER
        </h2>

        {[
          ["🎁", "10% Foodbonus", "Samla bonus vid varje beställning"],
          ["⭐", "5% Foodbonus", "Tipsa en vän och få extra bonus"],
          ["🎓", "10% Studentrabatt", "Gäller i restaurangen"],
          ["📅", "Boka bord", "Reservera snabbt och enkelt"],
        ].map(([icon, title, text], i) => (
          <div key={i} className="border border-white/30 rounded-xl p-4 flex gap-3 shadow-md shadow-black/40 transition hover:scale-[1.02] active:scale-95">
            <span className="text-2xl w-8 text-center">{icon}</span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-white/60">{text}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="h-px bg-white/10 mx-6"></div>

      {/* BESTÄLL ONLINE */}
      <section className="px-6 pb-10 text-center">
        <h4 className="text-xl mb-4 flex items-center justify-center gap-2">
          🍽️ BESTÄLL ONLINE
        </h4>

        <div className="space-y-3">
          <button className="w-full bg-white text-black py-3 rounded-xl font-semibold transition hover:opacity-90 active:scale-95">
            🥡 Ta med
          </button>

          <a
            href="tel:+46123456789"
            className="block w-full bg-white text-black py-3 rounded-xl font-semibold transition hover:opacity-90 active:scale-95"
          >
            📞 Ring nu
          </a>

          <button
            onClick={openDelivery}
            className="w-full bg-white text-black py-3 rounded-xl font-semibold transition hover:opacity-90 active:scale-95"
          >
            🚚 Hemkörning
          </button>
        </div>
      </section>

      {/* LOADER */}
      {loadingDelivery && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 text-white">
          Öppnar leverans...
        </div>
      )}

      {/* POPUP */}
      {showDelivery && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-xl p-6 w-[90%] max-w-sm text-center space-y-4 shadow-2xl">
            <h3 className="text-xl font-semibold">Välj leverans</h3>

            <a href="https://wolt.com" target="_blank" className="block bg-black text-white py-3 rounded-xl">
              Wolt
            </a>

            <a href="https://foodora.se" target="_blank" className="block bg-black text-white py-3 rounded-xl">
              Foodora
            </a>

            <button onClick={() => setShowDelivery(false)} className="text-sm text-gray-500">
              Stäng
            </button>
          </div>
        </div>
      )}

      {/* STICKY CALL BUTTON */}
      <a
        href="tel:+46123456789"
        className="fixed bottom-24 right-4 bg-white text-black w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
      >
        📞
      </a>

      {/* TO TOP */}
      {showTop && (
        <button
          onClick={scrollTop}
          className="fixed bottom-40 right-4 bg-white text-black w-12 h-12 rounded-full shadow-xl"
        >
          ↑
        </button>
      )}

      <p className="text-xs text-white/40 text-center pb-2">
        © Ellstorps Krog – Malmö
      </p>

      <Footer />
      <BottomNav />
    </main>
  );
}
