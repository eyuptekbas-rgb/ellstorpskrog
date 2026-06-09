"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink, Megaphone, Save, Search } from "lucide-react";
import { absoluteUrl } from "@/lib/seo/url";

type SeoSettings = {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  keywords: string;
  restaurantName: string;
};

export default function AdminSeoPage() {
  const [form, setForm] = useState<SeoSettings>({
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
    keywords: "",
    restaurantName: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/seo");
      if (!res.ok) throw new Error();
      setForm(await res.json());
    } catch {
      setError("Kunde inte hämta SEO-inställningar.");
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
      const res = await fetch("/api/seo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setForm(await res.json());
      setSaved(true);
    } catch {
      setError("Kunde inte spara SEO-inställningar.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-[#111] border border-[#b85c38]/30 rounded-2xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#b85c38] transition";

  const previewTitle = form.metaTitle || form.restaurantName || "Restaurang";
  const previewDescription =
    form.metaDescription ||
    "Restaurang i Malmö – beställ online, boka bord eller hemleverans.";

  return (
    <div className="px-5 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-serif flex items-center gap-2">
          <Search size={22} />
          SEO
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Metadata, Open Graph, schema.org och spårning
        </p>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-2xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-900/30 border border-green-700 rounded-2xl p-4 text-green-300 text-sm">
          SEO-inställningarna har sparats.
        </div>
      )}

      {loading ? (
        <p className="text-white/50 text-sm">Laddar…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38]">Metadata</h2>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Meta title</label>
              <input
                value={form.metaTitle}
                onChange={(e) =>
                  setForm((p) => ({ ...p, metaTitle: e.target.value }))
                }
                placeholder={form.restaurantName}
                className={inputClass}
              />
              <p className="text-white/40 text-xs mt-1">
                Tom = restaurangnamn. Sidor använder mallen &quot;%s | {form.restaurantName}&quot;.
              </p>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">
                Meta description
              </label>
              <textarea
                value={form.metaDescription}
                onChange={(e) =>
                  setForm((p) => ({ ...p, metaDescription: e.target.value }))
                }
                rows={3}
                placeholder="Kort beskrivning för sökmotorer…"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Keywords</label>
              <input
                value={form.keywords}
                onChange={(e) =>
                  setForm((p) => ({ ...p, keywords: e.target.value }))
                }
                placeholder="restaurang, malmö, pizza, kebab"
                className={inputClass}
              />
              <p className="text-white/40 text-xs mt-1">Kommaseparerade nyckelord.</p>
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38]">Open Graph</h2>

            <div>
              <label className="text-xs text-white/50 mb-1 block">
                OG-bild (URL)
              </label>
              <input
                value={form.ogImage}
                onChange={(e) =>
                  setForm((p) => ({ ...p, ogImage: e.target.value }))
                }
                placeholder="https://… eller /hero.jpg"
                className={inputClass}
              />
              {form.ogImage && (
                <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden bg-[#111]">
                  <Image
                    src={form.ogImage}
                    alt="OG preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 p-4 bg-[#111]">
              <p className="text-xs text-white/40 mb-2">Förhandsvisning</p>
              <p className="text-[#8ab4f8] text-sm font-medium truncate">
                {previewTitle}
              </p>
              <p className="text-green-400/80 text-xs truncate">
                {absoluteUrl("/").replace(/^https?:\/\//, "")}
              </p>
              <p className="text-white/60 text-xs mt-1 line-clamp-2">
                {previewDescription}
              </p>
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-3">
            <h2 className="text-lg font-serif text-[#b85c38] flex items-center gap-2">
              <Megaphone size={18} />
              Analys & annonser
            </h2>
            <p className="text-sm text-white/60">
              Google Analytics, GTM, Google Ads och Meta Pixel konfigureras under{" "}
              <Link href="/admin/marketing" className="text-[#b85c38] hover:underline">
                Marknadsföring
              </Link>{" "}
              med GDPR-samtycke.
            </p>
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-3">
            <h2 className="text-lg font-serif text-[#b85c38]">Produktion</h2>
            <ul className="text-sm text-white/60 space-y-2">
              <li className="flex items-center gap-2">
                <ExternalLink size={14} />
                <a href="/robots.txt" target="_blank" className="hover:text-white">
                  robots.txt
                </a>
              </li>
              <li className="flex items-center gap-2">
                <ExternalLink size={14} />
                <a href="/sitemap.xml" target="_blank" className="hover:text-white">
                  sitemap.xml
                </a>
              </li>
              <li>· Schema.org: Restaurant, LocalBusiness, Menu</li>
              <li>· Twitter Cards: summary_large_image</li>
            </ul>
            <p className="text-white/40 text-xs">
              Sätt <code className="text-white/60">NEXT_PUBLIC_APP_URL</code> till
              produktionsdomänen för korrekta canonical- och OG-URL:er.
            </p>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full bg-[#b85c38] hover:bg-[#9e4e2f] disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition"
          >
            <Save size={18} />
            {saving ? "Sparar…" : "Spara SEO-inställningar"}
          </button>
        </form>
      )}
    </div>
  );
}
