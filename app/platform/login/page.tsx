"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { ORDINA } from "@/lib/tenant/branding";

export default function PlatformLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/platform",
    });

    setLoading(false);

    if (result?.error) {
      setError("Fel e-post eller lösenord. Använd admin@ordina.se");
      return;
    }

    if (result?.url) {
      window.location.href = result.url;
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-5 text-white"
      style={{
        background: `linear-gradient(to bottom, #0a0612, ${ORDINA.surface}, #0f0a18)`,
      }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-serif font-bold text-white"
            style={{ background: `${ORDINA.primary}33`, color: ORDINA.accent }}
          >
            O
          </div>
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: ORDINA.accentMuted }}
          >
            {ORDINA.name} Platform
          </p>
          <h1 className="font-serif text-3xl tracking-wide">Logga in</h1>
          <p className="mt-2 text-sm text-white/50">{ORDINA.tagline}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border p-6"
          style={{
            background: ORDINA.surface,
            borderColor: ORDINA.border,
          }}
        >
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="ordina-email"
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/50"
            >
              E-post
            </label>
            <input
              id="ordina-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#7c3aed]/20 bg-[#0a0612] px-4 py-3 text-white placeholder:text-white/30 focus:border-[#7c3aed]/50 focus:outline-none"
              placeholder="admin@ordina.se"
            />
          </div>

          <div>
            <label
              htmlFor="ordina-password"
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/50"
            >
              Lösenord
            </label>
            <input
              id="ordina-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#7c3aed]/20 bg-[#0a0612] px-4 py-3 text-white placeholder:text-white/30 focus:border-[#7c3aed]/50 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3.5 font-semibold text-white transition disabled:opacity-50"
            style={{ background: ORDINA.primary }}
          >
            {loading ? "Loggar in…" : "Logga in till Ordina"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/35">
          Restaurang-admin?{" "}
          <a href="/login" className="text-[#a78bfa] hover:underline">
            Logga in här
          </a>
        </p>
      </div>
    </div>
  );
}
