"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Eye, Loader2, Send } from "lucide-react";
import { NotificationType } from "@prisma/client";
import { TEST_NOTIFICATION_TYPES } from "@/lib/email/notifications/sample-data";

type OrderOption = {
  id: string;
  orderNumber: string;
  customerName: string;
};

type TestResult = {
  type: NotificationType;
  status: string;
  logId?: string;
  error?: string;
};

export default function EmailTestPage() {
  const [recipient, setRecipient] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [sending, setSending] = useState<NotificationType | null>(null);
  const [previewType, setPreviewType] = useState<NotificationType | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [emailConfigured, setEmailConfigured] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders?limit=20");
      if (res.ok) {
        const data = await res.json();
        setOrders(
          data.map((o: OrderOption) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName,
          }))
        );
      }
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.emailConfigured) setEmailConfigured(true);
      });
  }, [fetchOrders]);

  const sendTest = async (type: NotificationType) => {
    if (!recipient.trim()) {
      alert("Ange en mottagar-e-postadress.");
      return;
    }

    setSending(type);
    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          recipient: recipient.trim(),
          orderId: orderId || undefined,
        }),
      });
      const data = await res.json();
      setResults((prev) => [
        {
          type,
          status: res.ok ? data.status : "ERROR",
          logId: data.logId,
          error: data.error,
        },
        ...prev,
      ]);
    } catch {
      setResults((prev) => [
        { type, status: "ERROR", error: "Nätverksfel" },
        ...prev,
      ]);
    } finally {
      setSending(null);
    }
  };

  const showPreview = async (type: NotificationType) => {
    setPreviewType(type);
    setPreviewLoading(true);
    setPreviewHtml("");
    try {
      const params = new URLSearchParams({ type });
      if (orderId) params.set("orderId", orderId);
      const res = await fetch(`/api/notifications/preview?${params}`);
      const data = await res.json();
      if (res.ok) setPreviewHtml(data.html);
    } finally {
      setPreviewLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-white placeholder:text-white/35 focus:border-[#b85c38]/60 focus:outline-none";

  return (
    <div className="px-4 py-6 pb-12 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link
          href="/admin/notifications"
          className="mb-4 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeft size={16} />
          Tillbaka till e-post
        </Link>
        <p className="text-[#d4a574] text-xs font-medium tracking-[0.2em] uppercase mb-2">
          Testverktyg
        </p>
        <h1 className="font-serif text-3xl text-white">Testa e-postmallar</h1>
        <p className="mt-2 text-sm text-white/50">
          Skicka testsmeddelanden via Resend och förhandsgranska svenska mallar
        </p>
      </div>

      {!emailConfigured && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <strong>RESEND_API_KEY</strong> saknas. Lägg till i{" "}
          <code className="text-amber-100">.env</code> för att skicka testmail.
        </div>
      )}

      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 space-y-4">
        <h2 className="font-serif text-lg text-[#b85c38]">Testinställningar</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">
              Mottagare *
            </label>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="din@email.se"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">
              Order (valfritt)
            </label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className={inputClass}
              disabled={loadingOrders}
            >
              <option value="">Exempeldata (EK-TEST001)</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} — {o.customerName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg text-white">Mallar att testa</h2>
        {TEST_NOTIFICATION_TYPES.map(({ type, label, description, audience }) => (
          <article
            key={type}
            className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-[#1a1a1a] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-white">{label}</p>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/40">
                  {audience === "customer" ? "Kund" : "Restaurang"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/45">{description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => showPreview(type)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10"
              >
                <Eye size={14} />
                Förhandsgranska
              </button>
              <button
                type="button"
                onClick={() => sendTest(type)}
                disabled={sending === type || !emailConfigured}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#b85c38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#a04f30] disabled:opacity-50"
              >
                {sending === type ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Skicka test
              </button>
            </div>
          </article>
        ))}
      </section>

      {results.length > 0 && (
        <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 space-y-2">
          <h2 className="font-serif text-lg text-[#b85c38]">Senaste testresultat</h2>
          {results.slice(0, 10).map((r, i) => (
            <div
              key={`${r.type}-${i}`}
              className="flex items-center justify-between rounded-xl bg-[#111] px-3 py-2 text-sm"
            >
              <span className="text-white/80">
                {TEST_NOTIFICATION_TYPES.find((t) => t.type === r.type)?.label ?? r.type}
              </span>
              <span
                className={
                  r.status === "SENT"
                    ? "text-emerald-400"
                    : r.status === "ERROR" || r.status === "FAILED"
                      ? "text-red-400"
                      : "text-yellow-400"
                }
              >
                {r.status}
                {r.error && ` — ${r.error}`}
              </span>
            </div>
          ))}
        </section>
      )}

      {previewType && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-white/10 bg-[#1a1a1a]">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <h3 className="font-serif text-lg text-white">
                Förhandsgranskning —{" "}
                {TEST_NOTIFICATION_TYPES.find((t) => t.type === previewType)?.label}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewType(null)}
                className="text-sm text-white/50 hover:text-white"
              >
                Stäng
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-white">
              {previewLoading ? (
                <p className="p-8 text-center text-gray-500">Renderar…</p>
              ) : (
                <iframe
                  title="E-postförhandsgranskning"
                  srcDoc={previewHtml}
                  className="h-[60vh] w-full border-0"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
