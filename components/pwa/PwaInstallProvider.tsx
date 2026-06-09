"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import IosInstallGuide from "@/components/pwa/IosInstallGuide";
import { isIosSafari, isStandaloneMode } from "@/lib/pwa/device";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaInstallContextValue = {
  isInstalled: boolean;
  canInstall: boolean;
  isIos: boolean;
  hasAndroidPrompt: boolean;
  installing: boolean;
  installApp: () => Promise<void>;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error("usePwaInstall must be used inside PwaInstallProvider");
  }
  return context;
}

export function usePwaInstallOptional() {
  return useContext(PwaInstallContext);
}

export default function PwaInstallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());
    setIsIos(isIosSafari());

    if (isStandaloneMode()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowIosGuide(false);
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => {
      if (isStandaloneMode()) onInstalled();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    mediaQuery.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      mediaQuery.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } finally {
        setInstalling(false);
      }
      return;
    }

    if (isIosSafari()) {
      setShowIosGuide(true);
    }
  }, [deferredPrompt, isInstalled]);

  const value = useMemo(
    () => ({
      isInstalled,
      canInstall: !isInstalled && (Boolean(deferredPrompt) || isIos),
      isIos,
      hasAndroidPrompt: Boolean(deferredPrompt),
      installing,
      installApp,
    }),
    [deferredPrompt, installApp, installing, isInstalled, isIos]
  );

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
      <IosInstallGuide
        open={showIosGuide}
        onClose={() => setShowIosGuide(false)}
      />
    </PwaInstallContext.Provider>
  );
}
