"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import type { SalesReport } from "@/lib/reports/sales-report";

function ReportsAdminClient() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [kind, setKind] = useState<"x" | "z" | "daily">("x");
  const [countedCash, setCountedCash] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ kind });
      if (countedCash) params.set("countedCash", countedCash);
      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } finally {
      setLoading(false);
    }
  }, [kind, countedCash]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const exportFile = (format: "csv" | "pdf") => {
    const params = new URLSearchParams({ kind, format });
    window.open(`/api/admin/reports?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d4a574]">
          Reports
        </p>
        <h1 className="font-serif text-3xl text-white">Dagsavslut & rapporter</h1>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["x", "z", "daily"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setKind(value)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold uppercase ${
              kind === value
                ? "border-[#b85c38]/35 bg-[#b85c38]/12 text-[#e8c4a8]"
                : "border-white/10 text-white/60"
            }`}
          >
            {value === "x" ? "X Report" : value === "z" ? "Z Report" : "Daily Close"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-white/60">
          Räknad kontant (kr)
          <input
            value={countedCash}
            onChange={(e) => setCountedCash(e.target.value)}
            className="ml-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
          />
        </label>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm"
        >
          Uppdatera
        </button>
        <button
          type="button"
          onClick={() => exportFile("csv")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm"
        >
          <FileSpreadsheet size={14} /> CSV/Excel
        </button>
        <button
          type="button"
          onClick={() => exportFile("pdf")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm"
        >
          <FileText size={14} /> PDF
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-white/40">
          <Loader2 className="animate-spin" />
        </div>
      ) : report ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Brutto", `${report.grossSales} kr`],
            ["Netto", `${report.netSales} kr`],
            ["Ordrar", String(report.orderCount)],
            ["Snittnota", `${report.averageTicket} kr`],
            ["Kontant förväntat", `${report.cashExpected} kr`],
            ["Kort förväntat", `${report.cardExpected} kr`],
            ["Avbrutna", String(report.cancelledCount)],
            ["Returer", `${report.refunds} kr`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
            >
              <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </section>
      ) : null}

      {countedCash && report ? (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/70">
          Kassavstämning: räknad {countedCash} kr vs förväntat {report.cashExpected} kr
          (diff {(Number(countedCash) - report.cashExpected).toFixed(0)} kr)
        </div>
      ) : null}
    </div>
  );
}

export default memo(ReportsAdminClient);
