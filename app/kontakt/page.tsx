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
      <section className="max-w-md mx-auto px-6 pt-10">

        <h1 className={`${libre.className} italic text-4xl text-center mb-2 tracking-wide`}>
          Kontakta Oss
        </h1>

        <p className="text-center text-gray-400 mb-8">
          Har du några frågor eller funderingar? Hör av dig till oss här.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-lg mb-10">
          <h2 className="text-lg font-medium mb-4">Skicka meddelande</h2>

          {error && (
            <div className="mb-4 rounded-xl bg-red-900/40 border border-red-700 p-3 text-red-300">
              Det gick inte att skicka meddelandet just nu.
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
              placeholder="E-post"
              required
              className="w-full p-3 rounded-xl bg-white text-black"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ditt meddelande..."
              required
              className="w-full p-3 h-32 rounded-xl bg-white text-black"
            />
            <button
              disabled={loading}
              className="w-full bg-white text-black p-3 rounded-xl font-semibold"
            >
              {loading ? "Skickar…" : "Skicka Meddelande"}
            </button>
          </form>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
