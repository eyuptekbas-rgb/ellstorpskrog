"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";

export default function Home() {
  const [showDelivery, setShowDelivery] = useState(false);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    setIsOpen(hour >= 11 && hour <= 22);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem("newsSeen");
    if (!seen) setShowNews(true);
  }, []);

  useEffect(() => {
    if (showNews) {
      const timer = setTimeout(() => closeNews(), 7000);
      return () => clearTimeout(timer);
    }
  }, [showNews]);

  const closeNews = () => {
    setShowNews(false);
    localStorage.setItem("newsSeen", "true");
  };

  const openDelivery = () => {
    setLoadingDelivery(true);
    setTimeout(() => {
      setLoadingDelivery(false);
      setShowDelivery(true);
    }, 500);
  };

  const scrollDown = () => window.scrollTo({ top: 500, behavior: "smooth" });
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <main className="bg-gradient-to-b from-[#0f0f0f] via-[#111111] to-[#141414] text-white min-h-screen">

      {/* HERO */}
      <section className="relative w-full h-[320px] overflow-hidden">
        <Image
          src="/hero.jpg"
          alt="Ellstorps Krog"
          fill
          priority
          className="object-cover brightness-95"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80"></div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 animate-fadeIn">
          <h1 className="text-3xl md:text-5xl font-serif tracking-wide">
            Välkommen till Ellstorps Krog
          </h1>

          <div className="w-24 h-[2px] bg-[#b85c38] rounded-full mt-5 mb-4"></div>

          <p className="text-white/70 text-sm">
            Klassisk husmanskost i hjärtat av Malmö
          </p>

          <p className={`mt-3 text-sm font-semibold ${isOpen ? "text-[#b85c38]" : "text-red-400"}`}>
            {isOpen ? "🟢 Öppet nu" : "🔴 Stängt"}
          </p>
        </div>

        <button onClick={scrollDown} className="absolute bottom-5 w-full text-center animate-bounce text-white/60">
          ↓
        </button>
      </section>

      {/* MENU PDF */}
      <section className="px-6 py-10 text-center">
        <a
          href="/menu.pdf"
          target="_blank"
          className="inline-block bg-[#b85c38] text-white px-8 py-4 rounded-2xl font-semibold transition duration-300 hover:bg-[#9e4e2f] hover:shadow-lg active:scale-95"
        >
          📄 Se Meny (PDF)
        </a>
      </section>

      {/* INFO BOXES */}
      <section className="px-6 py-12 space-y-6">
        <h2 className="text-center text-3xl tracking-wide">
          VI HAR FULLSTÄNDIGA RÄTTIGHETER
        </h2>

        {[
          ["🎁", "10% Foodbonus", "Samla bonus vid varje beställning"],
          ["⭐", "5% Foodbonus", "Tipsa en vän och få extra bonus"],
          ["🎓", "10% Studentrabatt", "Gäller i restaurangen"],
          ["📅", "Boka bord", "Reservera snabbt och enkelt"],
        ].map(([icon, title, text], i) => (
          <div
            key={i}
            className="bg-[#1a1a1a] border border-[#b85c38]/30 rounded-2xl p-6 flex gap-4 transition duration-300 hover:bg-[#b85c38]/10 hover:shadow-[0_0_30px_rgba(184,92,56,0.25)] active:scale-95"
          >
            <span className="text-2xl w-8 text-center">{icon}</span>
            <div>
              <p className="font-semibold text-lg">{title}</p>
              <p className="text-sm text-white/60 mt-1">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* BESTÄLL ONLINE */}
      <section className="px-6 pb-16 text-center">
        <h4 className="text-2xl mb-6 tracking-wide">
          BESTÄLL ONLINE
        </h4>

        <div className="space-y-4">
          <button className="w-full bg-[#b85c38] text-white py-4 rounded-2xl font-semibold transition duration-300 hover:bg-[#9e4e2f] hover:shadow-lg active:scale-95">
            🥡 Ta med
          </button>

          <a
            href="tel:+4640184268"
            className="block w-full bg-[#b85c38] text-white py-4 rounded-2xl font-semibold transition duration-300 hover:bg-[#9e4e2f] hover:shadow-lg active:scale-95"
          >
            📞 Ring nu
          </a>

          <button
            onClick={openDelivery}
            className="w-full bg-[#b85c38] text-white py-4 rounded-2xl font-semibold transition duration-300 hover:bg-[#9e4e2f] hover:shadow-lg active:scale-95"
          >
            🚚 Hemkörning
          </button>
        </div>
      </section>

      {/* DELIVERY POPUP */}
      {showDelivery && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 w-[90%] max-w-sm text-center space-y-5 shadow-2xl border border-[#b85c38]/40">
            <h3 className="text-xl font-semibold text-white">Välj leverans</h3>

            <a href="https://wolt.com" target="_blank" className="block bg-[#b85c38] text-white py-3 rounded-2xl">
              Wolt
            </a>

            <a href="https://foodora.se" target="_blank" className="block bg-[#b85c38] text-white py-3 rounded-2xl">
              Foodora
            </a>

            <button onClick={() => setShowDelivery(false)} className="text-sm text-white/50">
              Stäng
            </button>
          </div>
        </div>
      )}

      {/* NEWS POPUP */}
      {showNews && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 w-[90%] max-w-sm text-center space-y-5 shadow-2xl border border-[#b85c38]/40">
            <h3 className="text-xl font-semibold text-white">Information</h3>
            <p className="text-sm text-white/70">
              Her skriver du din egen nyhed.
            </p>
            <button onClick={closeNews} className="bg-[#b85c38] text-white px-4 py-2 rounded-xl">
              Stäng
            </button>
          </div>
        </div>
      )}

      {/* COOKIE TEXT */}
      <p className="text-center text-xs text-white/40 py-4">
        Integritet & Cookies
      </p>

      {/* STICKY CALL */}
      <a
        href="tel:+4640184268"
        className="fixed bottom-24 right-4 bg-[#b85c38] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(184,92,56,0.4)] transition hover:scale-110"
      >
        📞
      </a>

      {/* TO TOP */}
      {showTop && (
        <button
          onClick={scrollTop}
          className="fixed bottom-40 right-4 bg-[#b85c38] text-white w-12 h-12 rounded-full shadow-[0_0_20px_rgba(184,92,56,0.4)] transition hover:scale-110"
        >
          ↑
        </button>
      )}

      <p className="text-xs text-white/40 text-center pb-6">
        © {new Date().getFullYear()} Ellstorps Krog – Malmö
      </p>

      <Footer />
      <BottomNav />
    </main>
  );
}