"use client";

import { Download, Smartphone } from "lucide-react";
import { usePwaInstallOptional } from "@/components/pwa/PwaInstallProvider";

type Props = {
  className?: string;
  fullWidth?: boolean;
};

export default function InstallAppButton({
  className = "",
  fullWidth = true,
}: Props) {
  const pwa = usePwaInstallOptional();

  if (!pwa?.canInstall) return null;

  const { installApp, installing } = pwa;

  return (
    <button
      type="button"
      onClick={() => void installApp()}
      disabled={installing}
      className={`btn-primary inline-flex items-center justify-center gap-2 !py-3.5 text-sm disabled:opacity-60 ${fullWidth ? "w-full" : ""} ${className}`.trim()}
    >
      {installing ? (
        <>
          <Download size={18} className="animate-pulse" />
          Installerar…
        </>
      ) : (
        <>
          <Smartphone size={18} />
          Installera App
        </>
      )}
    </button>
  );
}
