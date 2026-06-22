type BarDatum = {
  label: string;
  value: number;
  displayValue?: string;
};

type Props = {
  data: BarDatum[];
  accent?: "copper" | "green";
  emptyLabel?: string;
};

export default function DashboardBarChart({
  data,
  accent = "copper",
  emptyLabel = "Ingen data",
}: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const hasData = data.some((d) => d.value > 0);
  const barClass =
    accent === "green"
      ? "bg-emerald-500/80 group-hover:bg-emerald-400"
      : "bg-[#b85c38]/80 group-hover:bg-[#c96a45]";

  if (!hasData) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10">
        <p className="text-sm text-white/40">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex h-44 min-w-full items-end gap-1.5 sm:gap-2">
        {data.map((datum) => {
          const height = Math.max(6, Math.round((datum.value / max) * 100));
          return (
            <div
              key={datum.label}
              className="group flex min-w-[2rem] flex-1 flex-col items-center gap-2"
            >
              <span className="text-[10px] font-medium tabular-nums text-white/50 opacity-0 transition group-hover:opacity-100">
                {datum.displayValue ?? datum.value}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-lg transition-all ${barClass}`}
                  style={{ height: `${height}%` }}
                  title={`${datum.label}: ${datum.displayValue ?? datum.value}`}
                />
              </div>
              <span className="max-w-full truncate text-[10px] text-white/35">
                {datum.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
