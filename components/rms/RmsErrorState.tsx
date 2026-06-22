"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { memo } from "react";

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
  offline?: boolean;
};

function RmsErrorState({
  title = "Något gick fel",
  message,
  onRetry,
  offline = false,
}: Props) {
  return (
    <div
      className="mx-auto max-w-md rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-left"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-300" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-red-100">{offline ? "Offline" : title}</p>
          <p className="mt-1 text-sm text-red-200/80">{message}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="rms-focus mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/25"
            >
              <RefreshCw size={14} aria-hidden />
              Försök igen
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default memo(RmsErrorState);
