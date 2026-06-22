import type { ReservationAdminStats } from "@/lib/reservations/admin";
import { CalendarDays, Clock, Sofa, Users } from "lucide-react";

type Props = {
  stats: ReservationAdminStats;
};

export default function ReservationStatsWidgets({ stats }: Props) {
  const occupancyPct =
    stats.totalTables > 0
      ? Math.round((stats.occupiedTables / stats.totalTables) * 100)
      : 0;

  const cards = [
    {
      label: "Dagens bokningar",
      value: stats.todayCount.toString(),
      hint: "Reservationer idag",
      icon: CalendarDays,
      accent: "text-[#e8c4a8]",
    },
    {
      label: "Lediga bord",
      value: stats.availableTables.toString(),
      hint: `${stats.totalTables} bord totalt`,
      icon: Sofa,
      accent: "text-emerald-300",
    },
    {
      label: "Upptagna bord",
      value: stats.occupiedTables.toString(),
      hint: `${occupancyPct}% beläggning`,
      icon: Users,
      accent: "text-blue-300",
    },
    {
      label: "Kommande ankomster",
      value: stats.upcomingArrivals.toString(),
      hint: "Inom 2 timmar",
      icon: Clock,
      accent: "text-amber-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon, accent }) => (
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
              <p className="mt-1.5 text-[11px] text-white/30">{hint}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#b85c38]/12 text-[#d4a574]">
              <Icon size={18} strokeWidth={1.75} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
