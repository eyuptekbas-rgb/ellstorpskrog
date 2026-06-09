"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { ServiceStatus } from "@/lib/health/checks";

type Props = {
  title: string;
  subtitle?: string;
  status: ServiceStatus;
  children?: React.ReactNode;
};

const STATUS_CONFIG: Record<
  ServiceStatus,
  { icon: typeof CheckCircle2; color: string; bg: string; label: string }
> = {
  ok: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    label: "OK",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    label: "Varning",
  },
  error: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/15",
    label: "Fel",
  },
};

export default function SystemStatusCard({ title, subtitle, status, children }: Props) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <section className="rounded-3xl border border-white/8 bg-gradient-to-b from-[#1a1a1a] to-[#141414] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-white/45">{subtitle}</p>}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cfg.bg} ${cfg.color}`}
        >
          <Icon size={22} />
        </div>
      </div>
      <p className={`mt-3 text-xs font-medium uppercase tracking-wider ${cfg.color}`}>
        {cfg.label}
      </p>
      {children && <div className="mt-4 space-y-2">{children}</div>}
    </section>
  );
}

export function StatusRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: ServiceStatus;
}) {
  const color =
    status === "error"
      ? "text-red-400"
      : status === "warning"
        ? "text-amber-400"
        : "text-white/70";

  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-white/45 shrink-0">{label}</span>
      <span className={`text-right ${color}`}>{value}</span>
    </div>
  );
}

export function CheckList({
  items,
}: {
  items: Array<{ label: string; message?: string; status: ServiceStatus }>;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-start gap-2 text-sm">
          {item.status === "ok" ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
          ) : item.status === "warning" ? (
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" />
          ) : (
            <XCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
          )}
          <div>
            <span className="text-white/70">{item.label}</span>
            {item.message && (
              <p className="text-xs text-white/40 mt-0.5">{item.message}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
