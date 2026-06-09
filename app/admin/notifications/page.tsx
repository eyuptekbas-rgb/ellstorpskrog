"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, FlaskConical, Mail, RefreshCw, RotateCcw, Save, Send } from "lucide-react";
import { NotificationType } from "@prisma/client";
import EmailStatsWidget from "@/components/admin/EmailStatsWidget";
import ResendStatusWidget from "@/components/admin/ResendStatusWidget";
import { DELIVERY_STATUS_LABELS } from "@/lib/email/notifications/sample-data";

type NotificationLog = {
  id: string;
  orderNumber: string | null;
  type: NotificationType;
  typeLabel: string;
  recipient: string;
  subject: string;
  status: string;
  errorMessage: string | null;
  retryCount: number;
  sentAt: string | null;
  createdAt: string;
};

type NotificationSettings = {
  notificationEmail: string;
  emailSenderName: string;
  emailSenderAddress: string;
  customerEmailsEnabled: boolean;
  restaurantEmailsEnabled: boolean;
  notifyCustomerOrderConfirmation: boolean;
  notifyCustomerPaymentConfirmation: boolean;
  notifyCustomerOrderReady: boolean;
  notifyCustomerOrderDelivered: boolean;
  notifyCustomerOrderCancelled: boolean;
  notifyRestaurantNewOrder: boolean;
  notifyRestaurantPaymentReceived: boolean;
  notifyRestaurantOrderCancelled: boolean;
  contactEmail: string;
  effectiveRestaurantEmail: string;
  effectiveFromAddress: string;
  emailConfigured: boolean;
  notificationTypes: {
    customer: { type: NotificationType; label: string; settingsKey: string }[];
    restaurant: { type: NotificationType; label: string; settingsKey: string }[];
  };
};

const defaultForm: NotificationSettings = {
  notificationEmail: "",
  emailSenderName: "",
  emailSenderAddress: "",
  customerEmailsEnabled: true,
  restaurantEmailsEnabled: true,
  notifyCustomerOrderConfirmation: true,
  notifyCustomerPaymentConfirmation: true,
  notifyCustomerOrderReady: true,
  notifyCustomerOrderDelivered: true,
  notifyCustomerOrderCancelled: true,
  notifyRestaurantNewOrder: true,
  notifyRestaurantPaymentReceived: true,
  notifyRestaurantOrderCancelled: true,
  contactEmail: "",
  effectiveRestaurantEmail: "",
  effectiveFromAddress: "",
  emailConfigured: false,
  notificationTypes: { customer: [], restaurant: [] },
};

const STATUS_STYLE: Record<string, string> = {
  SENT: "text-green-400 bg-green-400/10",
  FAILED: "text-red-400 bg-red-400/10",
  SKIPPED: "text-yellow-400 bg-yellow-400/10",
  PENDING: "text-white/50 bg-white/10",
};

type EmailStatsPayload = {
  configured: boolean;
  fromAddress: string;
  fromEmailEnv: string | null;
  restaurantEmail: string;
  stats: {
    total: number;
    sent: number;
    failed: number;
    skipped: number;
    pending: number;
    deliveryRate: number;
    last24Hours: { total: number; sent: number; failed: number };
    last7Days: { total: number; sent: number; failed: number };
  };
};

export default function AdminNotificationsPage() {
  const [form, setForm] = useState<NotificationSettings>(defaultForm);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [statsPayload, setStatsPayload] = useState<EmailStatsPayload | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [retryAllLoading, setRetryAllLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error();
      setForm(await res.json());
    } catch {
      setError("Kunde inte hämta notifikationsinställningar.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/notifications/logs?limit=30");
      if (res.ok) setLogs(await res.json());
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/notifications/stats");
      if (res.ok) setStatsPayload(await res.json());
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchLogs();
    fetchStats();
  }, [fetchSettings, fetchLogs, fetchStats]);

  const retryLog = async (logId: string) => {
    setRetrying(logId);
    try {
      const res = await fetch("/api/notifications/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Kunde inte försöka igen.");
      }
      await Promise.all([fetchLogs(), fetchStats()]);
    } finally {
      setRetrying(null);
    }
  };

  const retryAllFailed = async () => {
    setRetryAllLoading(true);
    setError("");
    try {
      const res = await fetch("/api/notifications/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retryAll: true }),
      });
      if (!res.ok) throw new Error();
      await Promise.all([fetchLogs(), fetchStats()]);
    } catch {
      setError("Kunde inte försöka skicka misslyckade utskick igen.");
    } finally {
      setRetryAllLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationEmail: form.notificationEmail || null,
          emailSenderName: form.emailSenderName || null,
          emailSenderAddress: form.emailSenderAddress || null,
          customerEmailsEnabled: form.customerEmailsEnabled,
          restaurantEmailsEnabled: form.restaurantEmailsEnabled,
          notifyCustomerOrderConfirmation: form.notifyCustomerOrderConfirmation,
          notifyCustomerPaymentConfirmation: form.notifyCustomerPaymentConfirmation,
          notifyCustomerOrderReady: form.notifyCustomerOrderReady,
          notifyCustomerOrderDelivered: form.notifyCustomerOrderDelivered,
          notifyCustomerOrderCancelled: form.notifyCustomerOrderCancelled,
          notifyRestaurantNewOrder: form.notifyRestaurantNewOrder,
          notifyRestaurantPaymentReceived: form.notifyRestaurantPaymentReceived,
          notifyRestaurantOrderCancelled: form.notifyRestaurantOrderCancelled,
        }),
      });
      if (!res.ok) throw new Error();
      setForm(await res.json());
      setSaved(true);
    } catch {
      setError("Kunde inte spara inställningar.");
    } finally {
      setSaving(false);
    }
  };

  const toggleKey = (key: keyof NotificationSettings, value: boolean) => {
    setForm((p) => ({ ...p, [key]: value }));
    setSaved(false);
  };

  const inputClass =
    "w-full bg-[#111] border border-[#b85c38]/30 rounded-2xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#b85c38] transition";

  return (
    <div className="px-4 py-6 pb-12 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-white">E-postnotifikationer</h1>
          <p className="mt-2 text-sm text-white/50">
            Resend · svenska mallar · loggning och återförsök
          </p>
        </div>
        <Link
          href="/admin/notifications/test"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#b85c38]/30 bg-[#b85c38]/10 px-4 py-2.5 text-sm font-medium text-[#e8c4a8] transition hover:bg-[#b85c38]/20"
        >
          <FlaskConical size={16} />
          Testa mallar
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ResendStatusWidget
          configured={statsPayload?.configured ?? form.emailConfigured}
          fromAddress={statsPayload?.fromAddress ?? form.effectiveFromAddress}
          fromEmailEnv={statsPayload?.fromEmailEnv ?? null}
          restaurantEmail={statsPayload?.restaurantEmail ?? form.effectiveRestaurantEmail}
          loading={statsLoading && !statsPayload}
        />
        <EmailStatsWidget
          stats={statsPayload?.stats ?? null}
          loading={statsLoading}
          onRetryAll={statsPayload && statsPayload.stats.failed > 0 ? retryAllFailed : undefined}
          retrying={retryAllLoading}
        />
      </div>

      {!loading && !form.emailConfigured && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-2xl p-4 text-amber-200 text-sm">
          <strong>RESEND_API_KEY</strong> saknas. Lägg till i{" "}
          <code className="text-amber-100">.env</code> för att skicka e-post.
        </div>
      )}

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-2xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-900/30 border border-green-700 rounded-2xl p-4 text-green-300 text-sm">
          Inställningarna har sparats.
        </div>
      )}

      {loading ? (
        <p className="text-white/50 text-sm">Laddar…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38] flex items-center gap-2">
              <Mail size={18} />
              Avsändare
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">
                  Avsändarnamn
                </label>
                <input
                  value={form.emailSenderName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, emailSenderName: e.target.value }))
                  }
                  placeholder={form.contactEmail ? "Ellstorps Krog" : ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">
                  Avsändar-e-post
                </label>
                <input
                  type="email"
                  value={form.emailSenderAddress}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      emailSenderAddress: e.target.value,
                    }))
                  }
                  placeholder="no-reply@ellstorpskrog.se"
                  className={inputClass}
                />
              </div>
            </div>
            <p className="text-white/40 text-xs">
              Skickas som:{" "}
              <span className="text-white/70">{form.effectiveFromAddress}</span>
            </p>
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38]">Restaurang</h2>
            <div>
              <label className="text-xs text-white/50 mb-1 block">
                Notifikations-e-post
              </label>
              <input
                type="email"
                value={form.notificationEmail}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notificationEmail: e.target.value }))
                }
                placeholder={form.contactEmail}
                className={inputClass}
              />
              <p className="text-white/40 text-xs mt-2">
                Skickas till:{" "}
                <span className="text-white/70">
                  {form.effectiveRestaurantEmail}
                </span>
              </p>
            </div>
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38] flex items-center gap-2">
              <Bell size={18} />
              Kundnotifikationer
            </h2>
            <label className="flex items-center gap-3 cursor-pointer pb-2 border-b border-white/5">
              <input
                type="checkbox"
                checked={form.customerEmailsEnabled}
                onChange={(e) =>
                  toggleKey("customerEmailsEnabled", e.target.checked)
                }
                className="w-4 h-4 accent-[#b85c38]"
              />
              <span className="text-sm font-medium">Aktivera alla kund-e-post</span>
            </label>
            {form.notificationTypes.customer.map(({ label, settingsKey }) => (
              <label
                key={settingsKey}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form[settingsKey as keyof NotificationSettings] as boolean}
                  onChange={(e) =>
                    toggleKey(
                      settingsKey as keyof NotificationSettings,
                      e.target.checked
                    )
                  }
                  disabled={!form.customerEmailsEnabled}
                  className="w-4 h-4 accent-[#b85c38] disabled:opacity-40"
                />
                <span className="text-sm text-white/80">{label}</span>
              </label>
            ))}
          </section>

          <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-serif text-[#b85c38]">
              Restaurangnotifikationer
            </h2>
            <label className="flex items-center gap-3 cursor-pointer pb-2 border-b border-white/5">
              <input
                type="checkbox"
                checked={form.restaurantEmailsEnabled}
                onChange={(e) =>
                  toggleKey("restaurantEmailsEnabled", e.target.checked)
                }
                className="w-4 h-4 accent-[#b85c38]"
              />
              <span className="text-sm font-medium">
                Aktivera alla restaurang-e-post
              </span>
            </label>
            {form.notificationTypes.restaurant.map(({ label, settingsKey }) => (
              <label
                key={settingsKey}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form[settingsKey as keyof NotificationSettings] as boolean}
                  onChange={(e) =>
                    toggleKey(
                      settingsKey as keyof NotificationSettings,
                      e.target.checked
                    )
                  }
                  disabled={!form.restaurantEmailsEnabled}
                  className="w-4 h-4 accent-[#b85c38] disabled:opacity-40"
                />
                <span className="text-sm text-white/80">{label}</span>
              </label>
            ))}
          </section>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full bg-[#b85c38] hover:bg-[#9e4e2f] disabled:opacity-60 text-white font-semibold py-4 rounded-2xl transition"
          >
            <Save size={18} />
            {saving ? "Sparar…" : "Spara inställningar"}
          </button>
        </form>
      )}

      <section className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-serif text-[#b85c38] flex items-center gap-2">
            <Send size={18} />
            Utskicklogg
          </h2>
          <button
            onClick={fetchLogs}
            disabled={logsLoading}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={logsLoading ? "animate-spin" : ""} />
            Uppdatera
          </button>
        </div>

        {logsLoading ? (
          <p className="text-white/50 text-sm">Laddar loggar…</p>
        ) : logs.length === 0 ? (
          <p className="text-white/50 text-sm">Inga utskick loggade ännu.</p>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {logs.map((log) => (
              <article
                key={log.id}
                className="bg-[#111] border border-white/5 rounded-xl p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-white/90">{log.typeLabel}</p>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[log.status] ?? STATUS_STYLE.PENDING}`}
                  >
                    {DELIVERY_STATUS_LABELS[log.status as keyof typeof DELIVERY_STATUS_LABELS] ?? log.status}
                  </span>
                </div>
                <p className="text-white/50 text-xs truncate">{log.subject}</p>
                <p className="text-white/40 text-xs mt-1">
                  Till: {log.recipient}
                  {log.orderNumber && ` · ${log.orderNumber}`}
                </p>
                <p className="text-white/30 text-xs mt-1">
                  {new Date(log.sentAt ?? log.createdAt).toLocaleString("sv-SE")}
                </p>
                {log.errorMessage && (
                  <p className="text-red-400/80 text-xs mt-1">{log.errorMessage}</p>
                )}
                {log.status === "FAILED" && (log.retryCount ?? 0) < 3 && (
                  <button
                    type="button"
                    onClick={() => retryLog(log.id)}
                    disabled={retrying === log.id}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-[#d4a574] hover:text-[#e8c4a8] disabled:opacity-50"
                  >
                    <RotateCcw size={12} className={retrying === log.id ? "animate-spin" : ""} />
                    Försök igen ({log.retryCount ?? 0}/3)
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
