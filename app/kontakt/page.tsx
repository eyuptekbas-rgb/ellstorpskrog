"use client";

import { useState } from "react";
import BottomNav from "../../components/BottomNav";
import { Phone, MapPin } from "lucide-react";
import { libre } from "../fonts";

export default function KontaktPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) throw new Error();

      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen text-white pb-28 bg-gradient-to-b from-black via-zinc-950 to-black">
      <section className="max-w-md mx-auto px-6 pt-10">

        {/* TITEL */}
        <h1 className={`${libre.className} text-4xl text-center mb-2 tracking-wide`}>
          Kontakta Oss
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Har du några frågor eller funderingar? Hör av dig till oss här.
        </p>

        {/* FORMULÄR */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-lg mb-10">
          <h2 className="text-lg font-medium mb-4">Skicka meddelande</h2>

          {error && (
            <div className="mb-4 rounded-xl bg-red-900/40 border border-red-700 p-3 text-red-300">
              Det gick inte att skicka meddelandet just nu. Försök igen lite senare.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Namn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-white text-black outline-none"
            />
            <input
              type="email"
              placeholder="E-post"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-white text-black outline-none"
            />
            <textarea
              placeholder="Ditt meddelande..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-white text-black outline-none h-32"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black p-3 rounded-xl font-semibold hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? "Skickar…" : "Skicka Meddelande"}
            </button>
          </form>
        </div>

        {/* INFO SEKTION */}
        <div className="space-y-4">

          {/* TELEFON */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm text-gray-400 mb-2">Telefon</p>
            <a
              href="tel:+4640184268"
              className="flex items-center gap-3 text-lg font-medium hover:opacity-80"
            >
              <Phone size={22} />
              Ring +46 40 18 42 68
            </a>
          </div>

          {/* ADRESS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm text-gray-400 mb-2">Adress</p>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={18} />
              <span className="text-lg font-medium">
                Sallerupsvägen 28D<br />
                212 18 Malmö
              </span>
            </div>
          </div>

          {/* ÖPPETTIDER */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm text-gray-400 mb-3">Öppettider</p>

            <div className="space-y-2 text-lg font-medium">
              <div className="flex justify-between">
                <span>Måndag</span>
                <span>13:00 – 21:00</span>
              </div>
              <div className="flex justify-between">
                <span>Tisdag</span>
                <span>13:00 – 22:00</span>
              </div>
              <div className="flex justify-between">
                <span>Onsdag</span>
                <span>13:00 – 22:00</span>
              </div>
              <div className="flex justify-between">
                <span>Torsdag</span>
                <span>13:00 – 22:00</span>
              </div>
              <div className="flex justify-between">
                <span>Fredag</span>
                <span>13:00 – 23:00</span>
              </div>
              <div className="flex justify-between">
                <span>Lördag</span>
                <span>13:00 – 23:00</span>
              </div>
              <div className="flex justify-between">
                <span>Söndag</span>
                <span>13:00 – 21:00</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <BottomNav />
    </main>
  );
}
