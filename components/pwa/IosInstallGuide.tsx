"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { LOGO_ALT, LOGO_PATH } from "@/lib/brand/images";

type Props = {
  open: boolean;
  onClose: () => void;
};

const STEPS = [
  {
    title: "Tryck på Dela",
    body: "Tryck på dela-ikonen längst ner i Safari.",
  },
  {
    title: "Lägg till på hemskärmen",
    body: 'Välj "Lägg till på hemskärmen" i menyn.',
  },
  {
    title: "Lägg till",
    body: 'Tryck "Lägg till" — appen visas som Ellstorps Krog.',
  },
];

export default function IosInstallGuide({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="pwa-ios-guide-backdrop fixed inset-0 z-[110] flex items-end justify-center bg-[#0f0f0f]/80 p-4 backdrop-blur-md sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-guide-title"
        className="pwa-ios-guide-panel w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/[0.1] bg-[#121212]/95 shadow-2xl backdrop-blur-2xl"
      >
        <div className="border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-label mb-2">iPhone & iPad</p>
              <h2
                id="ios-install-guide-title"
                className="font-serif text-xl text-white"
              >
                Lägg till på hemskärmen
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:text-white"
              aria-label="Stäng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="mb-5 flex items-center gap-4 rounded-2xl border border-[#b85c38]/20 bg-[#b85c38]/[0.06] p-4">
            <Image
              src={LOGO_PATH}
              alt={LOGO_ALT}
              width={72}
              height={72}
              className="h-16 w-16 shrink-0 object-contain"
            />
            <div>
              <p className="font-semibold text-white">Ellstorps Krog</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">
                Snabb beställning direkt från hemskärmen — utan App Store.
              </p>
            </div>
          </div>

          <ol className="space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#b85c38]/15 text-sm font-bold text-[#e8c4a8]">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="border-t border-white/[0.06] p-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary w-full !py-3.5 text-sm"
          >
            Jag förstår
          </button>
        </div>
      </div>
    </div>
  );
}
