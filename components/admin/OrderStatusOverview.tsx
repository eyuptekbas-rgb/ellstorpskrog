import Link from "next/link";
import { ORDER_STATUSES, STATUS_LABELS, statusStyle } from "@/lib/orders";
import type { OrderStatus } from "@prisma/client";

type Props = {
  statusCounts: Record<string, number>;
};

export default function OrderStatusOverview({ statusCounts }: Props) {
  const total = ORDER_STATUSES.reduce(
    (sum, status) => sum + (statusCounts[status] ?? 0),
    0
  );

  if (total === 0) return null;

  return (
    <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="font-serif text-xl text-white">Orderstatus</h2>
        <p className="mt-0.5 text-sm text-white/45">
          Fördelning av alla {total} ordrar
        </p>
      </div>

      <div className="space-y-3">
        {ORDER_STATUSES.map((status) => {
          const count = statusCounts[status] ?? 0;
          if (count === 0) return null;
          const pct = Math.round((count / total) * 100);

          return (
            <div key={status}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle(status as OrderStatus)}`}
                >
                  {STATUS_LABELS[status]}
                </span>
                <span className="text-white/50">
                  {count}{" "}
                  <span className="text-white/30">({pct}%)</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-[#b85c38]/70 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/admin/orders"
        className="mt-5 inline-flex text-xs font-medium text-[#d4a574] transition hover:text-[#e8c4a8]"
      >
        Hantera alla ordrar →
      </Link>
    </section>
  );
}
