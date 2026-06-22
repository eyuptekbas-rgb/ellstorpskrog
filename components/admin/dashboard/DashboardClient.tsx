"use client";

import { useCallback, useEffect, useState } from "react";
import KpiCard from "@/components/admin/KpiCard";
import QuickActions from "@/components/admin/QuickActions";
import RecentOrdersWidget from "@/components/admin/RecentOrdersWidget";
import DashboardBarChart from "@/components/admin/dashboard/DashboardBarChart";
import DashboardSystemStatus from "@/components/admin/dashboard/DashboardSystemStatus";
import type { DashboardStats } from "@/lib/admin/stats";
import { POLL_INTERVAL_MS } from "@/lib/orders/admin-filters";
import {
  CalendarDays,
  CheckCircle2,
  ChefHat,
  Clock,
  PackageCheck,
  TrendingUp,
} from "lucide-react";

type Props = {
  initial: DashboardStats;
};

export default function DashboardClient({ initial }: Props) {
  const [data, setData] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      /* keep last good data */
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const hourlyChart = data.ordersPerHour
    .filter((b) => b.hour >= 6 && b.hour <= 23)
    .map((b) => ({
      label: `${b.hour.toString().padStart(2, "0")}`,
      value: b.count,
    }));

  const revenueChart = data.revenueLast7Days.map((d) => ({
    label: d.label,
    value: d.revenue,
    displayValue: `${d.revenue} kr`,
  }));

  return (
    <div className="px-4 py-6 pb-12 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-8 border-b border-white/[0.05] pb-8 lg:mb-10">
        <p className="section-label mb-3">Översikt</p>
        <h1 className="font-serif text-3xl text-white sm:text-4xl lg:text-[2.75rem]">
          Dashboard
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/45">
          Välkommen tillbaka — här är dagens siffror
        </p>
      </header>

      {data.dbError && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <p className="mb-1 font-medium">Databasen är inte tillgänglig</p>
          <p className="text-xs leading-relaxed text-amber-200/70">{data.dbError}</p>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 xl:gap-4">
        <KpiCard
          label="Dagens ordrar"
          value={data.todayOrders.toString()}
          icon={CalendarDays}
          accent="copper"
          hint="Sedan midnatt"
        />
        <KpiCard
          label="Intäkter idag"
          value={`${data.revenue} kr`}
          icon={TrendingUp}
          accent="green"
          hint="Exkl. avbrutna"
        />
        <KpiCard
          label="Tillagas"
          value={data.ordersPreparing.toString()}
          icon={ChefHat}
          accent="amber"
          hint="Bekräftade + tillagas"
        />
        <KpiCard
          label="Klara"
          value={data.ordersReady.toString()}
          icon={PackageCheck}
          accent="blue"
          hint="Redo att hämtas/levereras"
        />
        <KpiCard
          label="Slutförda idag"
          value={data.completedToday.toString()}
          icon={CheckCircle2}
          accent="green"
          hint="Hämtade/levererade"
        />
        <KpiCard
          label="Snittorder"
          value={`${data.averageOrderValue} kr`}
          icon={Clock}
          accent="copper"
          hint="Genomsnitt idag"
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
          <h2 className="font-serif text-xl text-white">Ordrar per timme</h2>
          <p className="mt-0.5 text-sm text-white/45">Idag, 06–23</p>
          <div className="mt-5">
            <DashboardBarChart
              data={hourlyChart}
              accent="copper"
              emptyLabel="Inga ordrar idag ännu"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
          <h2 className="font-serif text-xl text-white">Intäkter senaste 7 dagarna</h2>
          <p className="mt-0.5 text-sm text-white/45">Exkl. avbrutna och misslyckade</p>
          <div className="mt-5">
            <DashboardBarChart
              data={revenueChart}
              accent="green"
              emptyLabel="Ingen intäkt senaste veckan"
            />
          </div>
        </section>
      </div>

      <div className="mb-8">
        <QuickActions />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <RecentOrdersWidget orders={data.latestOrders} />
        </div>
        <div className="lg:col-span-2">
          <DashboardSystemStatus
            system={data.system}
            lastOrderReceived={data.lastOrderReceived}
            refreshing={refreshing}
          />
        </div>
      </div>
    </div>
  );
}
