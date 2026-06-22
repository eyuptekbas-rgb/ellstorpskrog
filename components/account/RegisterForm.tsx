"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { AccountField } from "@/components/account/AccountUi";

export default function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/account/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        email,
        address,
        postalCode,
        city,
        password,
      }),
    });

    const data = (await res.json()) as { error?: string };

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Kunde inte skapa konto");
      return;
    }

    const login = await signIn("customer-credentials", {
      identifier: email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (login?.error) {
      router.push("/konto/logga-in");
      return;
    }

    router.push("/konto");
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-md px-[var(--content-px)] pb-[calc(var(--bottom-nav-height)+var(--bottom-nav-fab-overflow)+env(safe-area-inset-bottom,0px)+1.5rem)] pt-[calc(var(--header-height-mobile)+1.5rem)] lg:hidden">
      <div className="mb-6">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b85c38]">
          Konto
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl text-white">
          Skapa konto
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Registrera dig med e-post och mobilnummer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/[0.06] bg-[#141414] p-5">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <AccountField
            id="firstName"
            label="Förnamn"
            autoComplete="given-name"
            value={firstName}
            onChange={setFirstName}
          />
          <AccountField
            id="lastName"
            label="Efternamn"
            autoComplete="family-name"
            value={lastName}
            onChange={setLastName}
          />
        </div>

        <AccountField
          id="phone"
          label="Telefon"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={setPhone}
          placeholder="070 123 45 67"
        />

        <AccountField
          id="email"
          label="E-post"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />

        <AccountField
          id="address"
          label="Adress"
          autoComplete="street-address"
          value={address}
          onChange={setAddress}
        />

        <div className="grid grid-cols-2 gap-3">
          <AccountField
            id="postalCode"
            label="Postnummer"
            autoComplete="postal-code"
            value={postalCode}
            onChange={setPostalCode}
          />
          <AccountField
            id="city"
            label="Stad"
            autoComplete="address-level2"
            value={city}
            onChange={setCity}
          />
        </div>

        <AccountField
          id="password"
          label="Lösenord"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          placeholder="Minst 8 tecken"
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full !py-3.5 text-sm disabled:opacity-60"
        >
          {loading ? "Skapar konto…" : "Skapa konto"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        Har du redan konto?{" "}
        <Link href="/konto/logga-in" className="font-medium text-[#e8c4a8]">
          Logga in
        </Link>
      </p>
    </div>
  );
}
