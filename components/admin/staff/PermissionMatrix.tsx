import {
  PERMISSION_MATRIX,
  RMS_TIER_LABELS,
  type RmsTier,
} from "@/lib/rms/permissions-matrix";

export default function PermissionMatrix() {
  const tiers: RmsTier[] = ["ADMIN", "MANAGER", "STAFF"];

  return (
    <section className="overflow-hidden rounded-3xl border border-white/8 bg-[#141414]">
      <div className="border-b border-white/8 px-5 py-4">
        <h2 className="font-serif text-xl text-white">Behörighetsmatris</h2>
        <p className="mt-1 text-sm text-white/45">
          Standardbehörigheter per roll — anpassas per anställd under profil.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-left text-white/45">
              <th className="px-5 py-3 font-medium">Modul</th>
              {tiers.map((tier) => (
                <th key={tier} className="px-4 py-3 text-center font-medium">
                  {RMS_TIER_LABELS[tier]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MATRIX.map((row) => (
              <tr key={row.permission} className="border-b border-white/6">
                <td className="px-5 py-3 text-white/80">{row.label}</td>
                <td className="px-4 py-3 text-center">
                  <MatrixCell allowed={row.admin} />
                </td>
                <td className="px-4 py-3 text-center">
                  <MatrixCell allowed={row.manager} />
                </td>
                <td className="px-4 py-3 text-center">
                  <MatrixCell allowed={row.staff} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MatrixCell({ allowed }: { allowed: boolean }) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
        allowed
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-white/5 text-white/25"
      }`}
    >
      {allowed ? "✓" : "—"}
    </span>
  );
}
