import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import type { DashboardSystemStatus as SystemStatusData } from "@/lib/admin/stats";
import type { ServiceStatus } from "@/lib/health/checks";
import { formatOrderDate } from "@/lib/orders";

type Props = {
  system: SystemStatusData;
  lastOrderReceived: string | null;
  refreshing?: boolean;
};

const STATUS_ICON: Record<ServiceStatus, typeof CheckCircle2> = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const STATUS_COLOR: Record<ServiceStatus, string> = {
  ok: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-red-400",
};

const STATUS_BG: Record<ServiceStatus, string> = {
  ok: "bg-emerald-500/15",
  warning: "bg-amber-500/15",
  error: "bg-red-500/15",
};

function StatusItem({
  label,
  status,
  detail,
}: {
  label: string;
  status: ServiceStatus;
  detail: string;
}) {
  const Icon = STATUS_ICON[status];

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/6 bg-[#121212] p-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${STATUS_BG[status]}`}
      >
        <Icon size={18} className={STATUS_COLOR[status]} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className={`mt-0.5 text-xs ${STATUS_COLOR[status]}`}>{detail}</p>
      </div>
    </div>
  );
}

export default function DashboardSystemStatus({
  system,
  lastOrderReceived,
  refreshing,
}: Props) {
  const pollingSeconds = Math.round(system.pollingIntervalMs / 1000);
  const lastOrderLabel = lastOrderReceived
    ? formatOrderDate(new Date(lastOrderReceived))
    : "Ingen order ännu";

  return (
    <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-white">Systemstatus</h2>
          <p className="mt-0.5 text-sm text-white/45">Drift och anslutningar</p>
        </div>
        {refreshing && (
          <RefreshCw size={16} className="animate-spin text-[#d4a574]" aria-hidden />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatusItem
          label="Betalningar"
          status={system.payments}
          detail={system.paymentsMessage ?? "—"}
        />
        <StatusItem
          label="Databas"
          status={system.database}
          detail={system.databaseMessage ?? "—"}
        />
        <StatusItem
          label="Polling"
          status="ok"
          detail={`Auto-uppdatering var ${pollingSeconds}:e sekund`}
        />
        <StatusItem
          label="Senaste order"
          status={lastOrderReceived ? "ok" : "warning"}
          detail={lastOrderLabel}
        />
      </div>
    </section>
  );
}
