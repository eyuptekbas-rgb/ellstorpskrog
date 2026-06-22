import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ORDINA } from "@/lib/tenant/branding";

export const dynamic = "force-dynamic";

export default async function PlatformDashboardPage() {
  const [tenantCount, orderCount, activeTenants] = await Promise.all([
    prisma.tenant.count(),
    prisma.order.count(),
    prisma.tenant.count({ where: { active: true } }),
  ]);

  return (
    <div className="px-5 py-8 pb-12">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#a78bfa] mb-2">
          {ORDINA.name} Platform
        </p>
        <h1 className="text-3xl font-serif tracking-wide">Översikt</h1>
        <div
          className="mt-3 h-[2px] w-16 rounded-full"
          style={{ background: ORDINA.primary }}
        />
        <p className="mt-3 text-sm text-white/55">{ORDINA.tagline}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Kunder totalt", value: tenantCount },
          { label: "Aktiva kunder", value: activeTenants },
          { label: "Beställningar totalt", value: orderCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#7c3aed]/20 bg-[#120a1f] p-5"
          >
            <p className="text-xs text-white/45">{stat.label}</p>
            <p className="mt-1 text-3xl font-serif" style={{ color: ORDINA.accent }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/platform/tenants"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition"
          style={{ background: ORDINA.primary }}
        >
          <Building2 size={16} />
          Hantera kunder
        </Link>
        <Link
          href="/platform/tenants?new=1"
          className="inline-flex items-center gap-2 rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-4 py-3 text-sm font-semibold text-[#c4b5fd] transition hover:bg-[#7c3aed]/20"
        >
          <Plus size={16} />
          Ny kund
        </Link>
      </div>
    </div>
  );
}
