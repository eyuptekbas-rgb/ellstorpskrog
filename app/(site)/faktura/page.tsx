"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileSearch, Loader2 } from "lucide-react";
import FakturaDocument from "@/components/faktura/FakturaDocument";
import type { InvoiceData } from "@/lib/economy/invoice";

const FAKTURA_EMAIL_KEY = "faktura_customer_email";

function FakturaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledOrderNumber = searchParams.get("orderNumber") ?? "";
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token");

  const [orderNumber, setOrderNumber] = useState(prefilledOrderNumber);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(Boolean(orderId && token));
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);

  const lookupInvoice = useCallback(
    async (number: string, customerEmail: string) => {
      setLoading(true);
      setError("");
      setInvoice(null);

      try {
        const res = await fetch("/api/faktura/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: number.trim(),
            email: customerEmail.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Lookup failed");

        setInvoice(data.invoice);
        router.replace(
          `/faktura?orderId=${encodeURIComponent(data.orderId)}&token=${encodeURIComponent(data.token)}`,
          { scroll: false }
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Kunde inte hitta fakturan."
        );
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    const savedEmail = sessionStorage.getItem(FAKTURA_EMAIL_KEY);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  useEffect(() => {
    if (!orderId || !token) return;

    setLoading(true);
    setError("");

    fetch(`/api/faktura/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { invoice: InvoiceData }) => setInvoice(data.invoice))
      .catch(() => setError("Kunde inte hämta fakturan. Länken kan ha gått ut."))
      .finally(() => setLoading(false));
  }, [orderId, token]);

  useEffect(() => {
    if (!prefilledOrderNumber || orderId || invoice) return;
    const savedEmail = sessionStorage.getItem(FAKTURA_EMAIL_KEY);
    if (!savedEmail) return;

    setEmail(savedEmail);
    void lookupInvoice(prefilledOrderNumber, savedEmail);
  }, [prefilledOrderNumber, orderId, invoice, lookupInvoice]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await lookupInvoice(orderNumber, email);
  }

  return (
    <div className="px-4 py-8 pb-28 lg:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Till startsidan
        </Link>

        <header className="mb-8">
          <p className="section-label mb-2">Kundservice</p>
          <h1 className="text-display text-3xl text-white">Faktura</h1>
          <p className="text-body mt-3 max-w-xl text-sm text-white/55">
            Hämta och skriv ut faktura för din beställning. Ange ordernummer och
            samma e-postadress som du använde vid beställningen.
          </p>
        </header>

        {!invoice && (
          <form
            onSubmit={handleSubmit}
            className="card-premium mb-8 space-y-4 rounded-2xl p-6"
          >
            <div>
              <label htmlFor="faktura-order" className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/45">
                Ordernummer
              </label>
              <input
                id="faktura-order"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
                placeholder="t.ex. 1042"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[var(--brand-copper)]/45"
              />
            </div>
            <div>
              <label htmlFor="faktura-email" className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/45">
                E-post
              </label>
              <input
                id="faktura-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="din@email.se"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[var(--brand-copper)]/45"
              />
            </div>
            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <FileSearch size={18} />
              )}
              {loading ? "Söker faktura…" : "Visa faktura"}
            </button>
          </form>
        )}

        {loading && !invoice && orderId && (
          <div className="py-16 text-center text-white/45">
            <Loader2 size={28} className="mx-auto mb-3 animate-spin" />
            Laddar faktura…
          </div>
        )}

        {invoice && (
          <div className="space-y-4">
            <FakturaDocument invoice={invoice} />
            <button
              type="button"
              onClick={() => {
                setInvoice(null);
                router.replace("/faktura", { scroll: false });
              }}
              className="mx-auto block text-sm text-white/45 transition hover:text-white"
            >
              Sök en annan faktura
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FakturaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-white/45">
          Laddar…
        </div>
      }
    >
      <FakturaContent />
    </Suspense>
  );
}
