"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlatformInvoiceStatus } from "@prisma/client";
import {
  Banknote,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Settings2,
  Wallet,
  XCircle,
} from "lucide-react";
import PlatformInvoiceDocument from "@/components/platform/PlatformInvoiceDocument";
import { formatSek } from "@/lib/billing/calculate";
import { INVOICE_STATUS_LABELS } from "@/lib/billing/invoice-data";
import type {
  BillingDashboardStats,
  BillingPeriod,
  PlatformInvoiceDocument as InvoiceDoc,
  TenantBillingRow,
} from "@/lib/billing/types";
import { ORDINA } from "@/lib/tenant/branding";

type BillingResponse = {
  stats: BillingDashboardStats;
  tenants: TenantBillingRow[];
  period: BillingPeriod;
};

type InvoiceHistoryItem = {
  id: string;
  invoiceNumber: string;
  periodYear: number;
  periodMonth: number;
  totalAmount: number;
  status: PlatformInvoiceStatus;
  sentAt: string | null;
  paidAt: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-white/10 text-white/70",
  SENT: "bg-blue-500/15 text-blue-200",
  PAID: "bg-emerald-500/15 text-emerald-200",
  OVERDUE: "bg-amber-500/15 text-amber-200",
  CANCELLED: "bg-red-500/15 text-red-200",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("sv-SE");
}

export default function PlatformEconomyClient() {
  const [data, setData] = useState<BillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [settingsTenant, setSettingsTenant] = useState<TenantBillingRow | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    monthlySubscriptionFee: 0,
    orderFee: 0,
    billingVatRate: "" as string | number,
    invoiceEmail: "",
    companyName: "",
    organizationNumber: "",
    billingAddress: "",
  });

  const [previewDoc, setPreviewDoc] = useState<InvoiceDoc | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);

  const [historyTenant, setHistoryTenant] = useState<TenantBillingRow | null>(null);
  const [history, setHistory] = useState<InvoiceHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/platform/billing");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("Kunde inte hämta ekonomidata.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const openSettings = (tenant: TenantBillingRow) => {
    setSettingsTenant(tenant);
    setSettingsForm({
      monthlySubscriptionFee: tenant.monthlySubscriptionFee,
      orderFee: tenant.orderFee,
      billingVatRate: tenant.billingVatRate ?? "",
      invoiceEmail: tenant.invoiceEmail ?? "",
      companyName: tenant.companyName ?? "",
      organizationNumber: tenant.organizationNumber ?? "",
      billingAddress: tenant.billingAddress ?? "",
    });
  };

  const saveSettings = async () => {
    if (!settingsTenant) return;
    setBusyId(settingsTenant.id);
    setError("");
    try {
      const res = await fetch(`/api/platform/billing/tenants/${settingsTenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settingsForm,
          billingVatRate:
            settingsForm.billingVatRate === ""
              ? null
              : Number(settingsForm.billingVatRate),
        }),
      });
      if (!res.ok) throw new Error();
      setSettingsTenant(null);
      await fetchData();
    } catch {
      setError("Kunde inte spara faktureringsinställningar.");
    } finally {
      setBusyId(null);
    }
  };

  const generateInvoice = async (tenant: TenantBillingRow, regenerate = false) => {
    setBusyId(tenant.id);
    setError("");
    try {
      const res = await fetch("/api/platform/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          year: tenant.currentPeriod.year,
          month: tenant.currentPeriod.month,
          regenerate,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Generate failed");
      await fetchData();
      await openPreview(body.invoice.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte generera faktura.");
    } finally {
      setBusyId(null);
    }
  };

  const openPreview = async (invoiceId: string) => {
    setBusyId(invoiceId);
    try {
      const res = await fetch(`/api/platform/billing/invoices/${invoiceId}`);
      if (!res.ok) throw new Error();
      const body = await res.json();
      setPreviewDoc(body.document);
      setPreviewInvoiceId(invoiceId);
    } catch {
      setError("Kunde inte hämta faktura.");
    } finally {
      setBusyId(null);
    }
  };

  const sendInvoice = async (invoiceId: string) => {
    setBusyId(invoiceId);
    setError("");
    try {
      const res = await fetch(`/api/platform/billing/invoices/${invoiceId}/send`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Send failed");
      await fetchData();
      if (previewInvoiceId === invoiceId) {
        await openPreview(invoiceId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skicka faktura.");
    } finally {
      setBusyId(null);
    }
  };

  const markPaid = async (invoiceId: string) => {
    setBusyId(invoiceId);
    setError("");
    try {
      const res = await fetch(
        `/api/platform/billing/invoices/${invoiceId}/mark-paid`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
      await fetchData();
      if (previewInvoiceId === invoiceId) {
        await openPreview(invoiceId);
      }
      if (historyTenant) {
        await openHistory(historyTenant);
      }
    } catch {
      setError("Kunde inte markera faktura som betald.");
    } finally {
      setBusyId(null);
    }
  };

  const cancelInvoice = async (invoiceId: string) => {
    setBusyId(invoiceId);
    setError("");
    try {
      const res = await fetch(
        `/api/platform/billing/invoices/${invoiceId}/cancel`,
        { method: "POST" }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Cancel failed");
      await fetchData();
      if (previewInvoiceId === invoiceId) {
        setPreviewDoc(null);
        setPreviewInvoiceId(null);
      }
      if (historyTenant) {
        await openHistory(historyTenant);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunde inte makulera fakturan."
      );
    } finally {
      setBusyId(null);
    }
  };

  const openHistory = async (tenant: TenantBillingRow) => {
    setHistoryTenant(tenant);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/platform/billing/tenants/${tenant.id}`);
      if (!res.ok) throw new Error();
      const body = await res.json();
      setHistory(body.history);
    } catch {
      setError("Kunde inte hämta fakturahistorik.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const stats = data?.stats;

  return (
    <div className="px-5 py-8 pb-16">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#a78bfa] mb-2">
          Plattform · Ekonomi
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif tracking-wide">Ekonomi</h1>
            <div
              className="mt-3 h-[2px] w-16 rounded-full"
              style={{ background: ORDINA.primary }}
            />
            <p className="mt-3 max-w-2xl text-sm text-white/55">
              Månadsfakturering av kunder — abonnemang plus orderavgift per
              beställning. Fakturor genereras, skickas och sparas automatiskt.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-4 py-2.5 text-sm font-medium text-[#c4b5fd] disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Uppdatera
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            {
              label: "Intäkter denna månad",
              value: formatSek(stats.monthlyRevenue),
              icon: Wallet,
            },
            {
              label: "Obetalda fakturor",
              value: String(stats.outstandingInvoices),
              icon: FileText,
            },
            {
              label: "Betalda fakturor",
              value: String(stats.paidInvoices),
              icon: CheckCircle2,
            },
            {
              label: "Orderavgifter",
              value: formatSek(stats.totalOrderFees),
              icon: Banknote,
            },
            {
              label: "Abonnemang",
              value: formatSek(stats.totalSubscriptionFees),
              icon: Banknote,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-[#7c3aed]/20 bg-[#120a1f] p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-[#a78bfa]">
                  <Icon size={16} />
                  <p className="text-[11px] text-white/45">{item.label}</p>
                </div>
                <p className="text-xl font-serif" style={{ color: ORDINA.accent }}>
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#7c3aed]/20 bg-[#120a1f]">
        <div className="border-b border-[#7c3aed]/15 px-4 py-4 sm:px-6">
          <h2 className="font-medium text-white">Kunder</h2>
          <p className="text-xs text-white/45">
            Beräknad faktura = abonnemang + (ordrar × orderavgift) + moms
          </p>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center gap-2 py-16 text-white/45">
            <Loader2 size={20} className="animate-spin" />
            Laddar…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full text-sm">
              <thead>
                <tr className="border-b border-white/6 text-left text-xs uppercase tracking-wide text-white/35">
                  <th className="px-4 py-3 font-medium sm:px-6">Kund</th>
                  <th className="px-4 py-3 font-medium">Idag</th>
                  <th className="px-4 py-3 font-medium">Månad</th>
                  <th className="px-4 py-3 font-medium">Abonnemang</th>
                  <th className="px-4 py-3 font-medium">Orderavg.</th>
                  <th className="px-4 py-3 font-medium">Faktura</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Senast skickad</th>
                  <th className="px-4 py-3 font-medium">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {data?.tenants.map((tenant) => {
                  const invoiceId = tenant.currentInvoice?.id;
                  const isBusy = busyId === tenant.id || busyId === invoiceId;
                  const status = tenant.currentInvoice?.status ?? "NONE";

                  return (
                    <tr
                      key={tenant.id}
                      className="border-b border-white/5 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-4 sm:px-6">
                        <p className="font-medium text-white">{tenant.name}</p>
                        {tenant.customerNumber && (
                          <p className="font-mono text-xs text-[#a78bfa]">
                            {tenant.customerNumber}
                          </p>
                        )}
                        <p className="text-xs text-white/40">
                          {tenant.companyName || tenant.slug}
                          {!tenant.active && " · Pausad"}
                          {tenant.effectiveVatRate > 0 &&
                            ` · Moms ${tenant.effectiveVatRate}%`}
                        </p>
                      </td>
                      <td className="px-4 py-4">{tenant.ordersToday}</td>
                      <td className="px-4 py-4">{tenant.ordersThisMonth}</td>
                      <td className="px-4 py-4">
                        {formatSek(tenant.monthlySubscriptionFee)}
                      </td>
                      <td className="px-4 py-4">{formatSek(tenant.orderFee)}</td>
                      <td className="px-4 py-4 font-medium text-[#c4b5fd]">
                        {formatSek(tenant.currentInvoiceAmount)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            status === "NONE"
                              ? "bg-white/8 text-white/45"
                              : STATUS_STYLE[status] ?? STATUS_STYLE.DRAFT
                          }`}
                        >
                          {status === "NONE"
                            ? "Ej genererad"
                            : INVOICE_STATUS_LABELS[status] ?? status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-white/50">
                        {formatDateTime(tenant.lastInvoiceSentAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            title="Inställningar"
                            disabled={isBusy}
                            onClick={() => openSettings(tenant)}
                            className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/5 hover:text-white disabled:opacity-40"
                          >
                            <Settings2 size={14} />
                          </button>
                          <button
                            type="button"
                            title="Generera faktura"
                            disabled={isBusy}
                            onClick={() => void generateInvoice(tenant, Boolean(invoiceId))}
                            className="rounded-lg border border-[#7c3aed]/30 p-2 text-[#c4b5fd] hover:bg-[#7c3aed]/10 disabled:opacity-40"
                          >
                            <FileText size={14} />
                          </button>
                          {invoiceId && (
                            <>
                              <button
                                type="button"
                                title="Förhandsgranska"
                                disabled={isBusy}
                                onClick={() => void openPreview(invoiceId)}
                                className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/5 disabled:opacity-40"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                title="Skicka e-post"
                                disabled={isBusy}
                                onClick={() => void sendInvoice(invoiceId)}
                                className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/5 disabled:opacity-40"
                              >
                                <Send size={14} />
                              </button>
                              {tenant.currentInvoice?.status !== "PAID" && (
                                <button
                                  type="button"
                                  title="Markera betald"
                                  disabled={isBusy}
                                  onClick={() => void markPaid(invoiceId)}
                                  className="rounded-lg border border-emerald-500/30 p-2 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                              )}
                              {tenant.currentInvoice?.status !== "PAID" &&
                                tenant.currentInvoice?.status !== "CANCELLED" && (
                                  <button
                                    type="button"
                                    title="Makulera"
                                    disabled={isBusy}
                                    onClick={() => void cancelInvoice(invoiceId)}
                                    className="rounded-lg border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                )}
                            </>
                          )}
                          <button
                            type="button"
                            title="Historik"
                            disabled={isBusy}
                            onClick={() => void openHistory(tenant)}
                            className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/5 disabled:opacity-40"
                          >
                            <Mail size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {settingsTenant && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#7c3aed]/25 bg-[#120a1f] p-6">
            <h3 className="text-lg font-medium text-white">
              Faktureringsinställningar — {settingsTenant.name}
            </h3>
            <div className="mt-4 space-y-3">
              {[
                ["monthlySubscriptionFee", "Månadsabonnemang (SEK)", "number"],
                ["orderFee", "Orderavgift (SEK)", "number"],
                [
                  "billingVatRate",
                  "Moms (%) — tom = plattformsstandard",
                  "number",
                ],
                ["invoiceEmail", "Faktura-e-post", "email"],
                ["companyName", "Företagsnamn", "text"],
                ["organizationNumber", "Organisationsnummer", "text"],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs text-white/45">{label}</label>
                  <input
                    type={type}
                    value={settingsForm[key as keyof typeof settingsForm]}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        [key]:
                          type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-[#7c3aed]/40"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs text-white/45">Fakturaadress</label>
                <textarea
                  rows={3}
                  value={settingsForm.billingAddress}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, billingAddress: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-[#7c3aed]/40"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => void saveSettings()}
                disabled={busyId === settingsTenant.id}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ background: ORDINA.primary }}
              >
                Spara
              </button>
              <button
                type="button"
                onClick={() => setSettingsTenant(null)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {previewDoc && previewInvoiceId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4">
          <div className="mx-auto max-w-3xl py-8">
            <div className="mb-4 flex flex-wrap gap-2">
              <a
                href={`/api/platform/billing/invoices/${previewInvoiceId}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Ladda ner PDF
              </a>
              <button
                type="button"
                onClick={() => void sendInvoice(previewInvoiceId)}
                className="rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-4 py-2 text-sm text-[#c4b5fd]"
              >
                Skicka e-post
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewDoc(null);
                  setPreviewInvoiceId(null);
                }}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60"
              >
                Stäng
              </button>
            </div>
            <PlatformInvoiceDocument
              document={previewDoc}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      )}

      {historyTenant && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#7c3aed]/25 bg-[#120a1f] p-6">
            <h3 className="text-lg font-medium text-white">
              Fakturahistorik — {historyTenant.name}
              {historyTenant.customerNumber && (
                <span className="ml-2 font-mono text-sm text-[#a78bfa]">
                  {historyTenant.customerNumber}
                </span>
              )}
            </h3>
            {historyLoading ? (
              <div className="py-12 text-center text-white/45">
                <Loader2 size={24} className="mx-auto animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <p className="py-8 text-sm text-white/45">Inga fakturor ännu.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3"
                  >
                    <div>
                      <p className="font-medium text-white">{item.invoiceNumber}</p>
                      <p className="text-xs text-white/45">
                        {item.periodMonth}/{item.periodYear} · {formatSek(item.totalAmount)}
                      </p>
                      <p className="text-xs text-white/35">
                        Skickad: {formatDateTime(item.sentAt)} · Betald:{" "}
                        {formatDateTime(item.paidAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          STATUS_STYLE[item.status] ?? STATUS_STYLE.DRAFT
                        }`}
                      >
                        {INVOICE_STATUS_LABELS[item.status]}
                      </span>
                      <button
                        type="button"
                        onClick={() => void openPreview(item.id)}
                        className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/60"
                      >
                        Visa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setHistoryTenant(null)}
              className="mt-6 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60"
            >
              Stäng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
