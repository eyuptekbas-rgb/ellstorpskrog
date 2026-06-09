import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: "copper" | "green" | "blue" | "amber";
  hint?: string;
};

const accentStyles = {
  copper: {
    icon: "bg-[#b85c38]/15 text-[#d4a574]",
    value: "text-[#e8c4a8]",
    ring: "ring-[#b85c38]/10",
  },
  green: {
    icon: "bg-emerald-500/15 text-emerald-400",
    value: "text-emerald-300",
    ring: "ring-emerald-500/10",
  },
  blue: {
    icon: "bg-blue-500/15 text-blue-400",
    value: "text-blue-300",
    ring: "ring-blue-500/10",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-400",
    value: "text-amber-300",
    ring: "ring-amber-500/10",
  },
};

export default function KpiCard({
  label,
  value,
  icon: Icon,
  accent = "copper",
  hint,
}: Props) {
  const styles = accentStyles[accent];

  return (
    <article
      className={`card-premium rounded-3xl p-5 ring-1 ${styles.ring} transition hover:border-white/12 sm:p-6`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
            {label}
          </p>
          <p
            className={`mt-3 font-serif text-2xl leading-none sm:text-[2rem] ${styles.value}`}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-2 text-[11px] leading-relaxed text-white/30">{hint}</p>
          )}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}
        >
          <Icon size={20} strokeWidth={1.75} />
        </div>
      </div>
    </article>
  );
}
