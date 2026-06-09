import { OrderStatus } from "@prisma/client";
import KpiCard from "@/components/admin/KpiCard";
import OrderStatusOverview from "@/components/admin/OrderStatusOverview";
import QuickActions from "@/components/admin/QuickActions";
import RecentOrdersWidget from "@/components/admin/RecentOrdersWidget";
import { getDashboardStats } from "@/lib/admin/stats";
import {
  Activity,
  CalendarDays,
  Clock,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.NEW,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERING,
];

export default async function AdminDashboardPage() {
  const {
    todayOrders,
    newOrders,
    revenue,
    statusCounts,
    latestOrders,
    dbError,
  } = await getDashboardStats();

  const activeOrders = ACTIVE_STATUSES.reduce(
    (sum, status) => sum + (statusCounts[status] ?? 0),
    0
  );

  return (
    <div className="px-4 py-6 pb-12 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-10 border-b border-white/[0.05] pb-8">
        <p className="section-label mb-3">Översikt</p>
        <h1 className="font-serif text-3xl text-white sm:text-4xl lg:text-[2.75rem]">
          Dashboard
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/45">
          Välkommen tillbaka — här är dagens siffror
        </p>
      </header>

      {dbError && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <p className="font-medium mb-1">Databasen är inte tillgänglig</p>
          <p className="text-amber-200/70 text-xs leading-relaxed">{dbError}</p>
          <p className="text-amber-200/70 text-xs mt-2">
            Starta PostgreSQL och kör:{" "}
            <code className="text-amber-100">npx prisma migrate dev</code>
          </p>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard
          label="Dagens ordrar"
          value={todayOrders.toString()}
          icon={CalendarDays}
          accent="copper"
          hint="Sedan midnatt"
        />
        <KpiCard
          label="Intäkter idag"
          value={`${revenue} kr`}
          icon={TrendingUp}
          accent="green"
          hint="Exkl. avbrutna"
        />
        <KpiCard
          label="Nya ordrar"
          value={newOrders.toString()}
          icon={Clock}
          accent="amber"
          hint="Väntar på hantering"
        />
        <KpiCard
          label="Aktiva ordrar"
          value={activeOrders.toString()}
          icon={Activity}
          accent="blue"
          hint="Pågående i köket"
        />
      </div>

      <div className="mb-8">
        <QuickActions />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <RecentOrdersWidget orders={latestOrders} />
        </div>
        <div className="lg:col-span-2">
          <OrderStatusOverview statusCounts={statusCounts} />
        </div>
      </div>
    </div>
  );
}
