"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Megaphone, Save } from "lucide-react";

type MarketingForm = {
  googleAnalyticsId: string;
  googleTagManagerId: string;
  googleAdsConversionId: string;
  metaPixelId: string;
  googleAnalyticsEnabled: boolean;
  googleTagManagerEnabled: boolean;
  googleAdsEnabled: boolean;
  metaPixelEnabled: boolean;
};

const emptyForm: MarketingForm = {
  googleAnalyticsId: "",
  googleTagManagerId: "",
  googleAdsConversionId: "",
  metaPixelId: "",
  googleAnalyticsEnabled: false,
  googleTagManagerEnabled: false,
  googleAdsEnabled: false,
  metaPixelEnabled: false,
};

export default function AdminMarketingPage() {
  const [form, setForm] = useState<MarketingForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/marketing");
      if (!res.ok) throw new Error();
      setForm(await res.json());
    } catch {
      setError("Kunde inte hämta marknadsföringsinställningar.");
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
      const res = await fetch("/api/marketing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setForm(await res.json());
      setSaved(true);
    } catch {
      setError("Kunde inte spara inställningar.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-[#111] border border-[#b85c38]/30 rounded-2xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#b85c38] transition disabled:opacity-40";

  const Toggle = ({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-[#111] border border-white/5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 accent-[#b85c38] shrink-0"
      />
      <div>
        <span className="text-sm font-medium">{label}</span>
        <p className="text-white/40 text-xs mt-0.5">{description}</p>
      </div>
    </label>
  );

  return (
    <div className="px-5 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-serif flex items-center gap-2">
          <Megaphone size={22} />
          Marknadsföring & analys
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Spårningsskript laddas endast efter GDPR-samtycke från besökare
        </p>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-2xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-900/30 border border-green-700 rounded-2xl p-4 text-green-300 text-sm">
          Marknadsföringsinställningarna har sparats.
        </div>
      )}

      {loading ? (
        <p className="text-white/50 text-sm">Laddar…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38] flex items-center gap-2">
              <BarChart3 size={18} />
              Google Analytics 4
            </h2>
            <Toggle
              label="Aktivera GA4"
              description="Kräver samtycke till analys-cookies"
              checked={form.googleAnalyticsEnabled}
              onChange={(v) =>
                setForm((p) => ({ ...p, googleAnalyticsEnabled: v }))
              }
            />
            <input
              value={form.googleAnalyticsId}
              onChange={(e) =>
                setForm((p) => ({ ...p, googleAnalyticsId: e.target.value }))
              }
              placeholder="G-XXXXXXXXXX"
              disabled={!form.googleAnalyticsEnabled}
              className={inputClass}
            />
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38]">
              Google Tag Manager
            </h2>
            <Toggle
              label="Aktivera GTM"
              description="Laddas vid analys- eller marknadsföringssamtycke"
              checked={form.googleTagManagerEnabled}
              onChange={(v) =>
                setForm((p) => ({ ...p, googleTagManagerEnabled: v }))
              }
            />
            <input
              value={form.googleTagManagerId}
              onChange={(e) =>
                setForm((p) => ({ ...p, googleTagManagerId: e.target.value }))
              }
              placeholder="GTM-XXXXXXX"
              disabled={!form.googleTagManagerEnabled}
              className={inputClass}
            />
            <p className="text-white/40 text-xs">
              Om GTM är aktiv laddas GA4 direkt inte — konfigurera GA4 i GTM.
            </p>
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38]">
              Google Ads Conversion
            </h2>
            <Toggle
              label="Aktivera Google Ads"
              description="Kräver samtycke till marknadsförings-cookies"
              checked={form.googleAdsEnabled}
              onChange={(v) => setForm((p) => ({ ...p, googleAdsEnabled: v }))}
            />
            <input
              value={form.googleAdsConversionId}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  googleAdsConversionId: e.target.value,
                }))
              }
              placeholder="AW-XXXXXXXXX"
              disabled={!form.googleAdsEnabled}
              className={inputClass}
            />
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38]">Meta Pixel</h2>
            <Toggle
              label="Aktivera Meta Pixel"
              description="Kräver samtycke till marknadsförings-cookies"
              checked={form.metaPixelEnabled}
              onChange={(v) => setForm((p) => ({ ...p, metaPixelEnabled: v }))}
            />
            <input
              value={form.metaPixelId}
              onChange={(e) =>
                setForm((p) => ({ ...p, metaPixelId: e.target.value }))
              }
              placeholder="123456789012345"
              disabled={!form.metaPixelEnabled}
              className={inputClass}
            />
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-2">
            <h2 className="text-lg font-serif text-[#b85c38]">GDPR</h2>
            <ul className="text-sm text-white/60 space-y-1">
              <li>· Cookie-banner visas när minst en tjänst är aktiv</li>
              <li>· Skript laddas aldrig före samtycke</li>
              <li>· Google Consent Mode v2 vid GTM/gtag</li>
              <li>· Köpkonvertering spåras efter samtycke i kassan</li>
            </ul>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full bg-[#b85c38] hover:bg-[#9e4e2f] disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition"
          >
            <Save size={18} />
            {saving ? "Sparar…" : "Spara inställningar"}
          </button>
        </form>
      )}
    </div>
  );
}
