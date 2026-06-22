"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Lock } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

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
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError("Fel e-post eller lösenord");
      return;
    }

    if (result?.url) {
      window.location.href = result.url;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0f0f0f] via-[#111111] to-[#141414] px-5 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandLogo
            size="hero"
            href="/"
            className="mx-auto mb-4"
            priority
          />
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b85c38]/15">
            <Lock size={24} className="text-[#b85c38]" />
          </div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#b85c38]">
            Personal
          </p>
          <p className="mt-2 text-sm text-white/50">
            Logga in för restaurangadministration
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-white/5 bg-[#1a1a1a] p-6"
        >
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/50"
            >
              E-post
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-white/30 focus:border-[#b85c38]/50 focus:outline-none"
              placeholder="admin@ellstorpskrog.se"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/50"
            >
              Lösenord
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-white/30 focus:border-[#b85c38]/50 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#b85c38] py-3.5 font-semibold text-white transition hover:bg-[#9e4e2f] disabled:opacity-50"
          >
            {loading ? "Loggar in…" : "Logga in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f] text-white/50">
          Laddar…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
