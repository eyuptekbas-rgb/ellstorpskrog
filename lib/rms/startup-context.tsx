"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type RmsStartupContextValue = {
  /** Background printer / SSE / heartbeat services are active. */
  backgroundReady: boolean;
  /** Call once after the first successful order load (POS). */
  notifyOrdersReady: () => void;
};

const RmsStartupContext = createContext<RmsStartupContextValue | null>(null);

export function RmsStartupProvider({
  children,
  deferBackgroundUntilOrdersReady,
}: {
  children: ReactNode;
  deferBackgroundUntilOrdersReady?: boolean;
}) {
  const [backgroundReady, setBackgroundReady] = useState(
    !deferBackgroundUntilOrdersReady
  );

  const notifyOrdersReady = useCallback(() => {
    setBackgroundReady(true);
  }, []);

  const value = useMemo(
    () => ({ backgroundReady, notifyOrdersReady }),
    [backgroundReady, notifyOrdersReady]
  );

  return (
    <RmsStartupContext.Provider value={value}>
      {children}
    </RmsStartupContext.Provider>
  );
}

export function useRmsStartup(): RmsStartupContextValue {
  const ctx = useContext(RmsStartupContext);
  if (!ctx) {
    return {
      backgroundReady: true,
      notifyOrdersReady: () => undefined,
    };
  }
  return ctx;
}
