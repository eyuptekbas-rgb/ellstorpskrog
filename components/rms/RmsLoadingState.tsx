"use client";

import { Loader2 } from "lucide-react";
import { memo } from "react";

type Props = {
  label?: string;
  compact?: boolean;
};

function RmsLoadingState({ label = "Laddar…", compact = false }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-white/45 ${
        compact ? "py-8" : "py-20"
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 size={compact ? 24 : 32} className="animate-spin text-[#b85c38]/70" />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
}

export default memo(RmsLoadingState);
