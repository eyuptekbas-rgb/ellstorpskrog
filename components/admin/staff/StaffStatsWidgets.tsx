import type { StaffDashboardStats } from "@/lib/staff/staff-service";
import { Clock, LogIn, Users } from "lucide-react";

type Props = { stats: StaffDashboardStats };

export default function StaffStatsWidgets({ stats }: Props) {
  const cards = [
    {
      label: "Personal online",
      value: stats.staffOnline,
      icon: Users,
      accent: "text-emerald-300",
    },
    {
      label: "Aktiva sessioner",
      value: stats.activeSessions,
      icon: LogIn,
      accent: "text-[#e8c4a8]",
    },
    {
      label: "Senaste inloggningar",
      value: stats.recentLogins.length,
      icon: Clock,
      accent: "text-blue-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
