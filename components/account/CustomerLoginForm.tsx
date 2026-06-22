"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { AccountField } from "@/components/account/AccountUi";

export default function CustomerLoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("customer-credentials", {
      identifier,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Fel e-post/telefon eller lösenord");
      return;
    }

    router.push("/konto");
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-md px-[var(--content-px)] pb-[calc(var(--bottom-nav-height)+var(--bottom-nav-fab-overflow)+env(safe-area-inset-bottom,0px)+1.5rem)] pt-[calc(var(--header-height-mobile)+1.5rem)] lg:hidden">
      <div className="mb-8">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b85c38]">
          Konto
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl text-white">
          Logga in
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Använd e-post eller mobilnummer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/[0.06] bg-[#141414] p-5">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <AccountField
          id="identifier"
          label="E-post eller telefon"
          autoComplete="username"
          value={identifier}
          onChange={setIdentifier}
          placeholder="info@exempel.se eller 0701234567"
        />

        <AccountField
          id="password"
          label="Lösenord"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full !py-3.5 text-sm disabled:opacity-60"
        >
          {loading ? "Loggar in…" : "Logga in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        Inget konto?{" "}
        <Link href="/konto/registrera" className="font-medium text-[#e8c4a8]">
          Skapa konto
        </Link>
      </p>
    </div>
  );
}
