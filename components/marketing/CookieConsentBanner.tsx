"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings2, Shield } from "lucide-react";
import { useConsent } from "@/components/marketing/ConsentProvider";
export default function CookieConsentBanner() {
  const {
    bannerOpen,
    preferencesOpen,
    consent,
    acceptAll,
    rejectAll,
    savePreferences,
    closeBanner,
    openCustomize,
  } = useConsent();

  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (consent) {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
  }, [consent]);

  if (!bannerOpen) return null;

  const showCustomize = preferencesOpen;

  const handleSave = () => {
    savePreferences({ necessary: true, analytics, marketing });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-[#1a1a1a] border border-[#b85c38]/40 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#b85c38]/20 flex items-center justify-center shrink-0">
              <Cookie size={20} className="text-[#b85c38]" />
            </div>
            <div>
              <h2
                id="cookie-consent-title"
                className="font-serif text-lg font-semibold"
              >
                Vi värnar om din integritet
              </h2>
              <p className="text-white/60 text-sm mt-1 leading-relaxed">
                Vi använder cookies för att analysera trafik och förbättra din
                upplevelse. Du bestämmer vilka typer du godkänner enligt GDPR.
              </p>
            </div>
          </div>

          {showCustomize && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#111] border border-white/5">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Shield size={14} className="text-[#b85c38]" />
                    Nödvändiga
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    Krävs för att webbplatsen ska fungera. Kan inte stängas av.
                  </p>
                </div>
                <span className="text-xs text-white/40 shrink-0">Alltid på</span>
              </div>

              <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#111] border border-white/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Analys</p>
                  <p className="text-xs text-white/50 mt-1">
                    Google Analytics och Tag Manager — hjälper oss förstå hur
                    sidan används.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#b85c38] shrink-0"
                />
              </label>

              <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#111] border border-white/5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Marknadsföring</p>
                  <p className="text-xs text-white/50 mt-1">
                    Google Ads och Meta Pixel — mäter annonser och konverteringar.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#b85c38] shrink-0"
                />
              </label>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {showCustomize ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 bg-[#b85c38] hover:bg-[#9e4e2f] text-white font-semibold py-3 rounded-xl transition text-sm"
                >
                  Spara val
                </button>
                <button
                  type="button"
                  onClick={closeBanner}
                  className="px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition"
                >
                  Avbryt
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="flex-1 bg-[#b85c38] hover:bg-[#9e4e2f] text-white font-semibold py-3 rounded-xl transition text-sm"
                >
                  Acceptera alla
                </button>
                <button
                  type="button"
                  onClick={rejectAll}
                  className="flex-1 bg-[#111] border border-white/10 hover:border-white/20 text-white py-3 rounded-xl transition text-sm"
                >
                  Endast nödvändiga
                </button>
                <button
                  type="button"
                  onClick={openCustomize}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white text-sm transition"
                >
                  <Settings2 size={16} />
                  Anpassa
                </button>
              </>
            )}
          </div>

          <p className="text-[11px] text-white/40 text-center">
            Läs mer i vår{" "}
            <Link href="/kontakt" className="text-[#b85c38] hover:underline">
              integritetspolicy
            </Link>
            . Du kan ändra ditt val när som helst.
          </p>
        </div>
      </div>
    </div>
  );
}
