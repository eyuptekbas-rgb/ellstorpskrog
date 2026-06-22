"use client";

import RmsErrorState from "@/components/rms/RmsErrorState";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-[#0a0a0a] p-6">
      <div className="w-full max-w-lg">
        <RmsErrorState
          message={error.message || "Ett oväntat fel inträffade. Försök igen."}
          onRetry={reset}
        />
      </div>
    </div>
  );
}
