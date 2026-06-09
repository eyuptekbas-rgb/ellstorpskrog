"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Save, ShieldCheck } from "lucide-react";

type PaymentsForm = {
  stripeEnabled: boolean;
  stripeTestMode: boolean;
  stripePublishableKeyTest: string;
  stripeSecretKeyTest: string;
  stripeWebhookSecretTest: string;
  stripePublishableKeyLive: string;
  stripeSecretKeyLive: string;
  stripeWebhookSecretLive: string;
};

type PaymentsResponse = PaymentsForm & {
  configured: boolean;
  activeMode: string;
  maskedPublishableKey: string;
  maskedSecretKey: string;
  hasEnvSecretKey: boolean;
  hasEnvPublishableKey: boolean;
  hasEnvWebhookSecret: boolean;
};

const emptyForm: PaymentsForm = {
  stripeEnabled: false,
  stripeTestMode: true,
  stripePublishableKeyTest: "",
  stripeSecretKeyTest: "",
  stripeWebhookSecretTest: "",
  stripePublishableKeyLive: "",
  stripeSecretKeyLive: "",
  stripeWebhookSecretLive: "",
};

export default function AdminPaymentsPage() {
  const [form, setForm] = useState<PaymentsForm>(emptyForm);
  const [meta, setMeta] = useState<Omit<PaymentsResponse, keyof PaymentsForm> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments");
      if (!res.ok) throw new Error();
      const data: PaymentsResponse = await res.json();
      setForm({
        stripeEnabled: data.stripeEnabled,
        stripeTestMode: data.stripeTestMode,
        stripePublishableKeyTest: data.stripePublishableKeyTest,
        stripeSecretKeyTest: data.stripeSecretKeyTest,
        stripeWebhookSecretTest: data.stripeWebhookSecretTest,
        stripePublishableKeyLive: data.stripePublishableKeyLive,
        stripeSecretKeyLive: data.stripeSecretKeyLive,
        stripeWebhookSecretLive: data.stripeWebhookSecretLive,
      });
      setMeta({
        configured: data.configured,
        activeMode: data.activeMode,
        maskedPublishableKey: data.maskedPublishableKey,
        maskedSecretKey: data.maskedSecretKey,
        hasEnvSecretKey: data.hasEnvSecretKey,
        hasEnvPublishableKey: data.hasEnvPublishableKey,
        hasEnvWebhookSecret: data.hasEnvWebhookSecret,
      });
    } catch {
      setError("Kunde inte hämta betalningsinställningar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data: PaymentsResponse = await res.json();
      setForm({
        stripeEnabled: data.stripeEnabled,
        stripeTestMode: data.stripeTestMode,
        stripePublishableKeyTest: data.stripePublishableKeyTest,
        stripeSecretKeyTest: data.stripeSecretKeyTest,
        stripeWebhookSecretTest: data.stripeWebhookSecretTest,
        stripePublishableKeyLive: data.stripePublishableKeyLive,
        stripeSecretKeyLive: data.stripeSecretKeyLive,
        stripeWebhookSecretLive: data.stripeWebhookSecretLive,
      });
      setMeta({
        configured: data.configured,
        activeMode: data.activeMode,
        maskedPublishableKey: data.maskedPublishableKey,
        maskedSecretKey: data.maskedSecretKey,
        hasEnvSecretKey: data.hasEnvSecretKey,
        hasEnvPublishableKey: data.hasEnvPublishableKey,
        hasEnvWebhookSecret: data.hasEnvWebhookSecret,
      });
      setSaved(true);
    } catch {
      setError("Kunde inte spara inställningar.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-[#111] border border-[#b85c38]/30 rounded-2xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#b85c38] transition disabled:opacity-40 font-mono text-sm";

  const modeLabel = form.stripeTestMode ? "Test" : "Live";
  const modePrefix = form.stripeTestMode ? "Test" : "Live";

  return (
    <div className="px-5 py-8 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-serif tracking-wide">Betalningar</h1>
        <div className="w-16 h-[2px] bg-[#b85c38] rounded-full mt-3 mb-2" />
        <p className="text-white/60 text-sm">
          Stripe Checkout — kortbetalning online
        </p>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-2xl p-4 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-900/30 border border-green-700/50 rounded-2xl p-4 text-green-300 text-sm mb-6">
          Inställningar sparade.
        </div>
      )}

      {loading ? (
        <p className="text-white/50">Laddar…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#b85c38]/15 flex items-center justify-center">
                <CreditCard size={20} className="text-[#b85c38]" />
              </div>
              <div>
                <h2 className="font-serif text-lg">Stripe</h2>
                <p className="text-white/50 text-xs">
                  Aktivt läge:{" "}
                  <span className="text-[#b85c38]">{modeLabel}</span>
                  {meta?.configured ? " · konfigurerad" : " · ej konfigurerad"}
                </p>
              </div>
            </div>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="font-medium text-sm">Aktivera kortbetalning</p>
                <p className="text-white/50 text-xs">
                  Visa Stripe Checkout i kassan
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.stripeEnabled}
                onChange={(e) =>
                  setForm({ ...form, stripeEnabled: e.target.checked })
                }
                className="w-5 h-5 rounded"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="font-medium text-sm">Testläge</p>
                <p className="text-white/50 text-xs">
                  Använd testnycklar (pk_test_ / sk_test_)
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.stripeTestMode}
                onChange={(e) =>
                  setForm({ ...form, stripeTestMode: e.target.checked })
                }
                className="w-5 h-5 rounded"
              />
            </label>
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-lg text-[#b85c38]">
              {modePrefix}-nycklar
            </h2>

            <div>
              <label className="text-xs text-white/50 mb-1 block">
                Publishable key
              </label>
              <input
                type="text"
                placeholder={`pk_${form.stripeTestMode ? "test" : "live"}_…`}
                value={
                  form.stripeTestMode
                    ? form.stripePublishableKeyTest
                    : form.stripePublishableKeyLive
                }
                onChange={(e) =>
                  setForm(
                    form.stripeTestMode
                      ? {
                          ...form,
                          stripePublishableKeyTest: e.target.value,
                        }
                      : {
                          ...form,
                          stripePublishableKeyLive: e.target.value,
                        }
                  )
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">
                Secret key
              </label>
              <input
                type="password"
                placeholder={`sk_${form.stripeTestMode ? "test" : "live"}_…`}
                value={
                  form.stripeTestMode
                    ? form.stripeSecretKeyTest
                    : form.stripeSecretKeyLive
                }
                onChange={(e) =>
                  setForm(
                    form.stripeTestMode
                      ? { ...form, stripeSecretKeyTest: e.target.value }
                      : { ...form, stripeSecretKeyLive: e.target.value }
                  )
                }
                className={inputClass}
              />
              {meta?.maskedSecretKey && (
                <p className="text-white/40 text-xs mt-1">
                  Sparad: {meta.maskedSecretKey}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">
                Webhook secret
              </label>
              <input
                type="password"
                placeholder="whsec_…"
                value={
                  form.stripeTestMode
                    ? form.stripeWebhookSecretTest
                    : form.stripeWebhookSecretLive
                }
                onChange={(e) =>
                  setForm(
                    form.stripeTestMode
                      ? {
                          ...form,
                          stripeWebhookSecretTest: e.target.value,
                        }
                      : {
                          ...form,
                          stripeWebhookSecretLive: e.target.value,
                        }
                  )
                }
                className={inputClass}
              />
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <ShieldCheck size={16} className="text-[#b85c38]" />
              <span>Miljövariabler (fallback)</span>
            </div>
            <ul className="text-xs text-white/50 space-y-1 font-mono">
              <li>
                STRIPE_SECRET_KEY:{" "}
                {meta?.hasEnvSecretKey ? "✓ satt" : "— ej satt"}
              </li>
              <li>
                STRIPE_PUBLISHABLE_KEY:{" "}
                {meta?.hasEnvPublishableKey ? "✓ satt" : "— ej satt"}
              </li>
              <li>
                STRIPE_WEBHOOK_SECRET:{" "}
                {meta?.hasEnvWebhookSecret ? "✓ satt" : "— ej satt"}
              </li>
            </ul>
            <p className="text-white/40 text-xs leading-relaxed">
              Webhook-URL:{" "}
              <code className="text-white/60">/api/webhooks/stripe</code>
              <br />
              Lyssna på: checkout.session.completed, payment_intent.succeeded,
              payment_intent.payment_failed
            </p>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#b85c38] hover:bg-[#9e4e2f] disabled:opacity-60 text-white font-semibold py-3.5 rounded-2xl transition"
          >
            <Save size={18} />
            {saving ? "Sparar…" : "Spara inställningar"}
          </button>
        </form>
      )}
    </div>
  );
}
