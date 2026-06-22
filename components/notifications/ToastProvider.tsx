"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AdminToastStack, {
  type ToastMessage,
  type ToastTone,
} from "@/components/admin/menu/AdminToast";

type ToastContextValue = {
  pushToast: (text: string, tone?: ToastTone) => void;
  pushKitchenAlert: (text: string) => void;
  pushOrderReadyAlert: (text: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((text: string, tone: ToastTone = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const pushKitchenAlert = useCallback(
    (text: string) => {
      pushToast(text, "info");
      void import("@/lib/notifications/sounds").then(({ playKitchenAlertSound }) =>
        playKitchenAlertSound()
      );
    },
    [pushToast]
  );

  const pushOrderReadyAlert = useCallback(
    (text: string) => {
      pushToast(text, "success");
      void import("@/lib/notifications/sounds").then(({ playOrderReadySound }) =>
        playOrderReadySound()
      );
    },
    [pushToast]
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(
    () => ({ pushToast, pushKitchenAlert, pushOrderReadyAlert }),
    [pushToast, pushKitchenAlert, pushOrderReadyAlert]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AdminToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      pushToast: () => undefined,
      pushKitchenAlert: () => undefined,
      pushOrderReadyAlert: () => undefined,
    };
  }
  return ctx;
}
