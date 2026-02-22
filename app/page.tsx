"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";

export default function Home() {
  const [showDelivery, setShowDelivery] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const [reservationSent, setReservationSent] = useState(false);
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

  const closeNews = () => {
    setShowNews(false);
    localStorage.setItem("newsSeen", "true");
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <main className="bg-gradient-to-b from-[#0f0f0f] via-[#111111] to-[#141414] text-white min-h-screen">

      {/* HERO */}
      <section className="relative w-full h-[420px] overflow-hidden">
        <Image
          src="/hero.jpg"
          alt="Ellstorps Krog"
          fill
          priority
          className="object-cover brightness-95"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80"></div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-4xl font-serif tracking-wide">
            Välkommen till Ellstorps Krog
          </h1>

          <div className="w-24 h-[2px] bg-[#b85c38] rounded-full mt-5 mb-4"></div>

          <p className="text-white/70 text-sm">
            Klassisk husmanskost i hjärtat av Malmö
          </p>

          <p className={`mt-4 text-sm font-semibold ${isOpen ? "text-[#b85c38]" : "text-red-400"}`}>
            {isOpen ? "🟢 Öppet nu" : "🔴 Stängt"}
          </p>
        </div>
      </section>

      {/* BESTÄLL ONLINE */}
      <section className="px-6 py-16 text-center space-y-5">
        <h2 className="text-2xl font-serif mb-4">Beställ Online</h2>

        <button className="w-full bg-[#b85c38] text-white py-5 text-lg rounded-2xl font-semibold hover:bg-[#9e4e2f] transition">
          🥡 Ta med
        </button>

        <a
          href="tel:+4640184268"
          className="block w-full bg-[#b85c38] text-white py-5 text-lg rounded-2xl font-semibold hover:bg-[#9e4e2f] transition"
        >
          📞 Ring nu
        </a>

        <button
          onClick={() => setShowDelivery(true)}
          className="w-full bg-[#b85c38] text-white py-5 text-lg rounded-2xl font-semibold hover:bg-[#9e4e2f] transition"
        >
          🚚 Hemkörning
        </button>

        <button
          onClick={() => setShowReservation(true)}
          className="w-full bg-white text-black py-5 text-lg rounded-2xl font-semibold"
        >
          📅 Boka Bord
        </button>
      </section>

      {/* DELIVERY POPUP */}
      {showDelivery && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm px-4">
          <div className="bg-[#1a1a1a] w-full max-w-sm rounded-2xl p-8 space-y-5 border border-[#b85c38]/40">
            <h3 className="text-xl font-serif text-center">Välj leverans</h3>

            <a href="https://wolt.com" target="_blank" className="block bg-[#b85c38] text-white py-4 rounded-2xl text-center">
              Wolt
            </a>

            <a href="https://foodora.se" target="_blank" className="block bg-[#b85c38] text-white py-4 rounded-2xl text-center">
              Foodora
            </a>

            <button
              onClick={() => setShowDelivery(false)}
              className="text-center w-full text-sm text-white/50"
            >
              Luk
            </button>
          </div>
        </div>
      )}

      {/* RESERVATION POPUP */}
      {showReservation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm px-4">
          <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl p-8 space-y-6 border border-[#b85c38]/40">

            {!reservationSent ? (
              <>
                <h3 className="text-2xl font-serif text-center">
                  Reserver Bord
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setReservationSent(true);
                  }}
                  className="space-y-4"
                >

                  <input
                    type="text"
                    placeholder="Navn"
                    required
                    className="w-full bg-[#111] border border-[#b85c38]/30 rounded-2xl p-4 focus:outline-none focus:border-[#b85c38]"
                  />

                  <input
                    type="tel"
                    placeholder="Telefonnummer"
                    required
                    className="w-full bg-[#111] border border-[#b85c38]/30 rounded-2xl p-4 focus:outline-none focus:border-[#b85c38]"
                  />

                  <input
                    type="number"
                    placeholder="Antal personer"
                    required
                    className="w-full bg-[#111] border border-[#b85c38]/30 rounded-2xl p-4 focus:outline-none focus:border-[#b85c38]"
                  />

                  <input
                    type="date"
                    required
                    className="w-full bg-[#111] border border-[#b85c38]/30 rounded-2xl p-4 focus:outline-none focus:border-[#b85c38]"
                  />

                  <input
                    type="time"
                    required
                    className="w-full bg-[#111] border border-[#b85c38]/30 rounded-2xl p-4 focus:outline-none focus:border-[#b85c38]"
                  />

                  <button
                    type="submit"
                    className="w-full bg-[#b85c38] text-white py-4 rounded-2xl font-semibold hover:bg-[#9e4e2f] transition"
                  >
                    Send Reservation
                  </button>

                </form>

                <button
                  onClick={() => setShowReservation(false)}
                  className="text-center w-full text-sm text-white/50"
                >
                  Luk
                </button>
              </>
            ) : (
              <div className="text-center space-y-4">
                <h3 className="text-xl font-serif">
                  Tak for din reservation
                </h3>
                <p className="text-white/70 text-sm">
                  Vi kontakter dig hurtigst muligt.
                </p>
                <button
                  onClick={() => {
                    setReservationSent(false);
                    setShowReservation(false);
                  }}
                  className="w-full bg-[#b85c38] py-3 rounded-xl"
                >
                  Luk
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* TO TOP */}
      {showTop && (
        <button
          onClick={scrollTop}
          className="fixed bottom-40 right-4 bg-[#b85c38] text-white w-14 h-14 rounded-full"
        >
          ↑
        </button>
      )}

      <Footer />
      <BottomNav />
    </main>
  );
}