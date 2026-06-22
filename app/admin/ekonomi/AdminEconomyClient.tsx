"use client";

import { useCallback, useEffect, useState } from "react";
import { PaymentStatus, OrderStatus } from "@prisma/client";
import {
  Banknote,
  Clock,
  FileText,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import KpiCard from "@/components/admin/KpiCard";
import FakturaDocument from "@/components/faktura/FakturaDocument";
import type { InvoiceData } from "@/lib/economy/invoice";
import { formatSek } from "@/lib/economy/invoice";
import type { EconomyPeriod, EconomyStats } from "@/lib/economy/stats";
import {
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  formatOrderDate,
  formatOrderNumber,
  paymentStatusStyle,
  statusStyle,
} from "@/lib/orders";

const PERIOD_OPTIONS: { key: EconomyPeriod; label: string }[] = [
  { key: "today", label: "Idag" },
  { key: "week", label: "7 dagar" },
  { key: "month", label: "Denna månad" },
  { key: "all", label: "All tid" },
];

export default function AdminEconomyClient() {
  const [period, setPeriod] = useState<EconomyPeriod>("month");
  const [stats, setStats] = useState<EconomyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(
    null
  );
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/economy?period=${period}`);
      if (!res.ok) throw new Error();
      setStats(await res.json());
    } catch {
      setError("Kunde inte hämta ekonomidata.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const openInvoice = async (orderId: string) => {
    setLoadingInvoice(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/economy?invoiceId=${orderId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelectedInvoice(data.invoice);
    } catch {
      setError("Kunde inte hämta fakturan.");
    } finally {
      setLoadingInvoice(false);
    }
  };

  return (
    <div className="px-4 py-6 pb-12 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-8 border-b border-white/[0.05] pb-8">
        <p className="section-label mb-3">Ekonomi</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-white sm:text-4xl">Ekonomi</h1>
            <p className="mt-3 text-sm text-white/45">
              Intäkter, betalningar och fakturor för din restaurang
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchStats()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Uppdatera
          </button>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setPeriod(option.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              period === option.key
                ? "bg-[#b85c38] text-white"
                : "border border-white/10 bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {stats?.dbError && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {stats.dbError}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard
          label="Intäkter"
          value={formatSek(stats?.revenue ?? 0)}
          icon={TrendingUp}
          accent="green"
          hint="Exkl. avbrutna ordrar"
        />
        <KpiCard
          label="Betalt"
          value={formatSek(stats?.paidRevenue ?? 0)}
          icon={Banknote}
          accent="copper"
          hint={`${stats?.paidCount ?? 0} fakturor`}
        />
        <KpiCard
          label="Obetalt"
          value={formatSek(stats?.pendingRevenue ?? 0)}
          icon={Clock}
          accent="amber"
          hint={`${stats?.pendingCount ?? 0} väntande`}
        />
        <KpiCard
          label="Snittorder"
          value={formatSek(stats?.averageOrderValue ?? 0)}
          icon={Wallet}
          accent="blue"
          hint={`${stats?.orderCount ?? 0} ordrar totalt`}
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl text-white">Fakturor</h2>
            <p className="mt-1 text-sm text-white/45">
              Senaste ordrar med fakturaunderlag
            </p>
          </div>
        </div>

        {loading ? (
          <p className="py-12 text-center text-white/45">Laddar fakturor…</p>
        ) : !stats?.invoices.length ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-10 text-center text-white/45">
            Inga fakturor i vald period.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/8">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/8 bg-white/[0.03] text-left text-[11px] uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-4 py-3 font-semibold">Faktura</th>
                  <th className="px-4 py-3 font-semibold">Datum</th>
                  <th className="px-4 py-3 font-semibold">Kund</th>
                  <th className="px-4 py-3 font-semibold">Belopp</th>
                  <th className="px-4 py-3 font-semibold">Betalning</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {stats.invoices.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {formatOrderNumber(row.orderNumber)}
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {formatOrderDate(new Date(row.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white/85">{row.customerName}</p>
                      <p className="text-xs text-white/40">{row.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums text-white">
                      {formatSek(row.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${paymentStatusStyle(row.paymentStatus as PaymentStatus)}`}
                      >
                        {PAYMENT_STATUS_LABELS[row.paymentStatus as PaymentStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(row.status as OrderStatus)}`}
                      >
                        {STATUS_LABELS[row.status as OrderStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void openInvoice(row.id)}
                        disabled={loadingInvoice}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/75 transition hover:bg-white/10"
                      >
                        <FileText size={14} />
                        Visa faktura
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedInvoice && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedInvoice(null)}
          />
          <div className="fixed inset-x-4 top-[3vh] z-50 mx-auto max-h-[94vh] max-w-3xl overflow-y-auto">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-full bg-white/10 px-4 py-2 text-sm text-white"
              >
                Stäng
              </button>
            </div>
            <FakturaDocument invoice={selectedInvoice} />
          </div>
        </>
      )}
    </div>
  );
}
