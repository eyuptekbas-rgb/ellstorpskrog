"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { AnalyticsSnapshot } from "@/lib/admin/analytics";
import { PAYMENT_LABELS } from "@/lib/orders";

function AnalyticsAdminClient() {
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("Kunde inte ladda analys.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-white/45">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error || "Ingen data"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-6 sm:px-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4a574]">
          Analys
        </p>
        <h1 className="font-serif text-3xl text-white">Restaurant Analytics</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Dagens försäljning" value={`${data.todaySales} kr`} />
        <StatCard label="Ordrar idag" value={String(data.todayOrders)} />
        <StatCard label="Snittnota" value={`${data.averageTicket} kr`} />
        <StatCard
          label="Köks tid (snitt)"
          value={
            data.averageKitchenMinutes !== null
              ? `${data.averageKitchenMinutes} min`
              : "—"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/8 bg-[#141414] p-5">
          <h2 className="font-serif text-xl text-white">Toppprodukter</h2>
          <ul className="mt-4 space-y-2">
            {data.topProducts.length === 0 ? (
              <li className="text-sm text-white/40">Inga produkter idag.</li>
            ) : (
              data.topProducts.map((product) => (
                <li
                  key={product.name}
                  className="flex items-center justify-between rounded-xl border border-white/6 bg-[#0f0f0f] px-4 py-3 text-sm"
                >
                  <span className="text-white">{product.name}</span>
                  <span className="text-white/50">
                    {product.quantity} st · {product.revenue} kr
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#141414] p-5">
          <h2 className="font-serif text-xl text-white">Betalsätt</h2>
          <ul className="mt-4 space-y-2">
            {data.paymentMethods.map((entry) => (
              <li
                key={entry.method}
                className="flex items-center justify-between rounded-xl border border-white/6 bg-[#0f0f0f] px-4 py-3 text-sm"
              >
                <span className="text-white">{PAYMENT_LABELS[entry.method]}</span>
                <span className="text-white/50">
                  {entry.count} · {entry.total} kr
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Klara idag" value={String(data.completedToday)} />
        <StatCard label="Avbrutna idag" value={String(data.cancelledToday)} />
        <StatCard label="Avbokningsgrad" value={`${data.cancellationRate}%`} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-[#141414] px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl text-[#e8c4a8]">{value}</p>
    </div>
  );
}

export default memo(AnalyticsAdminClient);
