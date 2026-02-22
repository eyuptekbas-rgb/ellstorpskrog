"use client";

import { createContext, useContext, useState } from "react";

type ReservationContextType = {
  openReservation: () => void;
};

const ReservationContext = createContext<ReservationContextType | null>(null);

export function useReservation() {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error("useReservation must be used inside ReservationProvider");
  }
  return context;
}

export default function ReservationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showReservation, setShowReservation] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <ReservationContext.Provider
      value={{ openReservation: () => setShowReservation(true) }}
    >
      {children}

      {showReservation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] backdrop-blur-sm px-4">
          <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl p-8 space-y-6 border border-[#b85c38]/40">

            {!sent ? (
              <>
                <h3 className="text-2xl font-serif text-center text-white">
                  Reserver Bord
                </h3>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSent(true);
                  }}
                  className="space-y-4"
                >
                  <input
                    type="text"
                    placeholder="Navn"
                    required
                    className="w-full bg-[#111] text-white border border-[#b85c38]/30 rounded-2xl p-4 focus:outline-none focus:border-[#b85c38]"
                  />

                  <input
                    type="tel"
                    placeholder="Telefonnummer"
                    required
                    className="w-full bg-[#111] text-white border border-[#b85c38]/30 rounded-2xl p-4 focus:outline-none focus:border-[#b85c38]"
                  />

                  <input
                    type="number"
                    placeholder="Antal personer"
                    required
                    className="w-full bg-[#111] text-white border border-[#b85c38]/30 rounded-2xl p-4 focus:outline-none focus:border-[#b85c38]"
                  />

                  <input
                    type="date"
                    required
                    className="w-full bg-[#111] text-white border border-[#b85c38]/30 rounded-2xl p-4 focus:outline-none focus:border-[#b85c38]"
                  />

                  <input
                    type="time"
                    required
                    className="w-full bg-[#111] text-white border border-[#b85c38]/30 rounded-2xl p-4 focus:outline-none focus:border-[#b85c38]"
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
              <div className="text-center space-y-4 text-white">
                <h3 className="text-xl font-serif">
                  Tak for din reservation
                </h3>
                <p className="text-white/70 text-sm">
                  Vi kontakter dig hurtigst muligt.
                </p>
                <button
                  onClick={() => {
                    setSent(false);
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
    </ReservationContext.Provider>
  );
}