"use client";

import { ToastProvider } from "@/components/notifications/ToastProvider";
import RmsErrorBoundary from "@/components/rms/RmsErrorBoundary";
import {
  RmsStartupProvider,
} from "@/lib/rms/startup-context";
import { isPosEmergencyDebug, posDebugLog } from "@/lib/debug/pos-emergency-debug";
import "../../styles/rms-polish.css";

type RmsProvidersProps = {
  children: React.ReactNode;
  /** POS: wait for first successful order load before printer/SSE/queue. */
  deferBackgroundUntilOrdersReady?: boolean;
};

export default function RmsProviders({
  children,
  deferBackgroundUntilOrdersReady = false,
}: RmsProvidersProps) {
  if (isPosEmergencyDebug()) {
    posDebugLog("RMS PROVIDERS MINIMAL MODE (no SSE/heartbeat/print queue)");
  }

  return (
    <RmsStartupProvider
      deferBackgroundUntilOrdersReady={deferBackgroundUntilOrdersReady}
    >
      <ToastProvider>
        <RmsErrorBoundary context="rms-providers">
          {children}
        </RmsErrorBoundary>
      </ToastProvider>
    </RmsStartupProvider>
  );
}

export { useRmsStartup } from "@/lib/rms/startup-context";
