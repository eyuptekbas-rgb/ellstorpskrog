"use client";

import Image from "next/image";
import { Download, Smartphone } from "lucide-react";
import { LOGO_ALT, LOGO_PATH } from "@/lib/brand/images";
import { usePwaInstallOptional } from "@/components/pwa/PwaInstallProvider";

export default function AccountInstallCard() {
  const pwa = usePwaInstallOptional();

  if (!pwa) return null;

  const handleInstall = () => {
    void pwa.installApp();
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#b85c38]/25 bg-[#141414] p-5">
      <div className="mb-4 flex items-center gap-4">
        <Image
          src={LOGO_PATH}
          alt={LOGO_ALT}
          width={52}
          height={52}
          className="h-[3.25rem] w-[3.25rem] shrink-0 object-contain"
        />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b85c38]">
            App
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-lg text-white">
            Installera EllstorpsKrog App
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            Beställ snabbare direkt från hemskärmen.
          </p>
        </div>
      </div>

      {pwa.isInstalled ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          <Smartphone size={18} />
          EllstorpsKrog är installerad
        </div>
      ) : (
        <button
          type="button"
          onClick={handleInstall}
          disabled={pwa.installing}
          className="btn-primary inline-flex w-full items-center justify-center gap-2 !py-3.5 text-sm disabled:opacity-60"
        >
          {pwa.installing ? (
            <>
              <Download size={18} className="animate-pulse" />
              Installerar…
            </>
          ) : (
            <>
              <Smartphone size={18} />
              Installera EllstorpsKrog App
            </>
          )}
        </button>
      )}
    </section>
  );
}
