"use client";

import { AlertTriangle, BarChart3, CheckCircle2, Mail } from "lucide-react";

type Stats = {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  pending: number;
  deliveryRate: number;
  last24Hours: { total: number; sent: number; failed: number };
  last7Days: { total: number; sent: number; failed: number };
};

type Props = {
  stats: Stats | null;
  loading?: boolean;
  onRetryAll?: () => void;
  retrying?: boolean;
};

export default function EmailStatsWidget({
  stats,
  loading,
  onRetryAll,
  retrying,
}: Props) {
  if (loading || !stats) {
    return (
      <div className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 animate-pulse h-48" />
    );
  }

  return (
    <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-[#d4a574]" />
          <h2 className="font-serif text-xl text-white">Leveransstatistik</h2>
        </div>
        {stats.failed > 0 && onRetryAll && (
          <button
            type="button"
            onClick={onRetryAll}
            disabled={retrying}
            className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {retrying ? "Försöker…" : `Försök igen (${stats.failed})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Totalt" value={stats.total} icon={Mail} />
        <StatCard
          label="Skickade"
          value={stats.sent}
          icon={CheckCircle2}
          accent="text-emerald-400"
        />
        <StatCard
          label="Misslyckade"
          value={stats.failed}
          icon={AlertTriangle}
          accent="text-red-400"
        />
        <StatCard
          label="Leveransgrad"
          value={`${stats.deliveryRate}%`}
          accent="text-[#e8c4a8]"
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 text-xs text-white/45">
        <p>
          Senaste 24 h: {stats.last24Hours.sent}/{stats.last24Hours.total} skickade
          {stats.last24Hours.failed > 0 && (
            <span className="text-red-400"> · {stats.last24Hours.failed} misslyckade</span>
          )}
        </p>
        <p>
          Senaste 7 d: {stats.last7Days.sent}/{stats.last7Days.total} skickade
          {stats.last7Days.failed > 0 && (
            <span className="text-red-400"> · {stats.last7Days.failed} misslyckade</span>
          )}
        </p>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = "text-white",
}: {
  label: string;
  value: number | string;
  icon?: typeof Mail;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/6 bg-[#121212] p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
        {Icon && <Icon size={14} className="text-white/30" />}
      </div>
      <p className={`mt-1 font-serif text-2xl ${accent}`}>{value}</p>
    </div>
  );
}
