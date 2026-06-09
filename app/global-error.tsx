"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logging/production-logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("Global application error", {
      context: "global-error",
      error,
      meta: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="sv">
      <body className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-serif text-2xl">Något gick fel</h1>
          <p className="text-white/60 text-sm">
            Ett oväntat fel inträffade. Försök igen eller kontakta oss om
            problemet kvarstår.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-2xl bg-[#b85c38] px-6 py-3 text-sm font-semibold text-white"
          >
            Försök igen
          </button>
        </div>
      </body>
    </html>
  );
}
