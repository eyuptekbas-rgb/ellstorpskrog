"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { LOGO_ALT, LOGO_PATH } from "@/lib/brand/images";
import { usePwaInstallOptional } from "@/components/pwa/PwaInstallProvider";
import {
  isDismissedRecently,
  isIosSafari,
  isStandaloneMode,
  saveDismissState,
} from "@/lib/pwa/device";

export default function InstallPrompt() {
  const pwa = usePwaInstallOptional();
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    if (isStandaloneMode() || isDismissedRecently() || !pwa) return;

    if (pwa.hasAndroidPrompt) {
      setShowAndroid(true);
      setShowIos(false);
      return;
    }

    if (pwa.isIos) {
      const timer = window.setTimeout(() => setShowIos(true), 1200);
      return () => window.clearTimeout(timer);
    }
  }, [pwa?.hasAndroidPrompt, pwa?.isIos, pwa]);

  useEffect(() => {
    if (pwa?.isInstalled) {
      setShowAndroid(false);
      setShowIos(false);
    }
  }, [pwa?.isInstalled]);

  const dismiss = () => {
    saveDismissState();
    setShowAndroid(false);
    setShowIos(false);
  };

  if (!pwa || pwa.isInstalled) return null;

  return (
    <>
      {showAndroid && pwa.hasAndroidPrompt && (
        <div
          className="pwa-install-banner fixed bottom-[calc(var(--bottom-nav-height)+var(--bottom-nav-fab-overflow)+env(safe-area-inset-bottom,0px)+1rem)] left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
          role="dialog"
          aria-label="Installera app"
        >
          <div className="overflow-hidden rounded-2xl border border-[#b85c38]/35 bg-[#121212]/95 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.75),0_0_24px_rgba(184,92,56,0.12)] backdrop-blur-xl">
            <div className="flex items-start gap-3 p-4">
              <Image
                src={LOGO_PATH}
                alt={LOGO_ALT}
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  Installera Ellstorps Krog
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/55">
                  Lägg till på hemskärmen för snabbare beställning.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void pwa.installApp()}
                    disabled={pwa.installing}
                    className="btn-primary flex flex-1 items-center justify-center gap-2 !px-3 !py-2.5 text-sm disabled:opacity-60"
                  >
                    <Download size={16} />
                    {pwa.installing ? "Installerar…" : "Installera App"}
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/55 transition hover:text-white"
                    aria-label="Stäng"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showIos && isIosSafari() && !showAndroid && (
        <div
          className="pwa-install-banner fixed bottom-[calc(var(--bottom-nav-height)+var(--bottom-nav-fab-overflow)+env(safe-area-inset-bottom,0px)+1rem)] left-4 right-4 z-50"
          role="dialog"
          aria-label="Lägg till på hemskärmen"
        >
          <div className="overflow-hidden rounded-2xl border border-[#b85c38]/35 bg-[#121212]/95 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.75),0_0_24px_rgba(184,92,56,0.12)] backdrop-blur-xl">
            <div className="flex items-center gap-3 p-4">
              <Image
                src={LOGO_PATH}
                alt={LOGO_ALT}
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 object-contain"
              />
              <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-white">
                Lägg till Ellstorps Krog på hemskärmen
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void pwa.installApp()}
                  className="btn-primary !px-3.5 !py-2 text-xs whitespace-nowrap"
                >
                  Installera App
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:text-white"
                  aria-label="Stäng"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
