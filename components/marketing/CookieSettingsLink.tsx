"use client";

import { Cookie } from "lucide-react";
import { useConsent } from "@/components/marketing/ConsentProvider";

export default function CookieSettingsLink() {
  const { config, openPreferences } = useConsent();

  if (!config.hasTracking) return null;

  return (
    <button
      type="button"
      onClick={openPreferences}
      className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition"
    >
      <Cookie size={12} />
      Cookie-inställningar
    </button>
  );
}
