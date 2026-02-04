"use client";

import { useState } from "react";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
        }),
      });

      if (!res.ok) throw new Error("Fejl");

      setSuccess(true);
      e.currentTarget.reset();
    } catch {
      setError("Noget gik galt. Prøv igen senere.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-6 border border-black p-8"
    >
      <div>
        <label>Navn</label>
        <input name="name" required className="w-full border p-2" />
      </div>

      <div>
        <label>Email</label>
        <input
          type="email"
          name="email"
          required
          className="w-full border p-2"
        />
      </div>

      <div>
        <label>Besked</label>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full border p-2"
        />
      </div>

      <button
        disabled={loading}
        className="border px-6 py-2 hover:bg-black hover:text-white"
      >
        {loading ? "Sender..." : "Send besked"}
      </button>

      {success && <p>Tak. Din besked er sendt.</p>}
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
