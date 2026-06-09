"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Save } from "lucide-react";

type Settings = {
  restaurantName: string;
  phone: string;
  email: string;
  address: string;
  logo: string | null;
  heroImage: string | null;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  minimumOrder: number;
  deliveryFee: number;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
};

const emptySettings: Settings = {
  restaurantName: "",
  phone: "",
  email: "",
  address: "",
  logo: null,
  heroImage: null,
  deliveryEnabled: true,
  pickupEnabled: true,
  minimumOrder: 0,
  deliveryFee: 49,
  facebookUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Settings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error();
      setForm(await res.json());
    } catch {
      setError("Kunde inte hämta inställningar.");
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
      const res = await fetch("/api/settings", {
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
    "w-full bg-[#111] border border-[#b85c38]/30 rounded-2xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#b85c38] transition";

  return (
    <div className="px-5 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-serif">Inställningar</h1>
        <p className="text-white/50 text-sm mt-1">
          Restauranginfo, bilder och sociala medier
        </p>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-2xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-900/30 border border-green-700 rounded-2xl p-4 text-green-300 text-sm">
          Inställningarna har sparats.
        </div>
      )}

      {loading ? (
        <p className="text-white/50 text-sm">Laddar…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38]">Restaurang</h2>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Namn</label>
              <input
                value={form.restaurantName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, restaurantName: e.target.value }))
                }
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Telefon</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">E-post</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Adress</label>
              <input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                required
                className={inputClass}
              />
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38]">Bilder (URL)</h2>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Logotyp</label>
              <input
                value={form.logo ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, logo: e.target.value || null }))
                }
                placeholder="https://… eller /logo.png"
                className={inputClass}
              />
              {form.logo && (
                <div className="mt-3 relative w-20 h-20 rounded-xl overflow-hidden bg-[#111]">
                  <Image
                    src={form.logo}
                    alt="Logotyp"
                    fill
                    unoptimized
                    className="object-contain p-2"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Hero-bild</label>
              <input
                value={form.heroImage ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, heroImage: e.target.value || null }))
                }
                placeholder="https://… eller /hero.jpg"
                className={inputClass}
              />
              {form.heroImage && (
                <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden bg-[#111]">
                  <Image
                    src={form.heroImage}
                    alt="Hero"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38]">Beställning</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.pickupEnabled}
                onChange={(e) =>
                  setForm((p) => ({ ...p, pickupEnabled: e.target.checked }))
                }
                className="w-4 h-4 accent-[#b85c38]"
              />
              <span className="text-sm">Hämtning aktiverad</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.deliveryEnabled}
                onChange={(e) =>
                  setForm((p) => ({ ...p, deliveryEnabled: e.target.checked }))
                }
                className="w-4 h-4 accent-[#b85c38]"
              />
              <span className="text-sm">Hemleverans aktiverad</span>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">
                  Minsta order (kr, standard)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.minimumOrder}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      minimumOrder: Number(e.target.value) || 0,
                    }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">
                  Leveransavgift (kr, standard)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.deliveryFee}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      deliveryFee: Number(e.target.value) || 0,
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38]">Sociala medier</h2>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Facebook</label>
              <input
                value={form.facebookUrl ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    facebookUrl: e.target.value || null,
                  }))
                }
                placeholder="https://facebook.com/…"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Instagram</label>
              <input
                value={form.instagramUrl ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    instagramUrl: e.target.value || null,
                  }))
                }
                placeholder="https://instagram.com/…"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">TikTok</label>
              <input
                value={form.tiktokUrl ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    tiktokUrl: e.target.value || null,
                  }))
                }
                placeholder="https://tiktok.com/@…"
                className={inputClass}
              />
            </div>
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
