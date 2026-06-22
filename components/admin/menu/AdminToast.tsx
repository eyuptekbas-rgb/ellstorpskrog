"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

export type ToastMessage = {
  id: number;
  text: string;
  tone: ToastTone;
};

let toastId = 0;

export function useAdminToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const push = (text: string, tone: ToastTone = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, push, dismiss };
}

export default function AdminToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+4.5rem)] z-[80] flex flex-col items-center gap-2 px-4 lg:top-6 lg:items-end lg:pr-6"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const toneClass =
    toast.tone === "success"
      ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
      : toast.tone === "error"
        ? "border-red-400/25 bg-red-500/12 text-red-100"
        : "border-[#b85c38]/30 bg-[#b85c38]/12 text-[#e8c4a8]";

  const Icon =
    toast.tone === "error"
      ? XCircle
      : toast.tone === "success"
        ? CheckCircle2
        : CheckCircle2;

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.85)] backdrop-blur-md transition duration-300 ${toneClass} ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 text-sm font-medium">{toast.text}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-lg p-1 text-current/70 transition hover:bg-white/10 hover:text-current"
        aria-label="Stäng"
      >
        <X size={14} />
      </button>
    </div>
  );
}
