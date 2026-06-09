"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import BottomNav from "@/components/BottomNav";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import { usePwaInstallOptional } from "@/components/pwa/PwaInstallProvider";
import { LOGO_ALT, LOGO_PATH } from "@/lib/brand/images";

function KontoInstallCard() {
  const pwa = usePwaInstallOptional();

  if (!pwa?.canInstall) return null;

  return (
    <section
      aria-label="Installera app"
      className="mb-6 overflow-hidden rounded-2xl border border-[#b85c38]/25 bg-[#1a1a1a] p-5"
    >
      <div className="mb-4 flex items-center gap-4">
        <Image
          src={LOGO_PATH}
          alt={LOGO_ALT}
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 object-contain"
        />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#b85c38]">
            App
          </p>
          <h2 className="font-serif text-lg text-white">Installera Ellstorps Krog</h2>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            Beställ snabbare direkt från hemskärmen.
          </p>
        </div>
      </div>
      <InstallAppButton />
    </section>
  );
}

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0f0f0f] via-[#111111] to-[#141414] px-5 pb-[calc(var(--bottom-nav-height)+var(--bottom-nav-fab-overflow)+env(safe-area-inset-bottom,0px)+1rem)] text-white">
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
            Konto
          </p>
          <p className="mt-2 text-sm text-white/50">Logga in för att fortsätta</p>
        </div>

        <KontoInstallCard />

        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-white/50 uppercase tracking-wide mb-2"
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
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#b85c38]/50"
              placeholder="admin@ellstorpskrog.se"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-white/50 uppercase tracking-wide mb-2"
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
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#b85c38]/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#b85c38] hover:bg-[#9e4e2f] disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition"
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
    <>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white/50">
            Laddar…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
      <BottomNav />
    </>
  );
}
