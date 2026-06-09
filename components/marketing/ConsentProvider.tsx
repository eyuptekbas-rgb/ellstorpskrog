"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ConsentCategories,
  ConsentRecord,
  MarketingPublicConfig,
} from "@/lib/consent/types";
import { consentDecided } from "@/lib/consent/types";
import { loadConsent, saveConsent } from "@/lib/consent/storage";

type ConsentContextValue = {
  consent: ConsentRecord | null;
  bannerOpen: boolean;
  preferencesOpen: boolean;
  config: MarketingPublicConfig;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (categories: ConsentCategories) => void;
  openPreferences: () => void;
  openCustomize: () => void;
  closeBanner: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used within ConsentProvider");
  }
  return ctx;
}

type ConsentProviderProps = {
  children: React.ReactNode;
  config: MarketingPublicConfig;
};

export default function ConsentProvider({
  children,
  config,
}: ConsentProviderProps) {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadConsent();
    setConsent(stored);
    setBannerOpen(config.hasTracking && !consentDecided(stored));
    setHydrated(true);
  }, [config.hasTracking]);

  const persist = useCallback((categories: ConsentCategories) => {
    const record = saveConsent(categories);
    setConsent(record);
    setBannerOpen(false);
    setPreferencesOpen(false);
  }, []);

  const acceptAll = useCallback(() => {
    persist({ necessary: true, analytics: true, marketing: true });
  }, [persist]);

  const rejectAll = useCallback(() => {
    persist({ necessary: true, analytics: false, marketing: false });
  }, [persist]);

  const savePreferences = useCallback(
    (categories: ConsentCategories) => {
      persist(categories);
    },
    [persist]
  );

  const openPreferences = useCallback(() => {
    setPreferencesOpen(true);
    setBannerOpen(true);
  }, []);

  const openCustomize = useCallback(() => {
    setPreferencesOpen(true);
  }, []);

  const closeBanner = useCallback(() => {
    if (consentDecided(consent)) {
      setBannerOpen(false);
      setPreferencesOpen(false);
    } else {
      setPreferencesOpen(false);
    }
  }, [consent]);

  const value = useMemo(
    () => ({
      consent,
      bannerOpen: hydrated && bannerOpen && config.hasTracking,
      preferencesOpen,
      config,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      openCustomize,
      closeBanner,
    }),
    [
      consent,
      hydrated,
      bannerOpen,
      preferencesOpen,
      config,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      openCustomize,
      closeBanner,
    ]
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}
