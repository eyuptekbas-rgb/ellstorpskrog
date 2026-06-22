import type { CustomerDashboardStats } from "@/lib/customers/crm";
import { Crown, RefreshCw, Sparkles, UserPlus } from "lucide-react";

type Props = { stats: CustomerDashboardStats };

export default function CustomerStatsWidgets({ stats }: Props) {
  const cards = [
    {
      label: "Nya idag",
      value: stats.newToday,
      icon: UserPlus,
      accent: "text-[#e8c4a8]",
    },
    {
      label: "Återkommande",
      value: stats.returning,
      icon: RefreshCw,
      accent: "text-emerald-300",
    },
    {
      label: "VIP-kunder",
      value: stats.vipCount,
      icon: Crown,
      accent: "text-amber-300",
    },
    {
      label: "Toppkunder",
      value: stats.topCustomers.length,
      icon: Sparkles,
      accent: "text-blue-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, accent }) => (
        <article
          key={label}
          className="card-premium rounded-3xl p-4 ring-1 ring-[#b85c38]/10 sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                {label}
              </p>
              <p className={`mt-2 font-serif text-2xl leading-none ${accent}`}>{value}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#b85c38]/12 text-[#d4a574]">
              <Icon size={18} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
