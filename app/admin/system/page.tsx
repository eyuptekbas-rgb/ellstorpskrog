"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Globe,
  Key,
  Mail,
  RefreshCw,
  Server,
  Shield,
  Smartphone,
} from "lucide-react";
import SystemStatusCard, {
  CheckList,
  StatusRow,
} from "@/components/admin/SystemStatusCard";
import type { SystemStatus } from "@/lib/system/status";
import type { SetupCheckItem } from "@/lib/system/readiness";

const ENV_STATUS_LABEL: Record<string, string> = {
  set: "Satt",
  missing: "Saknas",
  weak: "Svag",
  local: "Lokal",
};

const ENV_STATUS_COLOR: Record<string, string> = {
  set: "text-emerald-400",
  missing: "text-red-400",
  weak: "text-amber-400",
  local: "text-amber-400",
};

function readinessColor(percent: number) {
  if (percent >= 80) return "text-emerald-400";
  if (percent >= 50) return "text-amber-400";
  return "text-red-400";
}

function SetupChecklistSection({
  title,
  items,
}: {
  title: string;
  items: SetupCheckItem[];
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm text-white/80">{item.label}</p>
              {item.message && (
                <p className="mt-0.5 text-xs text-white/40">{item.message}</p>
              )}
            </div>
            <span
              className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${
                item.status === "ok"
                  ? "text-emerald-400"
                  : item.status === "warning"
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {item.status === "ok" ? "OK" : item.status === "warning" ? "!" : "×"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminSystemPage() {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/system", { cache: "no-store" });
      if (!res.ok) throw new Error("Kunde inte hämta systemstatus");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Okänt fel");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const readiness = data?.readinessPercent ?? 0;
  const stripeReady = data?.stripeReadinessPercent ?? 0;
  const emailReady = data?.emailReadinessPercent ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#d4a574]">
            System
          </p>
          <h1 className="mt-1 font-serif text-3xl text-white">Produktionsstatus</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/50">
            Översikt av databas, betalningar, e-post, autentisering och miljövariabler inför
            Vercel-deploy.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Uppdatera
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Readiness banner */}
      <section className="rounded-3xl border border-white/8 bg-gradient-to-br from-[#1a1a1a] via-[#161616] to-[#121212] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Lanseringsberedskap
            </p>
            <p className={`mt-2 font-serif text-5xl tabular-nums ${readinessColor(readiness)}`}>
              {loading ? "—" : `${readiness}%`}
            </p>
            <p className="mt-2 text-sm text-white/50">
              Version {data?.buildVersion ?? "—"} · {data?.nodeEnv ?? "—"}
              {data?.vercelEnv ? ` · Vercel ${data.vercelEnv}` : ""}
            </p>
            {data && data.missingEnvVars.length > 0 && (
              <p className="mt-3 text-xs text-amber-300/90">
                Saknade/svaga: {data.missingEnvVars.join(", ")}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-white/35">Stripe</p>
              <p className={`mt-1 font-serif text-2xl tabular-nums ${readinessColor(stripeReady)}`}>
                {loading ? "—" : `${stripeReady}%`}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-white/35">E-post</p>
              <p className={`mt-1 font-serif text-2xl tabular-nums ${readinessColor(emailReady)}`}>
                {loading ? "—" : `${emailReady}%`}
              </p>
            </div>
            <div className="col-span-2 flex items-center justify-center rounded-2xl bg-[#b85c38]/15 sm:col-span-1">
              <Activity size={36} className="text-[#d4a574]" />
            </div>
          </div>
        </div>

        {data && data.launchBlockers.length > 0 && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
              Lanseringsblockerare ({data.launchBlockers.length})
            </p>
            <ul className="mt-2 space-y-1">
              {data.launchBlockers.map((b) => (
                <li key={b} className="text-sm text-red-300/90">
                  • {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data && data.launchBlockers.length === 0 && !loading && (
          <p className="mt-6 text-sm text-emerald-400">
            Inga kritiska blockerare — redo för lansering efter slutlig verifiering.
          </p>
        )}
      </section>

      {/* Core services */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SystemStatusCard
          title="Databas"
          subtitle="PostgreSQL"
          status={data?.health.database.status ?? "warning"}
        >
          <StatusRow
            label="Anslutning"
            value={data?.health.database.message ?? (loading ? "…" : "OK")}
            status={data?.health.database.status}
          />
        </SystemStatusCard>

        <SystemStatusCard
          title="Stripe"
          subtitle="Betalningar"
          status={data?.health.stripe.status ?? "warning"}
        >
          <StatusRow
            label="Konfigurerad"
            value={data?.health.stripe.configured ? "Ja" : "Nej"}
          />
          <StatusRow
            label="Aktiverad"
            value={data?.health.stripe.enabled ? "Ja" : "Nej"}
          />
          <StatusRow
            label="Läge"
            value={data?.health.stripe.testMode ? "Test" : "Live"}
          />
          {data?.health.stripe.message && (
            <StatusRow label="Info" value={data.health.stripe.message} />
          )}
        </SystemStatusCard>

        <SystemStatusCard
          title="E-post"
          subtitle="Resend"
          status={data?.health.email.status ?? "warning"}
        >
          <StatusRow
            label="Konfigurerad"
            value={data?.health.email.configured ? "Ja" : "Nej"}
          />
          {data?.health.email.message && (
            <StatusRow label="Info" value={data.health.email.message} />
          )}
        </SystemStatusCard>

        <SystemStatusCard
          title="Auth.js"
          subtitle="NextAuth v5"
          status={data?.health.auth.status ?? "warning"}
        >
          <StatusRow
            label="AUTH_SECRET"
            value={data?.health.auth.message ?? (loading ? "…" : "OK")}
            status={data?.health.auth.status}
          />
          <StatusRow label="trustHost" value="Aktiverad" />
        </SystemStatusCard>

        <SystemStatusCard
          title="Build"
          subtitle="Applikation"
          status="ok"
        >
          <StatusRow label="Version" value={data?.buildVersion ?? "—"} />
          <StatusRow label="Miljö" value={data?.nodeEnv ?? "—"} />
          <StatusRow
            label="Health"
            value={data?.health.status ?? "—"}
            status={
              data?.health.status === "healthy"
                ? "ok"
                : data?.health.status === "degraded"
                  ? "warning"
                  : "error"
            }
          />
        </SystemStatusCard>

        <SystemStatusCard
          title="Miljövariabler"
          subtitle="Vercel / .env"
          status={
            data?.environment.some((e) => e.required && e.status !== "set")
              ? "error"
              : data?.environment.some((e) => e.status === "local" || e.status === "weak")
                ? "warning"
                : "ok"
          }
        >
          {loading ? (
            <p className="text-sm text-white/40">Laddar…</p>
          ) : (
            data?.environment.map((env) => (
              <div key={env.key} className="flex items-center justify-between text-sm">
                <span className="text-white/45">
                  {env.label}
                  {env.required && <span className="text-red-400/60"> *</span>}
                </span>
                <span className={ENV_STATUS_COLOR[env.status]}>
                  {ENV_STATUS_LABEL[env.status]}
                </span>
              </div>
            ))
          )}
        </SystemStatusCard>
      </div>

      {/* Setup checklist */}
      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-xl text-white">Setup-checklista</h2>
            <p className="mt-1 text-sm text-white/45">
              Steg för Stripe, Resend och lansering — se{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">
                docs/PRODUCTION_SETUP.md
              </code>
            </p>
          </div>
          <a
            href="/admin/payments"
            className="text-sm text-[#d4a574] hover:underline"
          >
            Stripe-inställningar →
          </a>
        </div>
        {data ? (
          <div className="grid gap-8 lg:grid-cols-3">
            <SetupChecklistSection title="Stripe" items={data.setupStripe} />
            <SetupChecklistSection title="Resend / e-post" items={data.setupEmail} />
            <SetupChecklistSection title="Lansering" items={data.setupLaunch} />
          </div>
        ) : (
          <p className="text-sm text-white/40">Laddar checklista…</p>
        )}
      </section>

      {/* Extended checks */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <Globe size={20} className="text-[#d4a574]" />
            <h2 className="font-serif text-lg text-white">SEO</h2>
          </div>
          {data ? <CheckList items={data.seo} /> : <p className="text-sm text-white/40">…</p>}
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <Smartphone size={20} className="text-[#d4a574]" />
            <h2 className="font-serif text-lg text-white">PWA</h2>
          </div>
          {data ? <CheckList items={data.pwa} /> : <p className="text-sm text-white/40">…</p>}
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <Shield size={20} className="text-[#d4a574]" />
            <h2 className="font-serif text-lg text-white">Säkerhet</h2>
          </div>
          {data ? (
            <CheckList items={data.security} />
          ) : (
            <p className="text-sm text-white/40">…</p>
          )}
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <Server size={20} className="text-[#d4a574]" />
            <h2 className="font-serif text-lg text-white">Övrigt</h2>
          </div>
          {data ? (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">
                Rate limiting
              </p>
              <CheckList items={data.rateLimit} />
              <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wider text-white/30">
                Bildoptimering
              </p>
              <CheckList items={data.imageOptimization} />
            </>
          ) : (
            <p className="text-sm text-white/40">…</p>
          )}
        </section>
      </div>

      {/* Quick links */}
      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Snabbkontroller
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { href: "/api/health", label: "Health API", icon: Activity },
            { href: "/sitemap.xml", label: "Sitemap", icon: Globe },
            { href: "/robots.txt", label: "Robots", icon: Globe },
            { href: "/manifest.webmanifest", label: "Manifest", icon: Smartphone },
            { href: "/admin/notifications/test", label: "E-posttest", icon: Mail },
            { href: "/admin/payments", label: "Stripe", icon: Key },
          ].map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <Icon size={14} />
              {label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
