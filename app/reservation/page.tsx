"use client";

import { useState } from "react";
import BottomNav from "../../components/BottomNav";
import { libre } from "../fonts";

export default function ReservationPage() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [people, setPeople] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, date, time, people, note }),
      });

      if (!res.ok) throw new Error();

      // Clear form
      setName("");
      setEmail("");
      setPhone("");
      setDate("");
      setTime("");
      setPeople(1);
      setNote("");
      setShowModal(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="
        min-h-screen
        text-white
        pb-28
        bg-black
        bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.015),rgba(255,255,255,0.015)_1px,transparent_1px,transparent_3px)]
        animate-[bwMove_30s_linear_infinite]
      "
    >
      <section className="max-w-md mx-auto px-6 pt-10 text-center">
        {/* TITEL */}
        <h1 className={`${libre.className} italic text-4xl mb-6`}>
          Boka Bord
        </h1>

        {/* RESERVATION KNAP */}
        <button
          className="bg-white text-black px-6 py-2 rounded-xl hover:bg-gray-200"
          onClick={() => setShowModal(true)}
        >
          Reservation
        </button>
      </section>

      {/* POPUP MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-3xl max-w-md w-full relative">
            <button
              className="absolute top-4 right-4 text-white text-2xl"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>

            <h2 className="text-2xl font-semibold text-center mb-4">Boka Bord</h2>

            {error && (
              <div className="mb-4 rounded-xl bg-red-900/40 border border-red-700 p-3 text-red-300">
                Det gick inte att skicka reservationen. Försök igen senare.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Namn"
                required
                className="w-full p-3 rounded-xl bg-white text-black"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                required
                className="w-full p-3 rounded-xl bg-white text-black"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefon"
                required
                className="w-full p-3 rounded-xl bg-white text-black"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-white text-black"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-white text-black"
              />
              <input
                type="number"
                value={people}
                onChange={(e) => setPeople(Number(e.target.value))}
                min={1}
                placeholder="Antal personer"
                required
                className="w-full p-3 rounded-xl bg-white text-black"
              />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Bemærkning (valgfri)"
                className="w-full p-3 rounded-xl bg-white text-black h-24"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black p-3 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? "Skickar…" : "Boka"}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
